CREATE TABLE IF NOT EXISTS equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor TEXT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipamentos_setor_idx ON equipamentos (setor);

CREATE TABLE IF NOT EXISTS supervisores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shift_reports ALTER COLUMN equipe DROP DEFAULT;
ALTER TABLE shift_reports
  ALTER COLUMN equipe TYPE JSONB USING (
    CASE WHEN equipe IS NULL OR equipe = '' THEN '[]'::jsonb
    ELSE to_jsonb(string_to_array(equipe, ',')) END
  );
ALTER TABLE shift_reports ALTER COLUMN equipe SET DEFAULT '[]'::jsonb;
