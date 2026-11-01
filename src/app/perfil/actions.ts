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

export interface DadosMembroPayload {
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

export type SalvarDadosCadastraisPayload = DadosMembroPayload

export async function salvarDadosCadastraisAction(dados: DadosMembroPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, sucesso: false, error: 'Usuário não autenticado.', mensagem: 'Usuário não autenticado.' }
    }

    // Validações básicas de segurança no servidor
    if (!dados.nome_civil || dados.nome_civil.trim().length < 3) {
      return {
        success: false,
        sucesso: false,
        error: 'Por favor, informe seu Nome Civil Completo.',
        mensagem: 'Por favor, informe seu Nome Civil Completo.',
      }
    }

    if (dados.email_institucional) {
      const emailNorm = dados.email_institucional.trim().toLowerCase()
      if (!emailNorm.endsWith('@aluno.cefet-rj.br')) {
        return {
          success: false,
          sucesso: false,
          error: 'O e-mail institucional deve obrigatoriamente possuir o domínio @aluno.cefet-rj.br',
          mensagem: 'O e-mail institucional deve obrigatoriamente possuir o domínio @aluno.cefet-rj.br',
        }
      }
    }

    const agora = new Date().toISOString()

    const payloadFormatado = {
      usuario_id: user.id,
      nome_civil: dados.nome_civil?.trim() || null,
      nome_social: dados.nome_social?.trim() || null,
      data_nascimento: dados.data_nascimento || null,
      cpf: dados.cpf?.trim() || null,
      celular: dados.celular?.trim() || null,
      telefone_fixo: dados.telefone_fixo?.trim() || null,
      email_contato: dados.email_contato?.trim() || null,
      email_institucional: dados.email_institucional?.trim() || null,
      curso: dados.curso?.trim() || null,
      periodo: dados.periodo?.trim() || null,
      etnia: dados.etnia?.trim() || null,
      pcd: dados.pcd?.trim() || 'Não possui',
      neuroatipicidade: dados.neuroatipicidade?.trim() || 'Não possui',
      tipo_sanguineo: dados.tipo_sanguineo?.trim() || null,
      plano_saude: dados.plano_saude?.trim() || 'Não possui',
      emergencia_nome: dados.emergencia_nome?.trim() || null,
      emergencia_parentesco: dados.emergencia_parentesco?.trim() || null,
      emergencia_telefone: dados.emergencia_telefone?.trim() || null,
      alergia_medicamento: dados.alergia_medicamento?.trim() || 'Não possui',
      alergia_alimento: dados.alergia_alimento?.trim() || 'Não possui',
      alergia_outras: dados.alergia_outras?.trim() || 'Não possui',
      tratamento_continuo: dados.tratamento_continuo?.trim() || 'Não possui',
      medicamento_continuo: dados.medicamento_continuo?.trim() || 'Não possui',
      glicose_pressao: dados.glicose_pressao?.trim() || 'Não possui',
      tempo_ramo: dados.tempo_ramo?.trim() || null,
      membresia_ieee: Boolean(dados.membresia_ieee),
      numero_membro_ieee: dados.numero_membro_ieee?.trim() || null,
      capitulos_ieee: dados.capitulos_ieee?.trim() || 'Nenhum',
      atualizado_em: agora,
    }

    const { error: errorDados } = await supabase
      .from('dados_membros')
      .upsert(payloadFormatado, { onConflict: 'usuario_id' })

    if (errorDados) {
      console.error('Erro ao salvar dados_membros:', errorDados)
      return {
        success: false,
        sucesso: false,
        error: `Erro ao salvar dados: ${errorDados.message}`,
        mensagem: `Erro ao salvar dados: ${errorDados.message}`,
      }
    }

    // Sincroniza campos básicos na tabela usuarios (curso, telefone, etc.)
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
      success: true,
      sucesso: true,
      mensagem: 'Dados cadastrais atualizados com sucesso!',
      atualizadoEm: agora,
    }
  } catch (err: any) {
    console.error('Exceção ao salvar dados cadastrais:', err)
    return {
      success: false,
      sucesso: false,
      error: err.message || 'Erro inesperado no servidor.',
      mensagem: err.message || 'Erro inesperado no servidor.',
    }
  }
}

export async function confirmarDadosSemAlteracaoAction() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // Busca se já possui registro
    const { data: existente } = await supabase
      .from('dados_membros')
      .select('usuario_id')
      .eq('usuario_id', user.id)
      .maybeSingle()

    const agora = new Date().toISOString()

    if (existente) {
      const { error } = await supabase
        .from('dados_membros')
        .update({ atualizado_em: agora })
        .eq('usuario_id', user.id)

      if (error) {
        return { success: false, error: 'Falha ao confirmar dados no banco.' }
      }
    } else {
      // Se ainda não tem registro, busca nome e matrícula para criar o inicial
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('nome, matricula')
        .eq('id', user.id)
        .single()

      const { error } = await supabase.from('dados_membros').insert({
        usuario_id: user.id,
        nome_civil: perfil?.nome || '',
        atualizado_em: agora,
      })

      if (error) {
        return { success: false, error: 'Falha ao registrar confirmação.' }
      }
    }

    revalidatePath('/')
    return { success: true, mensagem: 'Cadastro confirmado com sucesso!' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao confirmar.' }
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

export async function obterFichaMembroAdminAction(membroId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado.' }
    }

    // Busca perfil e dados cadastrais do membro
    const { data: membro, error: errMembro } = await supabase
      .from('usuarios')
      .select(`
        id,
        nome,
        matricula,
        usuario_cargos (
          cargos (
            nome_cargo,
            nivel_acesso
          )
        ),
        dados_membros (*)
      `)
      .eq('id', membroId)
      .single()

    if (errMembro || !membro) {
      return { success: false, error: 'Membro não encontrado.' }
    }

    return {
      success: true,
      membro: {
        id: membro.id,
        nome: membro.nome,
        matricula: membro.matricula,
        cargos: (membro.usuario_cargos || []).map((uc: any) => uc?.cargos?.nome_cargo).filter(Boolean),
        dados: Array.isArray(membro.dados_membros)
          ? membro.dados_membros[0] || null
          : (membro.dados_membros as any) || null,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao carregar ficha.' }
  }
}
