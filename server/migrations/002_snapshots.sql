CREATE TABLE IF NOT EXISTS doc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  ydoc_state BYTEA NOT NULL,
  snapshot_size INTEGER DEFAULT 0,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_doc_id ON doc_snapshots(doc_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_saved_at ON doc_snapshots(saved_at);
