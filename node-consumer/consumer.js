// Kafka Consumer for FlexLM Logs
// Subscribes to multiple FlexLM topics and prints messages to the console

const { Kafka } = require("kafkajs");

// Kafka client configuration
const kafka = new Kafka({
  clientId: "flexlm-consumer",
  brokers: ["localhost:9092"],
});

// Create a Kafka consumer
const consumer = kafka.consumer({
  groupId: "flexlm-consumer-group",
});

// List of topics to subscribe to
const topics = [
  "flexlm.logs.synopsys",
  "flexlm.logs.cadence",
  "flexlm.logs.altair",
  "flexlm.logs.lmgrd",
];

// Terminal colors for different topics
const colors = {
  synopsys: "\x1b[36m", // Cyan
  cadence: "\x1b[33m", // Yellow
  altair: "\x1b[35m", // Magenta
  lmgrd: "\x1b[32m", // Green
  reset: "\x1b[0m", // Reset color
  new_topic_color: "\x1b[69m",
};

// Main consumer function
const run = async () => {
  try {
    console.log("Connecting to Kafka...");
    await consumer.connect();
    console.log("Connected to Kafka\n");

    // Subscribe to all topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
      console.log(`Subscribed to: ${topic}`);
    }

    console.log("\nListening for messages...\n");
    console.log("─".repeat(80));

    // Consume messages from Kafka
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
    console.error("Error:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown to disconnect consumer
const shutdown = async () => {
  console.log("\nShutting down consumer...");
  await consumer.disconnect();
  console.log("Consumer disconnected from Kafka");
  process.exit(0);
};

// Handle termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the consumer
run().catch(console.error);
