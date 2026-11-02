'use client'

import React, { useState, useMemo } from 'react'
import {
  PublicoConfig,
  MembroParticipante,
  NivelCargoAlvo,
} from '@/lib/pch-matching'
import { EQUIPES_OFICIAIS, obterSubequipes } from '@/lib/catalogo-cargos'

interface SeletorPublicoProps {
  config: PublicoConfig
  onChange: (novaConfig: PublicoConfig) => void
  todosMembros: MembroParticipante[]
  usuarioAtual: MembroParticipante | null
  participantesResolvidos: MembroParticipante[]
}

const NIVEIS_DISPONIVEIS: { id: NivelCargoAlvo; label: string; icon: string }[] = [
  { id: 'PRESIDENCIA', label: 'Presidência & Diretoria', icon: '🛡️' },
  { id: 'LIDERANCA', label: 'Lideranças & Gerentes', icon: '👔' },
  { id: 'ASSESSOR', label: 'Assessores', icon: '💼' },
  { id: 'MEMBRO', label: 'Membros Efetivos', icon: '⚡' },
  { id: 'TRAINEE', label: 'Trainees (PSE)', icon: '🎓' },
]

export const SeletorPublico: React.FC<SeletorPublicoProps> = ({
  config,
  onChange,
  todosMembros,
  usuarioAtual,
  participantesResolvidos,
}) => {
  const [equipeExpandida, setEquipeExpandida] = useState<string | null>(null)
  const [buscaConvidado, setBuscaConvidado] = useState('')
  const [dropdownBuscaAberto, setDropdownBuscaAberto] = useState(false)
  const [modalListaAberta, setModalListaAberta] = useState(false)
  const [filtroListaConvocados, setFiltroListaConvocados] = useState('')

  // 1. Mudança de Preset
  const handleSelecionarModo = (modo: PublicoConfig['modo']) => {
    onChange({
      ...config,
      modo,
      total_estimado: participantesResolvidos.length,
    })
  }

  // 2. Toggle de Nível de Cargo
  const handleToggleNivel = (nivel: NivelCargoAlvo) => {
    const niveisAtuais = new Set(config.niveis_cargos || [])
    if (niveisAtuais.has(nivel)) {
      niveisAtuais.delete(nivel)
    } else {
      niveisAtuais.add(nivel)
    }
    onChange({
      ...config,
      niveis_cargos: Array.from(niveisAtuais),
    })
  }

  // 3. Toggle de Equipe
  const handleToggleEquipe = (equipe: string) => {
    const equipesAtuais = new Set(config.equipes || [])
    const subequipesAtuais = new Set(config.subequipes || [])

    if (equipesAtuais.has(equipe)) {
      equipesAtuais.delete(equipe)
      // Remove subequipes associadas a essa equipe
      const subsDaEquipe = obterSubequipes(equipe)
      subsDaEquipe.forEach((s) => subequipesAtuais.delete(s))
      if (equipeExpandida === equipe) setEquipeExpandida(null)
    } else {
      equipesAtuais.add(equipe)
      setEquipeExpandida(equipe)
    }

    onChange({
      ...config,
      equipes: Array.from(equipesAtuais),
      subequipes: Array.from(subequipesAtuais),
    })
  }

  // 4. Toggle de Subequipe
  const handleToggleSubequipe = (subequipe: string) => {
    const subequipesAtuais = new Set(config.subequipes || [])
    if (subequipesAtuais.has(subequipe)) {
      subequipesAtuais.delete(subequipe)
    } else {
      subequipesAtuais.add(subequipe)
    }
    onChange({
      ...config,
      subequipes: Array.from(subequipesAtuais),
    })
  }

  // 5. Adicionar Convidado Específico
  const handleAdicionarConvidado = (m: MembroParticipante) => {
    const especificos = new Set(config.membros_especificos || [])
    especificos.add(m.matricula)
    onChange({
      ...config,
      membros_especificos: Array.from(especificos),
    })
    setBuscaConvidado('')
    setDropdownBuscaAberto(false)
  }

  // 6. Remover Convidado Específico
  const handleRemoverConvidado = (matricula: string) => {
    const especificos = new Set(config.membros_especificos || [])
    especificos.delete(matricula)
    onChange({
      ...config,
      membros_especificos: Array.from(especificos),
    })
  }

  // Sugestões de convidados para o autocomplete
  const sugestoesConvidados = useMemo(() => {
    if (!buscaConvidado.trim()) return []
    const termo = buscaConvidado.toLowerCase()
    const jaAdicionados = new Set(config.membros_especificos || [])

    return todosMembros
      .filter((m) => {
        if (jaAdicionados.has(m.matricula)) return false
        return (
          m.nome.toLowerCase().includes(termo) ||
          m.matricula.toLowerCase().includes(termo) ||
          (m.equipe && m.equipe.toLowerCase().includes(termo))
        )
      })
      .slice(0, 6)
  }, [buscaConvidado, todosMembros, config.membros_especificos])

  // Objetos completos dos membros adicionados especificamente
  const membrosEspecificosObjs = useMemo(() => {
    const mats = new Set(config.membros_especificos || [])
    return todosMembros.filter((m) => mats.has(m.matricula))
  }, [config.membros_especificos, todosMembros])

  return (
    <div className="space-y-4 text-xs">
      {/* 1. SELETOR DE PRESETS RÁPIDOS */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
          Público-Alvo & Alcance da Visibilidade
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleSelecionarModo('todos')}
            className={`p-2.5 rounded-xl border text-left font-bold flex flex-col gap-1 transition-all cursor-pointer ${
              config.modo === 'todos'
                ? 'bg-blue-50 border-primary text-primary shadow-xs ring-2 ring-blue-100'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-base">🌐</span>
            <span className="text-xs">Todo o Ramo</span>
            <span className="text-[10px] font-normal text-gray-400">Geral / Assembleia</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelecionarModo('minha_equipe')}
            className={`p-2.5 rounded-xl border text-left font-bold flex flex-col gap-1 transition-all cursor-pointer ${
              config.modo === 'minha_equipe'
                ? 'bg-blue-50 border-primary text-primary shadow-xs ring-2 ring-blue-100'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-base">🏢</span>
            <span className="text-xs">Minha Equipe</span>
            <span className="text-[10px] font-normal text-gray-400">
              {usuarioAtual?.equipe || 'Equipe do Usuário'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelecionarModo('liderancas')}
            className={`p-2.5 rounded-xl border text-left font-bold flex flex-col gap-1 transition-all cursor-pointer ${
              config.modo === 'liderancas'
                ? 'bg-blue-50 border-primary text-primary shadow-xs ring-2 ring-blue-100'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-base">👔</span>
            <span className="text-xs">Lideranças</span>
            <span className="text-[10px] font-normal text-gray-400">Diretoria & Líderes</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelecionarModo('personalizado')}
            className={`p-2.5 rounded-xl border text-left font-bold flex flex-col gap-1 transition-all cursor-pointer ${
              config.modo === 'personalizado'
                ? 'bg-blue-50 border-primary text-primary shadow-xs ring-2 ring-blue-100'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-base">✨</span>
            <span className="text-xs">Personalizado</span>
            <span className="text-[10px] font-normal text-gray-400">Equipes, Cargos & Nomes</span>
          </button>
        </div>
      </div>

      {/* 2. CONSTRUTOR PERSONALIZADO (APENAS SE MODO === 'personalizado') */}
      {config.modo === 'personalizado' && (
        <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3.5 space-y-4">
          {/* Dimensão 1: Papéis / Níveis de Cargos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                1. Níveis de Cargo / Papéis
              </span>
              <span className="text-[10px] text-gray-400">
                {config.niveis_cargos?.length
                  ? `${config.niveis_cargos.length} selecionado(s)`
                  : 'Todos os níveis'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NIVEIS_DISPONIVEIS.map((n) => {
                const ativo = (config.niveis_cargos || []).includes(n.id)
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleToggleNivel(n.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      ativo
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{n.icon}</span>
                    <span>{n.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dimensão 2: Equipes & Subequipes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                2. Equipes do Ramo
              </span>
              <span className="text-[10px] text-gray-400">
                {config.equipes?.length
                  ? `${config.equipes.length} equipe(s) marcada(s)`
                  : 'Todas as equipes'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {EQUIPES_OFICIAIS.map((eq) => {
                const ativa = (config.equipes || []).includes(eq)
                const subs = obterSubequipes(eq)
                const temSubs = subs.length > 0 && subs[0] !== 'Geral'
                return (
                  <div key={eq} className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleEquipe(eq)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                        ativa
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>{eq}</span>
                      {ativa && temSubs && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setEquipeExpandida(equipeExpandida === eq ? null : eq)
                          }}
                          className="text-[9px] bg-white/20 px-1 py-0.5 rounded hover:bg-white/30"
                          title="Refinar subequipes"
                        >
                          ▾
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Painel de Subequipes da equipe selecionada */}
            {equipeExpandida && (
              <div className="mt-2.5 p-2.5 bg-white border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-900">
                    Subequipes de {equipeExpandida}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEquipeExpandida(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ✕ Fechar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {obterSubequipes(equipeExpandida).map((sub) => {
                    const subAtiva = (config.subequipes || []).includes(sub)
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubequipe(sub)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                          subAtiva
                            ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {sub}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dimensão 3: Convidados Específicos (Busca & Chips) */}
          <div className="relative">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
              3. Convidar Pessoas Específicas (Individual)
            </span>
            <input
              type="text"
              value={buscaConvidado}
              onChange={(e) => {
                setBuscaConvidado(e.target.value)
                setDropdownBuscaAberto(true)
              }}
              onFocus={() => setDropdownBuscaAberto(true)}
              placeholder="Digite o nome ou matrícula do membro (ex: Arthur, Igor, 2024...)"
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            />

            {dropdownBuscaAberto && sugestoesConvidados.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-gray-100">
                {sugestoesConvidados.map((m) => (
                  <div
                    key={m.matricula}
                    onClick={() => handleAdicionarConvidado(m)}
                    className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{m.nome}</div>
                      <div className="text-[10px] text-gray-400">
                        {m.equipe} • {m.cargo} ({m.matricula})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary">+ Convidar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Chips de Pessoas Específicas Convocadas */}
            {membrosEspecificosObjs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {membrosEspecificosObjs.map((m) => (
                  <span
                    key={m.matricula}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-900 font-semibold rounded-lg text-xs"
                  >
                    <span>👤 {m.nome}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverConvidado(m.matricula)}
                      className="text-blue-600 hover:text-blue-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BARRA DE AUDIÊNCIA EM TEMPO REAL */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <div>
            <div className="font-headline font-bold text-gray-900 text-xs flex items-center gap-2">
              <span>{participantesResolvidos.length} participantes convocados</span>
              {participantesResolvidos.length === 0 && (
                <span className="text-[10px] text-amber-600 font-normal">
                  (Nenhum membro atende ao filtro atual)
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-500">
              A PCH abaixo cruzará a disponibilidade dessas pessoas.
            </div>
          </div>
        </div>

        {participantesResolvidos.length > 0 && (
          <button
            type="button"
            onClick={() => setModalListaAberta(true)}
            className="px-2.5 py-1.5 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-50 text-[11px] transition-all cursor-pointer shadow-xs"
          >
            Ver Lista Completa
          </button>
        )}
      </div>

      {/* MODAL / DRAWER DA LISTA COMPLETA DE PARTICIPANTES */}
      {modalListaAberta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="font-headline font-bold text-base text-gray-900">
                  Participantes Convocados ({participantesResolvidos.length})
                </h3>
                <p className="text-[11px] text-gray-500">
                  Membros que receberão e visualizarão este evento na agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalListaAberta(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={filtroListaConvocados}
              onChange={(e) => setFiltroListaConvocados(e.target.value)}
              placeholder="Filtrar por nome ou equipe..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 pr-1 max-h-80">
              {participantesResolvidos
                .filter(
                  (m) =>
                    !filtroListaConvocados ||
                    m.nome.toLowerCase().includes(filtroListaConvocados.toLowerCase()) ||
                    (m.equipe && m.equipe.toLowerCase().includes(filtroListaConvocados.toLowerCase()))
                )
                .map((m) => (
                  <div key={m.matricula} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{m.nome}</div>
                      <div className="text-[10px] text-gray-400">
                        {m.equipe} {m.subequipe ? `(${m.subequipe})` : ''} • {m.cargo}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {m.matricula}
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setModalListaAberta(false)}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-blue-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
