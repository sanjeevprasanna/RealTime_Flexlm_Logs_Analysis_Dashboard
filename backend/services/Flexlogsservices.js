const client = require("../db/clickhouseClient");

async function getDailyActiveCountsLast30Days() {
  const result = await client.query({
    query: `

WITH dates AS (
    SELECT toDate(today() - number) AS date
    FROM numbers(30)
)
SELECT
    d.date,
    countIf(l.operation = 'OUT') AS active_count
FROM dates AS d
LEFT JOIN flexlm_logs AS l
    ON toDate(l.event_time) = d.date
GROUP BY d.date
ORDER BY d.date ASC;

    `,
    format: "JSONEachRow",
  });
  return await result.json();
}

async function getActiveVendors() {
  const query = await client.query({
    query: `
      SELECT 
        daemon,
        sum(CASE WHEN operation = 'IN' THEN -1 WHEN operation = 'OUT' THEN 1 ELSE 0 END) AS active_count
      FROM flexlm_logs
      GROUP BY daemon
 HAVING active_count > 0
      ORDER BY active_count DESC
     
    `,
    format: "JSONEachRow",
  });
  return await query.json();
}

async function getSummaryHomePage() {
  const query = `
  WITH
  -- Current active licenses (cumulative from all time)
  active_now AS (
   SELECT 

  sum(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS cnt
FROM flexlm_logs
WHERE toDate(event_time) = today()
  AND operation IN ('OUT', 'IN')  having cnt>0),
  
  -- Active licenses at end of yesterday
  active_yesterday_eod AS (
    SELECT 
      sum(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS cnt
    FROM flexlm_logs
    WHERE toDate(event_time) < today()
      AND operation IN ('OUT', 'IN')
  ),
  
  -- Active vendors (cumulative)
  vendors_active AS (
    SELECT count(DISTINCT daemon) AS cnt
    FROM (
      SELECT 
        daemon,
        sum(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS net
      FROM flexlm_logs
      WHERE toDate(event_time) <= today()
        AND operation IN ('OUT', 'IN')
      GROUP BY daemon
      HAVING net > 0
    )
  ),
  
  -- Vendors active yesterday
  vendors_yesterday AS (
    SELECT count(DISTINCT daemon) AS cnt
    FROM (
      SELECT 
        daemon,
        sum(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS net
      FROM flexlm_logs
      WHERE toDate(event_time) < today()
        AND operation IN ('OUT', 'IN')
      GROUP BY daemon
      HAVING net > 0
    )
  ),
  
  -- Events count (all operations today)
  events_today AS (
    SELECT count(*) AS cnt 
    FROM flexlm_logs 
    WHERE toDate(event_time) = today()
  ),
  
  -- Events yesterday
  events_yesterday AS (
    SELECT count(*) AS cnt 
    FROM flexlm_logs 
    WHERE toDate(event_time) = today() - 1
  ),
  
  -- Total license capacity (all features, regardless of usage)
  total_capacity AS (
    SELECT 
      feature,
      daemon,
      argMax(licenses_total, event_time) AS total
    FROM flexlm_logs
    WHERE toDate(event_time) <= today()
    GROUP BY feature, daemon
  ),
  
  -- Currently used licenses (only active checkouts)
  used_licenses AS (
    SELECT 
      sum(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS used
    FROM flexlm_logs
    WHERE toDate(event_time) <= today()
      AND operation IN ('OUT', 'IN')
    GROUP BY feature, daemon
    HAVING used > 0
  )
SELECT
  COALESCE((SELECT cnt FROM active_now), 0) AS active_today,
  COALESCE((SELECT cnt FROM active_yesterday_eod), 0) AS active_yesterday,
  COALESCE((SELECT cnt FROM vendors_active), 0) AS vendors_today,
  COALESCE((SELECT cnt FROM vendors_yesterday), 0) AS vendors_yesterday,
  COALESCE((SELECT cnt FROM events_today), 0) AS events_today,
  COALESCE((SELECT cnt FROM events_yesterday), 0) AS events_yesterday,
  COALESCE((SELECT sum(total) FROM total_capacity), 0) AS total_licenses,
  COALESCE((SELECT sum(used) FROM used_licenses), 0) AS used_licenses
  `;

  const result = await client.query({ query, format: "JSONEachRow" });
  const [data] = await result.json();

  function calcTrend(today, yesterday) {
    if (!yesterday || yesterday === 0) return "N/A";
    const diff = ((today - yesterday) / yesterday) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  }

  const totalLicenses = data.total_licenses || 0;
  const usedLicenses = Math.max(data.used_licenses || 0, 0);
  const availableLicenses = Math.max(totalLicenses - usedLicenses, 0);

  return {
    activeLicenses: {
      today: Math.max(Number(data.active_today) || 0, 0),
      yesterday: Math.max(Number(data.active_yesterday) || 0, 0),
      trend: calcTrend(data.active_today, data.active_yesterday),
    },
    activeVendors: {
      today: data.vendors_today || 0,
      yesterday: data.vendors_yesterday || 0,
      trend: calcTrend(data.vendors_today, data.vendors_yesterday),
    },
    eventsToday: {
      today: data.events_today || 0,
      yesterday: data.events_yesterday || 0,
      trend: calcTrend(data.events_today, data.events_yesterday),
    },
    licenses: {
      total: totalLicenses,
      used: usedLicenses,
      available: availableLicenses,
    },
  };
}

