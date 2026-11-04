'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  buscarCargoPorNomeOuId,
  formatarNomeCompletoCargo,
  CargoItemHierarquia,
} from '@/lib/catalogo-cargos'

export interface SlotCargoData {
  slot: number
  idCargo?: string
  equipe: string
  subequipe: string
  area: string
  cargoNome: string
  nomeCompletoFormatado: string
  peso: number
  nivelAcesso?: string
  status: 'ativo' | 'vazio' | 'bloqueado'
}

export interface SolicitacaoMovimentacao {
  id: string
  usuario_id: string
  tipo: 'movimentacao_cargos' | 'desbloqueio_slot' | 'renovacao_automatica'
  cargos_atuais: any[]
  cargos_propostos: any[]
  justificativa?: string
  slot_solicitado?: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  motivo_recusa?: string
  criado_em: string
  nome_usuario?: string
  matricula_usuario?: string
}

/**
 * Busca os dados dos slots de cargos do usuário autenticado:
 * - Cargos ativos mapeados nos slots 1 a 3 (ou até limite_slots)
 * - Limite atual de slots liberados (padrão 3)
 * - Solicitação pendente de análise pela GP (se houver)
 */
export async function obterEstadoCargosSlotsAction() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    // 1. Busca perfil do usuário e limite de slots
    const { data: usuarioRecord } = await supabase
      .from('usuarios')
      .select('id, nome, matricula, limite_slots')
      .eq('id', user.id)
      .single()

    const limiteSlots = usuarioRecord?.limite_slots || 3

    // 2. Busca os cargos ativos do usuário
    const { data: usuarioCargos } = await supabase
      .from('usuario_cargos')
      .select(`
        cargo_id,
        cargos (
          id,
          nome_cargo,
          departamento,
          nivel_acesso,
          peso
        )
      `)
      .eq('usuario_id', user.id)

    const cargosAtivosNomes: string[] = []

    if (usuarioCargos && usuarioCargos.length > 0) {
      usuarioCargos.forEach((uc: any) => {
        const nome = uc.cargos?.nome_cargo || uc.cargo_id
        if (nome && !cargosAtivosNomes.includes(nome)) {
          cargosAtivosNomes.push(nome)
        }
      })
    }

    // 3. Monta o array dos 5 slots
    const slots: SlotCargoData[] = []
    for (let i = 1; i <= 5; i++) {
      const estaBloqueado = i > limiteSlots
      if (estaBloqueado) {
        slots.push({
          slot: i,
          cargoNome: '',
          equipe: '',
          subequipe: '',
          area: '',
          nomeCompletoFormatado: '',
          peso: 0,
          status: 'bloqueado',
        })
        continue
      }

      const cargoNome = cargosAtivosNomes[i - 1] || ''
      if (cargoNome) {
        const itemCatalogo = buscarCargoPorNomeOuId(cargoNome)
        const formatado = itemCatalogo ? formatarNomeCompletoCargo(itemCatalogo) : cargoNome
        slots.push({
          slot: i,
          idCargo: itemCatalogo?.id,
          equipe: itemCatalogo?.equipe || 'Geral',
          subequipe: itemCatalogo?.subequipe || 'Geral',
          area: itemCatalogo?.area || 'Geral',
          cargoNome: itemCatalogo?.cargo || cargoNome,
          nomeCompletoFormatado: formatado,
          peso: itemCatalogo?.peso ?? 1.0,
          nivelAcesso: itemCatalogo?.nivelAcesso ?? 'MEMBRO',
          status: 'ativo',
        })
      } else {
        slots.push({
          slot: i,
          cargoNome: '',
          equipe: '',
          subequipe: '',
          area: '',
          nomeCompletoFormatado: '',
          peso: 0,
          status: 'vazio',
        })
      }
    }

    // 4. Busca solicitação pendente em solicitacoes_movimentacao (com fallback se a tabela não existir)
    let solicitacaoPendente: SolicitacaoMovimentacao | null = null
    try {
      const { data: solData } = await supabase
        .from('solicitacoes_movimentacao')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false })
        .limit(1)

      if (solData && solData.length > 0) {
        solicitacaoPendente = solData[0] as SolicitacaoMovimentacao
      }
    } catch {
      // Tabela ainda não criada no banco
      solicitacaoPendente = null
    }

    return {
      sucesso: true,
      limiteSlots,
      slots,
      solicitacaoPendente,
    }
  } catch (err: any) {
    console.error('Erro ao obter estado de cargos slots:', err)
    return { sucesso: false, mensagem: err.message || 'Erro ao carregar cargos.' }
  }
}

