#!/bin/bash

# Ensure Kafka container is running
if ! docker ps | grep -q kafka; then
  echo "Kafka container not running!"
  exit 1
fi

TOPICS=("flexlm.logs.synopsys" "flexlm.logs.cadence" "flexlm.logs.altair")

for topic in "${TOPICS[@]}"; do
  echo "Creating topic: $topic"
  docker exec -it kafka /opt/kafka/bin/kafka-topics.sh \
    --create \
    --if-not-exists \
    --topic "$topic" \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1
done