async function getSubsPageData() {
  const featuresQuery = `
 
SELECT
    feature,
    daemon,
    argMax(licenses_total, event_time) AS total,
    SUM(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS used,
    groupArrayDistinct(user) AS users
FROM flexlm_logs
WHERE toDate(event_time) = today()
  AND operation IN ('OUT', 'IN')
GROUP BY feature, daemon
HAVING used > 0
ORDER BY daemon, feature;


  `;

  const featuresResult = await client.query({
    query: featuresQuery,
    format: "JSONEachRow",
  });
  const featuresRaw = await featuresResult.json();
  const activityQuery = `
WITH user_sessions AS (
  SELECT 
    user,
    feature,
    handle,
    min(event_time) AS access_time,
    max(event_time) AS last_event_time,
    SUM(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS net_count
  FROM flexlm_logs
  WHERE toDate(event_time) = today()
    AND operation IN ('OUT', 'IN')
  GROUP BY user, feature, handle
  HAVING net_count > 0  -- Only active sessions (changed from >= 0)
)
SELECT 
  user,
  feature,
  access_time,
  dateDiff('second', access_time, now() + INTERVAL 5 HOUR + INTERVAL 30 MINUTE) AS duration_seconds,
  true AS is_active
FROM user_sessions
ORDER BY access_time DESC
`;

  const hourlyQuery = `
SELECT
  hour,
  count(DISTINCT feature) AS active_features,
  sum(net_cnt) AS total_in_use
FROM
(
  SELECT
    feature,
    toHour(event_time) AS hour,
    SUM(multiIf(operation = 'OUT', 1, operation = 'IN', -1, 0)) AS net_cnt
  FROM flexlm_logs
  WHERE toDate(event_time) = today()
    AND operation IN ('OUT', 'IN')
  GROUP BY feature, hour
  HAVING net_cnt > 0
)
GROUP BY hour
ORDER BY hour ASC;
  `;

  const hourlyResult = await client.query({
    query: hourlyQuery,
    format: "JSONEachRow",
  });

  const hourlyRaw = await hourlyResult.json();

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyRaw.find((h) => h.hour === i);
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      count: hourData ? Math.max(hourData.total_in_use, 0) : 0,
    };
  });

  const activityResult = await client.query({
    query: activityQuery,
    format: "JSONEachRow",
  });
  const activityRaw = await activityResult.json();

  const features = featuresRaw.map((f) => ({
    feature: f.feature,
    daemon: f.daemon,
    total: f.total || 0,
    inUse: f.used || 0,
    users: f.users || [],
  }));

  const userActivity = activityRaw.map((a) => {
    const durationSeconds = a.duration_seconds || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration =
      hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : "0";

    // Parse the UTC time from database and display it as-is (it's already in IST format)
    const accessTime = new Date(a.access_time + "Z") // Add Z to treat as UTC
      .toLocaleTimeString("en-US", {
        timeZone: "UTC", // Don't convert, just format
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    return {
      user: a.user,
      feature: a.feature,
      accessTime: accessTime,
      duration: a.is_active ? `${duration}` : duration,
    };
  });

  console.log("Features count:", features.length);
  console.log("Hourly count:", hourlyData.length);
  console.log("Activity count:", userActivity.length);

  return {
    features,
    hourlyData,
    userActivity,
  };
}

async function getDenialPageData() {
  // Hourly denials by vendor
  const hourlyQuery = `
    SELECT
      toHour(event_time) AS hour,
      daemon,
      count() AS denial_count
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'DENIED'
    GROUP BY hour, daemon
    ORDER BY hour ASC
  `;

  const hourlyResult = await client.query({
    query: hourlyQuery,
    format: "JSONEachRow",
  });
  const hourlyRaw = await hourlyResult.json();

  // Transform to format: [{ hour: "00:00", cadence: 5, altair: 3, synopsys: 2 }, ...]
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourStr = `${String(i).padStart(2, "0")}:00`;
    const hourRecords = hourlyRaw.filter((h) => h.hour === i);

    const result = { hour: hourStr };
    hourRecords.forEach((record) => {
      result[record.daemon.toLowerCase()] = Number(record.denial_count);
    });

    // Ensure all vendors have a value (0 if not present)
    result.cadence = result.cadence || 0;
    result.altair = result.altair || 0;
    result.synopsys = result.synopsys || 0;

    return result;
  });

  // Table data: denials by feature and vendor
  const tableQuery = `
    SELECT 
      feature,
      daemon AS vendor,
      count() AS denied
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'DENIED'
    GROUP BY feature, vendor
    ORDER BY denied DESC
    LIMIT 50
  `;

  const tableResult = await client.query({
    query: tableQuery,
    format: "JSONEachRow",
  });
  const tableData = await tableResult.json();

  // Ensure numbers are properly formatted
  const formattedTableData = tableData.map((row) => ({
    feature: row.feature,
    vendor: row.vendor.toLowerCase(),
    denied: Number(row.denied),
  }));

  return {
    hourlyData,
    tableData: formattedTableData,
  };
}

