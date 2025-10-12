// Minimal Kafka Consumer for FlexLM Logs
// Consumes messages from all FlexLM topics and prints to console

const { Kafka } = require("kafkajs");

// Kafka configuration
const kafka = new Kafka({
  clientId: "flexlm-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "flexlm-consumer-group",
});

// Topics to subscribe to
const topics = [
  "flexlm.logs.synopsys",
  "flexlm.logs.cadence",
  "flexlm.logs.altair",
  "flexlm.logs.lmgrd",
];

// Color codes for terminal output
const colors = {
  synopsys: "\x1b[36m", // Cyan
  cadence: "\x1b[33m", // Yellow
  altair: "\x1b[35m", // Magenta
  lmgrd: "\x1b[32m", // Green
  reset: "\x1b[0m",
};

// Main consumer logic
const run = async () => {
  try {
    console.log("🔌 Connecting to Kafka...");
    await consumer.connect();
    console.log("✅ Connected to Kafka\n");

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
      console.log(`📡 Subscribed to: ${topic}`);
    }

    console.log("\n🎧 Listening for messages... (Press Ctrl+C to stop)\n");
    console.log("─".repeat(80));

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          const daemon = topic.split(".").pop();
          const color = colors[daemon] || colors.reset;

          const timestamp = value["@timestamp"]
            ? new Date(value["@timestamp"] * 1000).toISOString()
            : "unknown_time";

          console.log(
            `${color}[${timestamp}] ${daemon.toUpperCase()}${colors.reset} | ` +
            `${value.operation || "N/A"} | ` +
            `${value.feature || "N/A"} | ` +
            `${value.user || "N/A"}@${value.server || "N/A"}`,
          );
        } catch (err) {
          console.error("Error parsing message:", err.message);
        }
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down consumer...");
  await consumer.disconnect();
  console.log("✅ Disconnected from Kafka");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(console.error);
