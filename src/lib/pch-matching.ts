// Motor de Resolução de Audiência & Cruzamento de PCH em Tempo Real
// Portal IEEE CEFET-RJ

import { CATALOGO_HIERARQUIA, EQUIPES_OFICIAIS, obterSubequipes } from './catalogo-cargos'

export type NivelCargoAlvo = 'PRESIDENCIA' | 'LIDERANCA' | 'ASSESSOR' | 'MEMBRO' | 'TRAINEE'

export interface PublicoConfig {
  modo: 'todos' | 'minha_equipe' | 'liderancas' | 'personalizado'
  niveis_cargos: NivelCargoAlvo[]
  equipes: string[]
  subequipes: string[]
  membros_especificos: string[] // IDs ou Matrículas
  grupos_pse?: string[]
  total_estimado?: number
}

export interface MembroParticipante {
  id: string
  matricula: string
  nome: string
  equipe: string
  subequipe?: string
  cargo: string
  nivelAcesso: 'ADMIN' | 'GESTOR' | 'LIDER' | 'MEMBRO' | 'TRAINEE'
  tipo_membro?: string // 'Ativo', 'Trainee', etc.
  foto_url?: string
  grupo_pse?: string
}

export interface SlotModalidade {
  presencial: boolean
  online: boolean
}

export type GradePchSemanal = Record<string, Record<string, SlotModalidade>>

export interface SlotRecomendadoPCH {
  id: string
  diaSemana: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'
  diaNome: string
  dataSugerida: string // YYYY-MM-DD
  horarioInicio: string
  horarioFim: string
  slotFormatado: string // Ex: "Terça-feira, 14:00 - 16:00"
  totalParticipantes: number
  disponiveisCount: number
  percentualQuorum: number // Ex: 100 ou 85
  ehOuro: boolean // true se 100% livres
  nomesOcupados: string[]
  nomesDisponiveis: string[]
}

const DIAS_NOMES: Record<string, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
}

const DIAS_INDICE: Record<string, number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
}

// ---------------------------------------------------------------------------
// 1. RESOLUÇÃO DE PARTICIPANTES CONVOCADOS
// ---------------------------------------------------------------------------

export function resolverParticipantes(
  config: PublicoConfig,
  todosMembros: MembroParticipante[],
  usuarioAtual?: MembroParticipante | null
): MembroParticipante[] {
  if (!todosMembros || todosMembros.length === 0) return []

  // Mapa de IDs ou Matrículas diretas
  const especificosSet = new Set(
    (config.membros_especificos || []).map((m) => m.toLowerCase().trim())
  )

  // 1. Modo "Todo o Ramo"
  if (config.modo === 'todos') {
    return todosMembros
  }

  // 2. Modo "Minha Equipe"
  if (config.modo === 'minha_equipe') {
    const equipeUsuario = usuarioAtual?.equipe || 'Geral'
    return todosMembros.filter(
      (m) =>
        m.equipe.toLowerCase() === equipeUsuario.toLowerCase() ||
        especificosSet.has(m.id.toLowerCase()) ||
        especificosSet.has(m.matricula.toLowerCase())
    )
  }

  // 3. Modo "Todas as Lideranças"
  if (config.modo === 'liderancas') {
    return todosMembros.filter((m) => {
      if (especificosSet.has(m.id.toLowerCase()) || especificosSet.has(m.matricula.toLowerCase())) {
        return true
      }
      const nivel = m.nivelAcesso?.toUpperCase()
      const cargo = (m.cargo || '').toLowerCase()
      const ehLider =
        nivel === 'ADMIN' ||
        nivel === 'GESTOR' ||
        nivel === 'LIDER' ||
        cargo.includes('presidente') ||
        cargo.includes('diretor') ||
        cargo.includes('líder') ||
        cargo.includes('lider') ||
        cargo.includes('capit') ||
        cargo.includes('coordenador')
      return ehLider
    })
  }

  // 4. Modo "Personalizado"
  const equipesFiltro = new Set((config.equipes || []).map((e) => e.toLowerCase().trim()))
  const subequipesFiltro = new Set((config.subequipes || []).map((s) => s.toLowerCase().trim()))
  const niveisFiltro = new Set((config.niveis_cargos || []).map((n) => n.toUpperCase()))

  const resultado: MembroParticipante[] = []
  const idsJaInseridos = new Set<string>()

  for (const m of todosMembros) {
    const mId = m.id.toLowerCase()
    const mMat = m.matricula.toLowerCase()

    // Se está na lista de convidados específicos, entra obrigatoriamente
    if (especificosSet.has(mId) || especificosSet.has(mMat)) {
      if (!idsJaInseridos.has(m.matricula)) {
        resultado.push(m)
        idsJaInseridos.add(m.matricula)
      }
      continue
    }

    // Se nenhum filtro foi marcado e não é específico, não inclui
    const temFiltroEquipe = equipesFiltro.size > 0
    const temFiltroNivel = niveisFiltro.size > 0

    if (!temFiltroEquipe && !temFiltroNivel) {
      continue
    }

    // Filtro de Equipe
    let matchEquipe = true
    if (temFiltroEquipe) {
      matchEquipe = equipesFiltro.has((m.equipe || '').toLowerCase().trim())
      // Se tiver filtro de subequipe ativo, refina
      if (matchEquipe && subequipesFiltro.size > 0 && m.subequipe) {
        matchEquipe = subequipesFiltro.has(m.subequipe.toLowerCase().trim())
      }
    }

    // Filtro de Nível de Cargo
    let matchNivel = true
    if (temFiltroNivel) {
      const nivel = converterNivelParaCategoria(m.nivelAcesso, m.cargo, m.tipo_membro)
      matchNivel = niveisFiltro.has(nivel)
    }

    if (matchEquipe && matchNivel) {
      if (!idsJaInseridos.has(m.matricula)) {
        resultado.push(m)
        idsJaInseridos.add(m.matricula)
      }
    }
  }

  return resultado
}

