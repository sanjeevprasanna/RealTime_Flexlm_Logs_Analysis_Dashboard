require("dotenv").config();
const fs = require("fs");
const { Kafka } = require("kafkajs");
const { createTopic } = require("./kafka");

const NOTIFY_FILE = "/tmp/flexlm-new-topics.json";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENTID,
  brokers: process.env.KAFKA_BROKERS.split(","),
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_FALLBACK_CONSUMER_GROUPID,
});

const producer = kafka.producer();

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({
    topic: "flexlm.logs.fallback",
    fromBeginning: false,
  });

  const known = new Set();

  console.log("🎧 Fallback consumer running...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const daemon = data.daemon ? data.daemon.toLowerCase() : "unknown";
        const target = `flexlm.logs.${daemon}`;

        if (!known.has(target)) {
          console.log(`🔨 Creating topic: ${target}`);
          await createTopic(target, 2);
          known.add(target);

          // Notify main consumer
          try {
            let topics = [];
            if (fs.existsSync(NOTIFY_FILE)) {
              topics = JSON.parse(fs.readFileSync(NOTIFY_FILE, "utf8"));
            }
            topics.push({ topic: target, timestamp: Date.now() });
            fs.writeFileSync(NOTIFY_FILE, JSON.stringify(topics));
            console.log(`📝 Notified: ${target}`);
          } catch (err) {
            console.error("Notify failed:", err);
          }

          // Wait for propagation
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        await producer.send({
          topic: target,
          messages: [{ value: message.value }],
        });

        console.log(`↪️  Forwarded to ${target}`);
      } catch (error) {
        console.error("Error processing:", error);
      }
    },
  });
}

run().catch(console.error);
