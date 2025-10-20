require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@clickhouse/client");
const {
  getDailyActiveCountsLast30Days,
  getActiveVendors,
  getSummaryHomePage,
} = require("./services/Flexlogsservices.js");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
const port = process.env.PORT;

//Routes

app.get("/", (req, res) => {
  res.send("Hello Flex!!!");
});

app.get("/services/getDailyActiveCountsLast30Days", async (req, res) => {
  const data = await getDailyActiveCountsLast30Days();
  res.json(data);
});

app.get("/services/getActiveVendors", async (req, res) => {
  try {
    const data = await getActiveVendors();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching active vendors");
  }
});

app.get("/services/getSummaryHomePage", async (req, res) => {
  try {
    const data = await getSummaryHomePage();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Home Page Summary");
  }
});

//db
const client = createClient({
  host: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DB,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
});

app.get("/db", async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    try {
      const query = await client.query({
        query: "SELECT * FROM flexlm_logs LIMIT 20",
        format: "JSONEachRow",
      });

      const stream = query.stream();
      const results = [];

      stream.on("data", (batch) => {
        batch.forEach((row) => results.push(row.json()));
      });

      await new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching data");
    }
  } else {
    const query = `
      SELECT *
      FROM flexlm_logs
      WHERE event_time BETWEEN toDateTime('${start}') AND toDateTime('${end}')
      ORDER BY event_time DESC
      LIMIT 50
    `;

    const result = await client.query({
      query,
      format: "JSONEachRow",
    });
    const rows = result.json();
    res.json(rows);
  }
});

app.listen(port, () => {
  console.log(`Listening at port:${port}`);
});