function converterNivelParaCategoria(
  nivelAcesso?: string,
  cargo?: string,
  tipoMembro?: string
): NivelCargoAlvo {
  const c = (cargo || '').toLowerCase()
  const t = (tipoMembro || '').toLowerCase()
  const na = (nivelAcesso || '').toUpperCase()

  if (t === 'trainee' || na === 'TRAINEE' || c.includes('trainee')) return 'TRAINEE'
  if (c.includes('presidente') || c.includes('presidência') || c.includes('vice-presidente')) return 'PRESIDENCIA'
  if (na === 'ADMIN' || na === 'GESTOR' || na === 'LIDER' || c.includes('diretor') || c.includes('líder') || c.includes('coordenador')) {
    return 'LIDERANCA'
  }
  if (c.includes('assessor')) return 'ASSESSOR'
  return 'MEMBRO'
}

// ---------------------------------------------------------------------------
// 2. MOTOR DE RECOMENDAÇÃO DE HORÁRIOS DA PCH ("SLOTS DE OURO")
// ---------------------------------------------------------------------------

export const HORARIOS_PADRAO_PCH = [
  { inicio: '08:00', fim: '10:00', slots1h: ['08:00 - 09:00', '09:00 - 10:00'] },
  { inicio: '10:00', fim: '12:00', slots1h: ['10:00 - 11:00', '11:00 - 12:00'] },
  { inicio: '12:00', fim: '14:00', slots1h: ['12:00 - 13:00', '13:00 - 14:00'] },
  { inicio: '14:00', fim: '16:00', slots1h: ['14:00 - 15:00', '15:00 - 16:00'] },
  { inicio: '16:00', fim: '18:00', slots1h: ['16:00 - 17:00', '17:00 - 18:00'] },
  { inicio: '18:00', fim: '20:00', slots1h: ['18:00 - 19:00', '19:00 - 20:00'] },
  { inicio: '20:00', fim: '22:00', slots1h: ['20:00 - 21:00', '21:00 - 22:00'] },
]

