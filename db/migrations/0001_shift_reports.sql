CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_por TEXT NOT NULL DEFAULT '',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  turno TEXT NOT NULL DEFAULT 'A',
  hora_inicio TEXT NOT NULL DEFAULT '',
  hora_fim TEXT NOT NULL DEFAULT '',
  responsavel TEXT NOT NULL DEFAULT '',
  equipe TEXT NOT NULL DEFAULT '',
  setor TEXT NOT NULL DEFAULT '',
  resumo TEXT NOT NULL DEFAULT '',
  producao JSONB NOT NULL DEFAULT '[]'::jsonb,
  maquinas JSONB NOT NULL DEFAULT '[]'::jsonb,
  paradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  qualidade TEXT NOT NULL DEFAULT '',
  estoque TEXT NOT NULL DEFAULT '',
  manutencao TEXT NOT NULL DEFAULT '',
  seguranca JSONB NOT NULL DEFAULT '{"acidentes":0,"quase_acidentes":0,"observacoes":""}'::jsonb,
  limpeza TEXT NOT NULL DEFAULT '',
  pendencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT NOT NULL DEFAULT '',
  entregue_por TEXT NOT NULL DEFAULT '',
  recebido_por TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shift_reports_data_idx ON shift_reports (data DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_shift_reports_updated_at ON shift_reports;
CREATE TRIGGER update_shift_reports_updated_at
BEFORE UPDATE ON shift_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
