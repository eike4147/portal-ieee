// Catálogo Central Padronizado de Cargos do Ramo Estudantil IEEE CEFET-RJ
// Baseado no Estatuto e na matriz CARGOS_ESTRUTURA

export interface CargoItem {
  id: string
  nome: string
  departamento: string
  nivelAcesso: 'Admin' | 'Gestor' | 'Lider' | 'Membro' | 'Trainee'
  peso: number
  descricao?: string
  permiteAbrirSala?: boolean
}

export const DEPARTAMENTOS_RAMO = [
  'Presidência',
  'Gestão de Pessoas',
  'Marketing',
  'Financeiro',
  'Projetos',
  'WolfBotz (Robótica - RAS)',
  'WolfByte (Computação - CS)',
  'WolfPower (Energia - PES)',
  'WIE (Afinidade / Mulheres na Eng.)',
  'TI & Sistemas',
] as const

export type DepartamentoRamo = typeof DEPARTAMENTOS_RAMO[number]

export const CATALOGO_CARGOS_PADRAO: CargoItem[] = [
  // 1. Presidência
  {
    id: 'PRES',
    nome: 'Presidente',
    departamento: 'Presidência',
    nivelAcesso: 'Admin',
    peso: 3.0,
    descricao: 'Representação institucional e liderança geral do Ramo Estudantil.',
    permiteAbrirSala: true,
  },
  {
    id: 'VICE_PRES',
    nome: 'Vice-Presidente',
    departamento: 'Presidência',
    nivelAcesso: 'Admin',
    peso: 3.0,
    descricao: 'Suporte executivo, gestão de conformidade e vice-liderança institucional.',
    permiteAbrirSala: true,
  },

  // 2. Gestão de Pessoas (GP / R&S)
  {
    id: 'DIR_GP',
    nome: 'Diretor de Gestão de Pessoas',
    departamento: 'Gestão de Pessoas',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Coordenação estratégica de clima, retenção, PCH e movimentação de membros.',
    permiteAbrirSala: true,
  },
  {
    id: 'LIDER_RS',
    nome: 'Líder de Recrutamento & Seleção (R&S)',
    departamento: 'Gestão de Pessoas',
    nivelAcesso: 'Lider',
    peso: 1.0,
    descricao: 'Coordenação operacional do Processo Seletivo (PSE) e integração de trainees.',
    permiteAbrirSala: true,
  },
  {
    id: 'ASSESSOR_GP',
    nome: 'Assessor de Gestão de Pessoas',
    departamento: 'Gestão de Pessoas',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Acompanhamento de equipes, frequência e suporte aos membros.',
    permiteAbrirSala: true,
  },

  // 3. Marketing
  {
    id: 'DIR_MKT',
    nome: 'Diretor de Marketing',
    departamento: 'Marketing',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Gestão de marca institucional, comunicação e captação do Ramo.',
    permiteAbrirSala: true,
  },
  {
    id: 'ASSESSOR_MKT',
    nome: 'Assessor de Marketing & Criação',
    departamento: 'Marketing',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Criação de artes, edição de mídias e gestão de redes sociais.',
    permiteAbrirSala: true,
  },

  // 4. Financeiro
  {
    id: 'DIR_FIN',
    nome: 'Diretor Financeiro',
    departamento: 'Financeiro',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Fluxo de caixa, prestação de contas com IEEE Section e orçamentos.',
    permiteAbrirSala: true,
  },
  {
    id: 'ASSESSOR_FIN',
    nome: 'Assessor Financeiro & Patrocínios',
    departamento: 'Financeiro',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Controle de reembolsos, compras e captação de recursos.',
    permiteAbrirSala: true,
  },

  // 5. Projetos
  {
    id: 'DIR_PROJ',
    nome: 'Diretor de Projetos',
    departamento: 'Projetos',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Supervisão de cronogramas, metodologias ágeis e entrega de projetos.',
    permiteAbrirSala: true,
  },
  {
    id: 'LIDER_PROJ',
    nome: 'Líder de Projeto',
    departamento: 'Projetos',
    nivelAcesso: 'Lider',
    peso: 1.0,
    descricao: 'Liderança técnica e gestão de equipe em projeto específico.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_PROJ',
    nome: 'Membro Projetista',
    departamento: 'Projetos',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Desenvolvimento e execução técnica em projetos do Ramo.',
    permiteAbrirSala: true,
  },

  // 6. WolfBotz (Robótica - RAS)
  {
    id: 'COORD_RAS',
    nome: 'Coordenador WolfBotz / RAS',
    departamento: 'WolfBotz (Robótica - RAS)',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Coordenação do capítulo técnico RAS e equipe de competição WolfBotz.',
    permiteAbrirSala: true,
  },
  {
    id: 'LIDER_COMBATE',
    nome: 'Líder de Subequipe (Combate / Autônomo)',
    departamento: 'WolfBotz (Robótica - RAS)',
    nivelAcesso: 'Lider',
    peso: 1.0,
    descricao: 'Liderança técnica da categoria de robôs de combate e autônomos.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_RAS',
    nome: 'Membro Projetista (Robótica)',
    departamento: 'WolfBotz (Robótica - RAS)',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Desenvolvimento de hardware, mecânica ou software embarcado na WolfBotz.',
    permiteAbrirSala: true,
  },

  // 7. WolfByte (Computação - CS)
  {
    id: 'COORD_CS',
    nome: 'Coordenador WolfByte / CS',
    departamento: 'WolfByte (Computação - CS)',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Coordenação do capítulo CS e equipe de desenvolvimento de software.',
    permiteAbrirSala: true,
  },
  {
    id: 'LIDER_DEV',
    nome: 'Líder de Desenvolvimento (Tech Lead)',
    departamento: 'WolfByte (Computação - CS)',
    nivelAcesso: 'Lider',
    peso: 1.0,
    descricao: 'Arquitetura técnica, revisão de código e mentoria de desenvolvedores.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_DEV',
    nome: 'Membro Desenvolvedor (Software)',
    departamento: 'WolfByte (Computação - CS)',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Desenvolvimento fullstack, frontend, backend ou mobile na WolfByte.',
    permiteAbrirSala: true,
  },

  // 8. WolfPower (Energia - PES)
  {
    id: 'COORD_PES',
    nome: 'Coordenador WolfPower / PES',
    departamento: 'WolfPower (Energia - PES)',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Coordenação do capítulo técnico de sistemas de potência e energia.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_PES',
    nome: 'Membro Projetista (Energia & Potência)',
    departamento: 'WolfPower (Energia - PES)',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Pesquisa, simulação e desenvolvimento de sistemas elétricos e energéticos.',
    permiteAbrirSala: true,
  },

  // 9. WIE (Mulheres na Engenharia)
  {
    id: 'COORD_WIE',
    nome: 'Coordenadora de Afinidade WIE',
    departamento: 'WIE (Afinidade / Mulheres na Eng.)',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Liderança do grupo de afinidade Women in Engineering.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_WIE',
    nome: 'Membro / Assessora WIE',
    departamento: 'WIE (Afinidade / Mulheres na Eng.)',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Organização de iniciativas, eventos de representatividade e palestras.',
    permiteAbrirSala: true,
  },

  // 10. TI & Sistemas
  {
    id: 'COORD_TI',
    nome: 'Coordenador de TI & Sistemas',
    departamento: 'TI & Sistemas',
    nivelAcesso: 'Gestor',
    peso: 2.0,
    descricao: 'Gestão da infraestrutura em nuvem, Portal Web e ferramentas digitais.',
    permiteAbrirSala: true,
  },
  {
    id: 'MEMBRO_TI',
    nome: 'Membro Desenvolvedor (Portal / Infra)',
    departamento: 'TI & Sistemas',
    nivelAcesso: 'Membro',
    peso: 1.0,
    descricao: 'Manutenção e evolução do Portal IEEE, automações e banco de dados.',
    permiteAbrirSala: true,
  },
]

export function obterCargosPorDepartamento(departamento: string): CargoItem[] {
  return CATALOGO_CARGOS_PADRAO.filter((c) => c.departamento === departamento)
}

export function buscarCargoPorNomeOuId(identificador: string): CargoItem | undefined {
  if (!identificador) return undefined
  const limpo = identificador.trim().toLowerCase()
  return (
    CATALOGO_CARGOS_PADRAO.find((c) => c.id.toLowerCase() === limpo) ||
    CATALOGO_CARGOS_PADRAO.find((c) => c.nome.toLowerCase() === limpo)
  )
}
