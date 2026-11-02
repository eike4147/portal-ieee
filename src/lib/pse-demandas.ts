/**
 * Regras de Negócio e De-Para de Demandas do Processo Trainee (PSE)
 * - De-Para Automático de Demandas por Curso e Convocação Coletiva de Grupos Trainee
 * - Configuração e Quórum Estrito de Reunião 360
 * - Matriz de Cobertura de Trainees para Dinâmicas de Grupo
 */

import {
  MembroParticipante,
  SlotRecomendadoPCH,
  GradePchSemanal,
  calcularSlotsRecomendadosPCH,
} from './pch-matching'
import PSE_SEED from './pse-seed-data.json'

export interface GrupoTrainee {
  id: string
  nome_grupo: string
  assessor_tecnico_matricula?: string
  assessor_tecnico_nome?: string
  assessor_rh_matricula?: string
  assessor_rh_nome?: string
  lider_matricula?: string
  lider_nome?: string
  integrantes_matriculas: string[]
}

export interface DemandaCurso {
  id: string
  id_curso: string
  equipe_sigla: string
  equipe_participante?: string
  marcado_por?: string
  id_grupo_trainee?: string
}

export const GRUPOS_TRAINEE_PADRAO: GrupoTrainee[] = PSE_SEED.grupos
export const DEMANDAS_PADRAO: DemandaCurso[] = PSE_SEED.demandas

/**
 * Normaliza siglas de equipes para casamento flexível (ex: 'RAS', 'WolfBotz (RAS)', 'Wolfbotz')
 */
function normalizarSiglaEquipe(texto: string): string {
  if (!texto) return ''
  const t = texto.toUpperCase()
  if (t.includes('RAS') || t.includes('ROBOTICA') || t.includes('WOLFBOTZ')) return 'RAS'
  if (t.includes('PES') || t.includes('POWER') || t.includes('WOLFPOWER')) return 'PES'
  if (t.includes('AESS') || t.includes('AEROSPACE') || t.includes('ROCKETWOLF')) return 'AESS'
  if (t.includes('CS') || t.includes('COMPUTER') || t.includes('WOLFBYTE')) return 'CS'
  if (t.includes('SSIT') || t.includes('SOCIALWOLF')) return 'SSIT'
  if (t.includes('WIE') || t.includes('WOMEN')) return 'WIE'
  if (t.includes('GP') || t.includes('GESTÃO DE PESSOAS') || t.includes('RECRUTAMENTO')) return 'GP'
  return t
}

/**
 * 🎓 Categoria 1.1: Resolve os trainees convocados para um curso oficial através do De-Para de Demandas.
 * Se o presidente de qualquer equipe que compõe um Grupo Trainee demandou o curso,
 * TODO o grupo trainee é convocado coletivamente para manter o alinhamento do projeto.
 */
