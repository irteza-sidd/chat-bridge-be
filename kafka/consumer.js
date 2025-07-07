import { Kafka } from "kafkajs";
import { TOPICS } from "./topics.js";
import { handleSendNotification } from "./handler.js";

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["kafka:9093"],
});

const consumer = kafka.consumer({ groupId: "chat-service-group" });

const topicHandlers = {
  [TOPICS.SEND_NOTIFICATION]: handleSendNotification,
};

const connectKafka = async (delay = 5000) => {
  try {
    await consumer.connect();
    console.log("Kafka consumer connected successfully.");
  } catch (error) {
    console.error(`Error connecting to Kafka: ${error.message}`);
    console.log(`Retrying connection in ${delay / 1000} seconds...`);
    setTimeout(() => connectKafka(delay), delay);
  }
};

export const run = async () => {
  await connectKafka();

  await consumer.subscribe({
    topics: [TOPICS.SEND_NOTIFICATION],
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Topic received:", topic);
      const handler = topicHandlers[topic];
      if (handler) {
        console.log("Message content:", message.value.toString());
        handler(JSON.parse(message.value.toString()));
      } else {
        console.log(`No handler defined for topic: ${topic}`);
      }
    },
  });
};

run().catch(console.error);
