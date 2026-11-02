// Catálogo Central Oficial da Hierarquia do Ramo Estudantil IEEE CEFET-RJ
// Mapeado a partir de HIERARQUIA RAMO (128 cargos e funções organizacionais)

export interface CargoItemHierarquia {
  id: string
  equipe: string
  subequipe: string
  area: string
  cargo: string
  nivelOrganizacional: number
  nivelAcesso: 'ADMIN' | 'GESTOR' | 'LIDER' | 'MEMBRO' | 'TRAINEE'
  peso: number
  descricao?: string
}

export const CATALOGO_HIERARQUIA: CargoItemHierarquia[] = [
  {
    "id": "RAMO-EXEC-GER-PRES",
    "equipe": "Ramo IEEE",
    "subequipe": "Presidência",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 1,
    "nivelAcesso": "ADMIN",
    "peso": 1.0,
    "descricao": "Liderança institucional e representação legal do Ramo"
  },
  {
    "id": "RAMO-EXEC-GER-VICE",
    "equipe": "Ramo IEEE",
    "subequipe": "Presidência",
    "area": "Geral",
    "cargo": "Vice-Presidente",
    "nivelOrganizacional": 2,
    "nivelAcesso": "ADMIN",
    "peso": 1.0,
    "descricao": "Vice-liderança institucional e co-gestão geral do Ramo"
  },
  {
    "id": "RAMO-EXEC-GER-ASS",
    "equipe": "Ramo IEEE",
    "subequipe": "Presidência",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 3,
    "nivelAcesso": "ADMIN",
    "peso": 0.5,
    "descricao": "Assessoria direta à Presidência do Ramo"
  },
  {
    "id": "AESS-DIR-GER-PRES",
    "equipe": "AESS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de AESS"
  },
  {
    "id": "CS-DIR-GER-PRES",
    "equipe": "CS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de CS"
  },
  {
    "id": "RS-DIR-GER-PRES",
    "equipe": "Gestão R&S",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Gestão R&S"
  },
  {
    "id": "GP-DIR-GER-PRES",
    "equipe": "Gestão de Pessoas",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Gestão de Pessoas"
  },
  {
    "id": "PROJ-DIR-GER-PRES",
    "equipe": "Gestão de Projetos",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Gestão de Projetos"
  },
  {
    "id": "IPS-DIR-GER-PRES",
    "equipe": "IPS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de IPS"
  },
  {
    "id": "MKT-DIR-GER-PRES",
    "equipe": "Marketing",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Marketing"
  },
  {
    "id": "PES-DIR-GER-PRES",
    "equipe": "PES",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de PES"
  },
  {
    "id": "RAS-DIR-GER-PRES",
    "equipe": "RAS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de RAS"
  },
  {
    "id": "SSIT-DIR-GER-PRES",
    "equipe": "SSIT",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de SSIT"
  },
  {
    "id": "SEC-DIR-GER-PRES",
    "equipe": "Secretaria",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Secretaria"
  },
  {
    "id": "TES-DIR-GER-PRES",
    "equipe": "Tesouraria",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de Tesouraria"
  },
  {
    "id": "WIE-DIR-GER-PRES",
    "equipe": "WIE",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Presidente",
    "nivelOrganizacional": 4,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Liderança executiva da equipe de WIE"
  },
  {
    "id": "RAMO-EXEC-GER-VICE-EQ",
    "equipe": "RAS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Vice-Presidente de Equipe",
    "nivelOrganizacional": 5,
    "nivelAcesso": "GESTOR",
    "peso": 1.0,
    "descricao": "Vice-coordenação executiva do capítulo RAS"
  },
  {
    "id": "RAMO-EXEC-GER-ASS-EQ",
    "equipe": "RAS",
    "subequipe": "Diretoria",
    "area": "Geral",
    "cargo": "Assessor da Presidência de Equipe",
    "nivelOrganizacional": 6,
    "nivelAcesso": "GESTOR",
    "peso": 0.5,
    "descricao": "Assessoria executiva direta à Presidência do capítulo RAS"
  },
  {
    "id": "CS-GAME-GER-LID",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Games (CS)"
  },
  {
    "id": "CS-HW-GER-LID",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Hardware (CS)"
  },
  {
    "id": "CS-IA-GER-LID",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de IA (CS)"
  },
  {
    "id": "CS-WEB-GER-LID",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Web (CS)"
  },
  {
    "id": "RAS-COMB-GER-LID",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-SEG-GER-LID",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SUM-GER-LID",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Geral",
    "cargo": "Líder",
    "nivelOrganizacional": 7,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança geral da subequipe de Sumo (RAS)"
  },
  {
    "id": "RAS-COMB-GER-VICE",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Geral",
    "cargo": "Vice-Líder de Subequipe",
    "nivelOrganizacional": 8,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Vice-liderança geral da subequipe de Robôs de Combate"
  },
  {
    "id": "CS-GAME-GER-ASS",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Geral",
    "cargo": "Membro",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Games (CS)"
  },
  {
    "id": "CS-HW-GER-ASS",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Geral",
    "cargo": "Membro",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-IA-GER-ASS",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "Geral",
    "cargo": "Membro",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de IA (CS)"
  },
  {
    "id": "CS-WEB-GER-ASS",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Geral",
    "cargo": "Membro",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Web (CS)"
  },
  {
    "id": "RAS-COMB-GER-ASS",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-SEG-GER-ASS",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SUM-GER-ASS",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 9,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria e suporte de liderança na subequipe de Sumo (RAS)"
  },
  {
    "id": "AESS-TEC-AERO-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Aerodinâmica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Aerodinâmica (AESS)"
  },
  {
    "id": "AESS-TEC-ELET-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica (AESS)"
  },
  {
    "id": "AESS-TEC-PROG-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação (AESS)"
  },
  {
    "id": "AESS-TEC-PROP-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Propulsão",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Propulsão (AESS)"
  },
  {
    "id": "AESS-TEC-REC-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Recuperação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Recuperação (AESS)"
  },
  {
    "id": "AESS-TEC-TES-LID",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Tesouraria",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Tesouraria (AESS)"
  },
  {
    "id": "CS-GAME-ART-LID",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Arte e Som",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Arte e Som na subequipe de Games (CS)"
  },
  {
    "id": "CS-GAME-PROG-LID",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação na subequipe de Games (CS)"
  },
  {
    "id": "CS-HW-ELET-LID",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-HW-MEC-LID",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Mecânica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mecânica na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-HW-PROG-LID",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-IA-EDI-LID",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "EDI",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de EDI na subequipe de IA (CS)"
  },
  {
    "id": "CS-IA-PDO-LID",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "PDO",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de PDO na subequipe de IA (CS)"
  },
  {
    "id": "CS-IA-SAI-LID",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "SAI",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de SAI na subequipe de IA (CS)"
  },
  {
    "id": "CS-WEB-BACK-LID",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Back-End",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Back-End na subequipe de Web (CS)"
  },
  {
    "id": "CS-WEB-FRONT-LID",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Front-End",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Front-End na subequipe de Web (CS)"
  },
  {
    "id": "IPS-TEC-APLFIS-LID",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "Aplicações Físicas",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Aplicações Físicas (IPS)"
  },
  {
    "id": "IPS-TEC-PROG-LID",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "PROGELT",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de PROGELT (IPS)"
  },
  {
    "id": "IPS-TEC-PESQ-LID",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "Pesquisa e Fundamentação Teórica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Pesquisa e Fundamentação Teórica (IPS)"
  },
  {
    "id": "MKT-TEC-EVE-LID",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Eventos",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eventos (Marketing)"
  },
  {
    "id": "MKT-TEC-MS-LID",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Mídias Sociais",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mídias Sociais (Marketing)"
  },
  {
    "id": "MKT-TEC-PARC-LID",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Parceiras",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Parceiras (Marketing)"
  },
  {
    "id": "MKT-TEC-PROD-LID",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Produtos",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Produtos (Marketing)"
  },
  {
    "id": "PES-TEC-T1-LID",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 1",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Time 1 (PES)"
  },
  {
    "id": "PES-TEC-T2-LID",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 2",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Time 2 (PES)"
  },
  {
    "id": "PES-TEC-T3-LID",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 3",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Time 3 (PES)"
  },
  {
    "id": "RAS-COMB-ELET-LID",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica na subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-COMB-MEC-LID",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Mecânica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mecânica na subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-SEG-ELET-LID",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SEG-MEC-LID",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Mecânica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mecânica na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SEG-PROG-LID",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SUM-ELET-LID",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica na subequipe de Sumo (RAS)"
  },
  {
    "id": "RAS-SUM-MEC-LID",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Mecânica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mecânica na subequipe de Sumo (RAS)"
  },
  {
    "id": "RAS-SUM-PROG-LID",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação na subequipe de Sumo (RAS)"
  },
  {
    "id": "SSIT-TEC-EDU-LID",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Educacional",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Educacional (SSIT)"
  },
  {
    "id": "SSIT-TEC-ELET-LID",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Eletrônica",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eletrônica (SSIT)"
  },
  {
    "id": "SSIT-TEC-PROG-LID",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Programação",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Programação (SSIT)"
  },
  {
    "id": "WIE-TEC-EVE-LID",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Eventos",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Eventos (WIE)"
  },
  {
    "id": "WIE-TEC-MS-LID",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Mídias Sociais",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Mídias Sociais (WIE)"
  },
  {
    "id": "WIE-TEC-PROD-LID",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Produtos",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Produtos (WIE)"
  },
  {
    "id": "WIE-TEC-PROJ-LID",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Projetos",
    "cargo": "Líder",
    "nivelOrganizacional": 10,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Liderança da área de Projetos (WIE)"
  },
  {
    "id": "RAS-COMB-ELET-VICE",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Eletrônica",
    "cargo": "Vice-Líder de Área",
    "nivelOrganizacional": 11,
    "nivelAcesso": "LIDER",
    "peso": 1.0,
    "descricao": "Vice-liderança técnica da área de Eletrônica de Combate"
  },
  {
    "id": "AESS-TEC-GER-ASS",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de AESS"
  },
  {
    "id": "RS-OPER-GER-ASS",
    "equipe": "Gestão R&S",
    "subequipe": "Equipe Operacional",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Gestão R&S"
  },
  {
    "id": "GP-OPER-GER-ASS",
    "equipe": "Gestão de Pessoas",
    "subequipe": "Equipe Operacional",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Gestão de Pessoas"
  },
  {
    "id": "PROJ-OPER-GER-ASS",
    "equipe": "Gestão de Projetos",
    "subequipe": "Equipe Operacional",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Gestão de Projetos"
  },
  {
    "id": "IPS-TEC-GER-ASS",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de IPS"
  },
  {
    "id": "MKT-TEC-GER-ASS",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Marketing"
  },
  {
    "id": "PES-TEC-GER-ASS",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de PES"
  },
  {
    "id": "SSIT-TEC-GER-ASS",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de SSIT"
  },
  {
    "id": "SEC-OPER-GER-ASS",
    "equipe": "Secretaria",
    "subequipe": "Equipe Operacional",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Secretaria"
  },
  {
    "id": "TES-OPER-GER-ASS",
    "equipe": "Tesouraria",
    "subequipe": "Equipe Operacional",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de Tesouraria"
  },
  {
    "id": "WIE-TEC-GER-ASS",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Geral",
    "cargo": "Assessor",
    "nivelOrganizacional": 12,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Assessoria operacional para a equipe de WIE"
  },
  {
    "id": "AESS-TEC-AERO-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Aerodinâmica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Aerodinâmica (AESS)"
  },
  {
    "id": "AESS-TEC-ELET-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Eletrônica (AESS)"
  },
  {
    "id": "AESS-TEC-PROG-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Programação (AESS)"
  },
  {
    "id": "AESS-TEC-PROP-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Propulsão",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Propulsão (AESS)"
  },
  {
    "id": "AESS-TEC-REC-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Recuperação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Recuperação (AESS)"
  },
  {
    "id": "AESS-TEC-TES-MEM",
    "equipe": "AESS",
    "subequipe": "Equipe Técnica",
    "area": "Tesouraria",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Tesouraria (AESS)"
  },
  {
    "id": "CS-GAME-ART-MEM",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Arte e Som",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Arte e Som na subequipe de Games (CS)"
  },
  {
    "id": "CS-GAME-PROG-MEM",
    "equipe": "CS",
    "subequipe": "Games",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Programação na subequipe de Games (CS)"
  },
  {
    "id": "CS-HW-ELET-MEM",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Eletrônica na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-HW-MEC-MEM",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Mecânica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Mecânica na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-HW-PROG-MEM",
    "equipe": "CS",
    "subequipe": "Hardware",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Programação na subequipe de Hardware (CS)"
  },
  {
    "id": "CS-IA-EDI-MEM",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "EDI",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de EDI na subequipe de IA (CS)"
  },
  {
    "id": "CS-IA-PDO-MEM",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "PDO",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de PDO na subequipe de IA (CS)"
  },
  {
    "id": "CS-IA-SAI-MEM",
    "equipe": "CS",
    "subequipe": "IA",
    "area": "SAI",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de SAI na subequipe de IA (CS)"
  },
  {
    "id": "CS-WEB-BACK-MEM",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Back-End",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Back-End na subequipe de Web (CS)"
  },
  {
    "id": "CS-WEB-FRONT-MEM",
    "equipe": "CS",
    "subequipe": "Web",
    "area": "Front-End",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Front-End na subequipe de Web (CS)"
  },
  {
    "id": "IPS-TEC-APLFIS-MEM",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "Aplicações Físicas",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Aplicações Físicas (IPS)"
  },
  {
    "id": "IPS-TEC-PROG-MEM",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "PROGELT",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de PROGELT (IPS)"
  },
  {
    "id": "IPS-TEC-PESQ-MEM",
    "equipe": "IPS",
    "subequipe": "Equipe Técnica",
    "area": "Pesquisa e Fundamentação Teórica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Pesquisa e Fundamentação Teórica (IPS)"
  },
  {
    "id": "MKT-TEC-EVE-MEM",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Eventos",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Eventos (Marketing)"
  },
  {
    "id": "MKT-TEC-MS-MEM",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Mídias Sociais",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Mídias Sociais (Marketing)"
  },
  {
    "id": "MKT-TEC-PARC-MEM",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Parceiras",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Parceiras (Marketing)"
  },
  {
    "id": "MKT-TEC-PROD-MEM",
    "equipe": "Marketing",
    "subequipe": "Equipe Técnica",
    "area": "Produtos",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Produtos (Marketing)"
  },
  {
    "id": "PES-TEC-T1-MEM",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 1",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Time 1 (PES)"
  },
  {
    "id": "PES-TEC-T2-MEM",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 2",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Time 2 (PES)"
  },
  {
    "id": "PES-TEC-T3-MEM",
    "equipe": "PES",
    "subequipe": "Equipe Técnica",
    "area": "Time 3",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Time 3 (PES)"
  },
  {
    "id": "RAS-COMB-ELET-MEM",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Eletrônica na subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-COMB-MEC-MEM",
    "equipe": "RAS",
    "subequipe": "Combate",
    "area": "Mecânica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Mecânica na subequipe de Combate (RAS)"
  },
  {
    "id": "RAS-SEG-ELET-MEM",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Eletrônica na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SEG-MEC-MEM",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Mecânica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Mecânica na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SEG-PROG-MEM",
    "equipe": "RAS",
    "subequipe": "Seguidor",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Programação na subequipe de Seguidor (RAS)"
  },
  {
    "id": "RAS-SUM-ELET-MEM",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Eletrônica na subequipe de Sumo (RAS)"
  },
  {
    "id": "RAS-SUM-MEC-MEM",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Mecânica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Mecânica na subequipe de Sumo (RAS)"
  },
  {
    "id": "RAS-SUM-PROG-MEM",
    "equipe": "RAS",
    "subequipe": "Sumo",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista da área de Programação na subequipe de Sumo (RAS)"
  },
  {
    "id": "SSIT-TEC-EDU-MEM",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Educacional",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Educacional (SSIT)"
  },
  {
    "id": "SSIT-TEC-ELET-MEM",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Eletrônica",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Eletrônica (SSIT)"
  },
  {
    "id": "SSIT-TEC-PROG-MEM",
    "equipe": "SSIT",
    "subequipe": "Equipe Técnica",
    "area": "Programação",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Programação (SSIT)"
  },
  {
    "id": "WIE-TEC-EVE-MEM",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Eventos",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Eventos (WIE)"
  },
  {
    "id": "WIE-TEC-MS-MEM",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Mídias Sociais",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Mídias Sociais (WIE)"
  },
  {
    "id": "WIE-TEC-PROD-MEM",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Produtos",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Produtos (WIE)"
  },
  {
    "id": "WIE-TEC-PROJ-MEM",
    "equipe": "WIE",
    "subequipe": "Equipe Técnica",
    "area": "Projetos",
    "cargo": "Membro",
    "nivelOrganizacional": 13,
    "nivelAcesso": "MEMBRO",
    "peso": 1.0,
    "descricao": "Membro projetista/operacional de Projetos (WIE)"
  },
  {
    "id": "PSE-TRAINEE-GERAL",
    "equipe": "PSE",
    "subequipe": "Estágio Probatório",
    "area": "Geral",
    "cargo": "Trainee PSE",
    "nivelOrganizacional": 14,
    "nivelAcesso": "TRAINEE",
    "peso": 1.0,
    "descricao": "Trainee em estágio probatório no Processo Seletivo do Ramo"
  }
];