/**
 * Confirma os cargos atuais sem alteração (renovação semestral automática)
 */
export async function confirmarCargosSemAlteracaoAction(cargosAtuais: string[]) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const agora = new Date().toISOString()

    // Opcionalmente registra na tabela de histórico se ela existir
    try {
      await supabase.from('solicitacoes_movimentacao').insert({
        usuario_id: user.id,
        tipo: 'renovacao_automatica',
        cargos_atuais: cargosAtuais,
        cargos_propostos: cargosAtuais,
        status: 'aprovado',
        analisado_em: agora,
        criado_em: agora,
      })
    } catch {
      // Ignora se tabela ainda não existir
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: 'Cargos confirmados com sucesso para o semestre vigente!',
    }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message || 'Erro ao confirmar cargos.' }
  }
}

/**
 * Submete solicitação de movimentação de cargos (troca, saída ou adição nos slots)
 */
export async function submeterMovimentacaoSlotsAction(
  cargosAtuais: string[],
  cargosPropostos: string[],
  justificativa?: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    // Verifica se já possui solicitação pendente
    const { data: pendentes } = await supabase
      .from('solicitacoes_movimentacao')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('status', 'pendente')
      .limit(1)

    if (pendentes && pendentes.length > 0) {
      return {
        sucesso: false,
        mensagem:
          'Você já possui uma solicitação de movimentação pendente de análise pela Gestão de Pessoas (GP). Aguarde a conclusão antes de enviar novas alterações.',
      }
    }

    const agora = new Date().toISOString()

    const { error } = await supabase.from('solicitacoes_movimentacao').insert({
      usuario_id: user.id,
      tipo: 'movimentacao_cargos',
      cargos_atuais: cargosAtuais,
      cargos_propostos: cargosPropostos.filter(Boolean),
      justificativa: justificativa?.trim() || null,
      status: 'pendente',
      criado_em: agora,
    })

    if (error) {
      console.error('Erro ao salvar solicitacao de movimentacao:', error)
      return {
        sucesso: false,
        mensagem: `Não foi possível registrar a solicitação: ${error.message}. Verifique se a tabela 'solicitacoes_movimentacao' foi criada no Supabase.`,
      }
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: 'Sua solicitação de movimentação foi enviada para análise da Gestão de Pessoas (GP)!',
    }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message || 'Erro ao enviar movimentação.' }
  }
}

/**
 * Solicita à GP o desbloqueio de um slot extra (Slot 4 ou Slot 5)
 */
export async function solicitarDesbloqueioSlotAction(
  slotNumero: number,
  justificativa: string
) {
  try {
    if (!justificativa || justificativa.trim().length < 10) {
      return {
        sucesso: false,
        mensagem: 'Por favor, informe uma justificativa detalhada com pelo menos 10 caracteres.',
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    // Regra: Os slots 1, 2 e 3 precisam estar preenchidos para abrir slots 4 ou 5
    if (slotNumero >= 4) {
      const { data: usuarioCargos } = await supabase
        .from('usuario_cargos')
        .select('cargo_id')
        .eq('usuario_id', user.id)

      const qtdCargosAtivos = usuarioCargos?.length || 0
      if (qtdCargosAtivos < 3) {
        return {
          sucesso: false,
          mensagem:
            'Os slots 1, 2 e 3 devem estar totalmente preenchidos antes de solicitar a liberação de slots extras (4 ou 5).',
        }
      }
    }

    const agora = new Date().toISOString()

    const { error } = await supabase.from('solicitacoes_movimentacao').insert({
      usuario_id: user.id,
      tipo: 'desbloqueio_slot',
      slot_solicitado: slotNumero,
      justificativa: justificativa.trim(),
      status: 'pendente',
      criado_em: agora,
    })

    if (error) {
      return {
        sucesso: false,
        mensagem: `Erro ao solicitar liberação do slot: ${error.message}`,
      }
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: `Solicitação de liberação do Slot ${slotNumero} enviada para análise da Diretoria de Gestão de Pessoas (GP)!`,
    }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message || 'Erro ao solicitar desbloqueio.' }
  }
}

/**
 * Busca todas as solicitações pendentes para o painel da GP / Admin
 */
export async function obterSolicitacoesGPPendentesAction() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Não autenticado.', solicitacoes: [] }
    }

    const { data, error } = await supabase
      .from('solicitacoes_movimentacao')
      .select(`
        id,
        usuario_id,
        tipo,
        cargos_atuais,
        cargos_propostos,
        justificativa,
        slot_solicitado,
        status,
        criado_em,
        usuarios (
          nome,
          matricula
        )
      `)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })

    if (error) {
      return { sucesso: false, mensagem: error.message, solicitacoes: [] }
    }

    const solicitacoesFormatadas: SolicitacaoMovimentacao[] = (data || []).map((s: any) => ({
      id: s.id,
      usuario_id: s.usuario_id,
      tipo: s.tipo,
      cargos_atuais: s.cargos_atuais || [],
      cargos_propostos: s.cargos_propostos || [],
      justificativa: s.justificativa,
      slot_solicitado: s.slot_solicitado,
      status: s.status,
      criado_em: s.criado_em,
      nome_usuario: s.usuarios?.nome || 'Membro',
      matricula_usuario: s.usuarios?.matricula || '',
    }))

    return { sucesso: true, solicitacoes: solicitacoesFormatadas }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message, solicitacoes: [] }
  }
}

