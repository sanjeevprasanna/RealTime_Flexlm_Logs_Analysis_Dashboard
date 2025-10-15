const express = require("express");
const { createClient } = require("@clickhouse/client");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello Flex!!!");
});

const client = createClient({
  host: "http://localhost:8123",
  database: "flexlm",
  username: "admin",
  password: "admin123",
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
