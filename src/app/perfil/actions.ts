'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SalvarPCHPayload {
  dadosPch: Record<string, any>
  visibilidade?: 'todos' | 'lider'
}

export async function salvarPCHAction(payload: SalvarPCHPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const visibilidade = payload.visibilidade || 'todos'
    const agora = new Date().toISOString()

    const { error } = await supabase.from('pch').upsert(
      {
        usuario_id: user.id,
        dados_pch: payload.dadosPch || {},
        visibilidade: visibilidade,
        atualizado_em: agora,
      },
      { onConflict: 'usuario_id' }
    )

    if (error) {
      console.error('Erro ao salvar PCH no Supabase:', error)
      return { sucesso: false, mensagem: `Erro ao salvar PCH: ${error.message}` }
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: 'Plano de Carga Horária (PCH) salvo com sucesso!',
      atualizadoEm: agora,
    }
  } catch (err: any) {
    console.error('Exceção ao salvar PCH:', err)
    return { sucesso: false, mensagem: err.message || 'Erro inesperado no servidor.' }
  }
}

export interface SalvarDadosCadastraisPayload {
  nome_civil?: string
  nome_social?: string
  data_nascimento?: string
  cpf?: string
  celular?: string
  telefone_fixo?: string
  email_contato?: string
  email_institucional?: string
  curso?: string
  periodo?: string
  etnia?: string
  pcd?: string
  neuroatipicidade?: string
  tipo_sanguineo?: string
  plano_saude?: string
  emergencia_nome?: string
  emergencia_parentesco?: string
  emergencia_telefone?: string
  alergia_medicamento?: string
  alergia_alimento?: string
  alergia_outras?: string
  tratamento_continuo?: string
  medicamento_continuo?: string
  glicose_pressao?: string
  tempo_ramo?: string
  membresia_ieee?: boolean
  numero_membro_ieee?: string
  capitulos_ieee?: string
}

export async function salvarDadosCadastraisAction(dados: SalvarDadosCadastraisPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const agora = new Date().toISOString()

    // 1. Salva na tabela sensível dados_membros
    const { error: errorDados } = await supabase.from('dados_membros').upsert(
      {
        usuario_id: user.id,
        nome_civil: dados.nome_civil || null,
        nome_social: dados.nome_social || null,
        data_nascimento: dados.data_nascimento || null,
        cpf: dados.cpf || null,
        celular: dados.celular || null,
        telefone_fixo: dados.telefone_fixo || null,
        email_contato: dados.email_contato || null,
        email_institucional: dados.email_institucional || null,
        curso: dados.curso || null,
        periodo: dados.periodo || null,
        etnia: dados.etnia || null,
        pcd: dados.pcd || null,
        neuroatipicidade: dados.neuroatipicidade || null,
        tipo_sanguineo: dados.tipo_sanguineo || null,
        plano_saude: dados.plano_saude || null,
        emergencia_nome: dados.emergencia_nome || null,
        emergencia_parentesco: dados.emergencia_parentesco || null,
        emergencia_telefone: dados.emergencia_telefone || null,
        alergia_medicamento: dados.alergia_medicamento || null,
        alergia_alimento: dados.alergia_alimento || null,
        alergia_outras: dados.alergia_outras || null,
        tratamento_continuo: dados.tratamento_continuo || null,
        medicamento_continuo: dados.medicamento_continuo || null,
        glicose_pressao: dados.glicose_pressao || null,
        tempo_ramo: dados.tempo_ramo || null,
        membresia_ieee: Boolean(dados.membresia_ieee),
        numero_membro_ieee: dados.numero_membro_ieee || null,
        capitulos_ieee: dados.capitulos_ieee || null,
        atualizado_em: agora,
      },
      { onConflict: 'usuario_id' }
    )

    if (errorDados) {
      console.error('Erro ao salvar dados_membros:', errorDados)
      return { sucesso: false, mensagem: `Erro ao salvar dados: ${errorDados.message}` }
    }

    // 2. Sincroniza campos básicos na tabela usuarios (curso, telefone, etc.)
    await supabase
      .from('usuarios')
      .update({
        curso: dados.curso || null,
        telefone: dados.celular || dados.telefone_fixo || null,
        atualizado_em: agora,
      })
      .eq('id', user.id)

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: 'Dados cadastrais atualizados com sucesso!',
      atualizadoEm: agora,
    }
  } catch (err: any) {
    console.error('Exceção ao salvar dados cadastrais:', err)
    return { sucesso: false, mensagem: err.message || 'Erro inesperado no servidor.' }
  }
}

export async function alterarSenhaAction(novaSenha: string, confirmarSenha: string) {
  try {
    if (!novaSenha || novaSenha.trim().length < 6) {
      return { sucesso: false, mensagem: 'A nova senha deve possuir pelo menos 6 caracteres.' }
    }

    if (novaSenha !== confirmarSenha) {
      return { sucesso: false, mensagem: 'A confirmação de senha não coincide com a nova senha.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    })

    if (error) {
      console.error('Erro ao alterar senha:', error)
      return { sucesso: false, mensagem: `Erro ao alterar senha: ${error.message}` }
    }

    return { sucesso: true, mensagem: 'Senha alterada com sucesso!' }
  } catch (err: any) {
    console.error('Exceção ao alterar senha:', err)
    return { sucesso: false, mensagem: err.message || 'Erro inesperado no servidor.' }
  }
}

