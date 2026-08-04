CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  papel TEXT NOT NULL CHECK (papel IN ('turno_a', 'turno_b', 'turno_c', 'admin')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO usuarios (nome, papel) VALUES
  ('Douglas', 'turno_a'),
  ('Alisson', 'turno_b'),
  ('Patrocinio', 'turno_c'),
  ('Jean Novaes', 'admin'),
  ('Matheus Issao', 'admin')
ON CONFLICT (nome) DO NOTHING;
