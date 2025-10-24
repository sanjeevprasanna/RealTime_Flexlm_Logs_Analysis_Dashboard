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
        coalesce(sum(CASE WHEN operation = 'IN' THEN 1 WHEN operation = 'OUT' THEN -1 ELSE 0 END), 0) AS active_count
      FROM dates d
      LEFT JOIN flexlm_logs l ON toDate(l.event_time) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
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
        sum(CASE WHEN operation = 'IN' THEN 1 WHEN operation = 'OUT' THEN -1 ELSE 0 END) AS active_count
      FROM flexlm_logs
      GROUP BY daemon
      ORDER BY active_count DESC
    `,
    format: "JSONEachRow",
  });
  console.log("ho");
  return await query.json();
}

async function getSummaryHomePage() {
  const query = `
    WITH
      latest_licenses AS (
        SELECT 
          feature,
          argMax(licenses_total, event_time) AS total,
          argMax(licenses_used, event_time) AS used
        FROM flexlm_logs
        WHERE toDate(event_time) = today()
          AND licenses_total IS NOT NULL
          AND licenses_used IS NOT NULL
        GROUP BY feature
      ),
      active_today AS (
        SELECT sum(CASE WHEN operation = 'IN' THEN 1 WHEN operation = 'OUT' THEN -1 ELSE 0 END) AS cnt
        FROM flexlm_logs WHERE toDate(event_time) = today()
      ),
      active_yesterday AS (
        SELECT sum(CASE WHEN operation = 'IN' THEN 1 WHEN operation = 'OUT' THEN -1 ELSE 0 END) AS cnt
        FROM flexlm_logs WHERE toDate(event_time) = today() - 1
      ),
      vendors_today AS (
        SELECT count(DISTINCT daemon) AS cnt
        FROM flexlm_logs WHERE toDate(event_time) = today()
      ),
      vendors_yesterday AS (
        SELECT count(DISTINCT daemon) AS cnt
        FROM flexlm_logs WHERE toDate(event_time) = today() - 1
      ),
      events_today AS (
        SELECT count(*) AS cnt FROM flexlm_logs WHERE toDate(event_time) = today()
      ),
      events_yesterday AS (
        SELECT count(*) AS cnt FROM flexlm_logs WHERE toDate(event_time) = today() - 1
      )
    SELECT
      (SELECT cnt FROM active_today) AS active_today,
      (SELECT cnt FROM active_yesterday) AS active_yesterday,
      (SELECT cnt FROM vendors_today) AS vendors_today,
      (SELECT cnt FROM vendors_yesterday) AS vendors_yesterday,
      (SELECT cnt FROM events_today) AS events_today,
      (SELECT cnt FROM events_yesterday) AS events_yesterday,
      (SELECT sum(total) FROM latest_licenses) AS total_licenses,
      (SELECT sum(used) FROM latest_licenses) AS used_licenses
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
  const usedLicenses = data.used_licenses || 0;
  const availableLicenses = totalLicenses - usedLicenses;

  return {
    activeLicenses: {
      today: data.active_today || 0,
      yesterday: data.active_yesterday || 0,
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
      argMax(licenses_used, event_time) AS used,
      groupArray(DISTINCT user) AS users
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'IN'
    GROUP BY feature, daemon
  `;

  const featuresResult = await client.query({
    query: featuresQuery,
    format: "JSONEachRow",
  });
  const featuresRaw = await featuresResult.json();

  const hourlyQuery = `
    SELECT 
      toHour(event_time) AS hour,
      count(*) AS count
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
    GROUP BY hour
    ORDER BY hour
  `;
  const hourlyResult = await client.query({
    query: hourlyQuery,
    format: "JSONEachRow",
  });
  const hourlyRaw = await hourlyResult.json();

  const activityQuery = `
    SELECT 
      user,
      feature,
      min(event_time) AS access_time,
      dateDiff('second', min(event_time), max(event_time)) AS duration_seconds
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'IN'
    GROUP BY user, feature
    ORDER BY access_time DESC
    LIMIT 20
  `;
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

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyRaw.find((h) => h.hour === i);
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      count: hourData ? hourData.count : 0,
    };
  });

  const userActivity = activityRaw.map((a) => {
    const durationSeconds = a.duration_seconds || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      user: a.user,
      feature: a.feature,
      accessTime: new Date(a.access_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration,
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

const getDenialPageData = async () => {
  const hourlyQuery = `
    SELECT 
      formatDateTime(event_time, '%H:00') AS hour,
      daemon AS vendor,
      count() AS count
    FROM flexlm_logs
    WHERE toDate(event_time) = today() AND operation = 'DENIED'
    GROUP BY hour, vendor
    ORDER BY hour ASC
  `;

  const hourlyResult = await client.query({
    query: hourlyQuery,
    format: "JSONEachRow",
  });

  const hourlyData = await hourlyResult.json();

  const hours = Array.from({ length: 24 }, (_, i) => {
    const label = `${String(i).padStart(2, "0")}:00`;
    const perVendor = hourlyData.filter((row) => row.hour === label);
    const vendorCounts = Object.fromEntries(
      perVendor.map((r) => [r.vendor.toLowerCase(), r.count]),
    );
    return {
      hour: label,
      cadence: vendorCounts.cadence || 0,
      altair: vendorCounts.altair || 0,
      synopsys: vendorCounts.synopsys || 0,
    };
  });

  const tableQuery = `
    SELECT 
      feature,
      daemon AS vendor,
      count() AS denied
    FROM flexlm_logs
    WHERE toDate(event_time) = today() AND operation = 'DENIED'
    GROUP BY feature, vendor
    ORDER BY denied DESC
    LIMIT 50
  `;

  const tableResult = await client.query({
    query: tableQuery,
    format: "JSONEachRow",
  });

  const tableData = await tableResult.json();

  return {
    hourlyData: hours,
    tableData,
  };
};

//Live Page
async function getLivePageData() {
  // Get hourly usage data for today (24 hours) with vendor counts
  const hourlyQuery = `
    SELECT 
      toHour(event_time) AS hour,
      daemon AS vendor,
      count(DISTINCT feature) AS feature_count
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'IN'
    GROUP BY hour, vendor
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
      argMax(licenses_used, event_time) AS active,
      groupArray(DISTINCT user) AS users
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'IN'
      AND licenses_total IS NOT NULL
    GROUP BY feature, daemon
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
  // Get hourly wait/denial counts for today (24 hours)
  const hourlyWaitQuery = `
    SELECT
      toHour(event_time) AS hour,
      count() AS waitCount
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'DENIED'
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const hourlyResult = await client.query({
    query: hourlyWaitQuery,
    format: "JSONEachRow",
  });

  const hourlyRaw = await hourlyResult.json();

  // Create 24-hour array
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyRaw.find((h) => h.hour === i);
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      waitCount: hourData ? hourData.waitCount : 0,
    };
  });

  // Get current users experiencing denials (recent denials as "waiting")
  const currentWaitQuery = `
    SELECT
      feature,
      user,
      daemon AS vendor,
      min(event_time) AS first_denial,
      max(event_time) AS last_denial,
      count() AS denial_count
    FROM flexlm_logs
    WHERE toDate(event_time) = today()
      AND operation = 'DENIED'
      AND event_time >= now() - INTERVAL 1 HOUR
    GROUP BY feature, user, daemon
    ORDER BY last_denial DESC
    LIMIT 50
  `;

  const currentWaitResult = await client.query({
    query: currentWaitQuery,
    format: "JSONEachRow",
  });

  const currentWaitRaw = await currentWaitResult.json();

  const waitQueue = currentWaitRaw.map((w) => {
    const durationMs = new Date(w.last_denial) - new Date(w.first_denial);
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    return {
      feature: w.feature,
      user: w.user,
      vendor: w.vendor.toLowerCase(),
      duration,
      status: "waiting",
      denialCount: w.denial_count,
    };
  });

  return {
    hourlyData,
    waitQueue,
  };
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