export function resolverTraineesPorCursoDemanda(
  idCurso: string,
  grupos: GrupoTrainee[] = GRUPOS_TRAINEE_PADRAO,
  demandas: DemandaCurso[] = DEMANDAS_PADRAO,
  todosMembros: MembroParticipante[] = []
): {
  gruposConvocados: GrupoTrainee[]
  matriculasConvocadas: string[]
  traineesResolvidos: MembroParticipante[]
  equipesDemandantes: string[]
} {
  if (!idCurso) {
    return {
      gruposConvocados: [],
      matriculasConvocadas: [],
      traineesResolvidos: [],
      equipesDemandantes: [],
    }
  }

  // 1. Busca todas as demandas cadastradas para este curso
  const demandasDoCurso = demandas.filter(
    (d) => d.id_curso.trim().toUpperCase() === idCurso.trim().toUpperCase()
  )

  const siglasDemandantes = Array.from(
    new Set(
      demandasDoCurso
        .map((d) => normalizarSiglaEquipe(d.equipe_sigla || d.equipe_participante || ''))
        .filter((s) => s.length > 0)
    )
  )

  // 2. Identifica quais grupos possuem vínculo com essas equipes demandantes
  const gruposConvocados = grupos.filter((g) => {
    const nomeNormalizado = normalizarSiglaEquipe(g.nome_grupo)
    const contemEquipe = siglasDemandantes.some((sigla) => {
      const gUpper = g.nome_grupo.toUpperCase()
      return (
        gUpper.includes(sigla) ||
        nomeNormalizado.includes(sigla) ||
        (sigla === 'RAS' && gUpper.includes('WOLFBOTZ')) ||
        (sigla === 'PES' && gUpper.includes('WOLFPOWER')) ||
        (sigla === 'AESS' && gUpper.includes('ROCKETWOLF')) ||
        (sigla === 'CS' && gUpper.includes('WOLFBYTE')) ||
        (sigla === 'SSIT' && gUpper.includes('SOCIALWOLF'))
      )
    })
    return contemEquipe
  })

  // Se nenhuma equipe específica foi encontrada (ex: curso geral), ou se a demanda era "TODOS"
  const ehGeralOuTodos = demandasDoCurso.some(
    (d) =>
      (d.equipe_participante && d.equipe_participante.toUpperCase().includes('TODOS')) ||
      (d.equipe_sigla && d.equipe_sigla.toUpperCase().includes('TODOS'))
  )

  const gruposFinais = ehGeralOuTodos ? grupos : gruposConvocados

  // 3. Coleta todas as matrículas dos integrantes dos grupos convocados
  const matriculasSet = new Set<string>()
  gruposFinais.forEach((g) => {
    g.integrantes_matriculas.forEach((m) => {
      if (m && m.trim()) matriculasSet.add(m.trim().toUpperCase())
    })
  })

  const matriculasConvocadas = Array.from(matriculasSet)

  // 4. Resolve os objetos MembroParticipante a partir do banco
  const traineesResolvidos = todosMembros.filter((m) =>
    matriculasSet.has(m.matricula.trim().toUpperCase())
  )

  return {
    gruposConvocados: gruposFinais,
    matriculasConvocadas,
    traineesResolvidos,
    equipesDemandantes: siglasDemandantes,
  }
}

/**
 * 🔄 Categoria 1.2: Resolve os participantes convocados para a Reunião 360 de um grupo específico.
 * Atrela automaticamente os trainees do grupo + Assessor Trainee responsável + auditoria GP/R&S.
 */
export function resolverPublicoReuniao360(
  idGrupo: string,
  grupos: GrupoTrainee[] = GRUPOS_TRAINEE_PADRAO,
  todosMembros: MembroParticipante[] = []
): {
  grupo?: GrupoTrainee
  trainees: MembroParticipante[]
  assessorTecnico?: MembroParticipante
  assessorRh?: MembroParticipante
  participantesObrigatorios: MembroParticipante[]
  matriculasObrigatorias: string[]
  auditoresGpRs: MembroParticipante[]
} {
  const grupo = grupos.find((g) => g.id === idGrupo)
  if (!grupo) {
    return {
      trainees: [],
      participantesObrigatorios: [],
      matriculasObrigatorias: [],
      auditoresGpRs: [],
    }
  }

  const matTraineesSet = new Set(
    grupo.integrantes_matriculas.map((m) => m.trim().toUpperCase())
  )

  const trainees = todosMembros.filter((m) =>
    matTraineesSet.has(m.matricula.trim().toUpperCase())
  )

  const matAssessorTec = grupo.assessor_tecnico_matricula?.trim().toUpperCase()
  const matAssessorRh = grupo.assessor_rh_matricula?.trim().toUpperCase()

  const assessorTecnico = todosMembros.find(
    (m) => matAssessorTec && m.matricula.trim().toUpperCase() === matAssessorTec
  )
  const assessorRh = todosMembros.find(
    (m) => matAssessorRh && m.matricula.trim().toUpperCase() === matAssessorRh
  )

  const participantesObrigatorios = [...trainees]
  if (assessorTecnico && !participantesObrigatorios.some((p) => p.matricula === assessorTecnico.matricula)) {
    participantesObrigatorios.push(assessorTecnico)
  }
  if (assessorRh && !participantesObrigatorios.some((p) => p.matricula === assessorRh.matricula)) {
    participantesObrigatorios.push(assessorRh)
  }

  // Membros de GP e R&S para auditoria institucional (não obrigatórios, mas visíveis)
  const auditoresGpRs = todosMembros.filter((m) => {
    const eq = (m.equipe || '').toUpperCase()
    return eq.includes('PESSOAS') || eq.includes('RECRUTAMENTO') || eq.includes('GP') || eq.includes('R&S')
  })

  return {
    grupo,
    trainees,
    assessorTecnico,
    assessorRh,
    participantesObrigatorios,
    matriculasObrigatorias: participantesObrigatorios.map((p) => p.matricula),
    auditoresGpRs,
  }
}

