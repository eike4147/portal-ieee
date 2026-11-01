export const MAPA_SUFIXOS_CURSOS: Record<string, { curso: string; grau: string }> = {
  BCC: { curso: 'Ciência da Computação', grau: 'Graduação' },
  GAUT: { curso: 'Engenharia de Controle e Automação', grau: 'Graduação' },
  GELT: { curso: 'Engenharia Eletrônica', grau: 'Graduação' },
  GMEC: { curso: 'Engenharia Mecânica', grau: 'Graduação' },
  SINF: { curso: 'Sistemas de Informação', grau: 'Graduação' },
  GEL: { curso: 'Engenharia Elétrica', grau: 'Graduação' },
  GTEL: { curso: 'Engenharia de Telecomunicações', grau: 'Graduação' },
  GFIS: { curso: 'Física (Bacharelado / Licenciatura)', grau: 'Graduação' },
  GAMB: { curso: 'Engenharia Ambiental', grau: 'Graduação' },
  GPRO: { curso: 'Engenharia de Produção', grau: 'Graduação' },
  GADM: { curso: 'Bacharelado em Administração', grau: 'Graduação' },
  GCIV: { curso: 'Engenharia Civil', grau: 'Graduação' },
  GMET: { curso: 'Engenharia Metalúrgica', grau: 'Graduação' },
  TELT: { curso: 'Técnico em Eletrônica', grau: 'Técnico' },
  TELET: { curso: 'Técnico em Eletrotécnica', grau: 'Técnico' },
  TMEC: { curso: 'Técnico em Mecânica', grau: 'Técnico' },
  TINF: { curso: 'Técnico em Informática', grau: 'Técnico' },
  TADM: { curso: 'Técnico em Administração', grau: 'Técnico' },
  TSEG: { curso: 'Técnico em Segurança do Trabalho', grau: 'Técnico' },
  TMET: { curso: 'Técnico em Meteorologia', grau: 'Técnico' },
}

export const LISTA_CURSOS_CEFET = [
  'Ciência da Computação',
  'Engenharia de Controle e Automação',
  'Engenharia Eletrônica',
  'Engenharia Mecânica',
  'Sistemas de Informação',
  'Engenharia Elétrica',
  'Engenharia de Telecomunicações',
  'Física (Bacharelado / Licenciatura)',
  'Engenharia Ambiental',
  'Engenharia de Produção',
  'Bacharelado em Administração',
  'Engenharia Civil',
  'Engenharia Metalúrgica',
  'Técnico em Eletrônica',
  'Técnico em Eletrotécnica',
  'Técnico em Mecânica',
  'Técnico em Informática',
  'Técnico em Administração',
  'Técnico em Segurança do Trabalho',
  'Técnico em Meteorologia',
  'Outro',
]

export const LISTA_PERIODOS = [
  '1º Período',
  '2º Período',
  '3º Período',
  '4º Período',
  '5º Período',
  '6º Período',
  '7º Período',
  '8º Período',
  '9º Período',
  '10º Período',
  '11º+ / Formando',
  'Pós-Graduação / Mestrado',
]

export function detectarCursoDaMatricula(matricula: string): string {
  if (!matricula) return ''
  const m = matricula.trim().toUpperCase().match(/([A-Z]+)$/)
  if (!m) return ''
  const sufixo = m[1]
  if (MAPA_SUFIXOS_CURSOS[sufixo]) {
    return MAPA_SUFIXOS_CURSOS[sufixo].curso
  }
  return ''
}

export function sugerirPeriodoDaMatricula(matricula: string): string {
  if (!matricula) return '1º Período'
  const m = matricula.trim().match(/^(\d{2})(\d)/)
  if (!m) return '1º Período'
  const anoIngresso = 2000 + parseInt(m[1], 10)
  const semIngresso = parseInt(m[2], 10)
  const agora = new Date()
  const anoAtual = agora.getFullYear()
  const mesAtual = agora.getMonth() + 1
  const semAtual = mesAtual <= 6 ? 1 : 2

  const semestres = (anoAtual - anoIngresso) * 2 + (semAtual - semIngresso) + 1
  if (semestres >= 1 && semestres <= 10) {
    return `${semestres}º Período`
  }
  if (semestres > 10) {
    return '11º+ / Formando'
  }
  return '1º Período'
}

export function aplicarMascaraCPF(valor: string): string {
  let v = valor.replace(/\D/g, '')
  if (v.length > 11) v = v.substring(0, 11)
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return v
}

export function aplicarMascaraTelefone(valor: string): string {
  let v = valor.replace(/\D/g, '')
  if (v.length > 11) v = v.substring(0, 11)
  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  } else if (v.length > 5) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
  } else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d*)$/, '($1) $2')
  }
  return v
}

export function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}
