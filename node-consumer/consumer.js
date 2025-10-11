// consumer.js
import { Kafka } from 'kafkajs';
import { createClient } from '@clickhouse/client';

const kafka = new Kafka({
  clientId: 'flexlm-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'flexlm-group' });

const clickhouse = createClient({
  url: 'http://localhost:8123',
  username: 'default',
  password: ''
});

async function ensureTable() {
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS flexlm_events (
        ts DateTime DEFAULT now(),
        vendor String,
        event String,
        feature String,
        version String,
        user String,
        host String,
        details String,
        raw_log String
      ) ENGINE = MergeTree()
      ORDER BY (ts)
    `
  });
  // Allow skipping unknown JSON fields on insert
  await clickhouse.exec({ query: "SET input_format_skip_unknown_fields = 1" });
}

async function run() {
  await consumer.connect();
  await ensureTable();
  await consumer.subscribe({ topic: 'flexlm_logs', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value.toString();
      let obj;
      try {
        obj = JSON.parse(raw);
      } catch (err) {
        obj = { raw_log: raw };
      }

      const row = {
        ts: obj.date ? new Date(obj.date * 1000).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
        vendor: obj.vendor || '',
        event: obj.event || '',
        feature: obj.feature || '',
        version: obj.version || '',
        user: obj.user || '',
        host: obj.host || '',
        details: obj.details || '',
        raw_log: obj.log || obj.raw_log || raw
      };

      await clickhouse.insert({
        table: 'flexlm_events',
        values: [row],
        format: 'JSONEachRow'
      });
    }
  });
}

run().catch(err => {
  console.error('Fatal consumer error:', err);
  process.exit(1);
});

