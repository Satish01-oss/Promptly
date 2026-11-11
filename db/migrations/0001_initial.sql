CREATE TABLE IF NOT EXISTS site_settings(id TEXT PRIMARY KEY,value TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS app_secrets(id TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_history(id TEXT PRIMARY KEY,action TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL,snapshot TEXT);
CREATE INDEX IF NOT EXISTS admin_history_created_at_idx ON admin_history(created_at DESC);
CREATE TABLE IF NOT EXISTS daily_usage(day TEXT PRIMARY KEY,requests BIGINT NOT NULL,successes BIGINT NOT NULL,errors BIGINT NOT NULL,latency_ms BIGINT NOT NULL,input_characters BIGINT NOT NULL,output_characters BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS request_limits(id TEXT NOT NULL,minute BIGINT NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(id,minute));