// Lista de equipes oficiais únicas
export const EQUIPES_OFICIAIS: string[] = Array.from(
  new Set(CATALOGO_HIERARQUIA.map((c) => c.equipe))
).sort();

export function obterSubequipes(equipe: string): string[] {
  const subs = CATALOGO_HIERARQUIA
    .filter((c) => c.equipe === equipe)
    .map((c) => c.subequipe || 'Geral');
  return Array.from(new Set(subs)).sort();
}

export function obterAreas(equipe: string, subequipe: string): string[] {
  const areas = CATALOGO_HIERARQUIA
    .filter((c) => c.equipe === equipe && (c.subequipe || 'Geral') === subequipe)
    .map((c) => c.area || 'Geral');
  return Array.from(new Set(areas)).sort();
}

export function obterCargosDisponiveis(
  equipe: string,
  subequipe: string,
  area: string
): CargoItemHierarquia[] {
  return CATALOGO_HIERARQUIA.filter(
    (c) =>
      c.equipe === equipe &&
      (c.subequipe || 'Geral') === subequipe &&
      (c.area || 'Geral') === area
  );
}

export function buscarCargoPorId(id: string): CargoItemHierarquia | undefined {
  if (!id) return undefined;
  return CATALOGO_HIERARQUIA.find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
}

