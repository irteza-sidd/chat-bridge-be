import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["kafka:9093"],
});

const producer = kafka.producer();

export const sendMessage = async (topic, message) => {
  try {
    await producer.connect();

    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to topic ${topic}:`, message);
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
  } finally {
    await producer.disconnect();
  }
};
