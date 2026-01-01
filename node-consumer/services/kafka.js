const { Kafka } = require("kafkajs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

//Live Topics list.
const liveKafkaTopicsList = {};
const currLen = 0;

// console.log(process.env.KAFKA_GROUPID);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENTID,
  brokers: process.env.KAFKA_BROKERS.split(","),
});

// console.log(process.env.KAFKA_GROUPID);

const connectAdmin = async () => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    return admin;

    console.log("Admin Connected");
  } catch (excemption) {
    console.log("Error connecting", excemption);
  }
};

const disconnectAdmin = async (admin) => {
  try {
    await admin.disconnect();
    console.log("Admin Disconnected");
  } catch (e) {
    console.log("Error disconnecting", e);
  }
};

const getRunningTopics = async () => {
  try {
    const admin = await connectAdmin();
    const list = await admin.listTopics();
    console.log(list);
  } catch (excemption) {
    console.log("Error getting the running topics", getRunningTopics);
  }
};

const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUPID });

const addTopicToSubscription = async (topic) => {
  try {
    await consumer.stop();
    await consumer.connect();
    await consumer.subscribe({ topic });
    console.log("Added topic to subscription:", topic);
  } catch (error) {
    console.error("Error adding topic to subscription:", error);
    throw error;
  } finally {
    await consumer.disconnect();
  }
};

const createTopic = async (topicName, NumberOfPartitions) => {
  const admin = await connectAdmin();
  try {
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions: NumberOfPartitions,
        },
      ],
    });
    liveKafkaTopicsList.add(topicName);
    //await addTopicToSubscription(topicName);
  } catch (excemption) {
    console.log("Error creating topic", excemption);
  } finally {
    await disconnectAdmin(admin);
  }
};

const deleteTopic = async (topic) => {
  try {
    const admin = await connectAdmin();
    await admin.deleteTopics({
      topics: [topic],
    });
    console.log(topic, "Topic deleted successfully");
    await disconnectAdmin(admin);
    return true;
  } catch (error) {
    console.error("Error deleting topic:", error);
    return false;
  }
};

(async () => {
  // getRunningTopics();
  // createTopic("test-topic");
  // deleteTopic("test-topic");
  getRunningTopics();
})();