export function buscarCargoPorTexto(identificador: string): CargoItemHierarquia | undefined {
  if (!identificador) return undefined;
  const limpo = identificador.trim().toLowerCase();
  
  // 1. Tenta por ID
  const porId = CATALOGO_HIERARQUIA.find((c) => c.id.toLowerCase() === limpo);
  if (porId) return porId;

  // 2. Tenta por correspondência completa formatada
  const porFormatado = CATALOGO_HIERARQUIA.find(
    (c) => formatarNomeCompletoCargo(c).toLowerCase() === limpo
  );
  if (porFormatado) return porFormatado;

  // 3. Tenta encontrar onde o cargo e equipe coincidem
  const porCargo = CATALOGO_HIERARQUIA.find(
    (c) => c.cargo.toLowerCase() === limpo || limpo.includes(c.cargo.toLowerCase())
  );
  return porCargo;
}

export function formatarNomeCompletoCargo(c: CargoItemHierarquia): string {
  const partesSubArea: string[] = []
  if (c.subequipe && c.subequipe !== 'Geral') partesSubArea.push(c.subequipe)
  if (c.area && c.area !== 'Geral') partesSubArea.push(c.area)

  const subAreaStr = partesSubArea.length > 0 ? ` (${partesSubArea.join(' • ')})` : ''
  return `${c.cargo} • ${c.equipe}${subAreaStr}`
}

export const buscarCargoPorNomeOuId = buscarCargoPorTexto
