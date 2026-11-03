-- ==============================================================================
-- CENÁRIO COMPLETO DE TESTES PSE + TABELAS DA AGENDA E MÓDULO 3
-- Execução: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ESTRUTURA DA TABELA USUARIOS (Colunas Adicionais para Perfis e Equipes)
-- ------------------------------------------------------------------------------
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS equipe text DEFAULT 'Geral';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS subequipe text DEFAULT 'Geral';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS cargo text DEFAULT 'Membro';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nivel_acesso text DEFAULT 'MEMBRO';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS tipo_membro text DEFAULT 'Membro';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS curso text;

-- ------------------------------------------------------------------------------
-- 2. TABELAS DO MÓDULO 3: Catálogo, Demandas, Capacitações, Presenças, Avaliações
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalogo_cursos (
    id text PRIMARY KEY,
    nome_curso text NOT NULL,
    equipe_responsavel text DEFAULT 'Geral',
    status_curso text NOT NULL DEFAULT 'Ativo' CHECK (status_curso IN ('Ativo', 'Inativo')),
    ementa text,
    carga_horaria text,
    material_url text,
    criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupos_trainee (
    id text PRIMARY KEY,
    nome_grupo text NOT NULL,
    assessor_tecnico_matricula text,
    assessor_tecnico_nome text,
    assessor_rh_matricula text,
    assessor_rh_nome text,
    lider_matricula text,
    lider_nome text,
    integrantes_matriculas text,
    criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demandas_cursos (
    id text PRIMARY KEY,
    id_curso text REFERENCES public.catalogo_cursos(id) ON DELETE CASCADE,
    equipe_participante text NOT NULL,
    id_grupo_trainee text DEFAULT 'TODOS',
    tipo_atribuicao text DEFAULT 'Obrigatoria',
    marcado_por text,
    criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.capacitacoes (
    id text PRIMARY KEY,
    id_curso text REFERENCES public.catalogo_cursos(id) ON DELETE SET NULL,
    nome_capacitacao text NOT NULL,
    data date NOT NULL,
    hora_inicio text NOT NULL,
    hora_fim text NOT NULL,
    ministrantes text,
    modalidade text NOT NULL DEFAULT 'Presencial' CHECK (modalidade IN ('Presencial', 'Online', 'Gravada', 'Híbrido')),
    local_link text,
    status text NOT NULL DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Em Andamento', 'Concluída', 'Cancelada')),
    descricao text,
    equipe_responsavel text DEFAULT 'Geral',
    marcado_por text,
    tipo_evento text NOT NULL DEFAULT 'Capacitação',
    publico_alvo text NOT NULL DEFAULT 'Todos do Ramo',
    contexto text NOT NULL DEFAULT 'Processo Trainee (PSE)',
    publico_config jsonb DEFAULT '{}'::jsonb,
    data_fim date,
    criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.presencas (
    id text PRIMARY KEY DEFAULT ('REG-' || floor(extract(epoch from now()) * 1000)::text),
    id_capacitacao text NOT NULL REFERENCES public.capacitacoes(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    matricula text NOT NULL,
    status_presenca text NOT NULL CHECK (status_presenca IN ('Presente', 'Falta Justificada')),
    justificativa text,
    data_hora_registro timestamptz DEFAULT now(),
    UNIQUE(id_capacitacao, matricula)
);

CREATE TABLE IF NOT EXISTS public.chamada_ministrante (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_capacitacao text NOT NULL REFERENCES public.capacitacoes(id) ON DELETE CASCADE,
    matricula text NOT NULL,
    status_ministrante text NOT NULL DEFAULT 'Presente' CHECK (status_ministrante IN ('Presente', 'Falta')),
    data_hora timestamptz DEFAULT now(),
    UNIQUE(id_capacitacao, matricula)
);

CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id text PRIMARY KEY DEFAULT ('AVAL-' || floor(extract(epoch from now()) * 1000)::text),
    id_capacitacao text NOT NULL REFERENCES public.capacitacoes(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    matricula text NOT NULL,
    nota integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
    feedback text NOT NULL,
    data_avaliacao timestamptz DEFAULT now(),
    UNIQUE(id_capacitacao, matricula)
);

CREATE TABLE IF NOT EXISTS public.configuracoes (
    chave text PRIMARY KEY,
    valor jsonb NOT NULL,
    atualizado_em timestamptz DEFAULT now()
);

-- Converte valor de configuracoes para jsonb caso já exista como text
DO $$
BEGIN
    ALTER TABLE public.configuracoes ALTER COLUMN valor TYPE jsonb USING valor::jsonb;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.pch (
    usuario_id uuid PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    dados_pch jsonb NOT NULL DEFAULT '{}'::jsonb,
    visibilidade text NOT NULL DEFAULT 'todos' CHECK (visibilidade IN ('todos', 'lider')),
    atualizado_em timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- ------------------------------------------------------------------------------
ALTER TABLE public.catalogo_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_trainee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamada_ministrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pch ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total autenticados catalogo" ON public.catalogo_cursos;
CREATE POLICY "Acesso total autenticados catalogo" ON public.catalogo_cursos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados grupos" ON public.grupos_trainee;
CREATE POLICY "Acesso total autenticados grupos" ON public.grupos_trainee FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados demandas" ON public.demandas_cursos;
CREATE POLICY "Acesso total autenticados demandas" ON public.demandas_cursos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados capacitacoes" ON public.capacitacoes;
CREATE POLICY "Acesso total autenticados capacitacoes" ON public.capacitacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados presencas" ON public.presencas;
CREATE POLICY "Acesso total autenticados presencas" ON public.presencas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados chamadas" ON public.chamada_ministrante;
CREATE POLICY "Acesso total autenticados chamadas" ON public.chamada_ministrante FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados avaliacoes" ON public.avaliacoes;
CREATE POLICY "Acesso total autenticados avaliacoes" ON public.avaliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados configuracoes" ON public.configuracoes;
CREATE POLICY "Acesso total autenticados configuracoes" ON public.configuracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados pch" ON public.pch;
CREATE POLICY "Acesso total autenticados pch" ON public.pch FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total autenticados usuarios" ON public.usuarios;
CREATE POLICY "Acesso total autenticados usuarios" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. CONFIGURAÇÃO DE LISTAS PADRÃO DA AGENDA (Salas, Categorias Ramo, Categorias PSE)
-- ------------------------------------------------------------------------------
INSERT INTO public.configuracoes (chave, valor)
VALUES
    ('agenda_salas', '["E-213 - Sala do Ramo", "Auditório 1", "Lab Maker (E-205)", "Laboratório de Informática", "Sala de Estudos", "Pátio / Espaço Aberto"]'::jsonb),
    ('agenda_categorias_ramo', '["Capacitação Técnica", "Reunião de Equipe", "Reunião Geral do Ramo", "Reunião de Diretoria / Lideranças", "Workshop / Hackathon", "Alinhamento 1:1"]'::jsonb),
    ('agenda_categorias_pse', '["Capacitação Trainee", "Reunião 360", "Dinâmica em Grupo", "Entrevista Individual", "Follow Up Trainee"]'::jsonb)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- ------------------------------------------------------------------------------
-- 5. USUÁRIOS DE TESTE (Senhas padronizadas: 'ieee2026')
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_enc_pw text := extensions.crypt('ieee2026', extensions.gen_salt('bf'));
    u_admin uuid;
    u_lider uuid;
    u_membro uuid;
    u_trainee uuid;
    u_eike uuid;
BEGIN
    -- 1. Admin Presidente (1234567)
    SELECT id INTO u_admin FROM public.usuarios WHERE matricula = '1234567';
    IF u_admin IS NULL THEN
        u_admin := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (u_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@cefet-rj.br', v_enc_pw, now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin Presidente"}'::jsonb, now(), now());
        INSERT INTO public.usuarios (id, matricula, nome, email, status, tipo_membro, cargo, equipe, nivel_acesso)
        VALUES (u_admin, '1234567', 'Admin Presidente', 'admin@cefet-rj.br', 'Ativo', 'Membro', 'Presidente', 'Presidência', 'ADMIN');
    ELSE
        UPDATE auth.users SET encrypted_password = v_enc_pw WHERE id = u_admin;
        UPDATE public.usuarios SET equipe = 'Presidência', cargo = 'Presidente', nivel_acesso = 'ADMIN', tipo_membro = 'Membro' WHERE id = u_admin;
    END IF;

    -- 2. Eike Vimieiro (2012391GEL)
    SELECT id INTO u_eike FROM public.usuarios WHERE matricula = '2012391GEL';
    IF u_eike IS NOT NULL THEN
        UPDATE auth.users SET encrypted_password = v_enc_pw WHERE id = u_eike;
        UPDATE public.usuarios SET equipe = 'Presidência', cargo = 'Presidente', nivel_acesso = 'ADMIN', tipo_membro = 'Membro' WHERE id = u_eike;
    END IF;

    -- 3. Lucas Líder de Equipe (2323101)
    SELECT id INTO u_lider FROM public.usuarios WHERE matricula = '2323101';
    IF u_lider IS NULL THEN
        u_lider := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (u_lider, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lider.teste@cefet-rj.br', v_enc_pw, now(), '{"provider":"email","providers":["email"]}', '{"name":"Lucas Líder de Equipe"}'::jsonb, now(), now());
        INSERT INTO public.usuarios (id, matricula, nome, email, status, tipo_membro, cargo, equipe, nivel_acesso)
        VALUES (u_lider, '2323101', 'Lucas Líder de Equipe', 'lider.teste@cefet-rj.br', 'Ativo', 'Membro', 'Líder de Equipe', 'Wolfbotz (RAS)', 'LIDER');
    ELSE
        UPDATE auth.users SET encrypted_password = v_enc_pw WHERE id = u_lider;
        UPDATE public.usuarios SET equipe = 'Wolfbotz (RAS)', cargo = 'Líder de Equipe', nivel_acesso = 'LIDER', tipo_membro = 'Membro' WHERE id = u_lider;
    END IF;

    -- 4. Marcos Membro Projetista / Ministrante (2323102)
    SELECT id INTO u_membro FROM public.usuarios WHERE matricula = '2323102';
    IF u_membro IS NULL THEN
        u_membro := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (u_membro, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'membro.teste@cefet-rj.br', v_enc_pw, now(), '{"provider":"email","providers":["email"]}', '{"name":"Marcos Membro Projetista"}'::jsonb, now(), now());
        INSERT INTO public.usuarios (id, matricula, nome, email, status, tipo_membro, cargo, equipe, nivel_acesso)
        VALUES (u_membro, '2323102', 'Marcos Membro Projetista', 'membro.teste@cefet-rj.br', 'Ativo', 'Membro', 'Membro Projetista', 'Wolfpower (PES)', 'MEMBRO');
    ELSE
        UPDATE auth.users SET encrypted_password = v_enc_pw WHERE id = u_membro;
        UPDATE public.usuarios SET equipe = 'Wolfpower (PES)', cargo = 'Membro Projetista', nivel_acesso = 'MEMBRO', tipo_membro = 'Membro' WHERE id = u_membro;
    END IF;

    -- 5. Tiago Trainee PSE (2323103) - Membro do Grupo 1 (WolfPower + SocialWolf)
    SELECT id INTO u_trainee FROM public.usuarios WHERE matricula = '2323103';
    IF u_trainee IS NULL THEN
        u_trainee := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (u_trainee, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trainee.teste@cefet-rj.br', v_enc_pw, now(), '{"provider":"email","providers":["email"]}', '{"name":"Tiago Trainee PSE"}'::jsonb, now(), now());
        INSERT INTO public.usuarios (id, matricula, nome, email, status, tipo_membro, cargo, equipe, nivel_acesso)
        VALUES (u_trainee, '2323103', 'Tiago Trainee PSE', 'trainee.teste@cefet-rj.br', 'Ativo', 'Trainee', 'Trainee', 'Wolfpower (PES)', 'TRAINEE');
    ELSE
        UPDATE auth.users SET encrypted_password = v_enc_pw WHERE id = u_trainee;
        UPDATE public.usuarios SET equipe = 'Wolfpower (PES)', cargo = 'Trainee', nivel_acesso = 'TRAINEE', tipo_membro = 'Trainee' WHERE id = u_trainee;
    END IF;

    -- Insere PCH para os 5 usuários
    INSERT INTO public.pch (usuario_id, dados_pch, visibilidade) VALUES
        (u_admin, '{"seg": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "ter": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "qua": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "qui": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "sex": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "sab": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}}'::jsonb, 'todos'),
        (u_lider, '{"seg": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "ter": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qua": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qui": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sex": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sab": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}}'::jsonb, 'todos'),
        (u_membro, '{"seg": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "ter": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qua": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qui": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sex": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sab": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": false, "online": false}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}}'::jsonb, 'todos'),
        (u_trainee, '{"seg": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "ter": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qua": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "qui": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sex": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}, "sab": {"08:00 - 09:00": {"presencial": false, "online": false}, "09:00 - 10:00": {"presencial": false, "online": false}, "10:00 - 11:00": {"presencial": false, "online": false}, "11:00 - 12:00": {"presencial": false, "online": false}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": false, "online": false}, "19:00 - 20:00": {"presencial": false, "online": false}, "20:00 - 21:00": {"presencial": false, "online": false}}}'::jsonb, 'todos')
    ON CONFLICT (usuario_id) DO UPDATE SET dados_pch = EXCLUDED.dados_pch;

    IF u_eike IS NOT NULL THEN
        INSERT INTO public.pch (usuario_id, dados_pch, visibilidade)
        VALUES (u_eike, '{"seg": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "ter": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "qua": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "qui": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "sex": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}, "sab": {"08:00 - 09:00": {"presencial": true, "online": true}, "09:00 - 10:00": {"presencial": true, "online": true}, "10:00 - 11:00": {"presencial": true, "online": true}, "11:00 - 12:00": {"presencial": true, "online": true}, "13:00 - 14:00": {"presencial": true, "online": true}, "14:00 - 15:00": {"presencial": true, "online": true}, "15:00 - 16:00": {"presencial": true, "online": true}, "16:00 - 17:00": {"presencial": true, "online": true}, "17:00 - 18:00": {"presencial": true, "online": true}, "18:00 - 19:00": {"presencial": true, "online": true}, "19:00 - 20:00": {"presencial": true, "online": true}, "20:00 - 21:00": {"presencial": true, "online": true}}}'::jsonb, 'todos')
        ON CONFLICT (usuario_id) DO UPDATE SET dados_pch = EXCLUDED.dados_pch;
    END IF;

END $$;

-- ------------------------------------------------------------------------------
-- 6. CARGA DO CATÁLOGO DE CURSOS (74 Cursos Oficiais)
-- ------------------------------------------------------------------------------
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-001', 'Análise de dados com Pandas', 'Ativo', 'Wolfbyte (CS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-002', 'Apresentação Canva', 'Ativo', 'Wie - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-003', 'Apresentação Pessoal', 'Ativo', 'Gestão de Pessoas - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-004', 'Arte e Som', 'Ativo', 'Wolfbyte (CS) - Games') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-005', 'Conexões e cordas em recuperação', 'Ativo', 'Rocketwolf (AESS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-006', 'Didática e Impacto Social', 'Ativo', 'Socialwolf (SSIT) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-007', 'Elaboração de Relatório de Projeto', 'Ativo', 'Socialwolf (SSIT) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-008', 'Eletrônica Teórica', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-009', 'Energias Renováveis', 'Ativo', 'Wolfpower (PES) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-010', 'Equipe e grupo de Afinidade - WIE', 'Ativo', 'Wie - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-011', 'Eventos', 'Ativo', 'Wie - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-012', 'Eventos e Parcerias', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-013', 'Excel Básico', 'Ativo', 'Gestão de Pessoas - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-014', 'Excel II', 'Ativo', 'Gestão de Pessoas - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-015', 'Ferramentas e Uso da Sala + Impressora 3D', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-016', 'Fundamentos Básicos de Web & Projetos', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-017', 'Fundamentos da Eletrônica Digital', 'Ativo', 'Wolfbyte (CS) - Hardware') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-018', 'Gestão de Projetos', 'Ativo', 'Gestão de Projetos (Secretaria Geral) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-019', 'Gestão do Ramo', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-020', 'Git + Github', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-021', 'HTML + CSS3 + JS', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-022', 'Imagem', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-023', 'Introdução a Aerodinâmica', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-024', 'Introdução a Circuitos', 'Ativo', 'Wolfpower (PES) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-025', 'Introdução a Componentes do Foguete e suas Estruturas', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-026', 'Introdução a Foguetemodelismo', 'Ativo', 'Rocketwolf (AESS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-027', 'Introdução a Foguetrônica', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-028', 'Introdução a IA 0: Conceitos e Técnicas', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-029', 'Introdução a IA I: Machine Learning', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-030', 'Introdução a IA II: Visão Computacional', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-031', 'Introdução a IA III: Processamento de Linguagem Natural', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-032', 'Introdução a IA IV: Automação Digital', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-033', 'Introdução a Propulsão', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-034', 'Introdução a Recuperação', 'Ativo', 'Rocketwolf (AESS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-035', 'Introdução a Solidworks', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-036', 'Introdução ao Robótica e a categoria', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-037', 'JavaScript - Programação Básica', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-038', 'Laminação de Fibra de Vidro I', 'Ativo', 'Rocketwolf (AESS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-039', 'Laminação de Fibra de Vidro II', 'Ativo', 'Rocketwolf (AESS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-040', 'Liderança e Orgulho IEEE', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-041', 'Logisim - Simulação de Circuitos Lógicos', 'Ativo', 'Wolfbyte (CS) - Hardware') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-042', 'Microcontroladores', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-043', 'MVO e OpenRocket', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-044', 'NodeJS', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-045', 'Notion', 'Ativo', 'Gestão de Projetos (Secretaria Geral) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-046', 'PCB prática', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-047', 'PCB teórica', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-048', 'Planejamento de Projeto', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-049', 'Programação Básica em C/C++', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-050', 'Projeto de Motor', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-051', 'Projetos', 'Ativo', 'Wie - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-052', 'Python', 'Ativo', 'Wolfbyte (CS) - IA') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-053', 'Ramo Estudantil IEEE + Equipes', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-054', 'React', 'Ativo', 'Wolfbyte (CS) - Web') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-055', 'Redes Sociais e Identidade Visual do Ramo', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-056', 'Scrum', 'Ativo', 'Wolfbyte (CS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-057', 'SolidWorks para Foguetemodelismo', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-058', 'Testes e ensaios em recuperação', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-059', 'Tinkercad', 'Ativo', 'Wolfpower (PES) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-060', 'Unity POO', 'Ativo', 'Wolfbyte (CS) - Games') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-061', 'Introdução à Óptica', 'Ativo', 'Fótonwolf (IPS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-062', 'Polarização da Luz e Efeito Faraday', 'Ativo', 'Fótonwolf (IPS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-063', 'Agentes e Embarcados', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-064', 'Eletrônica Prática', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-065', 'Fusion 360', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-066', 'Fusion 360 para PCB’s', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-067', 'Prototipagem de PCB’s', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-068', 'Montagem de Circuitos Lógicos na Protoboard', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-069', 'Pipefy Básico', 'Ativo', 'Wolfbyte (CS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-070', 'Power BI Básico', 'Ativo', 'Wolfbyte (CS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-071', 'Lideranças e OUs - IEEE Computer Society', 'Ativo', 'Wolfbyte (CS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-072', 'Recepção Trainee', 'Ativo', 'Gestão de Recrutamento e Seleção - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-073', 'Programação para microcontroladores', 'Ativo', 'Wolfbotz (RAS) - Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;
INSERT INTO public.catalogo_cursos (id, nome_curso, status_curso, equipe_responsavel) VALUES ('CAP-074', 'Testes de sistema', 'Ativo', 'Geral') ON CONFLICT (id) DO UPDATE SET nome_curso = EXCLUDED.nome_curso, status_curso = EXCLUDED.status_curso, equipe_responsavel = EXCLUDED.equipe_responsavel;

-- ------------------------------------------------------------------------------
-- 7. CARGA DOS GRUPOS DE TRAINEE E ASSESSORES
-- ------------------------------------------------------------------------------
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-550036', 'Grupo 01 (Socialwolf (SSIT) - Geral • Wolfpower (PES) - Geral)', '2611138GAUT', 'Leonardo Rabello Rodrigues', '2620752GTEL', 'Camila Soares Santos', '2620334GAMB', 'Lucas Ferreira Nascentes', '2417977GAMB, 2620175GEL, 2620088GMEC, 2620334GAMB, 2512300GAUT, 2528957GAMB, 1724498GTEL, 2323103') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-606927', 'Grupo 02 (Rocketwolf (AESS) - Geral)', '', '', '', '', '2610544GMEC', 'Felippe Diniz Sena Gomes', '2610544GMEC, 4567890GEL') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-005052', 'Grupo 03 (Wolfbotz (RAS) - Geral)', '2529054GELT', 'Matheus Willian Torres Santos Flores', '2620882GAUT', 'Luisa Costa Cabral', '2529126GAUT', 'Lorenzo Marini Silva Padilha', '2611222GELT, 2529036GCIV, 2620116GELT, 2610441GAUT, 2512085GMEC, 2529190GAUT, 2529126GAUT, 2512769GEL') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-307425', 'Grupo 04 (Wolfbyte (CS) - Games)', '2512427BCC', 'Luciano Cunha Damaso Mello', '2323054GPRO', 'Pedro Henrique da Silva', '2528914BCC', 'Gabriela Ferreira Carneiro', '2610448GAUT, 2528914BCC, 2528906BCC, 2512448BCC') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-717765', 'Grupo 05 (Wolfbyte (CS) - Web)', '2224496GEL', 'João Pedro Weydt De Faria', '2512875BCC', 'Rafael Voigt Villas Boas', '1820696GELT', 'Jhonattan Cebriam Moreira Gomes', '2529071BCC, 2420063BCC, 1820696GELT, 2420061BCC') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-422036', 'Grupo 06 (Wolfbyte (CS) - Hardware)', '2512427BCC', 'Luciano Cunha Damaso Mello', '2512560GPRO', 'Victor Zanoni Teixeira', '2610292GELT', 'Ian Lahiri de Araujo Pereira', '2610292GELT, 2610331BCC, 2611025GAUT, 2420098BCC') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-486044', 'Grupo 07 (Wolfbyte (CS) - IA)', '2417470SINF', 'Emanuel Duarte Simões De Almeida', '2417832GADM', 'Déborah Fernandes Pereira Do Nascimento', '2528959GELT', 'Daniel Tavares Albuquerque da SIlva', '2528959GELT, 2610346GTEL, 2528941GEL, 2529083BCC') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;
INSERT INTO public.grupos_trainee (id, nome_grupo, assessor_tecnico_matricula, assessor_tecnico_nome, assessor_rh_matricula, assessor_rh_nome, lider_matricula, lider_nome, integrantes_matriculas) VALUES ('GRP-400283', 'Grupo 15 (Gestão de Pessoas - Geral)', '2012391GEL', 'Eike Vimieiro', '1234567GEL', 'STRIKE TRAINEE 1', '2345678GEL', 'STRIKE TRAINEE 2', '1234567GEL, 2345678GEL') ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, integrantes_matriculas = EXCLUDED.integrantes_matriculas;

-- ------------------------------------------------------------------------------
-- 8. CARGA DE DEMANDAS DE CURSOS PELAS EQUIPES
-- ------------------------------------------------------------------------------
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082783060', 'CAP-008', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082789840', 'CAP-013', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082790758', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082793562', 'CAP-017', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082796896', 'CAP-020', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082819851', 'CAP-035', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082820228', 'CAP-036', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082825149', 'CAP-040', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082828630', 'CAP-042', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082830448', 'CAP-045', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082832319', 'CAP-046', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082832933', 'CAP-047', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082834346', 'CAP-049', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082842429', 'CAP-053', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082848067', 'CAP-059', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082852867', 'CAP-064', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082853545', 'CAP-065', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082855468', 'CAP-066', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-1790082866030', 'CAP-073', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-070157-0', 'CAP-003', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-070347-1', 'CAP-008', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-071344-2', 'CAP-013', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-071534-3', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-071698-4', 'CAP-017', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-072421-5', 'CAP-020', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-072716-6', 'CAP-036', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-072860-7', 'CAP-040', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-073033-8', 'CAP-042', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-073222-9', 'CAP-045', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-073368-10', 'CAP-046', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074151-11', 'CAP-047', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074307-12', 'CAP-049', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074463-13', 'CAP-059', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074608-14', 'CAP-064', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074757-15', 'CAP-065', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-074946-16', 'CAP-073', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-530674-0', 'CAP-002', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-530958-1', 'CAP-003', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-531205-2', 'CAP-008', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-531456-3', 'CAP-013', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-531742-4', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-532218-5', 'CAP-018', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-532663-6', 'CAP-042', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-532906-7', 'CAP-046', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-533171-8', 'CAP-047', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-533401-9', 'CAP-053', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-533683-10', 'CAP-059', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-533994-11', 'CAP-064', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-534234-12', 'CAP-065', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-535024-13', 'CAP-002', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-535264-14', 'CAP-003', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-535511-15', 'CAP-002', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-535769-16', 'CAP-003', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-536019-17', 'CAP-008', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-536666-18', 'CAP-007', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-537461-19', 'CAP-009', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-537879-20', 'CAP-013', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-538122-21', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-539017-22', 'CAP-018', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-539273-23', 'CAP-024', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-539769-24', 'CAP-042', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-540024-25', 'CAP-046', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-540282-26', 'CAP-047', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-540542-27', 'CAP-048', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-540790-28', 'CAP-053', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-541032-29', 'CAP-059', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-541278-30', 'CAP-064', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-541522-31', 'CAP-065', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-541934-32', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-542786-33', 'CAP-040', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-543027-34', 'CAP-045', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-543279-35', 'CAP-074', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-543538-36', 'CAP-072', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-443343-0', 'CAP-015', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-443888-1', 'CAP-025', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-444444-2', 'CAP-026', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-444768-3', 'CAP-038', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-445071-4', 'CAP-039', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-445356-5', 'CAP-065', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-445619-6', 'CAP-005', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.demandas_cursos (id, id_curso, equipe_participante, id_grupo_trainee, tipo_atribuicao, marcado_por) VALUES ('DEM-445887-7', 'CAP-010', 'TODOS', 'TODOS', 'Obrigatoria', 'Equipe_Toda') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. EVENTOS SIMULADOS NA AGENDA (COBRINDO TODAS AS 5 CATEGORIAS DE PSE)
-- ------------------------------------------------------------------------------

-- 9.1 Capacitação Trainee (De-Para Automático) - Hoje
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-001',
    'CAP-003',
    'Capacitação Trainee - Apresentação Pessoal',
    '2026-11-02',
    '14:00',
    '16:00',
    'Marcos Membro Projetista',
    'Presencial',
    'E-213 - Sala do Ramo',
    'Agendada',
    'Gestão de Pessoas',
    'Capacitação Trainee',
    'Trainees dos Grupos 1, 2, 4 (WolfPower, SocialWolf, WolfByte)',
    'Processo Trainee (PSE)',
    'Treinamento obrigatório de postura, comunicação não-violenta e apresentação corporativa.'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, local_link = EXCLUDED.local_link;

-- 9.2 Reunião 360 (Quórum Estrito 100%) - Amanhã
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-002',
    NULL,
    'Reunião 360 - Grupo 01 (WolfPower + SocialWolf)',
    '2026-11-03',
    '17:00',
    '18:00',
    'Lucas Líder de Equipe (Assessor)',
    'Presencial',
    'E-213 - Sala do Ramo',
    'Agendada',
    'Gestão de Pessoas (GP) / R&S',
    'Reunião 360',
    'Trainees do Grupo 01 + Assessores Técnico e RH',
    'Processo Trainee (PSE)',
    '• Metas da Semana 1
• Status das primeiras entregas e divisão das duplas
• Dificuldades e bloqueios com ferramentas'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, local_link = EXCLUDED.local_link;

-- 9.3 Dinâmica em Grupo (Pool de Turmas Self-Service) - Daqui a 3 dias
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-003',
    NULL,
    'Dinâmica em Grupo - PSE 2026.1 (Turma A)',
    '2026-11-05',
    '15:00',
    '17:00',
    'Admin Presidente, Lucas Líder',
    'Presencial',
    'Auditório 1',
    'Agendada',
    'Gestão de Recrutamento e Seleção (R&S)',
    'Dinâmica em Grupo',
    'Pool de Trainees Candidatos (até 8 por turma)',
    'Processo Trainee (PSE)',
    'Dinâmica de estudo de caso prático para avaliação comportamental e trabalho em equipe.'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, local_link = EXCLUDED.local_link;

-- 9.4 Entrevista Individual PSE (PCH Triangular 3-Way) - Daqui a 5 dias
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-004',
    NULL,
    'Entrevista Individual - Tiago Trainee PSE',
    '2026-11-07',
    '14:00',
    '15:00',
    'Marcos Membro Projetista, Lucas Líder',
    'Presencial',
    'Sala de Estudos',
    'Agendada',
    'Gestão de Recrutamento e Seleção (R&S)',
    'Entrevista Individual',
    '1 Candidato (Tiago Trainee) + Banca Avaliadora',
    'Processo Trainee (PSE)',
    'Entrevista individual com perguntas de trajetória e alinhamento de expectativas.'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, local_link = EXCLUDED.local_link;

-- 9.5 Follow-Up Semanal (Assíncrono APP PSE) - Daqui a 5 dias
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-005',
    NULL,
    'Follow-Up Semanal Trainee #1',
    '2026-11-07',
    '00:00',
    '23:59',
    'Gestão de Pessoas (GP)',
    'Online',
    'Plataforma APP PSE',
    'Agendada',
    'Gestão de Pessoas (GP)',
    'Follow Up Trainee',
    'Todos os Grupos Trainee',
    'Processo Trainee (PSE)',
    'Envio obrigatório do formulário semanal de progresso e feedbacks na plataforma do PSE.'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, local_link = EXCLUDED.local_link;

-- 9.6 Evento Concluído com DOUBLE-CHECK ATIVO (Self Check-in + Chamada + Avaliação)
INSERT INTO public.capacitacoes (id, id_curso, nome_capacitacao, data, hora_inicio, hora_fim, ministrantes, modalidade, local_link, status, equipe_responsavel, tipo_evento, publico_alvo, contexto, descricao)
VALUES (
    'EVT-SIM-CONCLUIDA',
    'CAP-015',
    'Capacitação Trainee - Ferramentas e Uso da Sala + Impressora 3D',
    '2026-11-01',
    '13:00',
    '15:00',
    'Marcos Membro Projetista',
    'Presencial',
    'E-213 - Sala do Ramo',
    'Concluída',
    'Wolfbotz (RAS)',
    'Capacitação Trainee',
    'Todos os Trainees',
    'Processo Trainee (PSE)',
    'Treinamento prático de utilização de ferramentas manuais e calibração de impressora 3D.'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = 'Concluída';

-- Registra a presença do Aluno (Tiago Trainee - 2323103)
DO $$
DECLARE
    u_trainee_id uuid;
BEGIN
    SELECT id INTO u_trainee_id FROM public.usuarios WHERE matricula = '2323103';
    IF u_trainee_id IS NOT NULL THEN
        -- 1. Self Check-in do Aluno
        INSERT INTO public.presencas (id_capacitacao, usuario_id, matricula, status_presenca)
        VALUES ('EVT-SIM-CONCLUIDA', u_trainee_id, '2323103', 'Presente')
        ON CONFLICT (id_capacitacao, matricula) DO UPDATE SET status_presenca = 'Presente';

        -- 2. Avaliação de Didática e Feedback (Nota 5)
        INSERT INTO public.avaliacoes (id_capacitacao, usuario_id, matricula, nota, feedback)
        VALUES ('EVT-SIM-CONCLUIDA', u_trainee_id, '2323103', 5, 'Excelente treinamento prático! Aprendi a calibrar o nivelamento e usar o Cura.')
        ON CONFLICT (id_capacitacao, matricula) DO UPDATE SET nota = 5, feedback = EXCLUDED.feedback;
    END IF;

    -- 3. Chamada Oficial realizada pelo Ministrante (Marcos - 2323102)
    INSERT INTO public.chamada_ministrante (id_capacitacao, matricula, status_ministrante)
    VALUES ('EVT-SIM-CONCLUIDA', '2323103', 'Presente')
    ON CONFLICT (id_capacitacao, matricula) DO UPDATE SET status_ministrante = 'Presente';
END $$;

-- Concluído
SELECT 'CENÁRIO COMPLETO POPULADO COM SUCESSO! TABELAS E DADOS PRONTOS.' AS status;
