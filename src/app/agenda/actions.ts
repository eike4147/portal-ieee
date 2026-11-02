'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface EventoAgendaItem {
  id: string
  id_curso?: string | null
  nome_capacitacao: string
  data: string
  hora_inicio: string
  hora_fim: string
  ministrantes: string
  modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido'
  local_link?: string | null
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada' | 'Disponível'
  descricao?: string | null
  equipe_responsavel: string
  tipo_evento: string
  publico_alvo: string
  contexto: string
  data_fim?: string | null
  marcado_por?: string | null
  isObrigatorio?: boolean
  conflito?: boolean
  Status_Calculado?: string
  Minha_Presenca?: string | null
  Minha_Nota?: number | null
  Meu_Feedback?: string | null
  Status_Ministrante?: string | null
  souMinistrante?: boolean
  podeGerenciar?: boolean
}

export interface CatalogoCursoItem {
  id: string
  nome_curso: string
  equipe_responsavel: string
  status_curso: string
  ementa?: string
  carga_horaria?: string
}

export interface ListaChamadaMembro {
  matricula: string
  nome: string
  presente: boolean
  tipo: 'Obrigatório' | 'Opcional'
}

// Fallback seed de eventos para caso a tabela ainda não tenha sido criada no Supabase
const FALLBACK_EVENTOS: EventoAgendaItem[] = [
  {
    id: 'EVT-1790099273959',
    id_curso: 'CAP-015',
    nome_capacitacao: 'Ferramentas e Uso da Sala + Impressora 3D',
    data: '2026-10-24',
    hora_inicio: '13:00',
    hora_fim: '15:00',
    ministrantes: 'Arthur Fellini',
    modalidade: 'Presencial',
    local_link: 'E-213 - Sala do Ramo',
    status: 'Agendada',
    descricao: 'Treinamento prático de utilização das ferramentas e fatiamento 3D.',
    equipe_responsavel: 'Projetos',
    tipo_evento: 'Capacitação',
    publico_alvo: 'Todos do Ramo',
    contexto: 'Processo Trainee (PSE)',
    isObrigatorio: true,
  },
  {
    id: 'EVT-1790208034765',
    id_curso: 'CAP-036',
    nome_capacitacao: 'Introdução ao Robótica e a categoria',
    data: '2026-10-25',
    hora_inicio: '13:00',
    hora_fim: '14:30',
    ministrantes: 'Igor De Lima Marques, José Guilherme Barros',
    modalidade: 'Presencial',
    local_link: 'E-213 - Sala do Ramo',
    status: 'Agendada',
    descricao: 'Visão geral da categoria de robótica de combate e categorias autônomas.',
    equipe_responsavel: 'Robótica',
    tipo_evento: 'Capacitação',
    publico_alvo: 'Todos do Ramo',
    contexto: 'Processo Trainee (PSE)',
    isObrigatorio: true,
  },
  {
    id: 'EVT-1790301917920',
    id_curso: 'CAP-001',
    nome_capacitacao: 'Análise de dados com Pandas e Python',
    data: '2026-10-28',
    hora_inicio: '18:30',
    hora_fim: '20:00',
    ministrantes: 'Wolfbyte (CS)',
    modalidade: 'Online',
    local_link: 'https://teams.microsoft.com',
    status: 'Agendada',
    descricao: 'Introdução ao ecossistema de dados para projetos competitivos.',
    equipe_responsavel: 'Wolfbyte (CS)',
    tipo_evento: 'Capacitação',
    publico_alvo: 'Apenas Trainees',
    contexto: 'Processo Trainee (PSE)',
    isObrigatorio: false,
  },
  {
    id: 'EVT-1790302141974',
    id_curso: null,
    nome_capacitacao: 'Reunião Geral 360 do Ramo IEEE',
    data: '2026-10-31',
    hora_inicio: '10:00',
    hora_fim: '12:00',
    ministrantes: 'Diretoria Executiva',
    modalidade: 'Presencial',
    local_link: 'Auditório 2 - Bloco E',
    status: 'Agendada',
    descricao: 'Apresentação de resultados e alinhamento estratégico do semestre.',
    equipe_responsavel: 'Geral',
    tipo_evento: 'Reunião 360',
    publico_alvo: 'Todos do Ramo',
    contexto: 'Ramo Estudantil (Capítulos / Equipes)',
    isObrigatorio: true,
  },
]

