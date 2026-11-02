-- ==============================================================================
-- MÓDULO DE CARGOS & MOVIMENTAÇÃO POR SLOTS (PORTAL IEEE)
-- ==============================================================================

-- 1. Adicionar coluna de limite de slots em usuarios (padrão: 3 slots)
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS limite_slots integer DEFAULT 3;

-- 2. Tabela de Solicitações de Movimentação e Desbloqueio de Slots
CREATE TABLE IF NOT EXISTS public.solicitacoes_movimentacao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('movimentacao_cargos', 'desbloqueio_slot', 'renovacao_automatica')),
    cargos_atuais jsonb NOT NULL DEFAULT '[]'::jsonb,
    cargos_propostos jsonb NOT NULL DEFAULT '[]'::jsonb,
    justificativa text,
    slot_solicitado integer, -- Ex: 4 ou 5
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
    motivo_recusa text,
    analisado_por uuid REFERENCES public.usuarios(id),
    analisado_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuario_status 
ON public.solicitacoes_movimentacao (usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_status_data 
ON public.solicitacoes_movimentacao (status, criado_em DESC);

-- 4. Habilitar RLS
ALTER TABLE public.solicitacoes_movimentacao ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Usuários leem suas próprias solicitações" ON public.solicitacoes_movimentacao;
CREATE POLICY "Usuários leem suas próprias solicitações"
    ON public.solicitacoes_movimentacao FOR SELECT
    TO authenticated
    USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuários inserem suas solicitações" ON public.solicitacoes_movimentacao;
CREATE POLICY "Usuários inserem suas solicitações"
    ON public.solicitacoes_movimentacao FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Liderança e GP gerenciam todas as solicitações" ON public.solicitacoes_movimentacao;
CREATE POLICY "Liderança e GP gerenciam todas as solicitações"
    ON public.solicitacoes_movimentacao FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
