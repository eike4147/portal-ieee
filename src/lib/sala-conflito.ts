/**
 * Detector em Tempo Real de Choque de Salas Físicas do CEFET-RJ
 * Verifica se uma sala já está reservada por outro evento presencial no mesmo dia e intervalo de horário.
 */

export interface StatusSalaConflito {
  sala: string
  disponivel: boolean
  eventoOcupante?: {
    id: string
    nome_capacitacao: string
    hora_inicio: string
    hora_fim: string
    equipe_responsavel?: string
  }
}

export interface EventoParaChecagemSala {
  id: string
  nome_capacitacao: string
  data: string
  hora_inicio: string
  hora_fim: string
  modalidade: string
  local_link?: string | null
  status?: string
  equipe_responsavel?: string
}

/**
 * Converte 'HH:MM' em minutos desde 00:00 para comparação numérica exata
 */
function horaParaMinutos(horaStr: string): number {
  if (!horaStr) return 0
  const partes = horaStr.split(':')
  const h = parseInt(partes[0] || '0', 10)
  const m = parseInt(partes[1] || '0', 10)
  return h * 60 + m
}

/**
 * Avalia se dois intervalos [ini1, fim1] e [ini2, fim2] possuem sobreposição
 */
function haSobreposicaoHorario(ini1: string, fim1: string, ini2: string, fim2: string): boolean {
  const mIni1 = horaParaMinutos(ini1)
  const mFim1 = horaParaMinutos(fim1)
  const mIni2 = horaParaMinutos(ini2)
  const mFim2 = horaParaMinutos(fim2)

  return mIni1 < mFim2 && mFim1 > mIni2
}

/**
 * Verifica a disponibilidade de uma lista de salas físicas em uma determinada data e horário
 */
export function verificarDisponibilidadeSalas(
  salas: string[],
  data: string,
  horaInicio: string,
  horaFim: string,
  eventosExistentes: EventoParaChecagemSala[],
  idEventoAtual?: string
): StatusSalaConflito[] {
  if (!data || !horaInicio || !horaFim) {
    return salas.map((sala) => ({
      sala,
      disponivel: true,
    }))
  }

  // Filtra eventos presenciais ativos no mesmo dia
  const eventosNoMesmoDia = eventosExistentes.filter((evt) => {
    if (evt.id === idEventoAtual) return false
    if (evt.status === 'Cancelada') return false
    if (evt.modalidade !== 'Presencial') return false
    if (!evt.data || !evt.local_link) return false

    // Normaliza formato YYYY-MM-DD
    const dataEvt = evt.data.substring(0, 10)
    const dataAlvo = data.substring(0, 10)
    if (dataEvt !== dataAlvo) return false

    return haSobreposicaoHorario(horaInicio, horaFim, evt.hora_inicio, evt.hora_fim)
  })

  return salas.map((sala) => {
    const salaNormalizada = sala.trim().toLowerCase()

    const eventoConflito = eventosNoMesmoDia.find((evt) => {
      const localNormalizado = (evt.local_link || '').trim().toLowerCase()
      return (
        localNormalizado === salaNormalizada ||
        localNormalizado.includes(salaNormalizada) ||
        salaNormalizada.includes(localNormalizado)
      )
    })

    if (eventoConflito) {
      return {
        sala,
        disponivel: false,
        eventoOcupante: {
          id: eventoConflito.id,
          nome_capacitacao: eventoConflito.nome_capacitacao,
          hora_inicio: eventoConflito.hora_inicio,
          hora_fim: eventoConflito.hora_fim,
          equipe_responsavel: eventoConflito.equipe_responsavel,
        },
      }
    }

    return {
      sala,
      disponivel: true,
    }
  })
}
