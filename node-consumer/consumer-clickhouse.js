require("dotenv").config();

const { Kafka } = require("kafkajs");
const { createClient } = require("@clickhouse/client");

const CONFIG = {
  kafka: {
    clientId: "flexlm-consumer",
    brokers: ["localhost:9092"],
    groupId: "flexlm-consumer-group",
  },
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST,
    database: process.env.CLICKHOUSE_DB,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  },
  topics: [
    "flexlm.logs.synopsys",
    "flexlm.logs.cadence",
    "flexlm.logs.altair",
    "flexlm.logs.lmgrd",
  ],
  batch: {
    maxSize: 100,
    maxWaitMs: 1000,
  },
};

const kafka = new Kafka({
  clientId: CONFIG.kafka.clientId,
  brokers: CONFIG.kafka.brokers,
});

const consumer = kafka.consumer({
  groupId: CONFIG.kafka.groupId,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const clickhouse = createClient({
  host: CONFIG.clickhouse.host,
  database: CONFIG.clickhouse.database,
  username: CONFIG.clickhouse.username,
  password: CONFIG.clickhouse.password,
});

let batch = [];
let batchTimer = null;
let metrics = {
  messagesProcessed: 0,
  batchesInserted: 0,
  errors: 0,
  lastInsertTime: null,
};

async function revokeAllLicenses(eventTime) {
  try {
    console.log(` Revoking all licenses due to system event at ${eventTime}`);

    const query = `

INSERT INTO flexlm_logs 
SELECT 
  '${eventTime}' AS event_time,
  now() AS insert_time,
  daemon,
  'IN' AS operation,
  feature,
  version,
  user,
  server,
  handle,
  0 AS licenses_used,
  licenses_total,
  'Auto-revoked due to system restart/reread' AS raw_message,
  kafka_topic,
  kafka_partition,
  kafka_offset
FROM (
  SELECT 
    daemon,
    feature,
    version,
    user,
    server,
    handle,
    argMax(licenses_total, event_time) AS licenses_total,
    argMax(kafka_topic, event_time) AS kafka_topic,
    argMax(kafka_partition, event_time) AS kafka_partition,
    argMax(kafka_offset, event_time) AS kafka_offset,
    sum(CASE WHEN operation = 'OUT' THEN 1 WHEN operation = 'IN' THEN -1 ELSE 0 END) AS net_count
  FROM flexlm_logs
  WHERE operation IN ('OUT', 'IN')
  GROUP BY daemon, feature, version, user, server, handle
  HAVING net_count > 0
)
ARRAY JOIN range(net_count)

    `;

    await clickhouse.command({ query });
    console.log(" All active licenses revoked");
  } catch (error) {
    console.error(" Error revoking licenses:", error.message);
  }
}

function transformMessage(kafkaMessage, topic, partition, offset) {
  try {
    const value = JSON.parse(kafkaMessage.value.toString());

    let eventTime;
    if (value["@timestamp"]) {
      // Convert Unix timestamp to IST datetime
      const date = new Date(value["@timestamp"] * 1000);

      // Add IST offset (5 hours 30 minutes)
      const istDate = new Date(date.getTime());
      eventTime = istDate.toISOString().slice(0, 19).replace("T", " ");
    } else if (value.timestamp) {
      const now = new Date();
      const istNow = new Date(now.getTime());
      const localDate = istNow.toISOString().slice(0, 10);
      eventTime = `${localDate} ${value.timestamp}`;
    } else {
      const now = new Date();
      const istNow = new Date(now.getTime());
      eventTime = istNow.toISOString().slice(0, 19).replace("T", " ");
    }
    console.log(eventTime);
    const operation = value.operation || "N/A";
    const data = {
      event_time: eventTime,
      daemon: value.daemon || "unknown",
      operation: operation,
      feature: value.feature || "",
      version: value.version || "",
      user: value.user || "",
      server: value.server || "",
      handle: value.handle ? parseInt(value.handle) : null,
      licenses_used: value.licenses_used ? parseInt(value.licenses_used) : null,
      licenses_total: value.licenses_total
        ? parseInt(value.licenses_total)
        : null,
      raw_message: value.log || value.message || kafkaMessage.value.toString(),
      kafka_topic: topic,
      kafka_partition: partition,
      kafka_offset: offset,
      is_system_event: ["REREAD", "SHUTDOWN", "SERVER_EXIT", "START"].includes(
        operation,
      ),
    };
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error transforming message:", error.message);
    metrics.errors++;
    return null;
  }
}

async function insertBatch() {
  if (batch.length === 0) return;

  const batchToInsert = [...batch];
  batch = [];

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    const systemEvents = batchToInsert.filter((row) => row.is_system_event);
    const normalEvents = batchToInsert.filter((row) => !row.is_system_event);

    if (normalEvents.length > 0) {
      await clickhouse.insert({
        table: "flexlm_logs",
        values: normalEvents.map(({ is_system_event, ...rest }) => rest),
        format: "JSONEachRow",
      });
    }

    for (const event of systemEvents) {
      await clickhouse.insert({
        table: "flexlm_logs",
        values: [{ ...event, is_system_event: undefined }],
        format: "JSONEachRow",
      });

      if (
        event.daemon === "lmgrd" &&
        (event.operation === "REREAD" ||
          event.operation === "SHUTDOWN" ||
          event.operation === "SERVER_EXIT")
      ) {
        console.log(
          `Revoking licenses for ${event.operation} at ${event.event_time}`,
        );
        await revokeAllLicenses(event.event_time);
      }
    }

    metrics.batchesInserted++;
    metrics.lastInsertTime = new Date();

    console.log(
      `Inserted: ${batchToInsert.length} rows ` +
        `(${systemEvents.length} system, ${normalEvents.length} normal) ` +
        `(Total: ${metrics.messagesProcessed}, Batches: ${metrics.batchesInserted})`,
    );
  } catch (error) {
    console.error("Error inserting batch:", error.message);
    console.error(error);
    metrics.errors++;
    batch.push(...batchToInsert);
  }
}

async function addToBatch(row) {
  if (!row) return;

  batch.push(row);
  metrics.messagesProcessed++;

  if (batch.length >= CONFIG.batch.maxSize) {
    await insertBatch();
  } else if (batch.length === 1) {
    batchTimer = setTimeout(insertBatch, CONFIG.batch.maxWaitMs);
  }
}

async function run() {
  try {
    console.log(" Connecting to Kafka...");
    await consumer.connect();
    console.log(" Connected to Kafka");

    console.log(" Connecting to ClickHouse...");
    await clickhouse.ping();
    console.log(" Connected to ClickHouse\n");
    console.log(CONFIG.clickhouse.username);
    for (const topic of CONFIG.topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(` Subscribed to: ${topic}`);
    }

    console.log("\n Consuming messages...");
    console.log(
      `⚙️  Batch Config: ${CONFIG.batch.maxSize} messages or ${CONFIG.batch.maxWaitMs}ms\n`,
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const row = transformMessage(message, topic, partition, message.offset);
        await addToBatch(row);
      },
    });
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("\n\n Shutting down...");

  if (batch.length > 0) {
    console.log(` Flushing remaining ${batch.length} messages...`);
    await insertBatch();
  }

  await consumer.disconnect();
  await clickhouse.close();

  console.log("\n Final Metrics:");
  console.log(`   Messages: ${metrics.messagesProcessed}`);
  console.log(`   Batches: ${metrics.batchesInserted}`);
  console.log(`   Errors: ${metrics.errors}`);

  console.log("\n Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

setInterval(() => {
  console.log(
    `Metrics: Processed=${metrics.messagesProcessed}, ` +
      `Batches=${metrics.batchesInserted}, ` +
      `Errors=${metrics.errors}, ` +
      `Batch Size=${batch.length}`,
  );
}, 30000);

run().catch(console.error);
