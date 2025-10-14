-- Main table using MergeTree engine (best for time-series data)
CREATE TABLE IF NOT EXISTS flexlm.flexlm_logs(
    -- Timestamp fields
    event_time DateTime DEFAULT now(),           -- When event happened (from log)
    insert_time DateTime DEFAULT now(),          -- When inserted into DB
    
    -- Core fields from Kafka messages
    daemon LowCardinality(String),               -- synopsys, cadence, altair, lmgrd
    operation LowCardinality(String),            -- OUT, IN, DENIED, EXPIRED, etc.
    feature String,                              -- dc_shell, innovus, hypermesh
    version String,                              -- 2023.06, 23.10, etc.
    user String,                                 -- john, alice, bob
    server String,                               -- design01, floorplan01
    
    -- Optional fields (may be NULL)
    handle Nullable(UInt32),                     -- License handle number
    licenses_used Nullable(UInt16),              -- Current licenses in use
    licenses_total Nullable(UInt16),             -- Total available licenses
    
    -- Raw message for debugging
    raw_message String,
    
    -- Metadata
    kafka_topic String,                          -- Which Kafka topic
    kafka_partition UInt16,                      -- Which partition
    kafka_offset UInt64                          -- Message offset (for deduplication)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)                -- Partition by month for faster queries
ORDER BY (daemon, event_time, user)              -- Primary index for fast filtering
TTL event_time + INTERVAL 365 DAY                 -- Auto-delete data older than 365 days
SETTINGS index_granularity = 8192;               -- Default granularity


