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

module.exports = {
  getDailyActiveCountsLast30Days,
  getActiveVendors,
  getSummaryHomePage,
};
