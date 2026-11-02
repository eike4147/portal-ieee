'use client'

import { useState, useTransition, useRef } from 'react'
import { toggleSalaAction } from '@/app/sala/actions'
import { logoutAction } from '@/app/actions'
import {
  salvarPCHAction,
  salvarDadosCadastraisAction,
  alterarSenhaAction,
  confirmarDadosSemAlteracaoAction,
  type SalvarDadosCadastraisPayload,
} from '@/app/perfil/actions'
import FormAtualizacaoCadastralInline, {
  FormAtualizacaoCadastralInlineRef,
} from './form-atualizacao-cadastral-inline'
import SecaoCargosSlots from './secao-cargos-slots'
import FilaSolicitacoesGP from './fila-solicitacoes-gp'
import { detectarCursoDaMatricula, sugerirPeriodoDaMatricula } from '@/lib/curso-matricula'
import {
  obterAgendaAction,
  salvarCapacitacaoAction,
  cancelarCapacitacaoAction,
  registrarPresencaComAvaliacaoAction,
  registrarJustificativaAction,
  obterListaChamadaAction,
  salvarChamadaMinistranteAction,
  salvarCursoCatalogoAction,
  type EventoAgendaItem,
  type CatalogoCursoItem,
  type ListaChamadaMembro,
} from '@/app/agenda/actions'

interface UsuarioProps {
  id: string
  nome: string
  matricula: string
  tipo_membro?: string
  cargos: string[]
  podeGerenciarSala: boolean
}

export interface MembroElegivelSala {
  id: string
  nome: string
  matricula: string
  cargo: string
}

interface StatusSalaProps {
  aberta: boolean
  ultimoResponsavel: string
  ultimoResponsavelId?: string | null
  dataHora: string | null
}

interface LogSalaProps {
  id: string
  status: string
  data_hora: string
  observacao?: string | null
  usuarios?: any
}

export interface SlotModalidade {
  presencial: boolean
  online: boolean
}

export type GradePchSemanal = Record<string, Record<string, SlotModalidade>>

export interface PchDataProps {
  dados_pch?: GradePchSemanal | Record<string, any>
  visibilidade?: 'todos' | 'lider'
  atualizado_em?: string | null
}

export interface DadosMembroProps extends SalvarDadosCadastraisPayload {
  atualizado_em?: string | null
}

function converterParaGradePch(
  raw: any,
  listaSlots: string[]
): Record<string, Record<string, SlotModalidade>> {
  const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  const resultado: Record<string, Record<string, SlotModalidade>> = {
    seg: {},
    ter: {},
    qua: {},
    qui: {},
    sex: {},
    sab: {},
    dom: {},
  }

  if (!raw || typeof raw !== 'object') {
    return resultado
  }

  for (const d of dias) {
    const diaRaw = raw[d]
    if (Array.isArray(diaRaw)) {
      for (const slot of listaSlots) {
        if (!diaRaw.includes(slot)) {
          resultado[d][slot] = { presencial: true, online: false }
        }
      }
    } else if (diaRaw && typeof diaRaw === 'object') {
      for (const [slot, val] of Object.entries(diaRaw)) {
        if (typeof val === 'object' && val !== null) {
          const v = val as any
          if (v.presencial || v.online) {
            resultado[d][slot] = {
              presencial: Boolean(v.presencial),
              online: Boolean(v.online),
            }
          }
        } else if (val === true) {
          resultado[d][slot] = { presencial: true, online: false }
        }
      }
    }
  }

  return resultado
}

