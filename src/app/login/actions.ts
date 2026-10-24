'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = {
  error?: string
  success?: string
}

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const identificador = formData.get('identificador')?.toString().trim()
  const senha = formData.get('senha')?.toString()

  if (!identificador || !senha) {
    return { error: 'Preencha a matrícula/e-mail e a senha.' }
  }

  const supabase = await createClient()

  let emailParaLogin = identificador

  // Se o identificador não contiver '@', assume-se que é uma matrícula
  if (!identificador.includes('@')) {
    const { data: usuario, error: buscaError } = await supabase
      .from('usuarios')
      .select('email, status')
      .ilike('matricula', identificador)
      .maybeSingle()

    if (buscaError || !usuario) {
      return { error: 'Matrícula não encontrada no sistema. Verifique o número digitado ou use seu e-mail cadastrado.' }
    }

    if (usuario.status === 'Desligado') {
      return { error: 'Este usuário está inativo/desligado do Ramo.' }
    }

    emailParaLogin = usuario.email
  }

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: emailParaLogin,
    password: senha,
  })

  if (loginError) {
    return { error: 'Credenciais inválidas: ' + loginError.message }
  }

  redirect('/sala')
}

export async function cadastrarPilotoAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const nome = formData.get('nome')?.toString().trim()
  const matricula = formData.get('matricula')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const senha = formData.get('senha')?.toString()

  if (!nome || !matricula || !email || !senha) {
    return { error: 'Preencha todos os campos.' }
  }

  const supabase = await createClient()

  // 1. Cria a conta no Supabase Auth com senha nativa
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        name: nome,
        matricula: matricula,
      },
    },
  })

  if (authError || !authData.user) {
    return { error: 'Erro ao criar conta no Supabase: ' + (authError?.message || 'Falha ao registrar.') }
  }

  // 2. Insere/atualiza no perfil public.usuarios
  const { error: profileError } = await supabase.from('usuarios').upsert({
    id: authData.user.id,
    matricula,
    nome,
    email,
    status: 'Ativo',
    tipo_membro: 'Membro',
  })

  if (profileError) {
    return { error: 'Erro ao registrar perfil: ' + profileError.message }
  }

  // 3. Atribui cargo de Presidente (PRES) para teste com liberação da sala
  await supabase.from('usuario_cargos').upsert({
    usuario_id: authData.user.id,
    cargo_id: 'PRES',
    tipo: 'Principal',
  })

  // Se já logou direto na sessão
  if (authData.session) {
    redirect('/sala')
  }

  return { success: 'Usuário cadastrado com sucesso! Já pode entrar com a matrícula ou e-mail.' }
}

export async function resetPasswordAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const identificador = formData.get('identificador')?.toString().trim()

  if (!identificador) {
    return { error: 'Digite sua matrícula ou e-mail institucional.' }
  }

  const supabase = await createClient()
  let emailParaReset = identificador

  if (!identificador.includes('@')) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('email')
      .ilike('matricula', identificador)
      .maybeSingle()

    if (!usuario) {
      return { error: 'Matrícula não localizada no cadastro.' }
    }
    emailParaReset = usuario.email
  }

  const { error } = await supabase.auth.resetPasswordForEmail(emailParaReset, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/redefinir-senha`,
  })

  if (error) {
    return { error: 'Não foi possível enviar o e-mail de recuperação: ' + error.message }
  }

  return { success: `Link de redefinição enviado para o e-mail cadastrado (${emailParaReset}).` }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
