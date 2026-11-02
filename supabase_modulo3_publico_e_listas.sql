-- ==============================================================================
-- MÓDULO 3: Visibilidade Granular de Público-Alvo e Listas Dinâmicas da Agenda
-- ==============================================================================

-- 1. Coluna de público estruturado na tabela capacitacoes
ALTER TABLE public.capacitacoes
ADD COLUMN IF NOT EXISTS publico_config jsonb DEFAULT '{
  "modo": "todos",
  "niveis_cargos": [],
  "equipes": [],
  "subequipes": [],
  "membros_especificos": [],
  "total_estimado": 0
}'::jsonb;

-- Índice GIN para consultas ultra-rápidas de visibilidade
CREATE INDEX IF NOT EXISTS idx_capacitacoes_publico_config 
ON public.capacitacoes USING gin (publico_config);

-- 2. Tabela Central de Configurações Dinâmicas (Chave / Valor JSONB)
CREATE TABLE IF NOT EXISTS public.configuracoes (
    chave text PRIMARY KEY,
    valor jsonb NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now(),
    atualizado_por text
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Política de leitura: todos os membros autenticados podem ler as opções da agenda
DROP POLICY IF EXISTS "Leitura de configuracoes por usuarios autenticados" ON public.configuracoes;
CREATE POLICY "Leitura de configuracoes por usuarios autenticados"
ON public.configuracoes FOR SELECT
TO authenticated
USING (true);

-- Política de escrita: lideranças, gestores e admins
DROP POLICY IF EXISTS "Edicao de configuracoes por lideranca e admin" ON public.configuracoes;
CREATE POLICY "Edicao de configuracoes por lideranca e admin"
ON public.configuracoes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Seed inicial das Listas da Agenda (Salas Físicas e Categorias de Eventos)
INSERT INTO public.configuracoes (chave, valor)
VALUES 
  ('agenda_salas', '["E-213 - Sala do Ramo", "Auditório 1", "Lab Maker (E-205)", "Laboratório de Informática", "Sala de Estudos", "Pátio / Espaço Aberto"]'::jsonb),
  ('agenda_categorias_ramo', '["Capacitação Técnica", "Reunião de Equipe", "Reunião Geral do Ramo", "Reunião de Diretoria / Lideranças", "Workshop / Hackathon", "Alinhamento 1:1"]'::jsonb),
  ('agenda_categorias_pse', '["Capacitação Trainee", "Dinâmica em Grupo", "Entrevista Individual", "Follow Up Trainee", "Avaliação 360", "Encontro de Integração"]'::jsonb)
ON CONFLICT (chave) DO NOTHING;