export function calcularSlotsRecomendadosPCH(
  participantes: MembroParticipante[],
  pchsPorMembro: Record<string, GradePchSemanal>,
  modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido' = 'Presencial',
  dataReferencia?: string
): SlotRecomendadoPCH[] {
  if (!participantes || participantes.length === 0) return []

  const dias: ('seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab')[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const total = participantes.length
  const candidatos: SlotRecomendadoPCH[] = []

  // Calcula datas para os próximos dias da semana
  const baseDate = dataReferencia ? new Date(`${dataReferencia}T12:00:00`) : new Date()

  for (const dia of dias) {
    const dataCalculada = obterProximaDataParaDia(dia, baseDate)

    for (const bloco of HORARIOS_PADRAO_PCH) {
      const nomesDisponiveis: string[] = []
      const nomesOcupados: string[] = []

      for (const p of participantes) {
        // Tenta achar a PCH por matrícula ou ID
        const pch = pchsPorMembro[p.matricula] || pchsPorMembro[p.id]

        if (!pch || !pch[dia]) {
          // Sem PCH cadastrada: considera ocupado por precaução
          nomesOcupados.push(p.nome)
          continue
        }

        // Verifica se está livre em todos os slots do bloco
        let livreEmTodos = true
        for (const slot1h of bloco.slots1h) {
          const slotData = pch[dia][slot1h]
          if (!slotData) {
            livreEmTodos = false
            break
          }

          if (modalidade === 'Presencial') {
            if (!slotData.presencial) {
              livreEmTodos = false
              break
            }
          } else {
            // Online, Híbrido ou Gravada
            if (!slotData.online && !slotData.presencial) {
              livreEmTodos = false
              break
            }
          }
        }

        if (livreEmTodos) {
          nomesDisponiveis.push(p.nome)
        } else {
          nomesOcupados.push(p.nome)
        }
      }

      const disponiveisCount = nomesDisponiveis.length
      const percentual = total > 0 ? Math.round((disponiveisCount / total) * 100) : 0
      const ehOuro = disponiveisCount === total

      // Só consideramos horários com pelo menos 50% de quórum para sugestões
      if (percentual >= 50) {
        candidatos.push({
          id: `${dia}-${bloco.inicio}-${bloco.fim}`,
          diaSemana: dia,
          diaNome: DIAS_NOMES[dia] || dia,
          dataSugerida: dataCalculada,
          horarioInicio: bloco.inicio,
          horarioFim: bloco.fim,
          slotFormatado: `${DIAS_NOMES[dia]}, ${bloco.inicio} - ${bloco.fim}`,
          totalParticipantes: total,
          disponiveisCount,
          percentualQuorum: percentual,
          ehOuro,
          nomesOcupados,
          nomesDisponiveis,
        })
      }
    }
  }

  // Ordenação de Qualidade:
  // 1. Slots de Ouro (100%) no topo
  // 2. Maior percentual de quórum
  // 3. Maior quórum absoluto
  // 4. Horários entre 13h e 19h (preferência típica universitária)
  candidatos.sort((a, b) => {
    if (a.ehOuro && !b.ehOuro) return -1
    if (!a.ehOuro && b.ehOuro) return 1
    if (b.percentualQuorum !== a.percentualQuorum) {
      return b.percentualQuorum - a.percentualQuorum
    }
    return a.horarioInicio.localeCompare(b.horarioInicio)
  })

  return candidatos.slice(0, 6) // Retorna até 6 melhores opções
}

function obterProximaDataParaDia(diaAlvo: string, dataBase: Date): string {
  const alvoIndex = DIAS_INDICE[diaAlvo] ?? 1
  const d = new Date(dataBase)
  const diaAtual = d.getDay() // 0 = dom, 1 = seg...

  let diasFaltam = alvoIndex - diaAtual
  if (diasFaltam < 0) {
    diasFaltam += 7
  } else if (diasFaltam === 0) {
    // Se hoje é o dia alvo, agenda para a próxima semana para dar prazo
    diasFaltam = 7
  }

  d.setDate(d.getDate() + diasFaltam)
  return d.toISOString().substring(0, 10)
}

// ---------------------------------------------------------------------------
// 3. FORMATADORES E RESUMOS HUMANOS
// ---------------------------------------------------------------------------

export function formatarDescricaoPublico(config: PublicoConfig, total: number): string {
  if (config.modo === 'todos') {
    return `Todo o Ramo Estudantil IEEE (${total} membros)`
  }
  if (config.modo === 'minha_equipe') {
    return `Membros da Equipe (${total} pessoas)`
  }
  if (config.modo === 'liderancas') {
    return `Todas as Lideranças e Diretoria (${total} pessoas)`
  }

  const partes: string[] = []
  if (config.equipes && config.equipes.length > 0) {
    partes.push(config.equipes.join(', '))
  }
  if (config.subequipes && config.subequipes.length > 0) {
    partes.push(`Subequipes: ${config.subequipes.join(', ')}`)
  }
  if (config.niveis_cargos && config.niveis_cargos.length > 0) {
    partes.push(`Papéis: ${config.niveis_cargos.join(', ')}`)
  }
  if (config.membros_especificos && config.membros_especificos.length > 0) {
    partes.push(`+${config.membros_especificos.length} convidado(s) individual(is)`)
  }

  return partes.length > 0 ? `${partes.join(' • ')} (${total} selecionados)` : `Personalizado (${total} selecionados)`
}