/**
 * Decisão da GP sobre uma solicitação (Aprovar ou Rejeitar)
 */
export async function decidirSolicitacaoGPAction(
  solicitacaoId: string,
  decisao: 'aprovado' | 'rejeitado',
  motivoRecusa?: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Não autenticado.' }
    }

    // 1. Busca a solicitação
    const { data: sol, error: solErr } = await supabase
      .from('solicitacoes_movimentacao')
      .select('*')
      .eq('id', solicitacaoId)
      .single()

    if (solErr || !sol) {
      return { sucesso: false, mensagem: 'Solicitação não encontrada.' }
    }

    const agora = new Date().toISOString()

    // 2. Se for APROVADO, aplica os efeitos no banco
    if (decisao === 'aprovado') {
      if (sol.tipo === 'desbloqueio_slot' && sol.slot_solicitado) {
        // Atualiza limite_slots do usuário
        await supabase
          .from('usuarios')
          .update({ limite_slots: sol.slot_solicitado })
          .eq('id', sol.usuario_id)
      } else if (sol.tipo === 'movimentacao_cargos') {
        const novosCargos: string[] = sol.cargos_propostos || []

        // Remove cargos atuais do usuário
        await supabase.from('usuario_cargos').delete().eq('usuario_id', sol.usuario_id)

        // Adiciona novos cargos vinculando com a tabela cargos
        for (const nome of novosCargos) {
          const item = buscarCargoPorNomeOuId(nome)
          const cargoId = item?.id || nome.toUpperCase().replace(/\s+/g, '_').substring(0, 20)

          // Garante que o cargo exista na tabela cargos
          if (item) {
            const permiteSala = ['ADMIN', 'GESTOR', 'LIDER'].includes(item.nivelAcesso)
            await supabase.from('cargos').upsert(
              {
                id: item.id,
                nome_cargo: formatarNomeCompletoCargo(item),
                departamento: item.equipe,
                nivel_acesso: item.nivelAcesso,
                peso: Math.round(item.peso),
                permite_abrir_sala: permiteSala,
              },
              { onConflict: 'id' }
            )
          }

          await supabase.from('usuario_cargos').insert({
            usuario_id: sol.usuario_id,
            cargo_id: cargoId,
            tipo: 'Principal',
          })
        }
      }
    }

    // 3. Atualiza o status da solicitação
    const { error: updErr } = await supabase
      .from('solicitacoes_movimentacao')
      .update({
        status: decisao,
        motivo_recusa: decisao === 'rejeitado' ? motivoRecusa || null : null,
        analisado_por: user.id,
        analisado_em: agora,
      })
      .eq('id', solicitacaoId)

    if (updErr) {
      return { sucesso: false, mensagem: `Erro ao registrar decisão: ${updErr.message}` }
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: `Solicitação ${decisao === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`,
    }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message || 'Erro ao processar decisão.' }
  }
}
