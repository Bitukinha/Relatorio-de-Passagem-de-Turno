ALTER TABLE shift_reports RENAME COLUMN maquinas TO equipamentos;
ALTER TABLE shift_reports ALTER COLUMN equipamentos SET DEFAULT '[]'::jsonb;

ALTER TABLE shift_reports ADD COLUMN IF NOT EXISTS silos JSONB NOT NULL DEFAULT '[]'::jsonb;

DROP TABLE IF EXISTS equipamentos;
