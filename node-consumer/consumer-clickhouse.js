// Production Kafka Consumer with ClickHouse Integration
// Features: Batching, error handling, metrics, graceful shutdown

const { Kafka } = require("kafkajs");
const { createClient } = require("@clickhouse/client");

// Configuration
const CONFIG = {
  kafka: {
    clientId: "flexlm-consumer",
    brokers: ["localhost:9092"],
    groupId: "flexlm-consumer-group",
  },
  clickhouse: {
    host: "http://localhost:8123",
    database: "flexlm",
    username: "admin",
    password: "admin123",
  },
  topics: [
    "flexlm.logs.synopsys",
    "flexlm.logs.cadence",
    "flexlm.logs.altair",
    "flexlm.logs.lmgrd",
  ],
  // Batching configuration
  batch: {
    maxSize: 100, // Insert after 100 messages
    maxWaitMs: 2000, // OR after 2 seconds (whichever comes first)
  },
};

// Initialize Clients

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

// Batch Management

let batch = [];
let batchTimer = null;
let metrics = {
  messagesProcessed: 0,
  batchesInserted: 0,
  errors: 0,
  lastInsertTime: null,
};

/**
 * Transform Kafka message to ClickHouse row format
 */
function transformMessage(kafkaMessage, topic, partition, offset) {
  try {
    const value = JSON.parse(kafkaMessage.value.toString());

    // Convert Unix timestamp to DateTime
    const eventTime = value["@timestamp"]
      ? new Date(value["@timestamp"] * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");

    return {
      event_time: eventTime,
      daemon: value.daemon || "unknown",
      operation: value.operation || "N/A",
      feature: value.feature || "",
      version: value.version || "",
      user: value.user || "",
      server: value.server || "",
      handle: value.handle || null,
      licenses_used: value.licenses_used || null,
      licenses_total: value.licenses_total || null,
      raw_message: value.message || kafkaMessage.value.toString(),
      kafka_topic: topic,
      kafka_partition: partition,
      kafka_offset: offset,
    };
  } catch (error) {
    console.error("Error transforming message:", error.message);
    metrics.errors++;
    return null;
  }
}

// Insert batch into ClickHouse
async function insertBatch() {
  if (batch.length === 0) return;

  const batchToInsert = [...batch];
  batch = []; // Clear batch immediately

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    const startTime = Date.now();

    await clickhouse.insert({
      table: "flexlm_logs",
      values: batchToInsert,
      format: "JSONEachRow",
    });

    const duration = Date.now() - startTime;
    metrics.batchesInserted++;
    metrics.lastInsertTime = new Date();

    console.log(
      ` Inserted batch: ${batchToInsert.length} rows in ${duration}ms ` +
      `(Total: ${metrics.messagesProcessed}, Batches: ${metrics.batchesInserted})`,
    );
  } catch (error) {
    console.error(" Error inserting batch to ClickHouse:", error.message);
    metrics.errors++;

    // Put failed messages back in batch for retry
    batch.push(...batchToInsert);
  }
}

async function addToBatch(row) {
  if (!row) return;

  batch.push(row);
  metrics.messagesProcessed++;

  // Trigger insert if batch is full
  if (batch.length >= CONFIG.batch.maxSize) {
    await insertBatch();
  }
  // Set timer for first message in new batch
  else if (batch.length === 1) {
    batchTimer = setTimeout(insertBatch, CONFIG.batch.maxWaitMs);
  }
}

// Main Consumer Logic

async function run() {
  try {
    console.log(" Connecting to Kafka...");
    await consumer.connect();
    console.log("Connected to Kafka");

    console.log(" Connecting to ClickHouse...");
    await clickhouse.ping();
    console.log(" Connected to ClickHouse\n");

    // Subscribe to all topics
    for (const topic of CONFIG.topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(` Subscribed to: ${topic}`);
    }

    console.log("\n Consuming messages...");
    console.log(
      `   Batch Config: ${CONFIG.batch.maxSize} messages or ${CONFIG.batch.maxWaitMs}ms\n`,
    );
    console.log("─".repeat(80));

    // Start consuming
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

// Graceful Shutdown

async function shutdown() {
  console.log("\n\n Shutting down...");

  // Insert any remaining messages in batch
  if (batch.length > 0) {
    console.log(` Flushing remaining ${batch.length} messages...`);
    await insertBatch();
  }

  // Disconnect clients
  await consumer.disconnect();
  await clickhouse.close();

  // Print final metrics
  console.log("\n Final Metrics:");
  console.log(`   Messages Processed: ${metrics.messagesProcessed}`);
  console.log(`   Batches Inserted: ${metrics.batchesInserted}`);
  console.log(`   Errors: ${metrics.errors}`);
  console.log(`   Last Insert: ${metrics.lastInsertTime}`);

  console.log("\n Shutdown complete");
  process.exit(0);
}

// Handle termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Periodic metrics reporting (every 30 seconds)
setInterval(() => {
  console.log(
    `📊 Metrics: Processed=${metrics.messagesProcessed}, ` +
    `Batches=${metrics.batchesInserted}, ` +
    `Errors=${metrics.errors}, ` +
    `Current Batch Size=${batch.length}`,
  );
}, 30000);

// Start the consumer
run().catch(console.error);
