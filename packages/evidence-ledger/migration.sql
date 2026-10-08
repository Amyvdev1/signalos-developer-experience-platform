CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, created_at TEXT NOT NULL, document TEXT NOT NULL CHECK(json_valid(document)));
CREATE TABLE IF NOT EXISTS payments(key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, id TEXT NOT NULL UNIQUE, amount INTEGER NOT NULL CHECK(amount > 0));
CREATE TABLE IF NOT EXISTS scenario_attempts(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS evidence(run_id TEXT NOT NULL REFERENCES runs(id), ordinal INTEGER NOT NULL, document TEXT NOT NULL CHECK(json_valid(document)), PRIMARY KEY(run_id,ordinal));
CREATE INDEX IF NOT EXISTS runs_created ON runs(created_at DESC);
INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));
