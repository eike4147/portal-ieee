'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MembroParticipante,
  SlotRecomendadoPCH,
  GradePchSemanal,
  calcularSlotsRecomendadosPCH,
} from '@/lib/pch-matching'
import { calcularSlotsQuorumEstrito100 } from '@/lib/pse-demandas'
import { verificarDisponibilidadeSalas, EventoParaChecagemSala } from '@/lib/sala-conflito'

export interface FormularioContextoRamoProps {
  tipoEvento: string
  formNovoEvento: {
    id: string
    id_curso: string
    nome_capacitacao: string
    data: string
    hora_inicio: string
    hora_fim: string
    ministrantes: string
    modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido'
    local_link: string
    equipe_responsavel: string
    tipo_evento: string
    publico_alvo: string
    contexto: string
    descricao: string
  }
  setFormNovoEvento: React.Dispatch<React.SetStateAction<any>>
  usuario: {
    id: string
    matricula: string
    nome: string
    cargos: string[]
    tipo_membro?: string
  }
  todosMembros: MembroParticipante[]
  pchsPorMembro: Record<string, GradePchSemanal>
  catalogoCursos: Array<{
    id: string
    nome_curso: string
    equipe_responsavel: string
  }>
  configSalas: string[]
  eventosExistentes: EventoParaChecagemSala[]
  onAtualizarParticipantes: (participantes: MembroParticipante[]) => void
}

const EQUIPES_PADRAO_RAMO = [
  'Wolfbotz (RAS)',
  'Wolfpower (PES)',
  'Wolfbyte (CS)',
  'Socialwolf (SSIT)',
  'Rocketwolf (AESS)',
  'Fótonwolf (IPS)',
  'Wie',
  'Gestão de Pessoas',
  'Gestão R&S',
  'Gestão de Projetos',
  'Marketing',
  'Financeiro',
  'Presidência',
]

