import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';

const kafka: Kafka = new Kafka({
  clientId: 'weather-monitoring-app',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: 'temperature-processor' });

export { kafka, producer, consumer, KafkaMessage };