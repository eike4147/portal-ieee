'use client'

import { useState, useTransition } from 'react'
import { toggleSalaAction } from '@/app/sala/actions'
import { logoutAction } from '@/app/actions'

interface UsuarioProps {
  id: string
  nome: string
  matricula: string
  tipo_membro?: string
  cargos: string[]
  podeGerenciarSala: boolean
}

interface StatusSalaProps {
  aberta: boolean
  ultimoResponsavel: string
  dataHora: string | null
}

interface LogSalaProps {
  id: string
  status: string
  data_hora: string
  observacao?: string | null
  usuarios?: any
}

export default function PortalIEEEApp({
  usuario,
  statusSala,
  historicoSala,
}: {
  usuario: UsuarioProps
  statusSala: StatusSalaProps
  historicoSala: LogSalaProps[]
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
  const [slotsOcupadosPCH, setSlotsOcupadosPCH] = useState<Record<string, string[]>>({
    seg: ['08:00 - 08:50', '08:50 - 09:40', '10:00 - 10:50'],
    ter: ['13:30 - 14:20', '14:20 - 15:10'],
    qua: ['08:00 - 08:50', '08:50 - 09:40'],
    qui: ['15:30 - 16:20', '16:20 - 17:10'],
    sex: ['10:00 - 10:50', '11:00 - 11:50'],
    sab: [],
    dom: [],
  })

  // Mock de Capacitações / Agenda para visualização pré-migração
  const capacitacoesMock = [
    {
      id: 1,
      titulo: 'Introdução ao Git e GitHub para Projetos',
      contexto: 'Processo Trainee',
      categoria: 'Capacitação Técnica',
      modalidade: 'Presencial',
      data: '26/10/2026',
      horario: '14:00 - 16:00',
      local: 'Sala do Ramo IEEE (E-204)',
      ministrante: 'Diretoria de Projetos',
      status: 'Confirmada',
      obrigatorio: true,
    },
    {
      id: 2,
      titulo: 'Gestão Ágil e Scrum com Jira',
      contexto: 'Ramo Estudantil',
      categoria: 'Capacitação de Gestão',
      modalidade: 'Online',
      data: '28/10/2026',
      horario: '18:30 - 20:00',
      local: 'Microsoft Teams',
      ministrante: 'Gestão de Pessoas',
      status: 'Inscrições Abertas',
      obrigatorio: false,
    },
    {
      id: 3,
      titulo: 'Reunião Geral de Alinhamento 2026.1',
      contexto: 'Ramo Estudantil',
      categoria: 'Reunião Geral',
      modalidade: 'Presencial',
      data: '31/10/2026',
      horario: '13:00 - 15:00',
      local: 'Auditório 2 - Bloco E',
      ministrante: 'Presidência',
      status: 'Confirmada',
      obrigatorio: true,
    },
  ]

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

  // Função para executar abertura / fechamento da sala
  const handleToggleSala = (novoStatus: 'Aberta' | 'Fechada') => {
    setFeedbackSala(null)
    startTransition(async () => {
      const res = await toggleSalaAction(novoStatus, observacaoSala)
      if (res?.error) {
        setFeedbackSala({ tipo: 'erro', msg: res.error })
      } else {
        setFeedbackSala({
          tipo: 'ok',
          msg: novoStatus === 'Aberta' ? 'Sala aberta com sucesso!' : 'Sala fechada com sucesso!',
        })
        setObservacaoSala('')
      }
    })
  }

  // Função para simular papéis
  const simularPapel = (papel: string) => {
    setPapelSimulado(papel)
    setSimuladorAtivo(true)
  }

  const restaurarSimulador = () => {
    setPapelSimulado('Admin (Real)')
    setSimuladorAtivo(false)
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
              <h2 className="text-2xl font-headline font-bold text-gray-800">Agenda</h2>
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

            {/* FILTROS DA AGENDA (MASTER CALENDAR) */}
            <div className="mb-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-1/3">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Contexto</label>
                <select
                  value={filtroContextoAgenda}
                  onChange={(e) => setFiltroContextoAgenda(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary mt-1"
                >
                  <option value="TODOS">Todos os Contextos</option>
                  <option value="Processo Trainee">Processo Trainee (PSE)</option>
                  <option value="Ramo Estudantil">Ramo Estudantil IEEE</option>
                </select>
              </div>
              <div className="w-full sm:w-1/3">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Modalidade</label>
                <select
                  value={filtroModalidadeAgenda}
                  onChange={(e) => setFiltroModalidadeAgenda(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary mt-1"
                >
                  <option value="TODOS">Qualquer Modalidade</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                  <option value="Gravada">Gravada</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroContextoAgenda('TODOS')
                    setFiltroModalidadeAgenda('TODOS')
                  }}
                  className="h-[38px] px-4 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* MODO LISTA */}
            {modoVisaoAgenda === 'lista' && (
              <div className="space-y-3">
                {capacitacoesMock
                  .filter((c) => {
                    if (filtroContextoAgenda !== 'TODOS' && c.contexto !== filtroContextoAgenda) return false
                    if (filtroModalidadeAgenda !== 'TODOS' && c.modalidade !== filtroModalidadeAgenda) return false
                    return true
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-blue-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100">
                            {item.categoria}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              item.modalidade === 'Presencial'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}
                          >
                            {item.modalidade}
                          </span>
                          {item.obrigatorio && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline font-bold text-base text-gray-900">{item.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium pt-1">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-gray-400">calendar_today</span>
                            {item.data} • {item.horario}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-gray-400">pin_drop</span>
                            {item.local}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          className="flex-1 sm:flex-initial px-4 py-2 bg-blue-50 text-primary hover:bg-blue-100 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Detalhes</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* MODO GRID CALENDÁRIO */}
            {modoVisaoAgenda === 'grid' && (
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs mb-6">
                <div className="flex justify-between items-center mb-4">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider">Outubro 2026</h3>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((d) => (
                    <div key={d} className="text-[10px] font-bold text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => {
                    const temEvento = dia === 26 || dia === 28 || dia === 31
                    return (
                      <div
                        key={dia}
                        className={`p-2 h-14 rounded-xl text-xs font-bold border transition-all flex flex-col justify-between cursor-pointer ${
                          temEvento
                            ? 'bg-blue-50/70 border-blue-200 text-primary shadow-xs'
                            : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-[11px]">{dia}</span>
                        {temEvento && (
                          <span className="w-2 h-2 rounded-full bg-primary self-center"></span>
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
              onClick={() => setModalNovaCapAberto(true)}
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
                        Marque treinamentos obrigatórios para os trainees da sua equipe.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {capacitacoesMock.map((cap) => (
                        <div key={cap.id} className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-gray-800">{cap.titulo}</p>
                            <p className="text-[10px] text-gray-500">{cap.categoria} • {cap.data}</p>
                          </div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input type="checkbox" defaultChecked={cap.obrigatorio} className="rounded text-primary focus:ring-primary w-4 h-4" />
                            <span>Obrigatória</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: GESTÃO DE CATÁLOGO */}
                {adminSubView === 'gestao' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Cursos e capacitações registrados no catálogo oficial.</p>
                    {capacitacoesMock.map((cap) => (
                      <div key={cap.id} className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-gray-800">{cap.titulo}</p>
                          <p className="text-[10px] text-gray-500">Ministrante: {cap.ministrante}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          Ativo
                        </span>
                      </div>
                    ))}
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
                  <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Sua Disponibilidade Semanal
                      </p>
                      <button
                        type="button"
                        onClick={() => setModoEdicaoPCH(!modoEdicaoPCH)}
                        className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>{modoEdicaoPCH ? 'Salvar PCH' : 'Editar PCH'}</span>
                      </button>
                    </div>

                    {/* 7 DIAS */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                      {(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiaPCH(d)}
                          className={`flex-1 min-w-[44px] py-2 px-1 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                            diaPCH === d
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slotsHorarios.map((slot) => {
                        const ocupado = slotsOcupadosPCH[diaPCH]?.includes(slot)
                        return (
                          <div
                            key={slot}
                            onClick={() => {
                              if (!modoEdicaoPCH) return
                              setSlotsOcupadosPCH((prev) => {
                                const list = prev[diaPCH] || []
                                if (list.includes(slot)) {
                                  return { ...prev, [diaPCH]: list.filter((s) => s !== slot) }
                                } else {
                                  return { ...prev, [diaPCH]: [...list, slot] }
                                }
                              })
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                              modoEdicaoPCH ? 'cursor-pointer' : ''
                            } ${
                              ocupado
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <span>{slot}</span>
                            <span className="text-[10px] uppercase font-extrabold">
                              {ocupado ? '❌ Ocupado' : '✓ Livre'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: CARGOS */}
                {perfilSubView === 'cargos' && (
                  <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-4">
                    <h4 className="font-bold text-xs uppercase text-gray-400">Seus Cargos Ativos</h4>
                    <div className="space-y-2">
                      {usuario.cargos.length > 0 ? (
                        usuario.cargos.map((cargo, idx) => (
                          <div key={idx} className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-indigo-700">badge</span>
                              <span className="font-bold text-xs text-indigo-950">{cargo}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                              Ativo
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-gray-50 text-gray-500 text-xs rounded-xl text-center">
                          Nenhum cargo específico atribuído.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBVIEW: DADOS CADASTRAIS */}
                {perfilSubView === 'cadastrais' && (
                  <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-4">
                    <h4 className="font-bold text-xs uppercase text-gray-400">Informações Cadastradas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Nome</span>
                        <span className="font-bold text-gray-800">{usuario.nome}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Matrícula</span>
                        <span className="font-bold text-gray-800">{usuario.matricula || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Instituição</span>
                        <span className="font-bold text-gray-800">CEFET/RJ - Campus Maracanã</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Vínculo IEEE</span>
                        <span className="font-bold text-gray-800">Ramo Estudantil CEFET-RJ</span>
                      </div>
                    </div>
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

              {/* AÇÕES DE GESTÃO DA SALA */}
              {usuario.podeGerenciarSala ? (
                <div className="space-y-3 pt-2 border-t border-gray-100">
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

                  <div className="flex gap-2">
                    {statusSala.aberta ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleSala('Fechada')}
                        className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>{isPending ? 'Fechando...' : 'Fechar Sala'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleSala('Aberta')}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        <span>{isPending ? 'Abrindo...' : 'Abrir Sala'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-500 font-medium">
                  Seu cargo atual possui permissão apenas para visualização do status da sala.
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
      {/* 8. MODAL FICHA CADASTRAL DO MEMBRO (GESTOR / ADMIN) */}
      {/* ========================================================================= */}
      {modalFichaAberto && membroFicha && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[999] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {membroFicha.nome.charAt(0)}
                </div>
                <div>
                  <span className="text-[9px] bg-blue-500/30 text-blue-200 font-extrabold uppercase px-2 py-0.5 rounded">
                    Gestão de Pessoas
                  </span>
                  <h4 className="font-headline font-bold text-base leading-snug mt-0.5">{membroFicha.nome}</h4>
                  <p className="text-[11px] text-blue-200 font-medium">
                    Matrícula: {membroFicha.matricula} • {membroFicha.cargo}
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

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Equipe</span>
                  <span className="font-bold text-gray-800">{membroFicha.equipe}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Status</span>
                  <span className="font-bold text-emerald-600">{membroFicha.status}</span>
                </div>
              </div>
              <p className="text-gray-500">
                Ficha cadastral completa com dados de saúde, emergência e histórico de atuação no Ramo IEEE.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalFichaAberto(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-300 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL NOVA CAPACITAÇÃO / EVENTO */}
      {/* ========================================================================= */}
      {modalNovaCapAberto && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end text-left">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="font-headline font-bold text-xl text-gray-900">Agendar Compromisso / Evento</h2>
              <button
                type="button"
                onClick={() => setModalNovaCapAberto(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Título do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Treinamento de SolidWorks"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Horário</label>
                  <input
                    type="text"
                    placeholder="14:00 - 16:00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaCapAberto(false)}
                  className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Compromisso agendado com sucesso!')
                    setModalNovaCapAberto(false)
                  }}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
