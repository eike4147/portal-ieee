'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MembroParticipante,
  SlotRecomendadoPCH,
  GradePchSemanal,
  calcularSlotsRecomendadosPCH,
} from '@/lib/pch-matching'
import {
  GrupoTrainee,
  GRUPOS_TRAINEE_PADRAO,
  DEMANDAS_PADRAO,
  resolverTraineesPorCursoDemanda,
  resolverPublicoReuniao360,
  calcularSlotsQuorumEstrito100,
  calcularCoberturaDinamicaTurmas,
} from '@/lib/pse-demandas'
import { verificarDisponibilidadeSalas, EventoParaChecagemSala } from '@/lib/sala-conflito'

export interface FormularioContextoPseProps {
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

export function FormularioContextoPse({
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
}: FormularioContextoPseProps) {
  // =========================================================================
  // 1. NORMALIZAÇÃO ROBUSTA DA CATEGORIA (SEM PROBLEMAS DE ACENTUAÇÃO/MAIÚSCULAS)
  // =========================================================================
  const tipoNorm = useMemo(() => {
    return (tipoEvento || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }, [tipoEvento])

  const eh360 = tipoNorm.includes('360')
  const ehDinamica = tipoNorm.includes('dinam')
  const ehEntrevista = tipoNorm.includes('entrevis')
  const ehFollowUp = tipoNorm.includes('follow')
  const ehCapacitacao = tipoNorm.includes('capacita') || (!eh360 && !ehDinamica && !ehEntrevista && !ehFollowUp)

  // =========================================================================
  // 2. ESTADOS ESPECÍFICOS PARA CADA CATEGORIA
  // =========================================================================

  // 2.1 Capacitação Trainee (De-Para)
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState(formNovoEvento.id_curso || '')
  const [buscaCurso, setBuscaCurso] = useState('')
  const [dropdownCursoAberto, setDropdownCursoAberto] = useState(false)
  const [verListaTrainees, setVerListaTrainees] = useState(false)

  // 2.2 Reunião 360
  const [grupo360SelecionadoId, setGrupo360SelecionadoId] = useState(GRUPOS_TRAINEE_PADRAO[0]?.id || '')

  // 2.3 Dinâmica em Grupo
  const [capacidadePorTurma, setCapacidadePorTurma] = useState(8)
  const [turmasPropostas, setTurmasPropostas] = useState<
    Array<{
      id: string
      titulo: string
      diaSemana: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'
      slotHorario: string
      slot1h: string
      sala: string
    }>
  >([
    {
      id: 'turma-1',
      titulo: 'Turma A',
      diaSemana: 'ter',
      slotHorario: '14:00 - 16:00',
      slot1h: '14:00',
      sala: configSalas[0] || 'E-213 - Sala do Ramo',
    },
    {
      id: 'turma-2',
      titulo: 'Turma B',
      diaSemana: 'qua',
      slotHorario: '16:00 - 18:00',
      slot1h: '16:00',
      sala: configSalas[0] || 'E-213 - Sala do Ramo',
    },
  ])

  // 2.4 Entrevista Individual
  const [candidatoEntrevistaMatricula, setCandidatoEntrevistaMatricula] = useState('')
  const [avaliador1Matricula, setAvaliador1Matricula] = useState(usuario.matricula || '')
  const [avaliador2Matricula, setAvaliador2Matricula] = useState('')

  // 2.5 Follow-Up Semanal
  const [grupoFollowUp, setGrupoFollowUp] = useState('TODOS')
  const [prazoLimiteHora, setPrazoLimiteHora] = useState('23:59')

  // =========================================================================
  // 3. FILTRAGEM DE SALAS E CHECAGEM DE CHOQUE EM TEMPO REAL
  // =========================================================================
  const statusSalas = useMemo(() => {
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
    formNovoEvento.data,
    formNovoEvento.hora_inicio,
    formNovoEvento.hora_fim,
    eventosExistentes,
    formNovoEvento.id,
  ])

  // =========================================================================
  // 4. EFEITOS E SINCRONIZAÇÃO DE TÍTULO / PÚBLICO
  // =========================================================================

  // Sincroniza título padrão inteligente quando a categoria muda
  useEffect(() => {
    if (ehDinamica) {
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: prev.nome_capacitacao && prev.nome_capacitacao.includes('Dinâmica')
          ? prev.nome_capacitacao
          : 'Dinâmica em Grupo - PSE 2026.1',
        equipe_responsavel: 'Gestão de Recrutamento e Seleção (R&S)',
      }))
    } else if (ehFollowUp) {
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: prev.nome_capacitacao && prev.nome_capacitacao.includes('Follow')
          ? prev.nome_capacitacao
          : 'Follow-Up Semanal Trainee #1',
        equipe_responsavel: 'Gestão de Pessoas (GP)',
      }))
    }
  }, [ehDinamica, ehFollowUp, setFormNovoEvento])

  // 4.1 Categoria 1.1: Capacitação Trainee (De-Para)
  const resolucaoCapacitacao = useMemo(() => {
    if (!ehCapacitacao || !cursoSelecionadoId) {
      return null
    }
    return resolverTraineesPorCursoDemanda(
      cursoSelecionadoId,
      GRUPOS_TRAINEE_PADRAO,
      DEMANDAS_PADRAO,
      todosMembros
    )
  }, [ehCapacitacao, cursoSelecionadoId, todosMembros])

  useEffect(() => {
    if (ehCapacitacao && resolucaoCapacitacao) {
      onAtualizarParticipantes(resolucaoCapacitacao.traineesResolvidos)
      setFormNovoEvento((prev: any) => ({
        ...prev,
        publico_alvo: `${resolucaoCapacitacao.traineesResolvidos.length} trainees (${resolucaoCapacitacao.gruposConvocados.map((g) => g.nome_grupo.split('(')[0].trim()).join(', ')})`,
      }))
    }
  }, [ehCapacitacao, resolucaoCapacitacao, onAtualizarParticipantes, setFormNovoEvento])

  // 4.2 Categoria 1.2: Reunião 360
  const resolucao360 = useMemo(() => {
    if (!eh360 || !grupo360SelecionadoId) return null
    return resolverPublicoReuniao360(grupo360SelecionadoId, GRUPOS_TRAINEE_PADRAO, todosMembros)
  }, [eh360, grupo360SelecionadoId, todosMembros])

  useEffect(() => {
    if (eh360 && resolucao360 && resolucao360.grupo) {
      const nomeCurtoGrupo = resolucao360.grupo.nome_grupo.split('•')[0].trim()
      setFormNovoEvento((prev: any) => ({
        ...prev,
        nome_capacitacao: `Reunião 360 - ${nomeCurtoGrupo}`,
        equipe_responsavel: 'Gestão de Pessoas (GP) / R&S',
        publico_alvo: `${resolucao360.participantesObrigatorios.length} pessoas (${resolucao360.trainees.length} Trainees + Assessor)`,
      }))
      onAtualizarParticipantes(resolucao360.participantesObrigatorios)
    }
  }, [eh360, resolucao360, onAtualizarParticipantes, setFormNovoEvento])

  // 4.3 Categoria 1.3: Dinâmica em Grupo
  const traineesPseTodos = useMemo(() => {
    return todosMembros.filter(
      (m) => m.nivelAcesso === 'TRAINEE' || m.tipo_membro === 'Trainee' || m.cargo.toLowerCase().includes('trainee')
    )
  }, [todosMembros])

  const coberturaDinamica = useMemo(() => {
    return calcularCoberturaDinamicaTurmas(
      traineesPseTodos,
      pchsPorMembro,
      turmasPropostas,
      formNovoEvento.modalidade === 'Online' ? 'Online' : 'Presencial'
    )
  }, [traineesPseTodos, pchsPorMembro, turmasPropostas, formNovoEvento.modalidade])

  // 4.4 Categoria 1.4: Entrevista Individual
  const participantesEntrevista = useMemo(() => {
    const list: MembroParticipante[] = []
    const cand = todosMembros.find((m) => m.matricula === candidatoEntrevistaMatricula)
    if (cand) list.push(cand)
    const av1 = todosMembros.find((m) => m.matricula === avaliador1Matricula)
    if (av1 && !list.some((p) => p.matricula === av1.matricula)) list.push(av1)
    const av2 = todosMembros.find((m) => m.matricula === avaliador2Matricula)
    if (av2 && !list.some((p) => p.matricula === av2.matricula)) list.push(av2)
    return list
  }, [candidatoEntrevistaMatricula, avaliador1Matricula, avaliador2Matricula, todosMembros])

  useEffect(() => {
    if (ehEntrevista) {
      onAtualizarParticipantes(participantesEntrevista)
      const cand = todosMembros.find((m) => m.matricula === candidatoEntrevistaMatricula)
      if (cand) {
        setFormNovoEvento((prev: any) => ({
          ...prev,
          nome_capacitacao: `Entrevista Individual - ${cand.nome}`,
          publico_alvo: `1 Candidato (${cand.nome}) + Banca Avaliadora`,
        }))
      } else {
        setFormNovoEvento((prev: any) => ({
          ...prev,
          nome_capacitacao:
            prev.nome_capacitacao && prev.nome_capacitacao.includes('Entrevista')
              ? prev.nome_capacitacao
              : 'Entrevista Individual - PSE 2026.1',
          equipe_responsavel: 'Gestão de Recrutamento e Seleção (R&S)',
        }))
      }
    }
  }, [ehEntrevista, participantesEntrevista, candidatoEntrevistaMatricula, todosMembros, onAtualizarParticipantes, setFormNovoEvento])

  // Slots de Ouro / PCH para a categoria ativa
  const slotsQuorum100Reuniao360 = useMemo(() => {
    if (!resolucao360 || resolucao360.participantesObrigatorios.length === 0) return []
    return calcularSlotsQuorumEstrito100(
      resolucao360.participantesObrigatorios,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [resolucao360, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  const slotsPchEntrevista = useMemo(() => {
    if (participantesEntrevista.length < 2) return []
    return calcularSlotsQuorumEstrito100(
      participantesEntrevista,
      pchsPorMembro,
      formNovoEvento.modalidade,
      formNovoEvento.data
    )
  }, [participantesEntrevista, pchsPorMembro, formNovoEvento.modalidade, formNovoEvento.data])

  // =========================================================================
  // 5. RENDERIZAÇÃO DA INTERFACE ADAPTATIVA
  // =========================================================================

  return (
    <div className="space-y-4 text-xs">
      {/* ===================================================================== */}
      {/* 1.1 CAPACITAÇÃO TRAINEE */}
      {/* ===================================================================== */}
      {ehCapacitacao && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
                <span>📚</span> De-Para Automático de Demandas
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                Convocação por Grupo Trainee
              </span>
            </div>

            {/* Dropdown de Curso com Autocomplete */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                1. Vincular Curso Oficial do Catálogo *
              </label>
              <input
                type="text"
                value={buscaCurso}
                onChange={(e) => {
                  setBuscaCurso(e.target.value)
                  setDropdownCursoAberto(true)
                }}
                onFocus={() => setDropdownCursoAberto(true)}
                placeholder="Busque pelo nome ou código do curso (ex: Apresentação Pessoal, Git, SolidWorks...)"
                className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
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
                          setFormNovoEvento((prev: any) => ({
                            ...prev,
                            id_curso: c.id,
                            nome_capacitacao: c.nome_curso,
                            equipe_responsavel: c.equipe_responsavel || 'Geral',
                          }))
                          setDropdownCursoAberto(false)
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
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

            {/* Resultado do De-Para */}
            {resolucaoCapacitacao && (
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-gray-900 text-sm">
                      👥 {resolucaoCapacitacao.traineesResolvidos.length} Trainees Convocados
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {resolucaoCapacitacao.gruposConvocados.length} grupos convocados coletivamente
                      {resolucaoCapacitacao.equipesDemandantes.length > 0 && (
                        <span> • Demanda de: {resolucaoCapacitacao.equipesDemandantes.join(', ')}</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerListaTrainees(!verListaTrainees)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    {verListaTrainees ? 'Ocultar Lista ▲' : 'Ver Inscritos ▼'}
                  </button>
                </div>

                {verListaTrainees && (
                  <div className="mt-2 pt-2 border-t border-gray-100 max-h-40 overflow-y-auto space-y-1 text-[11px]">
                    {resolucaoCapacitacao.traineesResolvidos.map((t) => (
                      <div key={t.matricula} className="flex items-center justify-between py-1 px-2 rounded-lg bg-gray-50">
                        <span className="font-semibold text-gray-800">{t.nome}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{t.matricula} • {t.equipe}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1.2 REUNIÃO 360 */}
      {/* ===================================================================== */}
      {eh360 && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50/60 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                <span>🔄</span> Reunião 360 de Acompanhamento Trainee
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                Quórum 100% Obrigatório
              </span>
            </div>

            {/* Dropdown de Grupos Trainee */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                1. Selecione o Grupo Trainee Alvo *
              </label>
              <select
                value={grupo360SelecionadoId}
                onChange={(e) => setGrupo360SelecionadoId(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
              >
                {GRUPOS_TRAINEE_PADRAO.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome_grupo}
                  </option>
                ))}
              </select>
            </div>

            {/* Público Atrelado e Visibilidade de Auditoria */}
            {resolucao360 && resolucao360.grupo && (
              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-2">
                <div className="text-xs font-bold text-gray-900">
                  👥 {resolucao360.participantesObrigatorios.length} Participantes Obrigatórios Convocados:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resolucao360.trainees.map((t) => (
                    <span key={t.matricula} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 font-semibold text-[10px] border border-purple-100">
                      🎓 {t.nome.split(' ')[0]}
                    </span>
                  ))}
                  {resolucao360.assessorTecnico && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px]">
                      ⭐ Assessor Técnico: {resolucao360.assessorTecnico.nome.split(' ')[0]}
                    </span>
                  )}
                  {resolucao360.assessorRh && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                      ⭐ Assessor RH: {resolucao360.assessorRh.nome.split(' ')[0]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200/80">
                  <span>🛡️</span>
                  <span><strong>Auditoria Institucional:</strong> Visível automaticamente para Gestão de Pessoas (GP) e Recrutamento & Seleção (R&S).</span>
                </div>
              </div>
            )}

            {/* Sugestões de Quórum Estrito 100% */}
            {slotsQuorum100Reuniao360.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Slots com Quórum Estrito 100% (Todos Livres)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsQuorum100Reuniao360.slice(0, 4).map((slot) => (
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
                      className="p-2.5 bg-white hover:bg-purple-50 border border-purple-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-purple-900">{slot.diaNome}</div>
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
            ) : grupo360SelecionadoId ? (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Nenhum slot com 100% de quórum livre na grade padrão. Selecione a data e horário manualmente abaixo.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1.3 DINÂMICA EM GRUPO */}
      {/* ===================================================================== */}
      {ehDinamica && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                <span>🤝</span> Pool de Vagas & Agendamento Self-Service
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Taxa de Cobertura Total
              </span>
            </div>

            {/* Métrica de Cobertura das Turmas */}
            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Taxa de Cobertura de Trainees:
                </div>
                <div className="text-[11px] text-gray-500">
                  {coberturaDinamica.candidatosCobertosCount} de {coberturaDinamica.totalTrainees} trainees têm pelo menos 1 turma viável
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-black text-sm ${
                coberturaDinamica.taxaCobertura === 100
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {coberturaDinamica.taxaCobertura}% {coberturaDinamica.taxaCobertura === 100 ? '⭐' : '⚠️'}
              </div>
            </div>

            {/* Turmas Planejadas */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-600 block uppercase">
                Turmas do Pool Disponíveis para Escolha dos Trainees:
              </label>
              <div className="space-y-2">
                {turmasPropostas.map((t) => (
                  <div key={t.id} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-xs">
                        {t.titulo}: {t.diaSemana.toUpperCase()} ({t.slotHorario})
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Local: {t.sala} • Capacidade: até {capacidadePorTurma} candidatos
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-1 rounded-md">
                      Auto-Agendamento
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl text-[11px] text-gray-600 border border-gray-200">
              💡 <strong>Como funciona:</strong> Ao confirmar, o pool de turmas é publicado no portal. Cada trainee escolhe seu horário com 1 clique e pode alterar autonomamente até 24h antes.
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1.4 ENTREVISTA INDIVIDUAL */}
      {/* ===================================================================== */}
      {ehEntrevista && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                <span>🎙️</span> Entrevista Individual PSE
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Handshake Bilateral Obrigatório
              </span>
            </div>

            {/* Seleção do Trainee Candidato */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                1. Candidato / Trainee Nominal *
              </label>
              <select
                value={candidatoEntrevistaMatricula}
                onChange={(e) => setCandidatoEntrevistaMatricula(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              >
                <option value="">Selecione o candidato trainee</option>
                {traineesPseTodos.map((t) => (
                  <option key={t.matricula} value={t.matricula}>
                    {t.nome} ({t.matricula} - {t.equipe})
                  </option>
                ))}
              </select>
            </div>

            {/* Seleção da Banca Avaliadora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">
                  2. Avaliador 1 (Líder / Membro) *
                </label>
                <select
                  value={avaliador1Matricula}
                  onChange={(e) => setAvaliador1Matricula(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione o avaliador 1</option>
                  {todosMembros.map((m) => (
                    <option key={m.matricula} value={m.matricula}>
                      {m.nome} ({m.equipe})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">
                  3. Avaliador 2 (Opcional / GP)
                </label>
                <select
                  value={avaliador2Matricula}
                  onChange={(e) => setAvaliador2Matricula(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione o avaliador 2</option>
                  {todosMembros.map((m) => (
                    <option key={m.matricula} value={m.matricula}>
                      {m.nome} ({m.equipe})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sugestões Triangulares PCH */}
            {slotsPchEntrevista.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">
                  ⭐ Horários Triangulares Compatíveis (100% Livres)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slotsPchEntrevista.slice(0, 4).map((slot) => (
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
                      className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-amber-900">{slot.diaNome}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.horarioInicio} - {slot.horarioFim}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Quórum 3/3
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-2.5 bg-gray-50 rounded-xl text-[11px] text-gray-600 border border-gray-200 space-y-1">
              <div>🤝 <strong>Confirmação Bilateral (Handshake):</strong> O candidato e os avaliadores receberão um card no portal para confirmar presença.</div>
              <div>🚨 <strong>Central SOS:</strong> Caso alguém não possa, a entrevista entra na fila de pendências para substituição de banca com 1 clique.</div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1.5 FOLLOW-UP SEMANAL */}
      {/* ===================================================================== */}
      {ehFollowUp && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <span>📋</span> Follow-Up Semanal Trainee (Assíncrono)
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                Plataforma APP PSE
              </span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">
                Grupos Trainee Destinatários
              </label>
              <select
                value={grupoFollowUp}
                onChange={(e) => setGrupoFollowUp(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="TODOS">Todos os Grupos Trainee (Convocação Geral)</option>
                {GRUPOS_TRAINEE_PADRAO.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome_grupo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Data Limite de Envio
                </label>
                <input
                  type="date"
                  value={formNovoEvento.data}
                  onChange={(e) => setFormNovoEvento((prev: any) => ({ ...prev, data: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Hora Limite (com tolerância)
                </label>
                <input
                  type="text"
                  value={prazoLimiteHora}
                  onChange={(e) => setPrazoLimiteHora(e.target.value)}
                  placeholder="23:59"
                  className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TÍTULO DA ATIVIDADE (EDITÁVEL) */}
      {/* ===================================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
            Título Oficial do Compromisso *
          </label>
          <input
            type="text"
            value={formNovoEvento.nome_capacitacao}
            onChange={(e) => setFormNovoEvento({ ...formNovoEvento, nome_capacitacao: e.target.value })}
            placeholder="Ex: Treinamento SolidWorks ou Reunião 360"
            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* ===================================================================== */}
        {/* CAMPOS COMUNS: DATA, HORÁRIOS, MODALIDADE E SALA COM CHOQUE */}
        {/* ===================================================================== */}
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide pt-1 border-t border-gray-100">
          Data, Horários & Local (com Detector de Choque de Salas)
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
                onChange={(e) => setFormNovoEvento({ ...formNovoEvento, hora_inicio: e.target.value })}
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

        {/* Local com Indicador Visual de Choque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              {formNovoEvento.modalidade === 'Presencial' ? 'Sala Física (com Checagem em Tempo Real) *' : 'Link da Reunião Online *'}
            </label>
            {formNovoEvento.modalidade === 'Presencial' ? (
              <select
                value={formNovoEvento.local_link}
                onChange={(e) => setFormNovoEvento({ ...formNovoEvento, local_link: e.target.value })}
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
                onChange={(e) => setFormNovoEvento({ ...formNovoEvento, local_link: e.target.value })}
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
              onChange={(e) => setFormNovoEvento({ ...formNovoEvento, ministrantes: e.target.value })}
              placeholder="Nomes separados por vírgula"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Pauta / Descrição */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
            {eh360
              ? 'Pauta / Metas da Semana & Feedbacks'
              : 'Pauta / Descrição do Compromisso (Opcional)'}
          </label>
          <textarea
            value={formNovoEvento.descricao}
            onChange={(e) => setFormNovoEvento({ ...formNovoEvento, descricao: e.target.value })}
            placeholder={
              eh360
                ? '• Metas da semana e status do projeto\n• Feedbacks individuais e do grupo\n• Dificuldades e bloqueios'
                : 'Detalhes da atividade, objetivos, orientações prévias...'
            }
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