//Live Page
async function getLivePageData() {
  // Get hourly usage data for today (24 hours) with vendor counts
  const hourlyQuery = `
    SELECT 
      toHour(event_time) AS hour,
      daemon AS vendor,
      count(DISTINCT feature) AS feature_count,
    SUM(multiIf(operation = 'OUT',1,operation ='IN', -1,0)) as cnt
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation in ('OUT','IN')
    GROUP BY hour, vendor
    having cnt>0
    ORDER BY hour ASC

  `;

  const hourlyResult = await client.query({
    query: hourlyQuery,
    format: "JSONEachRow",
  });

  const hourlyData = await hourlyResult.json();

  // Create 24-hour array with vendor-specific feature counts
  const hours = Array.from({ length: 24 }, (_, i) => {
    const perVendor = hourlyData.filter((row) => row.hour === i);

    const vendorCounts = {};
    const vendorsActive = [];

    perVendor.forEach((row) => {
      const vendorName = row.vendor.toLowerCase();
      vendorCounts[vendorName] = row.feature_count;
      vendorsActive.push(vendorName);
    });

    return {
      time: `${String(i).padStart(2, "0")}:00`,
      vendorsActive: vendorsActive,
      vendorCounts: vendorCounts,
    };
  });

  // Get current feature usage with active counts
  const featuresQuery = `
    SELECT 
      feature,
      daemon AS vendor,
      argMax(licenses_total, event_time) AS total,
      sum(multiIf(operation='OUT',1,operation='IN',-1,0)) AS active,
      groupArray(DISTINCT user) AS users
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation in ('IN','OUT')
      AND licenses_total IS NOT NULL
    GROUP BY feature, daemon
having active > 0
    ORDER BY active DESC
  `;

  const featuresResult = await client.query({
    query: featuresQuery,
    format: "JSONEachRow",
  });

  const featuresRaw = await featuresResult.json();

  const features = featuresRaw.map((f) => ({
    feature: f.feature,
    vendor: f.vendor.toLowerCase(),
    active: f.active || 0,
    total: f.total || 0,
    available: (f.total || 0) - (f.active || 0),
    users: f.users || [],
  }));

  return {
    hourlyData: hours,
    features,
  };
}