export function FormularioContextoRamo({
  tipoEvento,
  formNovoEvento,
  setFormNovoEvento,
  usuario,
  todosMembros,
  pchsPorMembro,
  catalogoCursos,
  configSalas,
  eventosExistentes,
  onAtualizarParticipantes,
}: FormularioContextoRamoProps) {
  // =========================================================================
  // 1. NORMALIZAÇÃO ROBUSTA DA CATEGORIA (CONTEXTO 2: RAMO ESTUDANTIL)
  // =========================================================================
  const tipoNorm = useMemo(() => {
    return (tipoEvento || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }, [tipoEvento])

  const ehReuniaoEquipe =
    tipoNorm.includes('equipe') &&
    !tipoNorm.includes('diretoria') &&
    !tipoNorm.includes('lideranca')
  const ehReuniaoGeral = tipoNorm.includes('geral') || tipoNorm.includes('assembleia')
  const ehDiretoria = tipoNorm.includes('diretoria') || tipoNorm.includes('lideranca')
  const ehAlinhamento1a1 =
    tipoNorm.includes('1:1') || tipoNorm.includes('1a1') || tipoNorm.includes('alinhamento')
  const ehWorkshop = tipoNorm.includes('workshop') || tipoNorm.includes('hackathon')
  const ehCapacitacaoTecnica =
    tipoNorm.includes('capacita') ||
    (!ehReuniaoEquipe && !ehReuniaoGeral && !ehDiretoria && !ehAlinhamento1a1 && !ehWorkshop)

  // =========================================================================
  // 2. LISTAS DINÂMICAS DE EQUIPES E SUBEQUIPES
  // =========================================================================
  const equipesDisponiveis = useMemo(() => {
    const setEquipes = new Set<string>(EQUIPES_PADRAO_RAMO)
    todosMembros.forEach((m) => {
      if (m.equipe && m.equipe !== 'Geral' && m.equipe.trim().length > 1) {
        setEquipes.add(m.equipe.trim())
      }
    })
    return Array.from(setEquipes).sort()
  }, [todosMembros])

  // =========================================================================
  // 3. ESTADOS ESPECÍFICOS DE CADA CATEGORIA
  // =========================================================================

  // 3.1 Reunião de Equipe / Subequipe
  const [equipeReuniao, setEquipeReuniao] = useState<string>(() => {
    // Tenta sugerir a equipe do próprio usuário logado
    const equipeUsuario = usuario.cargos[0]?.split('•')[1]?.trim() || ''
    if (equipeUsuario && equipesDisponiveis.some((e) => e.toLowerCase().includes(equipeUsuario.toLowerCase()))) {
      return equipesDisponiveis.find((e) => e.toLowerCase().includes(equipeUsuario.toLowerCase())) || equipesDisponiveis[0]
    }
    return equipesDisponiveis[0] || 'Wolfbotz (RAS)'
  })
  const [subequipeReuniao, setSubequipeReuniao] = useState<string>('TODAS')

  // Subequipes detectadas para a equipe selecionada
  const subequipesDisponiveis = useMemo(() => {
    const setSubs = new Set<string>()
    todosMembros
      .filter((m) => {
        const eqM = (m.equipe || '').toLowerCase()
        const eqSel = equipeReuniao.toLowerCase()
        return eqM.includes(eqSel) || eqSel.includes(eqM)
      })
      .forEach((m) => {
        if (m.subequipe && m.subequipe !== 'Geral' && m.subequipe.trim().length > 1) {
          setSubs.add(m.subequipe.trim())
        }
      })
    return Array.from(setSubs).sort()
  }, [todosMembros, equipeReuniao])

  // 3.2 Capacitação Técnica
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState(formNovoEvento.id_curso || '')
  const [buscaCurso, setBuscaCurso] = useState('')
  const [dropdownCursoAberto, setDropdownCursoAberto] = useState(false)
  const [equipeDestinoCapacitacao, setEquipeDestinoCapacitacao] = useState<string>('TODAS')
  const [verListaMembrosCap, setVerListaMembrosCap] = useState(false)

  // 3.3 Alinhamento 1:1
  const [membro1Matricula, setMembro1Matricula] = useState(usuario.matricula || '')
  const [membro2Matricula, setMembro2Matricula] = useState('')
  const [buscaMembro2, setBuscaMembro2] = useState('')
  const [dropdownMembro2Aberto, setDropdownMembro2Aberto] = useState(false)

  // 3.4 Workshop / Hackathon
  const [vagasWorkshop, setVagasWorkshop] = useState(20)

  // =========================================================================
  // 4. RESOLUÇÃO DE PARTICIPANTES POR CATEGORIA
  // =========================================================================

  // 4.1 Membros da Reunião de Equipe
  const membrosReuniaoEquipe = useMemo(() => {
    if (!ehReuniaoEquipe || !equipeReuniao) return []
    const eqSel = equipeReuniao.toLowerCase()
    return todosMembros.filter((m) => {
      const eqM = (m.equipe || '').toLowerCase()
      const matchEquipe = eqM.includes(eqSel) || eqSel.includes(eqM)
      if (!matchEquipe) return false
      if (subequipeReuniao && subequipeReuniao !== 'TODAS') {
        const subM = (m.subequipe || '').toLowerCase()
        const subSel = subequipeReuniao.toLowerCase()
        return subM.includes(subSel) || subSel.includes(subM)
      }
      return true
    })
  }, [ehReuniaoEquipe, equipeReuniao, subequipeReuniao, todosMembros])

  // 4.2 Membros da Capacitação Técnica
  const membrosCapacitacaoTecnica = useMemo(() => {
    if (!ehCapacitacaoTecnica) return []
    if (equipeDestinoCapacitacao === 'TODAS') {
      return todosMembros.filter((m) => m.tipo_membro !== 'Inativo')
    }
    const eqSel = equipeDestinoCapacitacao.toLowerCase()
    return todosMembros.filter((m) => {
      const eqM = (m.equipe || '').toLowerCase()
      return eqM.includes(eqSel) || eqSel.includes(eqM)
    })
  }, [ehCapacitacaoTecnica, equipeDestinoCapacitacao, todosMembros])

  // 4.3 Membros da Reunião Geral / Assembleia (Todos os membros do Ramo)
  const membrosReuniaoGeral = useMemo(() => {
    if (!ehReuniaoGeral) return []
    return todosMembros.filter((m) => m.tipo_membro !== 'Inativo')
  }, [ehReuniaoGeral, todosMembros])

  // 4.4 Membros da Diretoria & Lideranças
  const membrosDiretoria = useMemo(() => {
    if (!ehDiretoria) return []
    return todosMembros.filter(
      (m) =>
        m.nivelAcesso === 'ADMIN' ||
        m.nivelAcesso === 'GESTOR' ||
        m.nivelAcesso === 'LIDER' ||
        m.cargo.toLowerCase().includes('diretor') ||
        m.cargo.toLowerCase().includes('presidente') ||
        m.cargo.toLowerCase().includes('coordenador') ||
        m.cargo.toLowerCase().includes('líder') ||
        m.cargo.toLowerCase().includes('lider')
    )
  }, [ehDiretoria, todosMembros])

  // 4.5 Membros do Alinhamento 1:1
  const participantes1a1 = useMemo(() => {
    if (!ehAlinhamento1a1) return []
    const list: MembroParticipante[] = []
    const m1 = todosMembros.find((m) => m.matricula === membro1Matricula)
    if (m1) list.push(m1)
    const m2 = todosMembros.find((m) => m.matricula === membro2Matricula)
    if (m2 && !list.some((p) => p.matricula === m2.matricula)) list.push(m2)
    return list
  }, [ehAlinhamento1a1, membro1Matricula, membro2Matricula, todosMembros])

  // =========================================================================
  // 5. EFEITOS DE SINCRONIZAÇÃO DE PÚBLICO E TÍTULO INTELIGENTE
  // =========================================================================

  // Sincronização 5.1: Reunião de Equipe
  useEffect(() => {
    if (ehReuniaoEquipe) {
      onAtualizarParticipantes(membrosReuniaoEquipe)
      const nomeCurto = equipeReuniao.split('(')[0].trim()
      const detalheSub = subequipeReuniao !== 'TODAS' ? ` - ${subequipeReuniao}` : ''
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: `Reunião de Equipe - ${nomeCurto}${detalheSub}`,
        equipe_responsavel: equipeReuniao,
        publico_alvo: `${membrosReuniaoEquipe.length} membros da equipe ${nomeCurto}`,
      }))
    }
  }, [ehReuniaoEquipe, equipeReuniao, subequipeReuniao, membrosReuniaoEquipe, onAtualizarParticipantes, setFormNovoEvento])

  // Sincronização 5.2: Capacitação Técnica
  useEffect(() => {
    if (ehCapacitacaoTecnica) {
      onAtualizarParticipantes(membrosCapacitacaoTecnica)
      const curso = catalogoCursos.find((c) => c.id === cursoSelecionadoId)
      if (curso) {
        setFormNovoEvento((prev: any) => ({
          ...prev,
          id_curso: curso.id,
          nome_capacitacao: `Capacitação Técnica - ${curso.nome_curso}`,
          equipe_responsavel: curso.equipe_responsavel || 'Geral',
          publico_alvo: `${membrosCapacitacaoTecnica.length} membros (${equipeDestinoCapacitacao})`,
        }))
      } else {
        setFormNovoEvento((prev: any) => ({
          ...prev,
          nome_capacitacao: prev.nome_capacitacao && prev.nome_capacitacao.includes('Capacitação')
            ? prev.nome_capacitacao
            : 'Capacitação Técnica do Ramo',
          publico_alvo: `${membrosCapacitacaoTecnica.length} membros (${equipeDestinoCapacitacao})`,
        }))
      }
    }
  }, [ehCapacitacaoTecnica, cursoSelecionadoId, equipeDestinoCapacitacao, membrosCapacitacaoTecnica, catalogoCursos, onAtualizarParticipantes, setFormNovoEvento])

  // Sincronização 5.3: Reunião Geral / Assembleia
  useEffect(() => {
    if (ehReuniaoGeral) {
      onAtualizarParticipantes(membrosReuniaoGeral)
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      const mesAtual = meses[new Date().getMonth()]
      const anoAtual = new Date().getFullYear()
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: `Reunião Geral do Ramo - ${mesAtual} ${anoAtual}`,
        equipe_responsavel: 'Presidência / Geral',
        publico_alvo: `Todo o Ramo (${membrosReuniaoGeral.length} membros)`,
        local_link: prev.modalidade === 'Presencial' ? 'Auditório 1' : prev.local_link,
      }))
    }
  }, [ehReuniaoGeral, membrosReuniaoGeral, onAtualizarParticipantes, setFormNovoEvento])

  // Sincronização 5.4: Diretoria & Lideranças
  useEffect(() => {
    if (ehDiretoria) {
      onAtualizarParticipantes(membrosDiretoria)
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: 'Alinhamento de Diretoria & Lideranças',
        equipe_responsavel: 'Presidência',
        publico_alvo: `Lideranças do Ramo (${membrosDiretoria.length} líderes)`,
        local_link: prev.modalidade === 'Presencial' ? (configSalas[0] || 'E-213 - Sala do Ramo') : prev.local_link,
      }))
    }
  }, [ehDiretoria, membrosDiretoria, configSalas, onAtualizarParticipantes, setFormNovoEvento])

  // Sincronização 5.5: Alinhamento 1:1
  useEffect(() => {
    if (ehAlinhamento1a1) {
      onAtualizarParticipantes(participantes1a1)
      const m1 = todosMembros.find((m) => m.matricula === membro1Matricula)
      const m2 = todosMembros.find((m) => m.matricula === membro2Matricula)
      const nome1 = m1 ? m1.nome.split(' ')[0] : 'Membro 1'
      const nome2 = m2 ? m2.nome.split(' ')[0] : 'Membro 2'
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: `1:1 - ${nome1} & ${nome2}`,
        equipe_responsavel: m1?.equipe || 'Geral',
        publico_alvo: `Alinhamento 1:1 (${nome1} & ${nome2})`,
      }))
    }
  }, [ehAlinhamento1a1, participantes1a1, membro1Matricula, membro2Matricula, todosMembros, onAtualizarParticipantes, setFormNovoEvento])

  // Sincronização 5.6: Workshop / Hackathon
  useEffect(() => {
    if (ehWorkshop) {
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: prev.nome_capacitacao && (prev.nome_capacitacao.includes('Workshop') || prev.nome_capacitacao.includes('Hackathon'))
          ? prev.nome_capacitacao
          : 'Workshop Prático de Inovação',
        equipe_responsavel: 'Projetos / CS',
        publico_alvo: `Aberto aos Membros (até ${vagasWorkshop} vagas)`,
        local_link: prev.modalidade === 'Presencial' ? 'Lab Maker (E-205)' : prev.local_link,
      }))
    }
  }, [ehWorkshop, vagasWorkshop, setFormNovoEvento])

  // =========================================================================
  // 6. MOTOR DE PCH ESPECIALIZADO POR CATEGORIA
  // =========================================================================

  // Slots de Quórum Estrito para Reunião de Equipe (100% ou maior quórum)
  const slotsReuniaoEquipe = useMemo(() => {
    if (membrosReuniaoEquipe.length === 0) return []
    const slots100 = calcularSlotsQuorumEstrito100(
      membrosReuniaoEquipe,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
    if (slots100.length > 0) return slots100
    // Fallback: slots recomendados com melhor quórum proporcional
    return calcularSlotsRecomendadosPCH(
      membrosReuniaoEquipe,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [membrosReuniaoEquipe, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  // Slots Bi-Laterais 100% para Alinhamento 1:1
  const slots1a1 = useMemo(() => {
    if (participantes1a1.length < 2) return []
    return calcularSlotsQuorumEstrito100(
      participantes1a1,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [participantes1a1, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  // Slots de Liderança
  const slotsDiretoria = useMemo(() => {
    if (membrosDiretoria.length === 0) return []
    return calcularSlotsRecomendadosPCH(
      membrosDiretoria,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [membrosDiretoria, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  // Slots Globais para Reunião Geral / Capacitação Técnica
  const slotsGerais = useMemo(() => {
    const publico = ehCapacitacaoTecnica ? membrosCapacitacaoTecnica : membrosReuniaoGeral
    if (publico.length === 0) return []
    return calcularSlotsRecomendadosPCH(
      publico,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [ehCapacitacaoTecnica, membrosCapacitacaoTecnica, ehReuniaoGeral, membrosReuniaoGeral, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  // =========================================================================
  // 7. CHECAGEM DE CHOQUE DE SALAS DO CEFET-RJ EM TEMPO REAL
  // =========================================================================
  const statusSalas = useMemo(() => {
    if (formNovoEvento.modalidade !== 'Presencial') return []
    return verificarDisponibilidadeSalas(
      configSalas,
      formNovoEvento.data,
      formNovoEvento.hora_inicio,
      formNovoEvento.hora_fim,
      eventosExistentes,
      formNovoEvento.id
    )
  }, [
    configSalas,
    eventosExistentes,
    formNovoEvento.data,
    formNovoEvento.hora_inicio,
    formNovoEvento.hora_fim,
    formNovoEvento.modalidade,
    formNovoEvento.id,
  ])

  // =========================================================================
  // 8. RENDERIZAÇÃO DA INTERFACE ADAPTATIVA
  // =========================================================================

  return (
    <div className="space-y-4 text-xs">
      {/* ===================================================================== */}
      {/* 2.1 REUNIÃO DE EQUIPE / SUBEQUIPE */}
      {/* ===================================================================== */}
      {ehReuniaoEquipe && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50/60 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
                <span>🏢</span> Reunião Operacional de Equipe / Subequipe
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                Convocação Direta por Equipe
              </span>
            </div>

            {/* Seletores Hierárquicos: Equipe & Subequipe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  1. Selecione a Equipe Oficial Alvo *
                </label>
                <select
                  value={equipeReuniao}
                  onChange={(e) => {
                    setEquipeReuniao(e.target.value)
                    setSubequipeReuniao('TODAS')
                  }}
                  className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
                >
                  {equipesDisponiveis.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  2. Subequipe / Área (Opcional)
                </label>
                <select
                  value={subequipeReuniao}
                  onChange={(e) => setSubequipeReuniao(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="TODAS">Toda a Equipe ({membrosReuniaoEquipe.length} membros)</option>
                  {subequipesDisponiveis.map((sub) => (
                    <option key={sub} value={sub}>
                      Subequipe: {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Membros Convocados Automaticamente */}
            <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                <span>👥 {membrosReuniaoEquipe.length} Membros Convocados Compulsoriamente:</span>
                <span className="text-[10px] text-gray-500 font-normal">
                  {equipeReuniao} {subequipeReuniao !== 'TODAS' && `• ${subequipeReuniao}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {membrosReuniaoEquipe.map((m) => (
                  <span
                    key={m.matricula}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-semibold text-[10px] border border-blue-100"
                  >
                    👤 {m.nome.split(' ')[0]} ({m.cargo})
                  </span>
                ))}
              </div>
            </div>

            {/* Sugestões PCH com Quórum Estrito ou Máximo */}
            {slotsReuniaoEquipe.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Melhores Horários para a Equipe (Menor Choque de Aulas no CEFET)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsReuniaoEquipe.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setFormNovoEvento((prev: any) => ({
                          ...prev,
                          data: slot.dataSugerida,
                          hora_inicio: slot.horarioInicio,
                          hora_fim: slot.horarioFim,
                        }))
                      }}
                      className="p-2.5 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-blue-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {slot.percentualQuorum}% Livre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.2 CAPACITAÇÃO TÉCNICA (CURSO OFICIAL OU INTERNO) */}
      {/* ===================================================================== */}
      {ehCapacitacaoTecnica && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50/60 border border-indigo-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Capacitação Técnica & Workshops Internos
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                Catálogo Oficial do Ramo
              </span>
            </div>

            {/* Dropdown de Curso do Catálogo */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                1. Vincular Treinamento do Catálogo Oficial (Opcional)
              </label>
              <input
                type="text"
                value={buscaCurso}
                onChange={(e) => {
                  setBuscaCurso(e.target.value)
                  setDropdownCursoAberto(true)
                }}
                onFocus={() => setDropdownCursoAberto(true)}
                placeholder="Pesquise o curso (ex: Git + Github, Python, SolidWorks, PCB...)"
                className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />

              {dropdownCursoAberto && catalogoCursos.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-gray-100">
                  {catalogoCursos
                    .filter(
                      (c) =>
                        !buscaCurso.trim() ||
                        c.nome_curso.toLowerCase().includes(buscaCurso.toLowerCase()) ||
                        c.id.toLowerCase().includes(buscaCurso.toLowerCase())
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCursoSelecionadoId(c.id)
                          setBuscaCurso(c.nome_curso)
                          setDropdownCursoAberto(false)
                        }}
                        className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-gray-900">{c.nome_curso}</div>
                          <div className="text-[10px] text-gray-500">{c.equipe_responsavel}</div>
                        </div>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                          {c.id}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Equipe Destino */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                2. Equipe Alvo do Treinamento
              </label>
              <select
                value={equipeDestinoCapacitacao}
                onChange={(e) => setEquipeDestinoCapacitacao(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="TODAS">Aberto a Todas as Equipes do Ramo</option>
                {equipesDisponiveis.map((eq) => (
                  <option key={eq} value={eq}>
                    Equipe: {eq}
                  </option>
                ))}
              </select>
            </div>

            {/* Audiência Convocada */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900">
                    👥 {membrosCapacitacaoTecnica.length} Membros Convocados
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {equipeDestinoCapacitacao === 'TODAS'
                      ? 'Capacitação aberta para o corpo de membros do Ramo'
                      : `Focado nos membros de ${equipeDestinoCapacitacao}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerListaMembrosCap(!verListaMembrosCap)}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {verListaMembrosCap ? 'Ocultar ▲' : 'Ver Membros ▼'}
                </button>
              </div>

              {verListaMembrosCap && (
                <div className="mt-2 pt-2 border-t border-gray-100 max-h-36 overflow-y-auto space-y-1 text-[11px]">
                  {membrosCapacitacaoTecnica.map((m) => (
                    <div
                      key={m.matricula}
                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-gray-50"
                    >
                      <span className="font-semibold text-gray-800">{m.nome}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {m.cargo} • {m.equipe}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PCH Geral de Capacitação */}
            {slotsGerais.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Horários Recomendados PCH (Maior Adesão)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsGerais.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setFormNovoEvento((prev: any) => ({
                          ...prev,
                          data: slot.dataSugerida,
                          hora_inicio: slot.horarioInicio,
                          hora_fim: slot.horarioFim,
                        }))
                      }}
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-indigo-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {slot.percentualQuorum}% Livre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.3 REUNIÃO GERAL DO RAMO / ASSEMBLEIA */}
      {/* ===================================================================== */}
      {ehReuniaoGeral && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                <span>🏛️</span> Assembleia Geral / Reunião Geral do Ramo
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                Convocação Geral Magna
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1.5">
              <div className="text-xs font-bold text-gray-900">
                👥 Convocatória Oficial: {membrosReuniaoGeral.length} Membros do Ramo
              </div>
              <p className="text-[11px] text-gray-600">
                Todos os membros ativos, diretores e coordenadores são convocados compulsoriamente.
              </p>
            </div>

            {/* Slots Globais com Menor Choque Geral */}
            {slotsGerais.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Slots com Menor Choque de Aulas no CEFET para Todo o Ramo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsGerais.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setFormNovoEvento((prev: any) => ({
                          ...prev,
                          data: slot.dataSugerida,
                          hora_inicio: slot.horarioInicio,
                          hora_fim: slot.horarioFim,
                        }))
                      }}
                      className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {slot.percentualQuorum}% Livre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.4 REUNIÃO DE DIRETORIA & LIDERANÇAS */}
      {/* ===================================================================== */}
      {ehDiretoria && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50/60 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                <span>👔</span> Alinhamento de Diretoria & Lideranças
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full font-bold">
                Exclusivo Lideranças
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-2">
              <div className="text-xs font-bold text-gray-900">
                👑 {membrosDiretoria.length} Líderes, Coordenadores e Diretores Convocados:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {membrosDiretoria.map((m) => (
                  <span
                    key={m.matricula}
                    className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 font-semibold text-[10px] border border-purple-100"
                  >
                    ⭐ {m.nome.split(' ')[0]} ({m.cargo})
                  </span>
                ))}
              </div>
            </div>

            {/* Slots de Liderança */}
            {slotsDiretoria.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Janelas com Maior Disponibilidade da Diretoria
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsDiretoria.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setFormNovoEvento((prev: any) => ({
                          ...prev,
                          data: slot.dataSugerida,
                          hora_inicio: slot.horarioInicio,
                          hora_fim: slot.horarioFim,
                        }))
                      }}
                      className="p-2.5 bg-white hover:bg-purple-50 border border-purple-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-purple-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {slot.percentualQuorum}% Livre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.5 ALINHAMENTO 1:1 */}
      {/* ===================================================================== */}
      {ehAlinhamento1a1 && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                <span>💬</span> Alinhamento Bi-lateral 1:1 (Líder ↔ Liderado)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Quórum 100% Estrito
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Membro 1 (Você) */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  1. Membro Solicitante (Você)
                </label>
                <div className="p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-800">
                  👤 {usuario.nome} ({usuario.matricula})
                </div>
              </div>

              {/* Membro 2 (Parceiro) */}
              <div className="relative">
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  2. Membro Participante *
                </label>
                <input
                  type="text"
                  value={buscaMembro2}
                  onChange={(e) => {
                    setBuscaMembro2(e.target.value)
                    setDropdownMembro2Aberto(true)
                  }}
                  onFocus={() => setDropdownMembro2Aberto(true)}
                  placeholder="Pesquise por nome ou matrícula..."
                  className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />

                {dropdownMembro2Aberto && todosMembros.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-gray-100">
                    {todosMembros
                      .filter(
                        (m) =>
                          m.matricula !== usuario.matricula &&
                          (!buscaMembro2.trim() ||
                            m.nome.toLowerCase().includes(buscaMembro2.toLowerCase()) ||
                            m.matricula.toLowerCase().includes(buscaMembro2.toLowerCase()))
                      )
                      .map((m) => (
                        <div
                          key={m.matricula}
                          onClick={() => {
                            setMembro2Matricula(m.matricula)
                            setBuscaMembro2(`${m.nome} (${m.equipe})`)
                            setDropdownMembro2Aberto(false)
                          }}
                          className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-gray-900">{m.nome}</div>
                            <div className="text-[10px] text-gray-500">
                              {m.cargo} • {m.equipe}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                            {m.matricula}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Slots 1:1 Estritos */}
            {slots1a1.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Slots onde AMBOS estão 100% Livres
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slots1a1.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setFormNovoEvento((prev: any) => ({
                          ...prev,
                          data: slot.dataSugerida,
                          hora_inicio: slot.horarioInicio,
                          hora_fim: slot.horarioFim,
                        }))
                      }}
                      className="p-2.5 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        100% Livre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : membro2Matricula ? (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Nenhum slot 100% livre encontrado na grade padrão. Selecione a data e o horário manualmente abaixo.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.6 WORKSHOP / HACKATHON */}
      {/* ===================================================================== */}
      {ehWorkshop && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50/60 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider flex items-center gap-1.5">
                <span>🚀</span> Workshop / Hackathon / Maratona Técnica
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-full font-bold">
                Capacidade & Inscrição Aberta
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Capacidade Máxima de Participantes
                </label>
                <input
                  type="number"
                  value={vagasWorkshop}
                  onChange={(e) => setVagasWorkshop(Number(e.target.value))}
                  min={5}
                  max={100}
                  className="w-full bg-white border border-rose-200 rounded-xl p-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Espaço Recomendado
                </label>
                <div className="p-2.5 bg-white border border-rose-200 rounded-xl font-bold text-xs text-rose-900">
                  🏢 Lab Maker (E-205) ou Auditório 1
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TÍTULO OFICIAL DO COMPROMISSO (PREENCHIDO DINAMICAMENTE & EDITÁVEL) */}
      {/* ===================================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
            Título Oficial do Compromisso *
          </label>
          <input
            type="text"
            value={formNovoEvento.nome_capacitacao}
            onChange={(e) =>
              setFormNovoEvento({ ...formNovoEvento, nome_capacitacao: e.target.value })
            }
            placeholder="Ex: Reunião de Equipe - Wolfbotz (RAS)"
            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        {/* ===================================================================== */}
        {/* CAMPOS COMUNS: DATA, HORÁRIOS, MODALIDADE E SALA COM DETECTOR DE CHOQUE */}
        {/* ===================================================================== */}
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide pt-1 border-t border-gray-100">
          Data, Horários & Local (com Detector de Choque de Salas do CEFET)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data *</label>
            <input
              type="date"
              value={formNovoEvento.data}
              onChange={(e) => setFormNovoEvento({ ...formNovoEvento, data: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              Início / Fim *
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={formNovoEvento.hora_inicio}
                onChange={(e) =>
                  setFormNovoEvento({ ...formNovoEvento, hora_inicio: e.target.value })
                }
                placeholder="14:00"
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-400">-</span>
              <input
                type="text"
                value={formNovoEvento.hora_fim}
                onChange={(e) => setFormNovoEvento({ ...formNovoEvento, hora_fim: e.target.value })}
                placeholder="16:00"
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Modalidade</label>
            <select
              value={formNovoEvento.modalidade}
              onChange={(e) =>
                setFormNovoEvento({
                  ...formNovoEvento,
                  modalidade: e.target.value as any,
                  local_link:
                    e.target.value === 'Presencial'
                      ? configSalas[0] || 'E-213 - Sala do Ramo'
                      : 'https://teams.microsoft.com',
                })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Presencial">Presencial (CEFET)</option>
              <option value="Online">Online</option>
              <option value="Gravada">Gravada</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>

        {/* Local com Detector de Choque de Salas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              {formNovoEvento.modalidade === 'Presencial'
                ? 'Sala Física (com Checagem em Tempo Real) *'
                : 'Link da Reunião Online *'}
            </label>
            {formNovoEvento.modalidade === 'Presencial' ? (
              <select
                value={formNovoEvento.local_link}
                onChange={(e) =>
                  setFormNovoEvento({ ...formNovoEvento, local_link: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary"
              >
                {statusSalas.map((s) => (
                  <option key={s.sala} value={s.sala} disabled={!s.disponivel}>
                    {s.disponivel
                      ? `🟢 ${s.sala} [Disponível]`
                      : `🔴 ${s.sala} (Ocupada: ${s.eventoOcupante?.nome_capacitacao} das ${s.eventoOcupante?.hora_inicio} às ${s.eventoOcupante?.hora_fim})`}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formNovoEvento.local_link}
                onChange={(e) =>
                  setFormNovoEvento({ ...formNovoEvento, local_link: e.target.value })
                }
                placeholder="Ex: https://teams.microsoft.com/... ou Google Meet"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              Facilitador(es) / Ministrante(s)
            </label>
            <input
              type="text"
              value={formNovoEvento.ministrantes}
              onChange={(e) =>
                setFormNovoEvento({ ...formNovoEvento, ministrantes: e.target.value })
              }
              placeholder="Nomes dos facilitadores separados por vírgula"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Pauta / Descrição */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
            {ehReuniaoEquipe
              ? 'Pauta da Reunião (Metas da Semana, Projetos & Impedimentos)'
              : ehAlinhamento1a1
              ? 'Pauta do 1:1 (Alinhamento, Metas & Feedbacks Mútuos)'
              : 'Pauta / Descrição do Compromisso (Opcional)'}
          </label>
          <textarea
            value={formNovoEvento.descricao}
            onChange={(e) =>
              setFormNovoEvento({ ...formNovoEvento, descricao: e.target.value })
            }
            placeholder={
              ehReuniaoEquipe
                ? '• Metas da semana e status do projeto\n• Alinhamento técnico entre subequipes\n• Impedimentos e pedidos de suporte'
                : ehAlinhamento1a1
                ? '• Revisão de metas e prioridades\n• Feedbacks mútuos e desenvolvimento\n• Dúvidas e próximos passos'
                : 'Objetivos da atividade, cronograma, orientações prévias aos membros...'
            }
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