export async function obterAgendaAction() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, eventos: [], catalogo: [], erro: 'Não autenticado' }
    }

    // 1. Busca perfil do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select(`
        id,
        nome,
        matricula,
        tipo_membro,
        usuario_cargos (
          cargos (
            nome_cargo,
            nivel_acesso,
            permite_abrir_sala
          )
        )
      `)
      .eq('id', user.id)
      .maybeSingle()

    const matricula = usuario?.matricula || ''
    const nomeUsuario = usuario?.nome || ''
    const cargos = (usuario?.usuario_cargos || []).map((uc: any) => uc.cargos).filter(Boolean)
    const ehLiderOuAdmin = cargos.some((c: any) =>
      ['Admin', 'Gestor', 'Lider', 'Diretoria', 'Lideranca', 'GP'].includes(c?.nivel_acesso)
    )

    // 2. Busca eventos da agenda
    const { data: eventosDb, error: errEventos } = await supabase
      .from('capacitacoes')
      .select('*')
      .order('data', { ascending: true })

    let listaEventos: EventoAgendaItem[] = []
    if (errEventos || !eventosDb || eventosDb.length === 0) {
      listaEventos = [...FALLBACK_EVENTOS]
    } else {
      listaEventos = eventosDb as EventoAgendaItem[]
    }

    // 3. Busca presenças, chamadas e avaliações do usuário
    let presencasMap = new Map<string, any>()
    let chamadasMap = new Map<string, any>()
    let avaliacoesMap = new Map<string, any>()

    try {
      const { data: presencas } = await supabase
        .from('presencas')
        .select('*')
        .eq('matricula', matricula)

      if (presencas) {
        presencas.forEach((p) => presencasMap.set(p.id_capacitacao, p))
      }

      const { data: chamadas } = await supabase
        .from('chamada_ministrante')
        .select('*')
        .eq('matricula', matricula)

      if (chamadas) {
        chamadas.forEach((c) => chamadasMap.set(c.id_capacitacao, c))
      }

      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('matricula', matricula)

      if (avaliacoes) {
        avaliacoes.forEach((a) => avaliacoesMap.set(a.id_capacitacao, a))
      }
    } catch {
      // Se tabelas ainda não existirem, ignora suavemente
    }

    // 4. Busca Catálogo de Cursos Ativos
    let listaCatalogo: CatalogoCursoItem[] = []
    try {
      const { data: catDb } = await supabase
        .from('catalogo_cursos')
        .select('id, nome_curso, equipe_responsavel, status_curso, ementa, carga_horaria')
        .eq('status_curso', 'Ativo')
        .order('nome_curso')

      if (catDb && catDb.length > 0) {
        listaCatalogo = catDb
      } else {
        listaCatalogo = [
          { id: 'CAP-001', nome_curso: 'Análise de dados com Pandas', equipe_responsavel: 'Wolfbyte (CS)', status_curso: 'Ativo' },
          { id: 'CAP-002', nome_curso: 'Apresentação Canva', equipe_responsavel: 'Wie', status_curso: 'Ativo' },
          { id: 'CAP-003', nome_curso: 'Apresentação Pessoal', equipe_responsavel: 'Gestão de Pessoas', status_curso: 'Ativo' },
          { id: 'CAP-015', nome_curso: 'Ferramentas e Uso da Sala + Impressora 3D', equipe_responsavel: 'Projetos', status_curso: 'Ativo' },
          { id: 'CAP-036', nome_curso: 'Introdução ao Robótica e a categoria', equipe_responsavel: 'Robótica', status_curso: 'Ativo' },
        ]
      }
    } catch {
      listaCatalogo = []
    }

    // 5. Aplica Motor de Double-Check e Regras Visuais em cada Evento
    const agora = new Date()

    const eventosEnriquecidos = listaEventos.map((ev) => {
      const dtStr = ev.data ? String(ev.data).substring(0, 10) : ''
      const inicioEvento = new Date(`${dtStr}T${ev.hora_inicio || '00:00'}:00`)
      const fimEvento = new Date(`${dtStr}T${ev.hora_fim || '23:59'}:00`)
      const diffIniHoras = (agora.getTime() - inicioEvento.getTime()) / (1000 * 60 * 60)
      const diffFimHoras = (agora.getTime() - fimEvento.getTime()) / (1000 * 60 * 60)

      // Registros deste usuário
      const regP = presencasMap.get(ev.id)
      const regCM = chamadasMap.get(ev.id)
      const regA = avaliacoesMap.get(ev.id)

      const statusAluno = regP?.status_presenca || (regA ? 'Presente' : null)
      const statusMin = regCM?.status_ministrante || null

      let presencaCalculada: string | null = null
      if (statusAluno === 'Falta Justificada') {
        presencaCalculada = 'Falta Justificada'
      } else if (ev.modalidade === 'Gravada') {
        presencaCalculada = statusAluno === 'Presente' ? 'Presente' : null
      } else {
        // Double-Check (Presencial / Online / Híbrido)
        if (statusAluno === 'Presente' && statusMin === 'Presente') {
          presencaCalculada = 'Presente'
        } else if (statusAluno === 'Presente' && statusMin !== 'Presente') {
          presencaCalculada = regA ? 'Presente' : 'Aguardando Ministrante'
        } else if (statusAluno !== 'Presente' && statusMin === 'Presente') {
          presencaCalculada = 'Avaliação Pendente'
        } else if (diffFimHoras > 24) {
          presencaCalculada = 'Falta'
        } else {
          presencaCalculada = null
        }
      }

      // Status do Card (Calculado)
      let statusCalculado = ev.status || 'Agendada'
      if (diffIniHoras < 0) {
        statusCalculado = 'Agendada'
      } else if (ev.modalidade === 'Gravada') {
        statusCalculado = presencaCalculada === 'Presente' ? 'Concluída' : 'Disponível'
      } else if (diffIniHoras >= 0 && diffFimHoras < 0) {
        statusCalculado = 'Em Andamento'
      } else {
        statusCalculado = 'Concluída'
      }

      // Checa se o usuário atual é ministrante do evento
      const ministrantesStr = String(ev.ministrantes || '').toLowerCase()
      const souMinistrante = Boolean(nomeUsuario && ministrantesStr.includes(nomeUsuario.toLowerCase()))

      // Permissão para editar / cancelar
      const marcadoPorStr = String(ev.marcado_por || '').toLowerCase()
      const souCriador = Boolean(
        (matricula && marcadoPorStr.includes(matricula.toLowerCase())) ||
        (nomeUsuario && marcadoPorStr.includes(nomeUsuario.toLowerCase()))
      )
      const podeGerenciar = ehLiderOuAdmin || souMinistrante || souCriador

      const isObrigatorio =
        ev.isObrigatorio !== undefined
          ? ev.isObrigatorio
          : String(ev.publico_alvo).includes('Trainee') ||
            String(ev.tipo_evento).toLowerCase().includes('follow') ||
            String(ev.tipo_evento).includes('360') ||
            String(ev.tipo_evento).includes('Geral')

      return {
        ...ev,
        Status_Calculado: statusCalculado,
        Minha_Presenca: presencaCalculada,
        Minha_Nota: regA?.nota || null,
        Meu_Feedback: regA?.feedback || null,
        Status_Ministrante: statusMin,
        souMinistrante,
        podeGerenciar,
        isObrigatorio,
      }
    })

    return {
      sucesso: true,
      eventos: eventosEnriquecidos,
      catalogo: listaCatalogo,
      usuarioLogado: {
        id: user.id,
        nome: nomeUsuario,
        matricula,
        ehLiderOuAdmin,
      },
    }
  } catch (err: any) {
    console.error('Erro em obterAgendaAction:', err)
    return {
      sucesso: false,
      eventos: FALLBACK_EVENTOS,
      catalogo: [],
      erro: err.message || 'Erro ao carregar agenda',
    }
  }
}

export interface SalvarCapacitacaoPayload {
  id?: string
  id_curso?: string | null
  nome_capacitacao: string
  data: string
  hora_inicio: string
  hora_fim: string
  ministrantes: string
  modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido'
  local_link?: string
  equipe_responsavel?: string
  tipo_evento?: string
  publico_alvo?: string
  contexto?: string
  descricao?: string
  data_fim?: string
}

export async function salvarCapacitacaoAction(payload: SalvarCapacitacaoPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome, matricula')
      .eq('id', user.id)
      .maybeSingle()

    const criador = usuario?.nome || user.email || 'Usuário'
    const idEvento = payload.id || `EVT-${Date.now()}`

    const dadosEvento = {
      id: idEvento,
      id_curso: payload.id_curso || null,
      nome_capacitacao: payload.nome_capacitacao,
      data: payload.data,
      hora_inicio: payload.hora_inicio,
      hora_fim: payload.hora_fim,
      ministrantes: payload.ministrantes || criador,
      modalidade: payload.modalidade || 'Presencial',
      local_link: payload.local_link || '',
      status: 'Agendada',
      descricao: payload.descricao || '',
      equipe_responsavel: payload.equipe_responsavel || 'Geral',
      marcado_por: criador,
      tipo_evento: payload.tipo_evento || 'Capacitação',
      publico_alvo: payload.publico_alvo || 'Todos do Ramo',
      contexto: payload.contexto || 'Processo Trainee (PSE)',
      data_fim: payload.data_fim || payload.data,
    }

    const { error } = await supabase
      .from('capacitacoes')
      .upsert(dadosEvento, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao salvar capacitação:', error)
      return { sucesso: false, mensagem: `Erro no banco: ${error.message}` }
    }

    revalidatePath('/')
    return { sucesso: true, mensagem: 'Compromisso agendado com sucesso!', idEvento }
  } catch (err: any) {
    console.error('Exceção ao salvar capacitação:', err)
    return { sucesso: false, mensagem: err.message || 'Erro inesperado ao salvar.' }
  }
}

export async function cancelarCapacitacaoAction(idCapacitacao: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Não autenticado.' }
    }

    const { error } = await supabase
      .from('capacitacoes')
      .update({ status: 'Cancelada' })
      .eq('id', idCapacitacao)

    if (error) {
      return { sucesso: false, mensagem: `Erro ao cancelar: ${error.message}` }
    }

    revalidatePath('/')
    return { sucesso: true, mensagem: 'Compromisso cancelado com sucesso.' }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message }
  }
}

export async function registrarPresencaComAvaliacaoAction(
  idCapacitacao: string,
  nota: number,
  feedback: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('matricula, nome')
      .eq('id', user.id)
      .maybeSingle()

    const matricula = usuario?.matricula || ''
    if (!matricula) {
      return { sucesso: false, mensagem: 'Matrícula não encontrada no perfil.' }
    }

    if (nota < 1 || nota > 5) {
      return { sucesso: false, mensagem: 'A nota deve ser entre 1 e 5 estrelas.' }
    }

    if (!feedback || feedback.trim().length === 0) {
      return { sucesso: false, mensagem: 'O comentário sobre a didática é obrigatório.' }
    }

    const agora = new Date().toISOString()

    // 1. Grava a Presença
    const { error: errPresenca } = await supabase.from('presencas').upsert(
      {
        id_capacitacao: idCapacitacao,
        usuario_id: user.id,
        matricula: matricula,
        status_presenca: 'Presente',
        justificativa: null,
        data_hora_registro: agora,
      },
      { onConflict: 'id_capacitacao,matricula' }
    )

    if (errPresenca) {
      console.error('Erro ao registrar presença:', errPresenca)
      return { sucesso: false, mensagem: `Erro ao registrar presença: ${errPresenca.message}` }
    }

    // 2. Grava a Avaliação
    const { error: errAvaliacao } = await supabase.from('avaliacoes').upsert(
      {
        id_capacitacao: idCapacitacao,
        usuario_id: user.id,
        matricula: matricula,
        nota: nota,
        feedback: feedback.trim(),
        data_avaliacao: agora,
      },
      { onConflict: 'id_capacitacao,matricula' }
    )

    if (errAvaliacao) {
      console.error('Erro ao registrar avaliação:', errAvaliacao)
    }

    revalidatePath('/')
    return {
      sucesso: true,
      mensagem: 'Presença confirmada e avaliação enviada com sucesso!',
    }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message || 'Erro ao registrar presença e avaliação.' }
  }
}

export async function registrarJustificativaAction(
  idCapacitacao: string,
  justificativa: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Usuário não autenticado.' }
    }

    if (!justificativa || justificativa.trim().length === 0) {
      return { sucesso: false, mensagem: 'A justificativa é obrigatória.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('matricula')
      .eq('id', user.id)
      .maybeSingle()

    const matricula = usuario?.matricula || ''
    const agora = new Date().toISOString()

    const { error } = await supabase.from('presencas').upsert(
      {
        id_capacitacao: idCapacitacao,
        usuario_id: user.id,
        matricula: matricula,
        status_presenca: 'Falta Justificada',
        justificativa: justificativa.trim(),
        data_hora_registro: agora,
      },
      { onConflict: 'id_capacitacao,matricula' }
    )

    if (error) {
      return { sucesso: false, mensagem: `Erro ao salvar justificativa: ${error.message}` }
    }

    revalidatePath('/')
    return { sucesso: true, mensagem: 'Falta justificada registrada com sucesso.' }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message }
  }
}

export async function obterListaChamadaAction(idCapacitacao: string) {
  try {
    const supabase = await createClient()

    // 1. Busca todos os usuários ativos
    const { data: todosUsuarios } = await supabase
      .from('usuarios')
      .select('matricula, nome, tipo_membro, status')
      .neq('status', 'Inativo')
      .order('nome')

    // 2. Busca marcações de chamada do ministrante para esta capacitação
    const { data: chamadas } = await supabase
      .from('chamada_ministrante')
      .select('matricula, status_ministrante')
      .eq('id_capacitacao', idCapacitacao)

    const presentesSet = new Set(
      (chamadas || [])
        .filter((c) => c.status_ministrante === 'Presente')
        .map((c) => String(c.matricula).trim())
    )

    const lista: ListaChamadaMembro[] = (todosUsuarios || []).map((u) => ({
      matricula: u.matricula,
      nome: u.nome,
      presente: presentesSet.has(String(u.matricula).trim()),
      tipo: u.tipo_membro === 'Trainee' ? 'Obrigatório' : 'Opcional',
    }))

    return { sucesso: true, lista }
  } catch (err: any) {
    return { sucesso: false, lista: [], mensagem: err.message }
  }
}

export async function salvarChamadaMinistranteAction(
  idCapacitacao: string,
  matriculasPresentes: string[]
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { sucesso: false, mensagem: 'Não autenticado.' }
    }

    // Remove presenças antigas do ministrante para este evento
    await supabase
      .from('chamada_ministrante')
      .delete()
      .eq('id_capacitacao', idCapacitacao)

    // Insere novas presenças validadas
    if (matriculasPresentes.length > 0) {
      const inserts = matriculasPresentes.map((mat) => ({
        id_capacitacao: idCapacitacao,
        matricula: mat,
        status_ministrante: 'Presente',
        data_hora: new Date().toISOString(),
      }))

      const { error } = await supabase.from('chamada_ministrante').insert(inserts)
      if (error) {
        return { sucesso: false, mensagem: `Erro ao salvar chamada: ${error.message}` }
      }
    }

    revalidatePath('/')
    return { sucesso: true, mensagem: 'Chamada do ministrante salva com sucesso!' }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message }
  }
}

export async function salvarCursoCatalogoAction(payload: {
  id?: string
  nome_curso: string
  equipe_responsavel: string
  status_curso: 'Ativo' | 'Inativo'
  ementa?: string
  carga_horaria?: string
}) {
  try {
    const supabase = await createClient()
    const idCurso = payload.id || `CAP-${String(Math.floor(Math.random() * 900) + 100)}`

    const { error } = await supabase.from('catalogo_cursos').upsert(
      {
        id: idCurso,
        nome_curso: payload.nome_curso,
        equipe_responsavel: payload.equipe_responsavel || 'Geral',
        status_curso: payload.status_curso || 'Ativo',
        ementa: payload.ementa || null,
        carga_horaria: payload.carga_horaria || null,
      },
      { onConflict: 'id' }
    )

    if (error) {
      return { sucesso: false, mensagem: `Erro ao salvar curso: ${error.message}` }
    }

    revalidatePath('/')
    return { sucesso: true, mensagem: 'Curso registrado no catálogo com sucesso!' }
  } catch (err: any) {
    return { sucesso: false, mensagem: err.message }
  }
}