async function getWaitPageData() {
  const hourlyWaitQuery = `
    SELECT
      toHour(event_time) AS hour,
      count() AS waitCount
    FROM flexlm_logs
    WHERE toDate(event_time) = toDate(now())
      AND operation = 'QUEUED'
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const hourlyResult = await client.query({
    query: hourlyWaitQuery,
    format: "JSONEachRow",
  });
  const hourlyRaw = await hourlyResult.json();

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyRaw.find((h) => h.hour === i);
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      waitCount: hourData ? Number(hourData.waitCount) : 0,
    };
  });

  // Query 1: Users still waiting (QUEUED but NOT in OUT)
  const stillWaitingQuery = `
SELECT
    feature,
    user,
    daemon AS vendor,
    min(event_time) AS first_denial,
    max(event_time) AS last_denial,
    count() AS denial_count
FROM flexlm_logs
WHERE toDate(event_time) = toDate(now())
  AND operation = 'QUEUED'
  AND (feature, user, daemon) NOT IN (
      SELECT feature, user, daemon
      FROM flexlm_logs
      WHERE toDate(event_time) = toDate(now())
        AND operation = 'OUT'
  )
GROUP BY feature, user, daemon
ORDER BY last_denial DESC;
`;

  // Query 2: Users who got the feature (QUEUED and then OUT)
  const grantedAfterQueueQuery = `
WITH queued AS (
    SELECT
        feature,
        user,
        daemon,
        min(event_time) AS first_queue,
        max(event_time) AS last_queue,
        count() AS denial_count
    FROM flexlm_logs
    WHERE toDate(event_time) = toDate(now())
      AND operation = 'QUEUED'
    GROUP BY feature, user, daemon
),
granted AS (
    SELECT
        feature,
        user,
        daemon,
        max(event_time) AS granted_time
    FROM flexlm_logs
    WHERE toDate(event_time) = toDate(now())
      AND operation = 'OUT'
    GROUP BY feature, user, daemon
)
SELECT
    q.feature,
    q.user,
    q.daemon AS vendor,
    q.first_queue AS first_denial,
    q.last_queue AS last_denial,
    q.denial_count,
    g.granted_time
FROM queued q
INNER JOIN granted g
    ON q.feature = g.feature
    AND q.user = g.user
    AND q.daemon = g.daemon
ORDER BY q.last_queue DESC;
`;

  // Execute both queries
  const [stillWaitingResult, grantedResult] = await Promise.all([
    client.query({ query: stillWaitingQuery, format: "JSONEachRow" }),
    client.query({ query: grantedAfterQueueQuery, format: "JSONEachRow" }),
  ]);

  const stillWaitingData = await stillWaitingResult.json();
  const grantedData = await grantedResult.json();

  // Get current time for calculating ongoing wait duration
  const now = new Date();

  // Parse waiting users - FIXED: Calculate duration from first denial to NOW
  const waitingQueue = stillWaitingData.map((r) => {
    const firstDenial = new Date(r.first_denial);

    // For users still waiting, calculate time from first denial to NOW
    const waitTime = Math.round((now - firstDenial) / 60000);

    // Format duration nicely
    let durationStr;
    if (waitTime < 1) {
      durationStr = "< 1 min";
    } else if (waitTime < 60) {
      durationStr = `${waitTime} min`;
    } else {
      const hours = Math.floor(waitTime / 60);
      const minutes = waitTime % 60;
      durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return {
      feature: r.feature,
      user: r.user,
      vendor: r.vendor,
      denialCount: Number(r.denial_count),
      duration: durationStr,
      status: "Waiting",
    };
  });

  // Parse granted users - Calculate duration from first denial to when granted
  const grantedQueue = grantedData.map((r) => {
    const firstDenial = new Date(r.first_denial);
    const grantedTime = new Date(r.granted_time);

    // Calculate total wait time
    const waitTime = Math.round((grantedTime - firstDenial) / 60000);

    // Format duration nicely
    let durationStr;
    if (waitTime < 1) {
      durationStr = "< 1 min";
    } else if (waitTime < 60) {
      durationStr = `${waitTime} min`;
    } else {
      const hours = Math.floor(waitTime / 60);
      const minutes = waitTime % 60;
      durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return {
      feature: r.feature,
      user: r.user,
      vendor: r.vendor,
      denialCount: Number(r.denial_count),
      duration: durationStr,
      status: "GIVEN FEATURE",
    };
  });

  // Combine both arrays
  const waitQueue = [...grantedQueue, ...waitingQueue];

  return { hourlyData, waitQueue };
}

module.exports = {
  getDailyActiveCountsLast30Days,
  getActiveVendors,
  getSummaryHomePage,
  getSubsPageData,
  getDenialPageData,
  getWaitPageData,
  getLivePageData,
};
