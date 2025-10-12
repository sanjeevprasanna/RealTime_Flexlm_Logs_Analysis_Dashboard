// Randomized Kafka Producer for FlexLM Logs Simulation (Consumer-Compatible)

const { Kafka } = require("kafkajs");

// Kafka setup
const kafka = new Kafka({
  clientId: "flexlm-producer",
  brokers: ["localhost:9092"],
});

const topics = [
  "flexlm.logs.synopsys",
  "flexlm.logs.cadence",
  "flexlm.logs.altair",
  "flexlm.logs.lmgrd",
];

const operations = ["IN", "OUT", "DENIED", "CHECKOUT", "RELEASE"];
const features = ["alpaca_shell", "verdi", "genus", "quartus", "flotherm"];
const users = ["john", "mary", "arun", "li", "alex"];
const servers = ["design01", "sim01", "eda03", "chip05", "cad02"];

const producer = kafka.producer();

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomLog() {
  return {
    "@timestamp": new Date().toISOString(), //live data time
    operation: getRandomItem(operations),
    feature: getRandomItem(features),
    user: getRandomItem(users),
    server: getRandomItem(servers),
  };
}

async function runProd() {
  await producer.connect();

  const messages = Array.from({ length: 100 }, () => {
    const topic = getRandomItem(topics);
    const log = generateRandomLog();
    return { topic, messages: [{ value: JSON.stringify(log) }] };
  });

  for (const batch of messages) {
    await producer.send(batch);
  }

  console.log("✅ 100 random FlexLM log messages sent successfully!");
  await producer.disconnect();
}

runProd().catch(console.error);