export default function PortalIEEEApp({
  usuario,
  statusSala,
  historicoSala,
  usuariosElegiveisSala = [],
  pchInicial = null,
  dadosMembroInicial = null,
  dadosCadastraisIniciais = null,
  agendaInicial = [],
  catalogoInicial = [],
}: {
  usuario: UsuarioProps
  statusSala: StatusSalaProps
  historicoSala: LogSalaProps[]
  usuariosElegiveisSala?: MembroElegivelSala[]
  pchInicial?: PchDataProps | null
  dadosMembroInicial?: DadosMembroProps | null
  dadosCadastraisIniciais?: any
  agendaInicial?: EventoAgendaItem[]
  catalogoInicial?: CatalogoCursoItem[]
}) {
  // Estado de navegação principal
  const [activeTab, setActiveTab] = useState<'calendario' | 'disponibilidade' | 'equipe' | 'admin' | 'perfil'>('calendario')
  
  // Subviews do Hub Admin
  const [adminSubView, setAdminSubView] = useState<'hub' | 'interesses' | 'gestao' | 'usuarios' | 'recrutamento'>('hub')
  
  // Subviews do Perfil
  const [perfilSubView, setPerfilSubView] = useState<'hub' | 'pch' | 'cargos' | 'cadastrais'>('hub')
  
  // Modais
  const [modalSalaAberto, setModalSalaAberto] = useState(false)
  const [modalManualAberto, setModalManualAberto] = useState(false)
  const [modalNovaCapAberto, setModalNovaCapAberto] = useState(false)
  const [modalSlotAberto, setModalSlotAberto] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState<{ dia: string; hora: string } | null>(null)
  const [modalFichaAberto, setModalFichaAberto] = useState(false)
  const [membroFicha, setMembroFicha] = useState<any>(null)
  const [banner24hVisivel, setBanner24hVisivel] = useState(true)

  // Estados dos Dados Cadastrais & Ficha
  const [dadosCadastrais, setDadosCadastrais] = useState<any>(
    dadosMembroInicial || dadosCadastraisIniciais || null
  )
  const [modoEdicaoCadastral, setModoEdicaoCadastral] = useState(false)
  const [isSalvandoCadastral, setIsSalvandoCadastral] = useState(false)
  const formCadastralRef = useRef<FormAtualizacaoCadastralInlineRef>(null)
  const [feedbackCadastral, setFeedbackCadastral] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [abaFichaMembro, setAbaFichaMembro] = useState<'pessoais' | 'saude' | 'ieee'>('pessoais')

  // Estados do Controle da Sala (Passar, Assumir e Checklist)
  const [modoAcaoSala, setModoAcaoSala] = useState<'inicial' | 'checklist_fechar' | 'passar_busca' | 'passar_confirmar'>('inicial')
  const [membroTransferencia, setMembroTransferencia] = useState<MembroElegivelSala | null>(null)
  const [termoBuscaPassar, setTermoBuscaPassar] = useState('')
  const [checklistFechamento, setChecklistFechamento] = useState({
    ar: false,
    luzes: false,
    computadores: false,
  })

  // Estado do Simulador de Superusuário
  const [papelSimulado, setPapelSimulado] = useState<string>('Admin (Real)')
  const [simuladorAtivo, setSimuladorAtivo] = useState(false)

  // Estado do Calendário (Lista vs Grid)
  const [modoVisaoAgenda, setModoVisaoAgenda] = useState<'lista' | 'grid'>('lista')
  const [filtroContextoAgenda, setFiltroContextoAgenda] = useState('TODOS')
  const [filtroModalidadeAgenda, setFiltroModalidadeAgenda] = useState('TODOS')

  // Estado do Mapa de Calor
  const [diaHeatmap, setDiaHeatmap] = useState<'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'>('seg')
  const [equipeHeatmap, setEquipeHeatmap] = useState('Geral')

  // Estado da Equipe
  const [equipeAtiva, setEquipeAtiva] = useState('WolfBotz')
  const [buscaMembroEquipe, setBuscaMembroEquipe] = useState('')

  // Estado da Sala (Controle)
  const [isPending, startTransition] = useTransition()
  const [observacaoSala, setObservacaoSala] = useState('')
  const [feedbackSala, setFeedbackSala] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  // PCH State
  const [diaPCH, setDiaPCH] = useState<'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'>('seg')
  const [modoEdicaoPCH, setModoEdicaoPCH] = useState(false)
  const [visibilidadePCH, setVisibilidadePCH] = useState<'todos' | 'lider'>(
    pchInicial?.visibilidade || 'todos'
  )
  const [ultimaAtualizacaoPCH, setUltimaAtualizacaoPCH] = useState<string | null>(
    pchInicial?.atualizado_em || null
  )
  const [gradePCH, setGradePCH] = useState<Record<string, Record<string, SlotModalidade>>>(() =>
    converterParaGradePch(pchInicial?.dados_pch, [
      '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
      '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
      '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
      '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
    ])
  )
  const [feedbackPCH, setFeedbackPCH] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)
  const [isSalvandoPCH, setIsSalvandoPCH] = useState(false)

  // Modal Alterar Senha State
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [feedbackSenha, setFeedbackSenha] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)
  const [isSalvandoSenha, setIsSalvandoSenha] = useState(false)

  // =========================================================================
  // MÓDULO 3: CAPACITAÇÕES, AGENDA, PRESENÇAS E CATÁLOGO
  // =========================================================================
  const [eventosAgenda, setEventosAgenda] = useState<EventoAgendaItem[]>(agendaInicial || [])
  const [catalogoCursos, setCatalogoCursos] = useState<CatalogoCursoItem[]>(catalogoInicial || [])
  const [eventoDetalhes, setEventoDetalhes] = useState<EventoAgendaItem | null>(null)
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)
  const [notaAvaliacao, setNotaAvaliacao] = useState<number>(0)
  const [feedbackAvaliacao, setFeedbackAvaliacao] = useState<string>('')
  const [justificativaTexto, setJustificativaTexto] = useState<string>('')
  const [isSalvandoPresenca, setIsSalvandoPresenca] = useState(false)
  const [feedbackAcaoAgenda, setFeedbackAcaoAgenda] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  // Chamada do Ministrante
  const [modalChamadaAberto, setModalChamadaAberto] = useState(false)
  const [listaChamada, setListaChamada] = useState<ListaChamadaMembro[]>([])
  const [buscaChamada, setBuscaChamada] = useState('')
  const [isCarregandoChamada, setIsCarregandoChamada] = useState(false)
  const [isSalvandoChamada, setIsSalvandoChamada] = useState(false)

  // Filtros de Agenda
  const [filtroPesquisaAgenda, setFiltroPesquisaAgenda] = useState('')

  // Novo Agendamento
  const [formNovoEvento, setFormNovoEvento] = useState({
    id: '',
    id_curso: '',
    nome_capacitacao: '',
    data: new Date().toISOString().substring(0, 10),
    hora_inicio: '14:00',
    hora_fim: '16:00',
    ministrantes: usuario.nome || '',
    modalidade: 'Presencial' as 'Presencial' | 'Online' | 'Gravada' | 'Híbrido',
    local_link: 'E-213 - Sala do Ramo',
    equipe_responsavel: 'Geral',
    tipo_evento: 'Capacitação',
    publico_alvo: 'Todos do Ramo',
    contexto: 'Processo Trainee (PSE)',
    descricao: '',
  })
  const [buscaCatalogoCurso, setBuscaCatalogoCurso] = useState('')
  const [dropdownCatalogoAberto, setDropdownCatalogoAberto] = useState(false)
  const [isSalvandoEvento, setIsSalvandoEvento] = useState(false)

  // Catálogo (GP)
  const [modalNovoCursoAberto, setModalNovoCursoAberto] = useState(false)
  const [formNovoCurso, setFormNovoCurso] = useState({
    nome_curso: '',
    equipe_responsavel: 'Geral',
    status_curso: 'Ativo' as 'Ativo' | 'Inativo',
    ementa: '',
    carga_horaria: '2h',
  })
  const [isSalvandoCurso, setIsSalvandoCurso] = useState(false)
  const [filtroPesquisaCatalogo, setFiltroPesquisaCatalogo] = useState('')

  // Handlers Módulo 3
  const handleRecarregarAgenda = async () => {
    try {
      const res = await obterAgendaAction()
      if (res.sucesso && res.eventos) {
        setEventosAgenda(res.eventos)
      }
      if (res.sucesso && res.catalogo) {
        setCatalogoCursos(res.catalogo)
      }
    } catch (err) {
      console.error('Erro ao recarregar agenda:', err)
    }
  }

  const handleAbrirDetalhes = (evento: EventoAgendaItem) => {
    setEventoDetalhes(evento)
    setNotaAvaliacao(evento.Minha_Nota || 0)
    setFeedbackAvaliacao(evento.Meu_Feedback || '')
    setJustificativaTexto('')
    setFeedbackAcaoAgenda(null)
    setModalDetalhesAberto(true)
  }

  const handleRegistrarPresenca = async () => {
    if (!eventoDetalhes) return
    if (notaAvaliacao === 0) {
      setFeedbackAcaoAgenda({ tipo: 'erro', msg: 'Por favor, selecione uma nota de 1 a 5 estrelas.' })
      return
    }
    if (!feedbackAvaliacao.trim()) {
      setFeedbackAcaoAgenda({ tipo: 'erro', msg: 'Por favor, digite seu feedback sobre a didática.' })
      return
    }

    setIsSalvandoPresenca(true)
    setFeedbackAcaoAgenda(null)
    try {
      const res = await registrarPresencaComAvaliacaoAction(
        eventoDetalhes.id,
        notaAvaliacao,
        feedbackAvaliacao
      )
      if (res.sucesso) {
        setFeedbackAcaoAgenda({ tipo: 'ok', msg: res.mensagem })
        // Atualiza estado local
        setEventosAgenda((prev) =>
          prev.map((e) =>
            e.id === eventoDetalhes.id
              ? {
                  ...e,
                  Minha_Presenca: 'Presente',
                  Minha_Nota: notaAvaliacao,
                  Meu_Feedback: feedbackAvaliacao,
                }
              : e
          )
        )
        setEventoDetalhes((prev) =>
          prev
            ? {
                ...prev,
                Minha_Presenca: 'Presente',
                Minha_Nota: notaAvaliacao,
                Meu_Feedback: feedbackAvaliacao,
              }
            : null
        )
        handleRecarregarAgenda()
      } else {
        setFeedbackAcaoAgenda({ tipo: 'erro', msg: res.mensagem || 'Erro ao registrar presença.' })
      }
    } catch (err: any) {
      setFeedbackAcaoAgenda({ tipo: 'erro', msg: err.message || 'Erro inesperado.' })
    } finally {
      setIsSalvandoPresenca(false)
    }
  }

  const handleRegistrarJustificativa = async () => {
    if (!eventoDetalhes) return
    if (!justificativaTexto.trim()) {
      setFeedbackAcaoAgenda({ tipo: 'erro', msg: 'Por favor, preencha o motivo da justificativa.' })
      return
    }

    setIsSalvandoPresenca(true)
    setFeedbackAcaoAgenda(null)
    try {
      const res = await registrarJustificativaAction(eventoDetalhes.id, justificativaTexto)
      if (res.sucesso) {
        setFeedbackAcaoAgenda({ tipo: 'ok', msg: res.mensagem })
        setEventosAgenda((prev) =>
          prev.map((e) =>
            e.id === eventoDetalhes.id ? { ...e, Minha_Presenca: 'Falta Justificada' } : e
          )
        )
        setEventoDetalhes((prev) =>
          prev ? { ...prev, Minha_Presenca: 'Falta Justificada' } : null
        )
        handleRecarregarAgenda()
      } else {
        setFeedbackAcaoAgenda({ tipo: 'erro', msg: res.mensagem })
      }
    } catch (err: any) {
      setFeedbackAcaoAgenda({ tipo: 'erro', msg: err.message })
    } finally {
      setIsSalvandoPresenca(false)
    }
  }

  const handleAbrirChamada = async () => {
    if (!eventoDetalhes) return
    setModalChamadaAberto(true)
    setIsCarregandoChamada(true)
    setBuscaChamada('')
    try {
      const res = await obterListaChamadaAction(eventoDetalhes.id)
      if (res.sucesso && res.lista) {
        setListaChamada(res.lista)
      }
    } catch (err) {
      console.error('Erro ao carregar lista de chamada:', err)
    } finally {
      setIsCarregandoChamada(false)
    }
  }

  const handleTogglePresencaChamada = (matricula: string) => {
    setListaChamada((prev) =>
      prev.map((m) => (m.matricula === matricula ? { ...m, presente: !m.presente } : m))
    )
  }

  const handleMarcarTodosChamada = (presente: boolean) => {
    const termo = buscaChamada.toLowerCase()
    setListaChamada((prev) =>
      prev.map((m) => {
        if (!termo || m.nome.toLowerCase().includes(termo) || m.matricula.toLowerCase().includes(termo)) {
          return { ...m, presente }
        }
        return m
      })
    )
  }

  const handleSalvarChamada = async () => {
    if (!eventoDetalhes) return
    setIsSalvandoChamada(true)
    try {
      const matriculasPresentes = listaChamada.filter((m) => m.presente).map((m) => m.matricula)
      const res = await salvarChamadaMinistranteAction(eventoDetalhes.id, matriculasPresentes)
      if (res.sucesso) {
        setModalChamadaAberto(false)
        alert(res.mensagem || 'Chamada salva com sucesso!')
        handleRecarregarAgenda()
      } else {
        alert(res.mensagem || 'Erro ao salvar chamada.')
      }
    } catch (err: any) {
      alert('Erro ao salvar chamada: ' + err.message)
    } finally {
      setIsSalvandoChamada(false)
    }
  }

  const handleSalvarNovoEvento = async () => {
    if (!formNovoEvento.nome_capacitacao.trim()) {
      alert('Informe o título do evento.')
      return
    }
    if (!formNovoEvento.data) {
      alert('Informe a data do evento.')
      return
    }

    setIsSalvandoEvento(true)
    try {
      const res = await salvarCapacitacaoAction(formNovoEvento)
      if (res.sucesso) {
        alert(res.mensagem)
        setModalNovaCapAberto(false)
        setFormNovoEvento({
          id: '',
          id_curso: '',
          nome_capacitacao: '',
          data: new Date().toISOString().substring(0, 10),
          hora_inicio: '14:00',
          hora_fim: '16:00',
          ministrantes: usuario.nome || '',
          modalidade: 'Presencial',
          local_link: 'E-213 - Sala do Ramo',
          equipe_responsavel: 'Geral',
          tipo_evento: 'Capacitação',
          publico_alvo: 'Todos do Ramo',
          contexto: 'Processo Trainee (PSE)',
          descricao: '',
        })
        handleRecarregarAgenda()
      } else {
        alert(res.mensagem || 'Erro ao salvar evento.')
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setIsSalvandoEvento(false)
    }
  }

  const handleCancelarEvento = async () => {
    if (!eventoDetalhes) return
    if (!confirm(`Tem certeza que deseja cancelar o compromisso "${eventoDetalhes.nome_capacitacao}"?`)) {
      return
    }

    try {
      const res = await cancelarCapacitacaoAction(eventoDetalhes.id)
      if (res.sucesso) {
        alert(res.mensagem)
        setModalDetalhesAberto(false)
        setEventosAgenda((prev) => prev.filter((e) => e.id !== eventoDetalhes.id))
        handleRecarregarAgenda()
      } else {
        alert(res.mensagem)
      }
    } catch (err: any) {
      alert('Erro: ' + err.message)
    }
  }

  const handleSalvarNovoCursoCatalogo = async () => {
    if (!formNovoCurso.nome_curso.trim()) {
      alert('Informe o nome do curso.')
      return
    }

    setIsSalvandoCurso(true)
    try {
      const res = await salvarCursoCatalogoAction(formNovoCurso)
      if (res.sucesso) {
        alert(res.mensagem)
        setModalNovoCursoAberto(false)
        setFormNovoCurso({
          nome_curso: '',
          equipe_responsavel: 'Geral',
          status_curso: 'Ativo',
          ementa: '',
          carga_horaria: '2h',
        })
        handleRecarregarAgenda()
      } else {
        alert(res.mensagem)
      }
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setIsSalvandoCurso(false)
    }
  }

  const handleExportarRelatorioPresencas = () => {
    const cabecalho = ['ID_Capacitacao', 'Nome_Capacitacao', 'Data', 'Horario', 'Modalidade', 'Ministrantes', 'Equipe_Responsavel', 'Tipo_Evento', 'Publico_Alvo', 'Status']
    const linhas = eventosAgenda.map((e) => [
      `"${e.id}"`,
      `"${e.nome_capacitacao.replace(/"/g, '""')}"`,
      `"${e.data}"`,
      `"${e.hora_inicio} - ${e.hora_fim}"`,
      `"${e.modalidade}"`,
      `"${(e.ministrantes || '').replace(/"/g, '""')}"`,
      `"${e.equipe_responsavel}"`,
      `"${e.tipo_evento}"`,
      `"${e.publico_alvo}"`,
      `"${e.status}"`,
    ])

    const csvContent = [cabecalho.join(','), ...linhas.map((l) => l.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Relatorio_Capacitacoes_IEEE_${new Date().toISOString().substring(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Mock de Integrantes da Equipe
  const membrosEquipeMock = [
    { nome: 'Eike Vimieiro', cargo: 'Presidente', nivel: 'Diretoria', matricula: '1234567', status: 'Ativo', equipe: 'Diretoria' },
    { nome: 'Ana Clara Souza', cargo: 'Diretora de GP', nivel: 'Diretoria', matricula: '2323101GADM', status: 'Ativo', equipe: 'Gestão de Pessoas' },
    { nome: 'Lucas Medeiros', cargo: 'Capitão WolfBotz', nivel: 'Lider', matricula: '2323102GADM', status: 'Ativo', equipe: 'WolfBotz' },
    { nome: 'Beatriz Lima', cargo: 'Assessora de Projetos', nivel: 'Assessor', matricula: '2323103GADM', status: 'Ativo', equipe: 'WolfBotz' },
    { nome: 'Gabriel Rocha', cargo: 'Membro Efetivo', nivel: 'Membro', matricula: '2323104GADM', status: 'Ativo', equipe: 'WolfBotz' },
    { nome: 'Juliana Torres', cargo: 'Trainee Robótica', nivel: 'Trainee', matricula: '2423105GADM', status: 'Ativo', equipe: 'WolfBotz' },
  ]

  // Mock de horários do Mapa de Calor (Slots de 1 hora)
  const slotsHorarios = [
    '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
    '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
    '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
  ]

  // Lista unificada para busca ao passar a sala (membros do banco + líderes de demonstração)
  const listaMembrosParaTransferencia: MembroElegivelSala[] = [
    ...usuariosElegiveisSala,
    ...[
      { id: 'mock-1', nome: 'Ana Clara Souza', matricula: '2323101GADM', cargo: 'Diretora de GP' },
      { id: 'mock-2', nome: 'Lucas Medeiros', matricula: '2323102GADM', cargo: 'Capitão WolfBotz' },
      { id: 'mock-3', nome: 'Beatriz Lima', matricula: '2323103GADM', cargo: 'Assessora de Projetos' },
      { id: 'mock-4', nome: 'Matheus Ribeiro', matricula: '2323104GADM', cargo: 'Coordenador WolfBytes' },
    ].filter(
      (m) =>
        m.nome !== usuario.nome &&
        !usuariosElegiveisSala.some((u) => u.nome === m.nome || u.matricula === m.matricula)
    ),
  ]

  // Função para executar abertura / fechamento / transferência da sala
  const handleToggleSala = (
    novoStatus: 'Aberta' | 'Fechada',
    observacaoCustom?: string,
    novoResponsavelId?: string
  ) => {
    setFeedbackSala(null)
    startTransition(async () => {
      const obsFinal =
        observacaoCustom ||
        observacaoSala ||
        (novoStatus === 'Aberta' ? 'Abriu a sala' : 'Fechou a sala')
      const res = await toggleSalaAction(novoStatus, obsFinal, novoResponsavelId)
      if (res?.error) {
        setFeedbackSala({ tipo: 'erro', msg: res.error })
      } else {
        const msgSucesso =
          novoStatus === 'Aberta'
            ? novoResponsavelId && novoResponsavelId !== usuario.id
              ? 'Transferência realizada com sucesso!\n\n🔑 Senha da porta: 73684134'
              : 'Sala aberta com sucesso!\n\n🔑 Senha da porta: 73684134'
            : 'A sala foi trancada com segurança.'

        setFeedbackSala({
          tipo: 'ok',
          msg: msgSucesso,
        })
        setObservacaoSala('')
        setModoAcaoSala('inicial')
        setChecklistFechamento({ ar: false, luzes: false, computadores: false })
        setMembroTransferencia(null)
      }
    })
  }

  // Permissão efetiva da sala considerando se o simulador está ativo
  const podeGerenciarSalaEfetivo = simuladorAtivo
    ? ['Admin', 'Diretoria', 'Lider'].includes(papelSimulado)
    : usuario.podeGerenciarSala

  // Função para simular papéis
  const simularPapel = (papel: string) => {
    setPapelSimulado(papel)
    setSimuladorAtivo(true)
  }

  const restaurarSimulador = () => {
    setPapelSimulado('Admin (Real)')
    setSimuladorAtivo(false)
  }

  // Handlers do Módulo 2 (PCH, Dados Cadastrais, Alteração de Senha)
  const toggleSlotLivre = (dia: string, slot: string) => {
    if (!modoEdicaoPCH) return
    setGradePCH((prev) => {
      const diaObj = { ...(prev[dia] || {}) }
      if (diaObj[slot]) {
        delete diaObj[slot]
      } else {
        diaObj[slot] = { presencial: true, online: false }
      }
      return { ...prev, [dia]: diaObj }
    })
  }

  const toggleModalidadeSlot = (
    dia: string,
    slot: string,
    modalidade: 'presencial' | 'online',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation()
    if (!modoEdicaoPCH) return
    setGradePCH((prev) => {
      const diaObj = { ...(prev[dia] || {}) }
      const slotAtual = diaObj[slot] || { presencial: false, online: false }
      const novoVal = !slotAtual[modalidade]
      const outroVal = modalidade === 'presencial' ? slotAtual.online : slotAtual.presencial

      if (!novoVal && !outroVal) {
        delete diaObj[slot]
      } else {
        diaObj[slot] = {
          ...slotAtual,
          [modalidade]: novoVal,
        }
      }
      return { ...prev, [dia]: diaObj }
    })
  }

  const aplicarLoteDia = (dia: string, tipo: 'presencial' | 'online' | 'ambos' | 'ocupado') => {
    if (!modoEdicaoPCH) return
    setGradePCH((prev) => {
      const diaObj: Record<string, SlotModalidade> = {}
      if (tipo !== 'ocupado') {
        for (const slot of slotsHorarios) {
          diaObj[slot] = {
            presencial: tipo === 'presencial' || tipo === 'ambos',
            online: tipo === 'online' || tipo === 'ambos',
          }
        }
      }
      return { ...prev, [dia]: diaObj }
    })
  }

  const handleSalvarPCH = async () => {
    setIsSalvandoPCH(true)
    setFeedbackPCH(null)
    const res = await salvarPCHAction({
      dadosPch: gradePCH,
      visibilidade: visibilidadePCH,
    })
    setIsSalvandoPCH(false)
    if (res.sucesso) {
      setFeedbackPCH({ tipo: 'ok', msg: res.mensagem })
      if (res.atualizadoEm) setUltimaAtualizacaoPCH(res.atualizadoEm)
      setModoEdicaoPCH(false)
    } else {
      setFeedbackPCH({ tipo: 'erro', msg: res.mensagem })
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSalvandoSenha(true)
    setFeedbackSenha(null)
    const res = await alterarSenhaAction(novaSenha, confirmarSenha)
    setIsSalvandoSenha(false)
    if (res.sucesso) {
      setFeedbackSenha({ tipo: 'ok', msg: res.mensagem })
      setNovaSenha('')
      setConfirmarSenha('')
      setTimeout(() => {
        setModalSenhaAberto(false)
        setFeedbackSenha(null)
      }, 1500)
    } else {
      setFeedbackSenha({ tipo: 'erro', msg: res.mensagem })
    }
  }

  return (
    <div id="app-main" className="flex-1 flex flex-col w-full min-h-screen bg-slate-50 antialiased font-body">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERUSUÁRIO SIMULADOR DE PERFIS (FIXADA NO TOPO - INDEX.HTML) */}
      {/* ========================================================================= */}
      <div
        id="barra-simulador-superusuario"
        className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border-b border-slate-800 sticky top-0 z-[60]"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-lg animate-pulse">psychology</span>
          <span className="font-headline font-bold text-slate-100">SIMULADOR:</span>
          <span
            id="badge-perfil-simulado"
            className="bg-amber-400/20 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30 text-[11px] uppercase tracking-wider"
          >
            👑 {papelSimulado}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => simularPapel('Admin')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => simularPapel('Diretoria')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              📊 Diretoria
            </button>
            <button
              type="button"
              onClick={() => simularPapel('Lider')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              👔 Líder
            </button>
            <button
              type="button"
              onClick={() => simularPapel('Membro')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              🎓 Membro
            </button>
            <button
              type="button"
              onClick={() => simularPapel('Trainee')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              🐣 Trainee
            </button>
          </div>

          <button
            type="button"
            onClick={restaurarSimulador}
            title="Voltar ao perfil real do login"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-sm text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CABEÇALHO PRINCIPAL DO PORTAL IEEE (FIXADO NO TOPO - INDEX.HTML) */}
      {/* ========================================================================= */}
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shadow-xs sticky top-[45px] z-40">
        <div>
          <h1 className="font-headline font-bold text-xl text-primary leading-tight">Portal IEEE</h1>
          
          {/* BADGE DA SALA (CLICÁVEL PARA ABRIR O MODAL DE CONTROLE) */}
          <div
            id="badge-sala"
            onClick={() => setModalSalaAberto(true)}
            className={`mt-1 cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all active:scale-95 ${
              statusSala.aberta
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[15px] ${
                statusSala.aberta ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              meeting_room
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              {statusSala.aberta ? 'SALA ABERTA' : 'SALA FECHADA'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                statusSala.aberta ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            ></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO ATUALIZAR STATUS SALA */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Atualizar dados"
            className="w-10 h-10 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>

          {/* BOTÃO MANUAL DO USUÁRIO */}
          <button
            type="button"
            onClick={() => setModalManualAberto(true)}
            title="Manual do Portal IEEE"
            className="w-10 h-10 bg-blue-50 text-primary hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>

          {/* BOTÃO LOGOUT RÁPIDO PARA TESTAR OUTROS USUÁRIOS */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sair / Trocar de Conta"
              className="w-10 h-10 bg-red-50 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO PRINCIPAL (MAIN COM AS 5 VIEWS) */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full p-4 pb-36 max-w-5xl mx-auto">
        {/* BANNER DE TOLERÂNCIA DE 24H (SEGUNDA-FEIRA) DE FOLLOW-UP */}
        {banner24hVisivel && (
          <div
            id="banner-atraso-followup-24h"
            className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl animate-bounce">warning</span>
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Atenção: Follow-Up Semanal em Atraso</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    Tolerância 24h
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  O Follow-Up do seu grupo venceu no domingo. Preencha hoje até 23:59h para evitar a suspensão temporária do grupo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin')
                  setAdminSubView('recrutamento')
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                <span>Preencher</span>
              </button>
              <button
                type="button"
                onClick={() => setBanner24hVisivel(false)}
                className="text-amber-500 hover:text-amber-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 1: AGENDA (view-calendario) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'calendario' && (
          <div id="view-calendario" className="pb-6">
            <div className="flex justify-between items-center mb-3 mt-2">
              <div>
                <h2 className="text-2xl font-headline font-bold text-gray-800">Agenda & Treinamentos</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Acompanhe capacitações, registre presenças e avalie a didática dos facilitadores.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecarregarAgenda}
                  className="text-gray-400 hover:text-primary transition-colors bg-white p-2 rounded-xl shadow-xs border border-gray-100 cursor-pointer"
                  title="Atualizar agenda"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisaoAgenda(modoVisaoAgenda === 'lista' ? 'grid' : 'lista')}
                  className="text-gray-400 hover:text-primary transition-colors bg-white p-2 rounded-xl shadow-xs border border-gray-100 cursor-pointer"
                  title={modoVisaoAgenda === 'lista' ? 'Mudar para Visão Mensal' : 'Mudar para Visão Lista'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {modoVisaoAgenda === 'lista' ? 'calendar_month' : 'format_list_bulleted'}
                  </span>
                </button>
              </div>
            </div>

            {/* BARRA DE FILTROS E BUSCA */}
            <div className="mb-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Pesquisar</label>
                <div className="relative mt-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                  <input
                    type="text"
                    value={filtroPesquisaAgenda}
                    onChange={(e) => setFiltroPesquisaAgenda(e.target.value)}
                    placeholder="Título, ministrante ou assunto..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Contexto</label>
                <select
                  value={filtroContextoAgenda}
                  onChange={(e) => setFiltroContextoAgenda(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary mt-1"
                >
                  <option value="TODOS">Todos os Contextos</option>
                  <option value="Processo Trainee (PSE)">Processo Trainee (PSE)</option>
                  <option value="Ramo Estudantil (Capítulos / Equipes)">Ramo Estudantil</option>
                </select>
              </div>
              <div className="w-full md:w-40">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Modalidade</label>
                <select
                  value={filtroModalidadeAgenda}
                  onChange={(e) => setFiltroModalidadeAgenda(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary mt-1"
                >
                  <option value="TODOS">Qualquer</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                  <option value="Gravada">Gravada</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroContextoAgenda('TODOS')
                    setFiltroModalidadeAgenda('TODOS')
                    setFiltroPesquisaAgenda('')
                  }}
                  className="h-[36px] px-3 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* MODO LISTA CATEGORIZADA */}
            {modoVisaoAgenda === 'lista' && (() => {
              const agora = new Date()

              // Filtra primeiro
              const eventosFiltrados = eventosAgenda.filter((ev) => {
                if (filtroContextoAgenda !== 'TODOS' && ev.contexto !== filtroContextoAgenda) return false
                if (filtroModalidadeAgenda !== 'TODOS' && ev.modalidade !== filtroModalidadeAgenda) return false
                if (filtroPesquisaAgenda.trim()) {
                  const termo = filtroPesquisaAgenda.toLowerCase()
                  const tit = ev.nome_capacitacao.toLowerCase()
                  const min = (ev.ministrantes || '').toLowerCase()
                  const eq = (ev.equipe_responsavel || '').toLowerCase()
                  if (!tit.includes(termo) && !min.includes(termo) && !eq.includes(termo)) return false
                }
                return true
              })

              const acoesNecessarias: EventoAgendaItem[] = []
              const proximosTreinamentos: EventoAgendaItem[] = []
              const opcionais: EventoAgendaItem[] = []
              const historico: EventoAgendaItem[] = []

              eventosFiltrados.forEach((c) => {
                const dtStr = (c.data || '').substring(0, 10)
                const ini = new Date(`${dtStr}T${c.hora_inicio || '00:00'}:00`)
                const fim = new Date(`${dtStr}T${c.hora_fim || '23:59'}:00`)
                const diffIni = (agora.getTime() - ini.getTime()) / (1000 * 60 * 60)
                const diffFim = (agora.getTime() - fim.getTime()) / (1000 * 60 * 60)

                const statusPresenca = String(c.Minha_Presenca || '').toLowerCase()
                const temNota = Boolean(c.Minha_Nota && c.Minha_Nota > 0)
                const presencaOk = statusPresenca === 'presente' || temNota
                const justificativaOk = statusPresenca.includes('justific')
                const concluidoPeloUsuario = presencaOk || justificativaOk
                const expirou = c.modalidade !== 'Gravada' && diffFim > 24

                if (c.isObrigatorio) {
                  if (concluidoPeloUsuario || expirou) {
                    historico.push(c)
                  } else if (diffIni < 0) {
                    proximosTreinamentos.push(c)
                  } else {
                    acoesNecessarias.push(c)
                  }
                } else {
                  if (concluidoPeloUsuario || expirou) {
                    historico.push(c)
                  } else {
                    opcionais.push(c)
                  }
                }
              })

              const renderCard = (cap: EventoAgendaItem, tipo: 'urgente' | 'proximo' | 'opcional' | 'historico') => {
                let dFmt = 'Data não definida'
                let dISO = ''
                if (cap.data) {
                  const d = new Date(cap.data)
                  if (!isNaN(d.getTime())) {
                    dFmt = d.toLocaleDateString('pt-BR')
                    dISO = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
                  }
                }

                const horaIniLimpa = (cap.hora_inicio || '00:00').replace(':', '')
                const horaFimLimpa = (cap.hora_fim || '23:59').replace(':', '')
                const linkGoogleCalendar = dISO
                  ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      cap.nome_capacitacao
                    )}&dates=${dISO}T${horaIniLimpa}00/${dISO}T${horaFimLimpa}00&details=${encodeURIComponent(
                      'Ministrantes: ' + (cap.ministrantes || '')
                    )}&location=${encodeURIComponent(cap.local_link || '')}`
                  : null

                // Estilo da borda
                let borda = 'border-l-4 border-primary'
                if (tipo === 'urgente') borda = 'border-l-4 border-orange-500 shadow-sm'
                else if (tipo === 'opcional') borda = 'border-l-4 border-purple-400'
                else if (tipo === 'historico') borda = 'border-l-4 border-gray-300'

                // Badge de modalidade
                let iconMod = 'location_on'
                let bgMod = 'bg-gray-100 text-gray-700'
                if (cap.modalidade === 'Online') {
                  iconMod = 'videocam'
                  bgMod = 'bg-blue-50 text-blue-700 border border-blue-200'
                } else if (cap.modalidade === 'Gravada') {
                  iconMod = 'ondemand_video'
                  bgMod = 'bg-purple-50 text-purple-700 border border-purple-200'
                } else if (cap.modalidade === 'Híbrido') {
                  iconMod = 'devices'
                  bgMod = 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }

                // Badge de Presença Pessoal (Double-Check)
                let badgePresenca = null
                const stP = cap.Minha_Presenca
                if (stP === 'Presente' || (cap.Minha_Nota && cap.Minha_Nota > 0)) {
                  badgePresenca = (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Presente
                    </span>
                  )
                } else if (stP === 'Falta Justificada') {
                  badgePresenca = (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">speaker_notes</span> Justificado
                    </span>
                  )
                } else if (stP === 'Aguardando Ministrante') {
                  badgePresenca = (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">pending_actions</span> Aguardando Chamada
                    </span>
                  )
                } else if (stP === 'Avaliação Pendente') {
                  badgePresenca = (
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-orange-200 animate-pulse flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">warning</span> Avaliação Pendente
                    </span>
                  )
                } else if (cap.Status_Calculado === 'Concluída') {
                  badgePresenca = (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">cancel</span> Falta
                    </span>
                  )
                }

                return (
                  <div
                    key={cap.id}
                    onClick={() => handleAbrirDetalhes(cap)}
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${borda}`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="bg-blue-50 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {cap.tipo_evento || 'Capacitação'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${bgMod}`}>
                          <span className="material-symbols-outlined text-[13px]">{iconMod}</span>
                          {cap.modalidade}
                        </span>
                        {badgePresenca}
                        {cap.souMinistrante && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">school</span> Você é Facilitador
                          </span>
                        )}
                        {cap.isObrigatorio && (
                          <span className="bg-red-50 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-200">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{cap.id}</span>
                    </div>

                    <h3 className="text-gray-900 font-headline font-bold text-base sm:text-lg mb-2">
                      {cap.nome_capacitacao}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">event</span>
                        <span>{dFmt} • {cap.hora_inicio || '--:--'} às {cap.hora_fim || '--:--'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">person</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                          {cap.ministrantes || 'A definir'}
                        </span>
                      </div>
                      {cap.local_link && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">pin_drop</span>
                          <span className="truncate max-w-[200px]">{cap.local_link}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2 flex-wrap">
                      <div className="text-[11px] text-gray-500 font-medium">
                        {cap.equipe_responsavel && <span>Equipe: <strong className="text-gray-700">{cap.equipe_responsavel}</strong></span>}
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {linkGoogleCalendar && (
                          <a
                            href={linkGoogleCalendar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                            Agenda
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalhes(cap)}
                          className="px-3 py-1 bg-primary text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Detalhes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              if (eventosFiltrados.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
                    <p className="font-bold text-gray-700 text-sm">Nenhum compromisso encontrado.</p>
                    <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros de pesquisa ou agende um novo evento no botão (+).</p>
                  </div>
                )
              }

              return (
                <div className="space-y-6">
                  {/* GRUPO 1: AÇÃO NECESSÁRIA */}
                  {acoesNecessarias.length > 0 && (
                    <div>
                      <h3 className="font-headline font-bold text-sm uppercase tracking-wider text-orange-600 mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg animate-pulse">notifications_active</span>
                        Ação Necessária ({acoesNecessarias.length})
                      </h3>
                      <div className="space-y-3">
                        {acoesNecessarias.map((cap) => renderCard(cap, 'urgente'))}
                      </div>
                    </div>
                  )}

                  {/* GRUPO 2: PRÓXIMOS TREINAMENTOS */}
                  {proximosTreinamentos.length > 0 && (
                    <div>
                      <h3 className="font-headline font-bold text-sm uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        Próximos Treinamentos ({proximosTreinamentos.length})
                      </h3>
                      <div className="space-y-3">
                        {proximosTreinamentos.map((cap) => renderCard(cap, 'proximo'))}
                      </div>
                    </div>
                  )}

                  {/* GRUPO 3: OPCIONAIS (OUTRAS EQUIPES) */}
                  {opcionais.length > 0 && (
                    <details className="group bg-purple-50/50 rounded-2xl p-4 border border-purple-100 transition-all">
                      <summary className="flex items-center justify-between font-headline font-bold text-sm text-purple-900 cursor-pointer list-none outline-none">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">explore</span>
                          Treinamentos Opcionais & Outras Equipes ({opcionais.length})
                        </span>
                        <span className="material-symbols-outlined transition group-open:rotate-180 text-purple-700">expand_more</span>
                      </summary>
                      <div className="mt-4 space-y-3">
                        {opcionais.map((cap) => renderCard(cap, 'opcional'))}
                      </div>
                    </details>
                  )}

                  {/* GRUPO 4: HISTÓRICO CONCLUÍDO */}
                  {historico.length > 0 && (
                    <details className="group bg-gray-50/80 rounded-2xl p-4 border border-gray-200 transition-all">
                      <summary className="flex items-center justify-between font-headline font-bold text-sm text-gray-600 cursor-pointer list-none outline-none">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">history</span>
                          Histórico de Treinamentos Concluídos ({historico.length})
                        </span>
                        <span className="material-symbols-outlined transition group-open:rotate-180 text-gray-500">expand_more</span>
                      </summary>
                      <div className="mt-4 space-y-3 opacity-80">
                        {historico.map((cap) => renderCard(cap, 'historico'))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })()}

            {/* MODO GRID CALENDÁRIO */}
            {modoVisaoAgenda === 'grid' && (
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    Calendário Geral de Compromissos
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">Total: {eventosAgenda.length} eventos</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((d) => (
                    <div key={d} className="text-[10px] font-black text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => {
                    const diaStr = String(dia).padStart(2, '0')
                    const eventosNoDia = eventosAgenda.filter((e) => {
                      const dt = (e.data || '').substring(0, 10)
                      return dt.endsWith(`-${diaStr}`)
                    })
                    const temEvento = eventosNoDia.length > 0

                    return (
                      <div
                        key={dia}
                        onClick={() => {
                          if (temEvento) {
                            handleAbrirDetalhes(eventosNoDia[0])
                          }
                        }}
                        className={`p-2 h-16 rounded-xl text-xs font-bold border transition-all flex flex-col justify-between ${
                          temEvento
                            ? 'bg-blue-50/80 border-blue-300 text-primary shadow-xs cursor-pointer hover:bg-blue-100'
                            : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-[11px] font-black">{dia}</span>
                        {temEvento && (
                          <div className="flex flex-col items-center">
                            <span className="w-2 h-2 rounded-full bg-primary mb-1"></span>
                            <span className="text-[9px] font-extrabold text-blue-700 truncate w-full text-center">
                              {eventosNoDia.length} evt
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FAB (+) ADICIONAR NOVO COMPROMISSO */}
            <button
              id="fab-adicionar"
              onClick={() => {
                setFormNovoEvento({
                  id: '',
                  id_curso: '',
                  nome_capacitacao: '',
                  data: new Date().toISOString().substring(0, 10),
                  hora_inicio: '14:00',
                  hora_fim: '16:00',
                  ministrantes: usuario.nome || '',
                  modalidade: 'Presencial',
                  local_link: 'E-213 - Sala do Ramo',
                  equipe_responsavel: 'Geral',
                  tipo_evento: 'Capacitação',
                  publico_alvo: 'Todos do Ramo',
                  contexto: 'Processo Trainee (PSE)',
                  descricao: '',
                })
                setBuscaCatalogoCurso('')
                setModalNovaCapAberto(true)
              }}
              className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 z-[50] transition-all hover:bg-blue-700 cursor-pointer"
              title="Agendar novo compromisso"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 2: MAPA DE CALOR (view-disponibilidade) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'disponibilidade' && (
          <div id="view-disponibilidade" className="pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">grid_view</span>
                  Mapa de Calor da Equipe
                </h2>
                <p className="text-xs text-gray-500">
                  Veja a disponibilidade combinada dos membros para agendar reuniões.
                </p>
              </div>
            </div>

            {/* PAINEL DE CONTROLE DE FILTROS DO MAPA DE CALOR */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 mb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={equipeHeatmap}
                    onChange={(e) => setEquipeHeatmap(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Geral">Todas as Equipes (Geral)</option>
                    <option value="WolfBotz">WolfBotz</option>
                    <option value="WolfCraft">WolfCraft</option>
                    <option value="WolfBytes">WolfBytes</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Gestão de Pessoas">Gestão de Pessoas</option>
                  </select>

                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-amber-400">tune</span>
                    <span>Configurar Filtros</span>
                  </button>

                  <button
                    type="button"
                    className="px-3.5 py-2 bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">groups</span>
                    <span>Membros (28)</span>
                  </button>
                </div>

                <span className="text-xs text-gray-500 font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
                  28 membros analisados
                </span>
              </div>

              {/* LEGENDA DO DEGRADÊ */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-500 mr-1">Disponibilidade:</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                    <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span> Ninguém
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                    <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></span> Poucos
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                    <span className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500"></span> Parcial
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-900">
                    <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></span> Maioria
                  </span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-blue-950">
                    <span className="w-3 h-3 rounded-full bg-blue-950"></span> 100% Livre
                  </span>
                </div>
              </div>
            </div>

            {/* NAVEGAÇÃO DOS 7 DIAS DO HEATMAP */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDiaHeatmap(d)}
                  className={`flex-1 min-w-[44px] py-2 px-1 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                    diaHeatmap === d
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>

            {/* GRADE DO MAPA DE CALOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-12">
              {slotsHorarios.map((slot, idx) => {
                // Cálculo ilustrativo da disponibilidade
                const pctLivre = (idx * 17 + 23) % 100
                return (
                  <div
                    key={slot}
                    onClick={() => {
                      setSlotSelecionado({ dia: diaHeatmap.toUpperCase(), hora: slot })
                      setModalSlotAberto(true)
                    }}
                    className="p-3.5 bg-white border border-gray-100 hover:border-blue-300 rounded-2xl shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        <span className="material-symbols-outlined text-base">schedule</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-gray-800">{slot}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {Math.round((pctLivre / 100) * 28)} membros disponíveis
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${pctLivre}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-extrabold text-primary w-8 text-right">
                        {pctLivre}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 3: EQUIPE & ORGANOGRAMA (view-equipe) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'equipe' && (
          <div id="view-equipe" className="pb-6">
            {/* CABEÇALHO COM GRADIENTE */}
            <div className="mb-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full border border-indigo-400/20">
                      Ramo Estudantil IEEE
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-lg sm:text-xl text-white mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-2xl">account_tree</span>
                    <span>Minhas Equipes & Organograma Hierárquico</span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Consulte os membros das suas equipes e visualize a estrutura oficial de cargos.
                  </p>
                </div>
              </div>

              {/* SELETOR DE EQUIPES */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {['WolfBotz', 'WolfCraft', 'WolfBytes', 'Diretoria', 'Gestão de Pessoas', 'Marketing'].map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setEquipeAtiva(eq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      equipeAtiva === eq
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="mb-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
                <input
                  type="text"
                  value={buscaMembroEquipe}
                  onChange={(e) => setBuscaMembroEquipe(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Buscar pessoa na equipe por nome, cargo ou posição..."
                />
              </div>
              <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-2 rounded-xl shrink-0">
                {membrosEquipeMock.length} membros
              </span>
            </div>

            {/* LISTA HIERÁRQUICA */}
            <div className="space-y-3 mb-8">
              {membrosEquipeMock
                .filter((m) => {
                  if (buscaMembroEquipe) {
                    return (
                      m.nome.toLowerCase().includes(buscaMembroEquipe.toLowerCase()) ||
                      m.cargo.toLowerCase().includes(buscaMembroEquipe.toLowerCase())
                    )
                  }
                  return true
                })
                .map((membro) => (
                  <div
                    key={membro.matricula}
                    onClick={() => {
                      setMembroFicha(membro)
                      setModalFichaAberto(true)
                    }}
                    className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                        {membro.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-gray-900">{membro.nome}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {membro.cargo}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">ID: {membro.matricula}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {membro.status}
                      </span>
                      <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* CARDS DOS GRUPOS DE TRAINEES (PSE) */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-lg">diversity_3</span>
                    <span>Grupos de Trainees (PSE)</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Equipes, assessores e integrantes vinculados</p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Novo Grupo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-900 uppercase">Grupo 01 (WolfBotz • Marketing)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold">5 Trainees</span>
                  </div>
                  <p className="text-xs text-purple-800 font-medium">
                    Líder: <strong className="font-bold">Juliana Torres</strong> • Assessor: Beatriz Lima
                  </p>
                </div>
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-900 uppercase">Grupo 02 (WolfBytes • GP)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold">4 Trainees</span>
                  </div>
                  <p className="text-xs text-purple-800 font-medium">
                    Líder: <strong className="font-bold">Matheus Ribeiro</strong> • Assessor: Ana Clara Souza
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 4: ADMIN HUB (view-admin) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'admin' && (
          <div id="view-admin" className="pb-6">
            {adminSubView === 'hub' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
                      Painel Administrativo
                    </h2>
                    <p className="text-xs text-gray-500">Selecione o módulo para gerenciar as atividades do grupo.</p>
                  </div>
                </div>

                {/* 4 CARDS DO HUB ADMIN (INDEX.HTML) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div
                    onClick={() => setAdminSubView('interesses')}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl">bookmark</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Demandas da Equipe</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Catálogo de interesses e solicitações</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAdminSubView('gestao')}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Gestão de Catálogo</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Gerenciar capacitações e presenças</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAdminSubView('usuarios')}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Gestão de Pessoas</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Controle de Membros e Cadastro</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAdminSubView('recrutamento')}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl">how_to_reg</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Recrutamento & Seleção</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Trainees e Acompanhamento PSE</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBVIEWS DO ADMIN */}
            {adminSubView !== 'hub' && (
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <button
                    onClick={() => setAdminSubView('hub')}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>Voltar ao Painel Admin</span>
                  </button>
                  <span className="font-bold text-sm text-gray-700 capitalize">
                    {adminSubView === 'interesses' && 'Demandas da Equipe'}
                    {adminSubView === 'gestao' && 'Gestão de Catálogo'}
                    {adminSubView === 'usuarios' && 'Gestão de Pessoas'}
                    {adminSubView === 'recrutamento' && 'Recrutamento & Seleção'}
                  </span>
                </div>

                {/* SUBVIEW: GESTÃO DE PESSOAS */}
                {adminSubView === 'usuarios' && (
                  <div className="space-y-4">
                    {/* 4 KPIS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-lg">group</span>
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900 leading-none">28</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Total Membros</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-lg">verified</span>
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-emerald-600 leading-none">24</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Atualizados</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-lg">pending_actions</span>
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-amber-600 leading-none">4</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Pendentes</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-lg">person_off</span>
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-red-600 leading-none">0</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Inativos</p>
                        </div>
                      </div>
                    </div>

                    {/* FILA DE SOLICITAÇÕES GP */}
                    <FilaSolicitacoesGP />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {membrosEquipeMock.map((m) => (
                        <div
                          key={m.matricula}
                          onClick={() => {
                            setMembroFicha(m)
                            setModalFichaAberto(true)
                          }}
                          className="p-3 bg-gray-50 border border-gray-100 hover:border-purple-300 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div>
                            <p className="font-bold text-xs text-gray-900">{m.nome}</p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {m.cargo} • {m.equipe}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            Ver Ficha
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: DEMANDAS DA EQUIPE */}
                {adminSubView === 'interesses' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
                      <h4 className="font-bold text-sm">Demandas da Equipe (Capacitações Obrigatórias)</h4>
                      <p className="text-xs text-blue-200 mt-1">
                        Defina quais treinamentos do catálogo são obrigatórios para os novos trainees e membros da sua equipe.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {catalogoCursos.map((curso) => (
                        <div key={curso.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-gray-500 font-bold">{curso.id}</span>
                              <p className="font-bold text-xs text-gray-800">{curso.nome_curso}</p>
                            </div>
                            <p className="text-[10px] text-gray-500">Equipe: <strong className="text-gray-700">{curso.equipe_responsavel}</strong></p>
                          </div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={curso.equipe_responsavel.includes('Geral') || curso.id === 'CAP-015'}
                              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span>Obrigatória</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: GESTÃO DE CATÁLOGO */}
                {adminSubView === 'gestao' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">Catálogo Oficial de Treinamentos</h4>
                        <p className="text-xs text-gray-500">
                          {catalogoCursos.length} cursos cadastrados no banco de dados.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportarRelatorioPresencas}
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Exportar dados de presença e eventos para CSV"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>Exportar CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalNovoCursoAberto(true)}
                          className="px-3 py-2 bg-primary text-white hover:bg-blue-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Novo Curso</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                      <input
                        type="text"
                        value={filtroPesquisaCatalogo}
                        onChange={(e) => setFiltroPesquisaCatalogo(e.target.value)}
                        placeholder="Pesquisar curso no catálogo por nome ou equipe..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {catalogoCursos
                        .filter((c) => {
                          if (!filtroPesquisaCatalogo.trim()) return true
                          const t = filtroPesquisaCatalogo.toLowerCase()
                          return c.nome_curso.toLowerCase().includes(t) || c.equipe_responsavel.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)
                        })
                        .map((c) => (
                          <div key={c.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-200 transition-colors">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-primary font-black bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  {c.id}
                                </span>
                                <p className="font-bold text-xs text-gray-800">{c.nome_curso}</p>
                              </div>
                              <p className="text-[10px] text-gray-500">
                                Responsável: <strong className="text-gray-700">{c.equipe_responsavel}</strong>
                              </p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              {c.status_curso || 'Ativo'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: RECRUTAMENTO & SELEÇÃO */}
                {adminSubView === 'recrutamento' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                        <p className="text-lg font-extrabold text-purple-900 leading-none">12</p>
                        <p className="text-[10px] text-purple-700 font-bold uppercase mt-0.5">Total Trainees</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                        <p className="text-lg font-extrabold text-indigo-900 leading-none">2</p>
                        <p className="text-[10px] text-indigo-700 font-bold uppercase mt-0.5">Grupos PSE</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                        <p className="text-lg font-extrabold text-amber-900 leading-none">2</p>
                        <p className="text-[10px] text-amber-700 font-bold uppercase mt-0.5">Líderes Trainees</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                        <p className="text-lg font-extrabold text-emerald-900 leading-none">12</p>
                        <p className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5">Ativos</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <p className="font-bold">Follow-Up Trainee Semanal</p>
                      <p className="text-[11px] text-amber-800">
                        Acompanhamento dos relatórios semanais de desempenho dos grupos enviados pelos Líderes e Assessores de RH.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 5: PERFIL (view-perfil) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'perfil' && (
          <div id="view-perfil" className="text-center text-gray-800 w-full relative z-10 space-y-6 pb-6">
            {/* 1. CABEÇALHO DO PERFIL (INDEX.HTML) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 relative overflow-hidden text-center">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-500/10 via-primary/15 to-indigo-500/10"></div>

              {/* Avatar */}
              <div className="relative pt-2">
                <div className="w-24 h-24 bg-white rounded-full mx-auto p-1.5 shadow-md border-2 border-primary/20 relative z-10 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-tr from-primary/10 via-blue-50 to-indigo-100 rounded-full flex items-center justify-center text-primary font-black text-3xl">
                    {usuario.nome.charAt(0)}
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="mt-4 relative z-10">
                <h2 className="font-headline font-extrabold text-2xl text-gray-900 tracking-tight">
                  {usuario.nome}
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  ID: {usuario.matricula || 'N/A'} • {usuario.cargos.join(', ') || 'Membro'}
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-3 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setModalSenhaAberto(true)
                    setFeedbackSenha(null)
                    setNovaSenha('')
                    setConfirmarSenha('')
                  }}
                  className="flex-1 max-w-[160px] py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-gray-500">lock_reset</span>
                  <span>Alterar Senha</span>
                </button>
                <form action={logoutAction} className="flex-1 max-w-[160px]">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-red-500">logout</span>
                    <span>Sair do App</span>
                  </button>
                </form>
              </div>
            </div>

            {/* HUB DE CARTÕES DO PERFIL (INDEX.HTML) */}
            {perfilSubView === 'hub' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div
                  onClick={() => setPerfilSubView('pch')}
                  className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-4 text-center items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-3xl">schedule</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-gray-900 text-sm">Plano de Carga Horária</h3>
                    <p className="text-[11px] text-gray-400 mt-1">Sua disponibilidade semanal</p>
                  </div>
                </div>

                <div
                  onClick={() => setPerfilSubView('cargos')}
                  className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-4 text-center items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-3xl">badge</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-gray-900 text-sm">Cargos & Movimentação</h3>
                    <p className="text-[11px] text-gray-400 mt-1">Equipes e funções atribuídas</p>
                  </div>
                </div>

                <div
                  onClick={() => setPerfilSubView('cadastrais')}
                  className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-4 text-center items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-3xl">contact_mail</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-gray-900 text-sm">Dados Cadastrais</h3>
                    <p className="text-[11px] text-gray-400 mt-1">Infos e contato na instituição</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBVIEWS DO PERFIL */}
            {perfilSubView !== 'hub' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPerfilSubView('hub')}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h3 className="font-headline font-bold text-gray-900 text-base">
                      {perfilSubView === 'pch' && 'Plano de Carga Horária (PCH)'}
                      {perfilSubView === 'cargos' && 'Cargos & Movimentação'}
                      {perfilSubView === 'cadastrais' && 'Dados Cadastrais'}
                    </h3>
                  </div>
                </div>

                {/* SUBVIEW: PCH */}
                {perfilSubView === 'pch' && (
                  <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-4">
                    {/* Header PCH */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Sua Disponibilidade Semanal
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              ultimaAtualizacaoPCH
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ultimaAtualizacaoPCH
                              ? `Atualizado: ${new Date(ultimaAtualizacaoPCH).toLocaleDateString('pt-BR')}`
                              : 'Pendente de preenchimento'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {modoEdicaoPCH
                            ? 'Clique nos horários para alternar entre Livre (Verde) e Ocupado (Vermelho).'
                            : 'Visualize seus horários cadastrados. Clique em "Editar PCH" para alterar.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {modoEdicaoPCH && (
                          <button
                            type="button"
                            onClick={() => {
                              setModoEdicaoPCH(false)
                              setFeedbackPCH(null)
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isSalvandoPCH}
                          onClick={() => {
                            if (modoEdicaoPCH) {
                              handleSalvarPCH()
                            } else {
                              setModoEdicaoPCH(true)
                              setFeedbackPCH(null)
                            }
                          }}
                          className={`px-3.5 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                            modoEdicaoPCH
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-primary hover:bg-blue-700 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isSalvandoPCH ? 'sync' : modoEdicaoPCH ? 'save' : 'edit'}
                          </span>
                          <span>
                            {isSalvandoPCH ? 'Salvando...' : modoEdicaoPCH ? 'Salvar PCH' : 'Editar PCH'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback Toast */}
                    {feedbackPCH && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-1.5 ${
                          feedbackPCH.tipo === 'ok'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {feedbackPCH.tipo === 'ok' ? 'check_circle' : 'error'}
                        </span>
                        <span>{feedbackPCH.msg}</span>
                      </div>
                    )}

                    {/* Visibilidade do PCH */}
                    {modoEdicaoPCH && (
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gray-700 font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-primary">visibility</span>
                          Visibilidade da sua grade:
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer font-medium text-gray-700">
                            <input
                              type="radio"
                              name="visibilidadePch"
                              checked={visibilidadePCH === 'todos'}
                              onChange={() => setVisibilidadePCH('todos')}
                              className="accent-primary"
                            />
                            <span>Toda a equipe</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer font-medium text-gray-700">
                            <input
                              type="radio"
                              name="visibilidadePch"
                              checked={visibilidadePCH === 'lider'}
                              onChange={() => setVisibilidadePCH('lider')}
                              className="accent-primary"
                            />
                            <span>Apenas Liderança / GP</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 7 DIAS */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {(
                        [
                          { key: 'seg', label: 'Segunda', short: 'SEG' },
                          { key: 'ter', label: 'Terça', short: 'TER' },
                          { key: 'qua', label: 'Quarta', short: 'QUA' },
                          { key: 'qui', label: 'Quinta', short: 'QUI' },
                          { key: 'sex', label: 'Sexta', short: 'SEX' },
                          { key: 'sab', label: 'Sábado', short: 'SÁB' },
                          { key: 'dom', label: 'Domingo', short: 'DOM' },
                        ] as const
                      ).map((d) => {
                        const livresNoDia = Object.values(gradePCH[d.key] || {}).filter(
                          (s) => s.presencial || s.online
                        ).length
                        const ocupadosNoDia = slotsHorarios.length - livresNoDia

                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => setDiaPCH(d.key)}
                            className={`flex-1 min-w-[55px] py-2 px-1 text-xs font-bold rounded-2xl transition-all border text-center cursor-pointer ${
                              diaPCH === d.key
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span className="block text-[11px] font-black">{d.short}</span>
                            <span className="block text-[9px] opacity-80 mt-0.5">
                              {livresNoDia}L / {ocupadosNoDia}O
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Atalhos rápidos no modo de edição */}
                    {modoEdicaoPCH && (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                        <span className="font-bold text-gray-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">bolt</span>
                          Preenchimento Rápido ({diaPCH.toUpperCase()}):
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => aplicarLoteDia(diaPCH, 'presencial')}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 font-bold border border-blue-200 rounded-lg cursor-pointer"
                          >
                            🏢 Tudo Presencial
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarLoteDia(diaPCH, 'online')}
                            className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg cursor-pointer"
                          >
                            💻 Tudo Online
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarLoteDia(diaPCH, 'ambos')}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg cursor-pointer"
                          >
                            ⚡ Ambos
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarLoteDia(diaPCH, 'ocupado')}
                            className="px-2 py-1 bg-white hover:bg-red-50 text-red-700 font-bold border border-red-200 rounded-lg cursor-pointer"
                          >
                            🚫 Tudo Ocupado
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Grade de Slots com Modalidades Online / Presencial */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {slotsHorarios.map((slot) => {
                        const slotConfig = gradePCH[diaPCH]?.[slot]
                        const isLivre = Boolean(slotConfig && (slotConfig.presencial || slotConfig.online))
                        const isPresencial = Boolean(slotConfig?.presencial)
                        const isOnline = Boolean(slotConfig?.online)

                        return (
                          <div
                            key={slot}
                            className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isLivre
                                ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {/* Linha Superior: Horário e Status Principal */}
                            <div className="flex items-center justify-between">
                              <span className="font-headline font-bold text-xs text-gray-800 tracking-tight flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-gray-400">schedule</span>
                                {slot}
                              </span>

                              {/* Botão de Toggle Livre / Ocupado */}
                              <button
                                type="button"
                                disabled={!modoEdicaoPCH}
                                onClick={() => toggleSlotLivre(diaPCH, slot)}
                                className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                                  !modoEdicaoPCH
                                    ? isLivre
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-700'
                                    : isLivre
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
                                    : 'bg-red-100 hover:bg-red-200 text-red-700 active:scale-95'
                                }`}
                              >
                                {isLivre ? '✓ Livre' : '✕ Ocupado'}
                              </button>
                            </div>

                            {/* Linha Inferior: Opções de Modalidade (Online / Presencial) */}
                            {isLivre ? (
                              <div className="space-y-1.5 pt-1.5 border-t border-emerald-100">
                                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                                  <span>Modalidades:</span>
                                  {isPresencial && isOnline && (
                                    <span className="text-emerald-700 font-extrabold lowercase text-[9px] bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                      ambos
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {/* Chip Presencial */}
                                  <button
                                    type="button"
                                    disabled={!modoEdicaoPCH}
                                    onClick={(e) => toggleModalidadeSlot(diaPCH, slot, 'presencial', e)}
                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                                      isPresencial
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                                    } ${modoEdicaoPCH ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {isPresencial ? 'check_circle' : 'apartment'}
                                    </span>
                                    <span>Presencial</span>
                                  </button>

                                  {/* Chip Online */}
                                  <button
                                    type="button"
                                    disabled={!modoEdicaoPCH}
                                    onClick={(e) => toggleModalidadeSlot(diaPCH, slot, 'online', e)}
                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                                      isOnline
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                                    } ${modoEdicaoPCH ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {isOnline ? 'check_circle' : 'devices'}
                                    </span>
                                    <span>Online</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1 text-[11px] text-gray-400 italic flex items-center justify-between">
                                <span>Indisponível neste horário</span>
                                {modoEdicaoPCH && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSlotLivre(diaPCH, slot)}
                                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer not-italic"
                                  >
                                    Liberar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: CARGOS & MOVIMENTAÇÃO (SISTEMA DE SLOTS) */}
                {perfilSubView === 'cargos' && (
                  <SecaoCargosSlots cargosIniciaisUsuario={usuario.cargos || []} />
                )}

                {/* SUBVIEW: DADOS CADASTRAIS (DIVIDIDO EM 3 ETAPAS) */}
                {perfilSubView === 'cadastrais' && (
                  <div className="space-y-4">
                    {/* Header Dados Cadastrais (Referência PCH) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Seus Dados Cadastrais
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              dadosCadastrais?.atualizado_em
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {dadosCadastrais?.atualizado_em
                              ? `Atualizado: ${new Date(dadosCadastrais.atualizado_em).toLocaleDateString('pt-BR')}`
                              : 'Pendente de revisão'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {modoEdicaoCadastral
                            ? 'Edite suas informações nas 3 etapas abaixo e clique em "Salvar Dados".'
                            : 'Visualize seus dados cadastrais. Clique em "Atualizar Meus Dados" para alterar.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!modoEdicaoCadastral && (
                          <button
                            type="button"
                            onClick={() => {
                              startTransition(async () => {
                                const res = await confirmarDadosSemAlteracaoAction()
                                if (res.success) {
                                  setFeedbackCadastral({ tipo: 'sucesso', texto: res.mensagem || 'Cadastro confirmado!' })
                                  setDadosCadastrais((prev: any) => ({
                                    ...(prev || {}),
                                    atualizado_em: new Date().toISOString(),
                                  }))
                                  setTimeout(() => setFeedbackCadastral(null), 3000)
                                } else {
                                  setFeedbackCadastral({ tipo: 'erro', texto: res.error || 'Erro ao confirmar.' })
                                }
                              })
                            }}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                            <span>Confirmar sem alterar</span>
                          </button>
                        )}

                        {modoEdicaoCadastral && (
                          <button
                            type="button"
                            onClick={() => {
                              setModoEdicaoCadastral(false)
                              setFeedbackCadastral(null)
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isSalvandoCadastral}
                          onClick={() => {
                            if (modoEdicaoCadastral) {
                              formCadastralRef.current?.salvar()
                            } else {
                              setModoEdicaoCadastral(true)
                              setFeedbackCadastral(null)
                            }
                          }}
                          className={`px-3.5 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                            modoEdicaoCadastral
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-primary hover:bg-blue-700 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isSalvandoCadastral ? 'sync' : modoEdicaoCadastral ? 'save' : 'edit'}
                          </span>
                          <span>
                            {isSalvandoCadastral
                              ? 'Salvando...'
                              : modoEdicaoCadastral
                              ? 'Salvar Dados'
                              : 'Atualizar Meus Dados'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* FEEDBACK DE AÇÃO */}
                    {feedbackCadastral && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                          feedbackCadastral.tipo === 'sucesso'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {feedbackCadastral.tipo === 'sucesso' ? 'check_circle' : 'error'}
                        </span>
                        <span>{feedbackCadastral.texto}</span>
                      </div>
                    )}

                    {modoEdicaoCadastral ? (
                      <FormAtualizacaoCadastralInline
                        ref={formCadastralRef}
                        usuario={usuario}
                        dadosIniciais={dadosCadastrais}
                        onPendingChange={setIsSalvandoCadastral}
                        onCancelar={() => {
                          setModoEdicaoCadastral(false)
                          setFeedbackCadastral(null)
                        }}
                        onSalvoComSucesso={(novosDados) => {
                          setDadosCadastrais(novosDados)
                          setModoEdicaoCadastral(false)
                          setFeedbackCadastral({
                            tipo: 'sucesso',
                            texto: 'Dados cadastrais atualizados com sucesso!',
                          })
                          setTimeout(() => setFeedbackCadastral(null), 3000)
                        }}
                      />
                    ) : (
                      <>
                        {/* 1. CARD ETAPA 1: IDENTIFICAÇÃO CIVIL & CONTATO */}
                    <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                          <span className="material-symbols-outlined text-base">person</span>
                          <span>1. Identificação Civil & Contato</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Etapa 1 de 3</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Nome Civil</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.nome_civil || usuario.nome}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Apelido</span>
                          <span className="font-bold text-blue-700">
                            {dadosCadastrais?.apelido || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Nome Social</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.nome_social || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Data de Nascimento</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.data_nascimento
                              ? new Date(dadosCadastrais.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR')
                              : 'Não informada'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">CPF</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {dadosCadastrais?.cpf || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Celular / WhatsApp</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.celular || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Telefone Residencial</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.telefone_fixo || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">E-mail de Contato</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.email_contato || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Étnico-Racial</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.etnia || 'Não informado'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">PCD (Deficiência)</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.pcd || 'Não possui'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Neurodivergência</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.neuroatipicidade || 'Não possui'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. CARD ETAPA 2: SAÚDE & EMERGÊNCIA */}
                    <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                          <span className="material-symbols-outlined text-base">medical_services</span>
                          <span>2. Saúde & Emergência</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Etapa 2 de 3</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 flex items-center justify-between">
                          <div>
                            <span className="text-red-700 text-[10px] font-bold uppercase block">Tipo Sanguíneo</span>
                            <span className="font-extrabold text-base text-red-900">
                              {dadosCadastrais?.tipo_sanguineo || 'Não informado'}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-2xl text-red-300">bloodtype</span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Plano de Saúde</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.plano_saude || 'Não possui'}
                          </span>
                        </div>

                        {/* Contato de emergência com destaque */}
                        <div className="p-3.5 bg-red-50/50 rounded-2xl border border-red-200/80 col-span-full space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-red-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">phone_in_talk</span> Contato de Emergência
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-gray-400 text-[9px] uppercase font-bold block">Nome</span>
                              <span className="font-bold text-gray-800">
                                {dadosCadastrais?.emergencia_nome || 'Não informado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[9px] uppercase font-bold block">Parentesco</span>
                              <span className="font-semibold text-gray-700">
                                {dadosCadastrais?.emergencia_parentesco || 'Não informado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[9px] uppercase font-bold block">Telefone</span>
                              <span className="font-bold text-red-700 font-mono">
                                {dadosCadastrais?.emergencia_telefone || 'Não informado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Alergia a Medicamento</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.alergia_medicamento || 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Alergia a Alimento</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.alergia_alimento || 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Outras Alergias</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.alergia_outras || 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Tratamento Contínuo</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.tratamento_continuo || 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Medicamento Contínuo</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.medicamento_continuo || 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Glicose ou Pressão</span>
                          <span className="font-semibold text-gray-700">
                            {dadosCadastrais?.glicose_pressao || 'Não possui'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. CARD ETAPA 3: VÍNCULO ACADÊMICO & IEEE */}
                    <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                          <span className="material-symbols-outlined text-base">school</span>
                          <span>3. Vínculo Acadêmico (CEFET-RJ) & IEEE</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Etapa 3 de 3</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                          <span className="text-blue-700 text-[10px] font-bold uppercase block">Matrícula CEFET-RJ</span>
                          <span className="font-extrabold text-blue-900 font-mono">
                            {usuario.matricula || 'N/A'}
                          </span>
                        </div>

                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 sm:col-span-2">
                          <span className="text-indigo-700 text-[10px] font-bold uppercase block">
                            Curso no CEFET-RJ (Auto-detectado)
                          </span>
                          <span className="font-extrabold text-indigo-900">
                            {dadosCadastrais?.curso || detectarCursoDaMatricula(usuario.matricula) || 'Não informado'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Período Atual</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.periodo || sugerirPeriodoDaMatricula(usuario.matricula)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">
                            E-mail Institucional (@aluno.cefet-rj.br)
                          </span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.email_institucional || 'Não cadastrado'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Tempo de Ramo</span>
                          <span className="font-bold text-gray-800">
                            {dadosCadastrais?.tempo_ramo || 'Não informado'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Membresia Internacional</span>
                          <span className={`font-bold ${dadosCadastrais?.membresia_ieee ? 'text-indigo-700' : 'text-gray-600'}`}>
                            {dadosCadastrais?.membresia_ieee ? 'Sim (Membro Ativo)' : 'Não possui'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block">Nº de Membro IEEE</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {dadosCadastrais?.numero_membro_ieee || 'N/A'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 col-span-full">
                          <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">
                            Capítulos & Sociedades Associadas
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {dadosCadastrais?.capitulos_ieee && dadosCadastrais.capitulos_ieee !== 'Nenhum' ? (
                              dadosCadastrais.capitulos_ieee.split(',').map((cap: string) => (
                                <span
                                  key={cap}
                                  className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[10px]"
                                >
                                  {cap.trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 font-medium">Nenhum capítulo informado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. BARRA DE NAVEGAÇÃO INFERIOR FIXADA (MAIN-NAV - INDEX.HTML) */}
      {/* ========================================================================= */}
      <nav
        id="main-nav"
        className="bg-white border-t border-gray-100 p-2 fixed bottom-0 w-full flex justify-around shadow-lg z-50"
      >
        <button
          type="button"
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendario' ? 'text-primary bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          <span className="text-[10px] mt-0.5">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disponibilidade')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'disponibilidade' ? 'text-primary bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
          <span className="text-[10px] mt-0.5">Mapa Calor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'equipe' ? 'text-primary bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">groups</span>
          <span className="text-[10px] mt-0.5">Equipe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'admin' ? 'text-primary bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          <span className="text-[10px] mt-0.5">Admin</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('perfil')
            setPerfilSubView('hub')
          }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'perfil' ? 'text-primary bg-blue-50 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 5. MODAL DE CONTROLE DA SALA (EXATO DO INDEX.HTML + WIRED TO SUPABASE) */}
      {/* ========================================================================= */}
      {modalSalaAberto && (
        <div
          id="modal-sala"
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 z-[9999]"
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left"
            style={{ maxHeight: '85vh' }}
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-xl font-headline font-bold text-gray-800">Controle da Sala</h3>
              <button
                type="button"
                onClick={() => setModalSalaAberto(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {/* STATUS ATUAL */}
              <div id="sala-estado-atual" className="text-center py-2">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-3 shadow-inner ${
                    statusSala.aberta ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl">
                    {statusSala.aberta ? 'meeting_room' : 'door_front'}
                  </span>
                </div>
                <h4
                  className={`text-2xl font-headline font-bold ${
                    statusSala.aberta ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {statusSala.aberta ? 'SALA ABERTA' : 'SALA FECHADA'}
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Responsável Atual:{' '}
                  <strong className="text-gray-800 font-bold">{statusSala.ultimoResponsavel}</strong>
                </p>
                {statusSala.dataHora && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Atualizado em: {new Date(statusSala.dataHora).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              {/* FEEDBACK DE AÇÃO */}
              {feedbackSala && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold text-center ${
                    feedbackSala.tipo === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedbackSala.msg}
                </div>
              )}

              {/* AÇÕES DE GESTÃO DA SALA (INDEX.HTML COMPLETO) */}
              {podeGerenciarSalaEfetivo ? (
                <div className="pt-2 border-t border-gray-100">
                  {/* QUANDO A SALA ESTÁ FECHADA */}
                  {!statusSala.aberta && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                          Observação / Atividade (Opcional):
                        </label>
                        <input
                          type="text"
                          value={observacaoSala}
                          onChange={(e) => setObservacaoSala(e.target.value)}
                          placeholder="Ex: Reunião do WolfBotz ou Estudo em grupo"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleSala('Aberta', observacaoSala || 'Abriu a sala')}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">lock_open</span>
                        <span>{isPending ? 'Abrindo...' : 'Abrir Sala'}</span>
                      </button>
                    </div>
                  )}

                  {/* QUANDO A SALA ESTÁ ABERTA: 1. AÇÕES INICIAIS */}
                  {statusSala.aberta && modoAcaoSala === 'inicial' && (
                    <div className="flex flex-col gap-2.5">
                      {/* OPÇÃO 1: TOMAR A SALA ("Eu assumo a sala" se outro membro for o titular) */}
                      {statusSala.ultimoResponsavelId !== usuario.id && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleToggleSala(
                              'Aberta',
                              `Assumiu a responsabilidade da sala (estava com ${statusSala.ultimoResponsavel})`,
                              usuario.id
                            )
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-base">person_add</span>
                          <span>{isPending ? 'Gravando...' : 'Eu assumo a sala'}</span>
                        </button>
                      )}

                      {/* OPÇÃO 2: PASSAR SALA (se o usuário for o titular ou Presidente/Admin) */}
                      {(statusSala.ultimoResponsavelId === usuario.id ||
                        usuario.cargos.includes('Presidente') ||
                        papelSimulado === 'Admin') && (
                        <button
                          type="button"
                          onClick={() => {
                            setModoAcaoSala('passar_busca')
                            setTermoBuscaPassar('')
                          }}
                          className="w-full bg-blue-50 border border-blue-200 text-primary hover:bg-blue-100 font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">swap_horiz</span>
                          <span>Passar Sala</span>
                        </button>
                      )}

                      {/* OPÇÃO 3: FECHAR SALA (Dispara o Checklist Obrigatório) */}
                      <button
                        type="button"
                        onClick={() => {
                          setModoAcaoSala('checklist_fechar')
                          setChecklistFechamento({ ar: false, luzes: false, computadores: false })
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">lock</span>
                        <span>Fechar Sala</span>
                      </button>
                    </div>
                  )}

                  {/* QUANDO A SALA ESTÁ ABERTA: 2. CHECKLIST OBRIGATÓRIO DE FECHAMENTO */}
                  {statusSala.aberta && modoAcaoSala === 'checklist_fechar' && (
                    <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-4">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">checklist</span>
                        <span>Verifique antes de trancar:</span>
                      </p>

                      <div className="space-y-2 text-xs text-gray-700 font-medium">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={checklistFechamento.ar}
                            onChange={(e) =>
                              setChecklistFechamento((prev) => ({ ...prev, ar: e.target.checked }))
                            }
                            className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                          />
                          <span className="font-semibold text-gray-800">Ar condicionado desligado</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={checklistFechamento.luzes}
                            onChange={(e) =>
                              setChecklistFechamento((prev) => ({ ...prev, luzes: e.target.checked }))
                            }
                            className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                          />
                          <span className="font-semibold text-gray-800">Luzes apagadas</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={checklistFechamento.computadores}
                            onChange={(e) =>
                              setChecklistFechamento((prev) => ({
                                ...prev,
                                computadores: e.target.checked,
                              }))
                            }
                            className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                          />
                          <span className="font-semibold text-gray-800">
                            Computadores e Equip. desligados
                          </span>
                        </label>
                      </div>

                      {/* Botão de trancar só habilita com os 3 checks */}
                      {checklistFechamento.ar &&
                      checklistFechamento.luzes &&
                      checklistFechamento.computadores ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleToggleSala(
                              'Fechada',
                              'Trancou a sala (Checklist verificado: ar condicionado desligado, luzes apagadas, equipamentos desligados)'
                            )
                          }
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">lock</span>
                          <span>{isPending ? 'Trancando...' : 'Trancar Sala Definitivamente'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full bg-gray-300 text-gray-500 font-bold py-4 rounded-xl transition-all shadow-2xs cursor-not-allowed text-xs"
                        >
                          Preencha o checklist acima
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setModoAcaoSala('inicial')}
                        className="w-full text-gray-500 hover:text-gray-700 font-bold py-2 text-xs transition-colors cursor-pointer"
                      >
                        Voltar
                      </button>
                    </div>
                  )}

                  {/* QUANDO A SALA ESTÁ ABERTA: 3. BUSCA DE LÍDER PARA PASSAR A SALA */}
                  {statusSala.aberta && modoAcaoSala === 'passar_busca' && (
                    <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-3">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Buscar Líder para Transferência:
                      </p>

                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base">
                          search
                        </span>
                        <input
                          type="text"
                          value={termoBuscaPassar}
                          onChange={(e) => setTermoBuscaPassar(e.target.value)}
                          placeholder="Digite o nome do líder..."
                          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                        />
                      </div>

                      {/* LISTA SUSPENSA DE LÍDERES */}
                      <div className="bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto shadow-sm custom-scrollbar divide-y divide-gray-50">
                        {listaMembrosParaTransferencia.filter((m) =>
                          m.nome.toLowerCase().includes(termoBuscaPassar.toLowerCase())
                        ).length > 0 ? (
                          listaMembrosParaTransferencia
                            .filter((m) =>
                              m.nome.toLowerCase().includes(termoBuscaPassar.toLowerCase())
                            )
                            .map((membro) => (
                              <div
                                key={membro.id}
                                onClick={() => {
                                  setMembroTransferencia(membro)
                                  setModoAcaoSala('passar_confirmar')
                                }}
                                className="p-3 text-xs cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-bold text-gray-800">{membro.nome}</p>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                                    {membro.cargo} • ID: {membro.matricula}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-primary text-base">
                                  chevron_right
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="p-4 text-xs text-gray-400 text-center font-medium">
                            Nenhum líder encontrado com esse nome.
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setModoAcaoSala('inicial')}
                        className="w-full text-gray-500 hover:text-gray-700 font-bold py-2 text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* QUANDO A SALA ESTÁ ABERTA: 4. CRACHÁ DE CONFIRMAÇÃO DE TRANSFERÊNCIA */}
                  {statusSala.aberta && modoAcaoSala === 'passar_confirmar' && membroTransferencia && (
                    <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">
                        Confirme a transferência:
                      </p>

                      <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center gap-3">
                        <div className="bg-blue-100 text-primary p-2.5 rounded-full flex items-center justify-center h-11 w-11 shrink-0">
                          <span className="material-symbols-outlined text-xl">person_check</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold leading-tight">
                            {membroTransferencia.cargo}
                          </p>
                          <p className="font-bold text-gray-800 text-sm mt-0.5">
                            {membroTransferencia.nome}
                          </p>
                          <p className="text-[10px] text-gray-400">ID: {membroTransferencia.matricula}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleToggleSala(
                            'Aberta',
                            `Recebeu a responsabilidade de ${usuario.nome}`,
                            membroTransferencia.id
                          )
                        }
                        className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-md text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        <span>{isPending ? 'Transferindo...' : 'Confirmar Transferência'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoAcaoSala('passar_busca')}
                        className="w-full text-gray-600 font-bold py-2.5 text-xs border border-gray-200 rounded-xl bg-white hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Escolher outra pessoa
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoAcaoSala('inicial')}
                        className="w-full text-gray-400 hover:text-gray-600 font-bold py-1 text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-1.5 shadow-xs">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <p className="text-xs font-bold text-amber-900">Acesso Restrito: Apenas Visualização</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    {simuladorAtivo
                      ? `Modo Simulador (${papelSimulado}): este perfil possui apenas visualização do status da sala.`
                      : `Seu cargo cadastrado (${usuario.cargos?.[0] || usuario.tipo_membro}) possui permissão apenas de visualização. Apenas membros em cargos de liderança ou diretoria podem abrir, fechar ou receber a sala.`}
                  </p>
                </div>
              )}

              {/* HISTÓRICO RECENTE */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider">Histórico Recente</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {historicoSala && historicoSala.length > 0 ? (
                    historicoSala.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            {Array.isArray(log.usuarios) ? log.usuarios[0]?.nome : log.usuarios?.nome || 'Membro'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(log.data_hora).toLocaleString('pt-BR')}
                            {log.observacao && ` • ${log.observacao}`}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            log.status === 'Aberta' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">Nenhum registro encontrado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DO MANUAL DO USUÁRIO (INDEX.HTML) */}
      {/* ========================================================================= */}
      {modalManualAberto && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-headline font-bold text-xl text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">menu_book</span> Manual do Portal IEEE
              </h2>
              <button
                type="button"
                onClick={() => setModalManualAberto(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-xs text-gray-600 leading-relaxed space-y-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">1. Controle de Sala</h4>
                <p>
                  O status da sala do Ramo IEEE é exibido em tempo real no cabeçalho. Membros autorizados (Diretoria, Líderes e Assessores designados) podem abrir ou fechar a sala clicando no badge.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">2. Agenda & Capacitações</h4>
                <p>
                  Acompanhe os treinamentos obrigatórios do Processo Trainee e as reuniões gerais. Use o filtro de contexto para alternar entre atividades do PSE e do Ramo Estudantil.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">3. Plano de Carga Horária (PCH)</h4>
                <p>
                  Mantenha sua disponibilidade semanal atualizada na aba Perfil para permitir que coordenadores agendem reuniões em horários livres da sua equipe.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DETALHES DO SLOT (MAPA DE CALOR) */}
      {/* ========================================================================= */}
      {modalSlotAberto && slotSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-bold text-gray-800 text-base">
                  {slotSelecionado.dia} ({slotSelecionado.hora})
                </h4>
                <p className="text-xs text-gray-400">Disponibilidade dos integrantes</p>
              </div>
              <button
                type="button"
                onClick={() => setModalSlotAberto(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Membros Livres
                  </span>
                  <span className="font-extrabold">20</span>
                </p>
                <div className="space-y-1 pl-1 text-gray-600">
                  <p>• Eike Vimieiro (Presidente)</p>
                  <p>• Ana Clara Souza (Diretora GP)</p>
                  <p>• Lucas Medeiros (Capitão WolfBotz)</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">cancel</span> Membros Ocupados
                  </span>
                  <span className="font-extrabold">8</span>
                </p>
                <div className="space-y-1 pl-1 text-gray-600">
                  <p>• Gabriel Rocha (Aulas CEFET)</p>
                  <p>• Juliana Torres (Trabalho)</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalSlotAberto(false)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL FICHA CADASTRAL COMPLETA DO MEMBRO (GESTOR / ADMIN) */}
      {/* ========================================================================= */}
      {modalFichaAberto && membroFicha && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[999] flex items-center justify-center p-3 sm:p-4 text-left animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100">
            {/* CABEÇALHO */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md border border-white/20">
                  {membroFicha.nome.charAt(0)}
                </div>
                <div>
                  <span className="text-[9px] bg-blue-500/30 text-blue-200 font-extrabold uppercase px-2 py-0.5 rounded border border-blue-400/30">
                    Ficha de Membro • GP
                  </span>
                  <h4 className="font-headline font-bold text-base leading-snug mt-0.5">{membroFicha.nome}</h4>
                  <p className="text-[11px] text-blue-200 font-medium">
                    Matrícula: {membroFicha.matricula} • {membroFicha.cargo || 'Membro'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalFichaAberto(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* ABAS DA FICHA DO MEMBRO */}
            <div className="bg-slate-50 border-b border-slate-200/80 p-2 shrink-0 flex items-center justify-around gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAbaFichaMembro('pessoais')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  abaFichaMembro === 'pessoais' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                1. Pessoais
              </button>
              <button
                type="button"
                onClick={() => setAbaFichaMembro('saude')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  abaFichaMembro === 'saude' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                2. Saúde
              </button>
              <button
                type="button"
                onClick={() => setAbaFichaMembro('ieee')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  abaFichaMembro === 'ieee' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                3. Acadêmico / IEEE
              </button>
            </div>

            {/* CORPO DA FICHA */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
              {abaFichaMembro === 'pessoais' && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Nome Civil</span>
                      <span className="font-bold text-gray-800">{membroFicha.nome}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Matrícula</span>
                      <span className="font-mono font-bold text-gray-800">{membroFicha.matricula}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Equipe</span>
                      <span className="font-bold text-gray-800">{membroFicha.equipe || 'Geral'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Status</span>
                      <span className="font-bold text-emerald-600">{membroFicha.status || 'Ativo'}</span>
                    </div>
                    {membroFicha.dados?.apelido && (
                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 col-span-2">
                        <span className="text-blue-700 font-bold text-[10px] uppercase block">Apelido no Ramo</span>
                        <span className="font-bold text-blue-900">{membroFicha.dados.apelido}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {abaFichaMembro === 'saude' && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                      <span className="text-red-700 text-[10px] font-bold uppercase block">Tipo Sanguíneo</span>
                      <span className="font-extrabold text-base text-red-900">
                        {membroFicha.tipo_sanguineo || 'Não informado'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-2xl text-red-300">bloodtype</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-gray-400 font-bold text-[10px] uppercase block">Contato de Emergência</span>
                    <span className="font-bold text-gray-800">
                      {membroFicha.emergencia_nome || 'Não cadastrado'}
                      {membroFicha.emergencia_telefone ? ` • ${membroFicha.emergencia_telefone}` : ''}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-gray-400 font-bold text-[10px] uppercase block">Alergias & Restrições</span>
                    <span className="font-semibold text-gray-700">
                      {membroFicha.alergia_medicamento || 'Nenhuma alergia relatada'}
                    </span>
                  </div>
                </div>
              )}

              {abaFichaMembro === 'ieee' && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-indigo-700 font-bold text-[10px] uppercase block">Curso CEFET-RJ</span>
                    <span className="font-bold text-indigo-900">
                      {detectarCursoDaMatricula(membroFicha.matricula) || 'Não detectado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Período Sugerido</span>
                      <span className="font-bold text-gray-800">
                        {sugerirPeriodoDaMatricula(membroFicha.matricula)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-gray-400 font-bold text-[10px] uppercase block">Membresia IEEE</span>
                      <span className="font-bold text-indigo-600">
                        {membroFicha.membresia_ieee ? 'Membro Pagante' : 'Membro Ramo'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalFichaAberto(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300 cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL DETALHES DO TREINAMENTO / EVENTO (MÓDULO 3) */}
      {/* ========================================================================= */}
      {modalDetalhesAberto && eventoDetalhes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-left">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-blue-50 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {eventoDetalhes.tipo_evento || 'Capacitação'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {eventoDetalhes.modalidade}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">ID: {eventoDetalhes.id}</span>
                </div>
                <h2 className="font-headline font-bold text-xl text-gray-900 leading-tight">
                  {eventoDetalhes.nome_capacitacao}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhesAberto(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Informações Básicas */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-gray-400">calendar_today</span>
                <span className="font-semibold text-gray-900">
                  {eventoDetalhes.data} • {eventoDetalhes.hora_inicio || '--:--'} às {eventoDetalhes.hora_fim || '--:--'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-gray-400">person</span>
                <span>
                  Facilitador(es): <strong className="text-gray-900">{eventoDetalhes.ministrantes || 'A definir'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-gray-400">groups</span>
                <span>
                  Público-Alvo: <strong className="text-gray-900">{eventoDetalhes.publico_alvo}</strong>
                </span>
              </div>
              {eventoDetalhes.local_link && (
                <div className="flex items-start gap-2 pt-1">
                  <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0">pin_drop</span>
                  <div className="flex-1">
                    {eventoDetalhes.local_link.startsWith('http') ? (
                      <a
                        href={eventoDetalhes.local_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline break-all inline-flex items-center gap-1"
                      >
                        <span>Acessar Sala Virtual</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    ) : (
                      <span>{eventoDetalhes.local_link}</span>
                    )}
                  </div>
                </div>
              )}
              {eventoDetalhes.descricao && (
                <div className="pt-2 border-t border-gray-200 text-gray-600 text-[11px] leading-relaxed">
                  <p className="font-bold text-gray-700 uppercase text-[9px] mb-0.5">Pauta / Ementa</p>
                  <p>{eventoDetalhes.descricao}</p>
                </div>
              )}
            </div>

            {/* Ações Especiais de Facilitador / Liderança */}
            {eventoDetalhes.souMinistrante && eventoDetalhes.modalidade !== 'Gravada' && (
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-center space-y-2">
                <p className="text-xs font-bold text-purple-900">Você é o facilitador desta sessão</p>
                <button
                  type="button"
                  onClick={handleAbrirChamada}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">checklist</span>
                  <span>Fazer Chamada da Turma</span>
                </button>
              </div>
            )}

            {eventoDetalhes.podeGerenciar && eventoDetalhes.status !== 'Cancelada' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelarEvento}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  <span>Cancelar Compromisso</span>
                </button>
              </div>
            )}

            {/* MOTOR DE DOUBLE-CHECK: PRESENÇA E AVALIAÇÃO DE DIDÁTICA */}
            <div className="pt-2">
              {eventoDetalhes.Minha_Nota ? (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    Presença Confirmada (Double-Check)
                  </div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Sua Avaliação de Didática</p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-2xl ${
                          i <= (eventoDetalhes.Minha_Nota || 0) ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {eventoDetalhes.Meu_Feedback && (
                    <p className="text-xs italic text-gray-700 mt-1 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                      &ldquo;{eventoDetalhes.Meu_Feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : eventoDetalhes.Minha_Presenca === 'Falta Justificada' ? (
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-center text-xs font-bold text-slate-700 flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-3xl text-slate-500">speaker_notes</span>
                  <span>Falta Justificada Registrada para este evento.</span>
                </div>
              ) : (() => {
                const agora = new Date()
                const dtStr = (eventoDetalhes.data || '').substring(0, 10)
                const ini = new Date(`${dtStr}T${eventoDetalhes.hora_inicio || '00:00'}:00`)
                const fim = new Date(`${dtStr}T${eventoDetalhes.hora_fim || '23:59'}:00`)
                const diffIni = (agora.getTime() - ini.getTime()) / (1000 * 60 * 60)
                const diffFim = (agora.getTime() - fim.getTime()) / (1000 * 60 * 60)

                // 1. Futuro
                if (diffIni < 0 && eventoDetalhes.modalidade !== 'Gravada') {
                  return (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center text-blue-700 space-y-1">
                      <span className="material-symbols-outlined text-2xl">schedule</span>
                      <p className="font-bold text-xs">Aguarde o início do treinamento para registrar sua presença.</p>
                      <p className="text-[11px] text-blue-600">A chamada e avaliação serão liberadas no horário do evento.</p>
                    </div>
                  )
                }

                // 2. Expirado > 24h
                if (diffFim > 24 && eventoDetalhes.modalidade !== 'Gravada') {
                  return (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center text-red-700 space-y-1">
                      <span className="material-symbols-outlined text-2xl">timer_off</span>
                      <p className="font-bold text-xs">O período de 24h para registro ou justificativa expirou.</p>
                      <p className="text-[11px] text-red-600">Falta computada automaticamente.</p>
                    </div>
                  )
                }

                // 3. Janela de Justificativa (1h a 24h pós-evento sem chamada)
                if (diffFim > 1 && diffFim <= 24 && eventoDetalhes.modalidade !== 'Gravada' && eventoDetalhes.Minha_Presenca !== 'Avaliação Pendente') {
                  return (
                    <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 text-center space-y-3">
                      <div className="flex items-center justify-center gap-1.5 text-red-700 font-bold text-xs">
                        <span className="material-symbols-outlined text-base">warning</span>
                        <span>Período de Justificativa de Ausência (24h)</span>
                      </div>
                      <textarea
                        value={justificativaTexto}
                        onChange={(e) => setJustificativaTexto(e.target.value)}
                        placeholder="Descreva o motivo de força maior que impediu sua presença..."
                        className="w-full bg-white border border-red-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-red-400"
                        rows={3}
                      />
                      {feedbackAcaoAgenda && (
                        <p className={`text-xs font-bold ${feedbackAcaoAgenda.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {feedbackAcaoAgenda.msg}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleRegistrarJustificativa}
                        disabled={isSalvandoPresenca}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isSalvandoPresenca ? 'Enviando...' : 'Enviar Justificativa de Falta'}
                      </button>
                    </div>
                  )
                }

                // 4. Janela de Presença Normal & Avaliação (Durante o evento, até 1h após ou aula gravada)
                return (
                  <div className="bg-white p-4 rounded-2xl border border-blue-100 text-center space-y-3 shadow-xs">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-gray-800 uppercase block tracking-wider">
                        Avalie a Didática para Confirmar a Presença
                      </label>
                      <p className="text-[11px] text-gray-500">
                        Seu feedback construtivo é anônimo e ajuda na melhoria dos cursos do Ramo.
                      </p>
                    </div>

                    <div className="flex justify-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((estrela) => (
                        <button
                          key={estrela}
                          type="button"
                          onClick={() => setNotaAvaliacao(estrela)}
                          className="hover:scale-125 transition-transform p-1 cursor-pointer"
                        >
                          <span
                            className={`material-symbols-outlined text-3xl ${
                              estrela <= notaAvaliacao ? 'text-amber-400' : 'text-gray-300'
                            }`}
                          >
                            star
                          </span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={feedbackAvaliacao}
                      onChange={(e) => setFeedbackAvaliacao(e.target.value)}
                      placeholder="O que achou do ritmo, clareza e didática do facilitador? (Obrigatório)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                    />

                    {feedbackAcaoAgenda && (
                      <p className={`text-xs font-bold ${feedbackAcaoAgenda.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {feedbackAcaoAgenda.msg}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleRegistrarPresenca}
                      disabled={isSalvandoPresenca || notaAvaliacao === 0 || !feedbackAvaliacao.trim()}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>{isSalvandoPresenca ? 'Registrando...' : 'Confirmar Presença e Avaliar'}</span>
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL CHAMADA DO MINISTRANTE (MÓDULO 3) */}
      {/* ========================================================================= */}
      {modalChamadaAberto && eventoDetalhes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-left">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-headline font-bold text-lg text-gray-900">Lista de Chamada Oficial</h3>
                <p className="text-xs text-gray-500 truncate max-w-sm">{eventoDetalhes.nome_capacitacao}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalChamadaAberto(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Barra de Busca e Contadores */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                <input
                  type="text"
                  value={buscaChamada}
                  onChange={(e) => setBuscaChamada(e.target.value)}
                  placeholder="Filtrar por nome ou matrícula..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-black text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                  {listaChamada.filter((m) => m.presente).length} / {listaChamada.length} Presentes
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMarcarTodosChamada(true)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => handleMarcarTodosChamada(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                Desmarcar Todos
              </button>
            </div>

            {/* Lista de Alunos */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {isCarregandoChamada ? (
                <p className="text-xs text-gray-400 text-center py-8 animate-pulse">Carregando lista de chamada...</p>
              ) : (
                listaChamada
                  .filter((m) => {
                    if (!buscaChamada.trim()) return true
                    const t = buscaChamada.toLowerCase()
                    return m.nome.toLowerCase().includes(t) || m.matricula.toLowerCase().includes(t)
                  })
                  .map((membro) => (
                    <div
                      key={membro.matricula}
                      onClick={() => handleTogglePresencaChamada(membro.matricula)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        membro.presente
                          ? 'bg-purple-50/70 border-purple-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-gray-900">{membro.nome}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                          <span>{membro.matricula}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            membro.tipo === 'Obrigatório' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {membro.tipo}
                          </span>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={membro.presente}
                        onChange={() => handleTogglePresencaChamada(membro.matricula)}
                        className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>
                  ))
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalChamadaAberto(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSalvarChamada}
                disabled={isSalvandoChamada}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSalvandoChamada ? 'Salvando...' : 'Salvar Chamada Oficial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL NOVA CAPACITAÇÃO / AGENDAMENTO */}
      {/* ========================================================================= */}
      {modalNovaCapAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-left">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-headline font-bold text-xl text-gray-900">Agendar Novo Treinamento / Evento</h2>
                <p className="text-xs text-gray-500">Marque capacitações técnicas, reuniões gerais ou workshops do Ramo.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaCapAberto(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Autocomplete de Curso do Catálogo */}
              <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Vincular Curso do Catálogo (Opcional)
                </label>
                <input
                  type="text"
                  value={buscaCatalogoCurso}
                  onChange={(e) => {
                    setBuscaCatalogoCurso(e.target.value)
                    setDropdownCatalogoAberto(true)
                  }}
                  onFocus={() => setDropdownCatalogoAberto(true)}
                  placeholder="Selecione ou busque no catálogo (ex: SolidWorks, Python, Git...)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                />

                {dropdownCatalogoAberto && catalogoCursos.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-gray-100">
                    {catalogoCursos
                      .filter((c) => !buscaCatalogoCurso.trim() || c.nome_curso.toLowerCase().includes(buscaCatalogoCurso.toLowerCase()))
                      .map((curso) => (
                        <div
                          key={curso.id}
                          onClick={() => {
                            setFormNovoEvento((prev) => ({
                              ...prev,
                              id_curso: curso.id,
                              nome_capacitacao: curso.nome_curso,
                              equipe_responsavel: curso.equipe_responsavel || 'Geral',
                            }))
                            setBuscaCatalogoCurso(curso.nome_curso)
                            setDropdownCatalogoAberto(false)
                          }}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-gray-800">{curso.nome_curso}</span>
                          <span className="text-[10px] font-mono text-gray-400">{curso.id} • {curso.equipe_responsavel}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Título do Evento */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Título do Evento *</label>
                <input
                  type="text"
                  value={formNovoEvento.nome_capacitacao}
                  onChange={(e) => setFormNovoEvento({ ...formNovoEvento, nome_capacitacao: e.target.value })}
                  placeholder="Ex: Treinamento de SolidWorks para Iniciantes"
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Contexto e Tipo de Evento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Contexto</label>
                  <select
                    value={formNovoEvento.contexto}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, contexto: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Processo Trainee (PSE)">Processo Trainee (PSE)</option>
                    <option value="Ramo Estudantil (Capítulos / Equipes)">Ramo Estudantil (Capítulos / Equipes)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tipo de Evento</label>
                  <select
                    value={formNovoEvento.tipo_evento}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, tipo_evento: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Capacitação">Capacitação / Treinamento</option>
                    <option value="Reunião 360">Reunião 360</option>
                    <option value="Reunião Geral">Reunião Geral</option>
                    <option value="Follow Up Líder">Follow Up Líder</option>
                    <option value="Workshop">Workshop / Hackathon</option>
                    <option value="Avaliação / Prova">Avaliação / Prova</option>
                  </select>
                </div>
              </div>

              {/* Data, Horário e Modalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data *</label>
                  <input
                    type="date"
                    value={formNovoEvento.data}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, data: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Horário Início / Fim</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={formNovoEvento.hora_inicio}
                      onChange={(e) => setFormNovoEvento({ ...formNovoEvento, hora_inicio: e.target.value })}
                      placeholder="14:00"
                      className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-medium text-center outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="text"
                      value={formNovoEvento.hora_fim}
                      onChange={(e) => setFormNovoEvento({ ...formNovoEvento, hora_fim: e.target.value })}
                      placeholder="16:00"
                      className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-medium text-center outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Modalidade</label>
                  <select
                    value={formNovoEvento.modalidade}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, modalidade: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Online">Online</option>
                    <option value="Gravada">Gravada</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>
              </div>

              {/* Local ou Link e Facilitadores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Local ou Link da Reunião</label>
                  <input
                    type="text"
                    value={formNovoEvento.local_link}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, local_link: e.target.value })}
                    placeholder="E-213 - Sala do Ramo ou Link Meet/Teams"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Facilitador(es) / Ministrante(s)</label>
                  <input
                    type="text"
                    value={formNovoEvento.ministrantes}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, ministrantes: e.target.value })}
                    placeholder="Nomes dos ministrantes separados por vírgula"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Equipe Responsável e Público Alvo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Equipe Responsável</label>
                  <input
                    type="text"
                    value={formNovoEvento.equipe_responsavel}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, equipe_responsavel: e.target.value })}
                    placeholder="Ex: Projetos, Robótica, CS, Geral"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Público-Alvo</label>
                  <select
                    value={formNovoEvento.publico_alvo}
                    onChange={(e) => setFormNovoEvento({ ...formNovoEvento, publico_alvo: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Todos do Ramo">Todos do Ramo</option>
                    <option value="Apenas Trainees">Apenas Trainees</option>
                    <option value="Apenas Equipe">Apenas Equipe</option>
                    <option value="Apenas Diretoria">Apenas Diretoria</option>
                  </select>
                </div>
              </div>

              {/* Descrição / Pauta */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Descrição / Pauta (Opcional)</label>
                <textarea
                  value={formNovoEvento.descricao}
                  onChange={(e) => setFormNovoEvento({ ...formNovoEvento, descricao: e.target.value })}
                  placeholder="Detalhes sobre o que será abordado, materiais prévios ou pré-requisitos..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalNovaCapAberto(false)}
                  className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarNovoEvento}
                  disabled={isSalvandoEvento}
                  className="flex-1 py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSalvandoEvento ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL NOVO CURSO NO CATÁLOGO (GP) */}
      {/* ========================================================================= */}
      {modalNovoCursoAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-left">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-headline font-bold text-lg text-gray-900">Novo Curso no Catálogo</h3>
              <button
                type="button"
                onClick={() => setModalNovoCursoAberto(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nome do Treinamento *</label>
                <input
                  type="text"
                  value={formNovoCurso.nome_curso}
                  onChange={(e) => setFormNovoCurso({ ...formNovoCurso, nome_curso: e.target.value })}
                  placeholder="Ex: Introdução ao Docker e Containers"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Equipe Responsável</label>
                  <input
                    type="text"
                    value={formNovoCurso.equipe_responsavel}
                    onChange={(e) => setFormNovoCurso({ ...formNovoCurso, equipe_responsavel: e.target.value })}
                    placeholder="Ex: Wolfbyte (CS)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Carga Horária</label>
                  <input
                    type="text"
                    value={formNovoCurso.carga_horaria}
                    onChange={(e) => setFormNovoCurso({ ...formNovoCurso, carga_horaria: e.target.value })}
                    placeholder="Ex: 2h"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Ementa / Descrição</label>
                <textarea
                  value={formNovoCurso.ementa}
                  onChange={(e) => setFormNovoCurso({ ...formNovoCurso, ementa: e.target.value })}
                  placeholder="Resumo dos tópicos abordados no curso..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalNovoCursoAberto(false)}
                  className="flex-1 py-2.5 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarNovoCursoCatalogo}
                  disabled={isSalvandoCurso}
                  className="flex-1 py-2.5 bg-primary text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSalvandoCurso ? 'Salvando...' : 'Salvar no Catálogo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL ALTERAR SENHA */}
      {/* ========================================================================= */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[400] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">lock_reset</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Alterar Senha</h4>
                  <p className="text-[10px] text-gray-400">Atualize sua credencial de acesso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalSenhaAberto(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {feedbackSenha && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  feedbackSenha.tipo === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {feedbackSenha.msg}
              </div>
            )}

            <form onSubmit={handleAlterarSenha} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Nova Senha (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSenhaAberto(false)}
                  className="flex-1 py-2.5 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSalvandoSenha}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isSalvandoSenha ? 'sync' : 'check'}
                  </span>
                  <span>{isSalvandoSenha ? 'Salvando...' : 'Salvar Senha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