/**
 * Calcula slots com 100% de quórum estrito (Slots de Ouro) para os participantes convocados
 */
export function calcularSlotsQuorumEstrito100(
  participantes: MembroParticipante[],
  pchsPorMembro: Record<string, GradePchSemanal>,
  modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido' = 'Presencial',
  dataReferencia?: string
): SlotRecomendadoPCH[] {
  const todosSlots = calcularSlotsRecomendadosPCH(
    participantes,
    pchsPorMembro,
    modalidade,
    dataReferencia
  )
  return todosSlots.filter((slot) => slot.ehOuro || slot.percentualQuorum === 100)
}

/**
 * 🤝 Categoria 1.3: Calcula a Taxa de Cobertura de Trainees para um conjunto de Turmas de Dinâmica propostas.
 * Verifica se 100% dos trainees possuem PELO MENOS 1 horário de turma livre na sua PCH.
 */
export function calcularCoberturaDinamicaTurmas(
  trainees: MembroParticipante[],
  pchsPorMembro: Record<string, GradePchSemanal>,
  turmasPropostas: Array<{
    id: string
    titulo: string
    diaSemana: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'
    slotHorario: string // ex: "14:00" ou "14:00-16:00"
    slot1h: string // ex: "14:00"
  }>,
  modalidade: 'Presencial' | 'Online' = 'Presencial'
): {
  taxaCobertura: number
  totalTrainees: number
  candidatosCobertosCount: number
  traineesSemOpcao: MembroParticipante[]
  detalhePorTurma: Array<{
    turmaId: string
    titulo: string
    traineesAptosCount: number
  }>
} {
  if (trainees.length === 0 || turmasPropostas.length === 0) {
    return {
      taxaCobertura: 0,
      totalTrainees: trainees.length,
      candidatosCobertosCount: 0,
      traineesSemOpcao: trainees,
      detalhePorTurma: [],
    }
  }

  const detalhePorTurma = turmasPropostas.map((turma) => {
    let aptos = 0
    trainees.forEach((t) => {
      const pch = pchsPorMembro[t.matricula] || pchsPorMembro[t.id]
      if (!pch || !pch[turma.diaSemana]) {
        aptos++ // se não tem PCH, considera sem restrição declarada
        return
      }
      const slot = pch[turma.diaSemana]?.[turma.slot1h]
      if (!slot) {
        aptos++
        return
      }
      const livre = modalidade === 'Presencial' ? slot.presencial : (slot.online || slot.presencial)
      if (livre) aptos++
    })
    return {
      turmaId: turma.id,
      titulo: turma.titulo,
      traineesAptosCount: aptos,
    }
  })

  // Para cada trainee, verifica se ele pode em pelo menos 1 turma
  const traineesSemOpcao: MembroParticipante[] = []
  let cobertosCount = 0

  trainees.forEach((t) => {
    const pch = pchsPorMembro[t.matricula] || pchsPorMembro[t.id]
    if (!pch) {
      cobertosCount++
      return
    }

    const podeEmAlgumaTurma = turmasPropostas.some((turma) => {
      const diaData = pch[turma.diaSemana]
      if (!diaData) return true
      const slot = diaData[turma.slot1h]
      if (!slot) return true
      return modalidade === 'Presencial' ? slot.presencial : (slot.online || slot.presencial)
    })

    if (podeEmAlgumaTurma) {
      cobertosCount++
    } else {
      traineesSemOpcao.push(t)
    }
  })

  const taxaCobertura = Math.round((cobertosCount / trainees.length) * 100)

  return {
    taxaCobertura,
    totalTrainees: trainees.length,
    candidatosCobertosCount: cobertosCount,
    traineesSemOpcao,
    detalhePorTurma,
  }
}
