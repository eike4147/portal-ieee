'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  SlotCargoData,
  SolicitacaoMovimentacao,
  obterEstadoCargosSlotsAction,
  confirmarCargosSemAlteracaoAction,
  submeterMovimentacaoSlotsAction,
  solicitarDesbloqueioSlotAction,
} from '@/app/cargos/actions'
import {
  DEPARTAMENTOS_RAMO,
  obterCargosPorDepartamento,
  buscarCargoPorNomeOuId,
} from '@/lib/catalogo-cargos'

interface SecaoCargosSlotsProps {
  cargosIniciaisUsuario: string[]
}

export default function SecaoCargosSlots({ cargosIniciaisUsuario }: SecaoCargosSlotsProps) {
  const [isPending, startTransition] = useTransition()
  const [carregando, setCarregando] = useState(true)

  // Estado dos slots
  const [slots, setSlots] = useState<SlotCargoData[]>([])
  const [slotsOriginais, setSlotsOriginais] = useState<SlotCargoData[]>([])
  const [limiteSlots, setLimiteSlots] = useState(3)
  const [solicitacaoPendente, setSolicitacaoPendente] = useState<SolicitacaoMovimentacao | null>(null)

  // Feedback do usuário
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; texto: string } | null>(null)

  // Slot em edição / seleção (1 a 5)
  const [slotEmEdicao, setSlotEmEdicao] = useState<number | null>(null)
  const [deptoSelecionado, setDeptoSelecionado] = useState<string>('')
  const [cargoSelecionado, setCargoSelecionado] = useState<string>('')

  // Modal de desbloqueio de slot extra (Slots 4 e 5)
  const [modalDesbloqueioAberto, setModalDesbloqueioAberto] = useState(false)
  const [slotParaDesbloquear, setSlotParaDesbloquear] = useState<number>(4)
  const [justificativaDesbloqueio, setJustificativaDesbloqueio] = useState('')

  // Justificativa opcional para movimentação
  const [justificativaMovimentacao, setJustificativaMovimentacao] = useState('')

  // Carrega estado inicial do servidor
  const carregarDados = async () => {
    setCarregando(true)
    const res = await obterEstadoCargosSlotsAction()
    if (res.sucesso && res.slots) {
      setSlots(res.slots)
      setSlotsOriginais(JSON.parse(JSON.stringify(res.slots)))
      setLimiteSlots(res.limiteSlots || 3)
      setSolicitacaoPendente(res.solicitacaoPendente || null)
    } else {
      // Fallback local caso ainda não tenha banco montado
      const fallbackSlots: SlotCargoData[] = []
      for (let i = 1; i <= 5; i++) {
        const estaBloqueado = i > 3
        if (estaBloqueado) {
          fallbackSlots.push({ slot: i, cargoNome: '', departamento: '', peso: 0, status: 'bloqueado' })
        } else {
          const cNome = cargosIniciaisUsuario[i - 1] || ''
          const item = buscarCargoPorNomeOuId(cNome)
          fallbackSlots.push({
            slot: i,
            cargoNome: item?.nome || cNome,
            departamento: item?.departamento || 'Geral',
            peso: item?.peso ?? (cNome ? 1.0 : 0),
            status: cNome ? 'ativo' : 'vazio',
          })
        }
      }
      setSlots(fallbackSlots)
      setSlotsOriginais(JSON.parse(JSON.stringify(fallbackSlots)))
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Verifica se houve alguma alteração em relação aos slots originais
  const cargosAtuaisNomes = slotsOriginais
    .filter((s) => s.status === 'ativo' && s.cargoNome)
    .map((s) => s.cargoNome)

  const cargosPropostosNomes = slots
    .filter((s) => s.status === 'ativo' && s.cargoNome)
    .map((s) => s.cargoNome)

  const houveAlteracao =
    JSON.stringify(cargosAtuaisNomes) !== JSON.stringify(cargosPropostosNomes)

  // Carga total acumulada proposta
  const cargaTotal = slots
    .filter((s) => s.status === 'ativo')
    .reduce((acc, curr) => acc + (curr.peso || 0), 0)

  // Contagem de slots ativos
  const slotsOcupadosCount = slots.filter((s) => s.status === 'ativo').length

  // Iniciar edição/adição em um slot
  const handleIniciarEdicaoSlot = (slotNumero: number) => {
    const slotAtual = slots.find((s) => s.slot === slotNumero)
    setSlotEmEdicao(slotNumero)
    if (slotAtual?.status === 'ativo' && slotAtual.departamento) {
      setDeptoSelecionado(slotAtual.departamento)
      setCargoSelecionado(slotAtual.cargoNome)
    } else {
      setDeptoSelecionado(DEPARTAMENTOS_RAMO[0])
      const cargosPrimeiroDepto = obterCargosPorDepartamento(DEPARTAMENTOS_RAMO[0])
      setCargoSelecionado(cargosPrimeiroDepto[0]?.nome || '')
    }
  }

  // Cancelar edição
  const handleCancelarEdicao = () => {
    setSlotEmEdicao(null)
    setDeptoSelecionado('')
    setCargoSelecionado('')
  }

  // Salvar cargo no slot localmente
  const handleConfirmarCargoNoSlot = (slotNumero: number) => {
    if (!cargoSelecionado) {
      setFeedback({ tipo: 'aviso', texto: 'Selecione um cargo válido.' })
      return
    }

    // Verifica se já não escolheu o mesmo cargo em outro slot
    const jaEscolhidoEmOutroSlot = slots.some(
      (s) => s.slot !== slotNumero && s.cargoNome === cargoSelecionado && s.status === 'ativo'
    )
    if (jaEscolhidoEmOutroSlot) {
      setFeedback({
        tipo: 'erro',
        texto: `O cargo "${cargoSelecionado}" já está ocupado em outro slot. Escolha uma função diferente.`,
      })
      return
    }

    const itemCatalogo = buscarCargoPorNomeOuId(cargoSelecionado)

    setSlots((prev) =>
      prev.map((s) => {
        if (s.slot === slotNumero) {
          return {
            ...s,
            cargoNome: itemCatalogo?.nome || cargoSelecionado,
            departamento: itemCatalogo?.departamento || deptoSelecionado,
            peso: itemCatalogo?.peso ?? 1.0,
            nivelAcesso: itemCatalogo?.nivelAcesso ?? 'Membro',
            status: 'ativo',
          }
        }
        return s
      })
    )

    setSlotEmEdicao(null)
    setFeedback(null)
  }

  // Esvaziar / Deixar livre um slot (Equivale a pedir saída dessa função)
  const handleRemoverCargoSlot = (slotNumero: number) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slot === slotNumero) {
          return {
            ...s,
            cargoNome: '',
            departamento: '',
            peso: 0,
            status: 'vazio',
          }
        }
        return s
      })
    )
    setSlotEmEdicao(null)
  }

  // Restaurar alterações locais
  const handleRestaurar = () => {
    setSlots(JSON.parse(JSON.stringify(slotsOriginais)))
    setSlotEmEdicao(null)
    setFeedback(null)
    setJustificativaMovimentacao('')
  }

  // Confirmar sem alteração
  const handleConfirmarSemAlteracoes = () => {
    startTransition(async () => {
      const res = await confirmarCargosSemAlteracaoAction(cargosAtuaisNomes)
      if (res.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: res.mensagem })
        carregarDados()
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem })
      }
    })
  }

  // Enviar proposta de movimentação para a GP
  const handleEnviarMovimentacaoGP = () => {
    startTransition(async () => {
      const res = await submeterMovimentacaoSlotsAction(
        cargosAtuaisNomes,
        cargosPropostosNomes,
        justificativaMovimentacao
      )
      if (res.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: res.mensagem })
        carregarDados()
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem })
      }
    })
  }

  // Abrir modal de desbloqueio de slot 4 ou 5
  const handleAbrirDesbloqueio = (slotNum: number) => {
    setSlotParaDesbloquear(slotNum)
    setJustificativaDesbloqueio('')
    setModalDesbloqueioAberto(true)
  }

  // Submeter pedido de desbloqueio de slot extra
  const handleSubmeterDesbloqueio = () => {
    if (!justificativaDesbloqueio || justificativaDesbloqueio.trim().length < 10) {
      setFeedback({
        tipo: 'erro',
        texto: 'Por favor, escreva uma justificativa com no mínimo 10 caracteres explicando por que precisa de um slot extra.',
      })
      return
    }

    startTransition(async () => {
      const res = await solicitarDesbloqueioSlotAction(slotParaDesbloquear, justificativaDesbloqueio)
      if (res.sucesso) {
        setModalDesbloqueioAberto(false)
        setFeedback({ tipo: 'sucesso', texto: res.mensagem })
        carregarDados()
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem })
      }
    })
  }

  if (carregando) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 flex items-center justify-center gap-2 text-slate-500 text-xs py-12 animate-pulse">
        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
        <span>Carregando seus slots de cargos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA SEÇÃO DE SLOTS */}
      <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">badge</span>
              <h3 className="font-headline font-bold text-gray-900 text-sm uppercase tracking-wider">
                Cargos & Movimentação (Sistema de Slots)
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Você possui 3 slots liberados para atuação simultânea. Slots 4 e 5 exigem autorização da GP.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">grid_view</span>
              <span>{slotsOcupadosCount} de {limiteSlots} Slots Preenchidos</span>
            </span>

            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                cargaTotal > 3.5
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className="material-symbols-outlined text-xs">scale</span>
              <span>Carga Total: {cargaTotal.toFixed(1)} / Máx. 3.5</span>
            </span>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.tipo === 'erro'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                {feedback.tipo === 'sucesso'
                  ? 'check_circle'
                  : feedback.tipo === 'erro'
                  ? 'error'
                  : 'warning'}
              </span>
              <span>{feedback.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        )}

        {/* BANNER DE SOLICITAÇÃO PENDENTE DE ANÁLISE PELA GP */}
        {solicitacaoPendente && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span className="material-symbols-outlined text-amber-600 animate-pulse text-base">
                hourglass_top
              </span>
              <span>Solicitação sob Análise da Gestão de Pessoas (GP)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Você possui uma solicitação de{' '}
              <strong>
                {solicitacaoPendente.tipo === 'desbloqueio_slot'
                  ? `Liberação do Slot ${solicitacaoPendente.slot_solicitado}`
                  : 'Movimentação de Cargos'}
              </strong>{' '}
              enviada em{' '}
              <strong>{new Date(solicitacaoPendente.criado_em).toLocaleDateString('pt-BR')}</strong> aguardando
              parecer da GP. Novas alterações permanecem bloqueadas enquanto houver pendência ativa.
            </p>
          </div>
        )}

        {/* ALERTA DE CARGA EXCESSIVA */}
        {cargaTotal > 3.5 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-base">warning</span>
            <span>
              Atenção: A soma dos pesos dos cargos ultrapassou o teto estatutário de 3.5. Essa movimentação
              exigirá justificativa e deferimento especial da GP.
            </span>
          </div>
        )}

        {/* GRID DOS 5 SLOTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {slots.map((item) => {
            const isEmEdicao = slotEmEdicao === item.slot
            const isBloqueado = item.status === 'bloqueado'
            const isAtivo = item.status === 'ativo'
            const isVazio = item.status === 'vazio'

            const rotuloSlot =
              item.slot === 1
                ? 'Slot 1 • Principal'
                : item.slot === 2
                ? 'Slot 2 • Secundário'
                : item.slot === 3
                ? 'Slot 3 • Terciário'
                : `Slot ${item.slot} • Extra Especial`

            // CARD BLOQUEADO (SLOTS 4 E 5)
            if (isBloqueado) {
              return (
                <div
                  key={item.slot}
                  className="p-4 bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 opacity-90 transition-all hover:border-slate-300"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {rotuloSlot}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>Bloqueado</span>
                      </span>
                    </div>

                    <div className="pt-2 text-center py-3">
                      <span className="material-symbols-outlined text-3xl text-slate-400 block mb-1">
                        lock_clock
                      </span>
                      <p className="font-bold text-xs text-slate-700">Slot 4 ou 5 Excepcional</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Exige aprovação prévia da Diretoria de Gestão de Pessoas (GP).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || !!solicitacaoPendente}
                    onClick={() => handleAbrirDesbloqueio(item.slot)}
                    className="w-full py-2 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">key</span>
                    <span>Solicitar Liberação à GP</span>
                  </button>
                </div>
              )
            }

            // MODO DE SELEÇÃO / EDIÇÃO NO SLOT
            if (isEmEdicao) {
              const cargosDisponiveis = obterCargosPorDepartamento(deptoSelecionado)

              return (
                <div
                  key={item.slot}
                  className="p-4 bg-blue-50/50 border-2 border-blue-400 rounded-2xl space-y-3 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Escolhendo Cargo ({rotuloSlot})
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelarEdicao}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        1. Equipe / Departamento
                      </label>
                      <select
                        value={deptoSelecionado}
                        onChange={(e) => {
                          const novoDepto = e.target.value
                          setDeptoSelecionado(novoDepto)
                          const novosCargos = obterCargosPorDepartamento(novoDepto)
                          setCargoSelecionado(novosCargos[0]?.nome || '')
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {DEPARTAMENTOS_RAMO.map((dep) => (
                          <option key={dep} value={dep}>
                            {dep}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        2. Cargo Específico
                      </label>
                      <select
                        value={cargoSelecionado}
                        onChange={(e) => setCargoSelecionado(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {cargosDisponiveis.map((c) => (
                          <option key={c.id} value={c.nome}>
                            {c.nome} (Peso {c.peso.toFixed(1)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmarCargoNoSlot(item.slot)}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Aplicar ao Slot</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelarEdicao}
                      className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )
            }

            // SLOT VAZIO (DISPONÍVEL)
            if (isVazio) {
              return (
                <div
                  key={item.slot}
                  className="p-4 bg-slate-50/50 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {rotuloSlot}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                        Disponível
                      </span>
                    </div>

                    <div className="pt-2 text-center py-3">
                      <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">
                        add_circle
                      </span>
                      <p className="font-bold text-xs text-slate-700">Slot Livre</p>
                      <p className="text-[10px] text-slate-400">Você pode adicionar mais uma função aqui.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || !!solicitacaoPendente}
                    onClick={() => handleIniciarEdicaoSlot(item.slot)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Adicionar Cargo</span>
                  </button>
                </div>
              )
            }

            // SLOT OCUPADO / ATIVO
            return (
              <div
                key={item.slot}
                className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between space-y-3 transition-all hover:shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      {rotuloSlot}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Ativo</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-indigo-700 text-lg mt-0.5">
                        workspace_premium
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-indigo-950 leading-snug">{item.cargoNome}</h4>
                        <p className="text-[11px] text-indigo-700 font-medium">{item.departamento}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] bg-white border border-indigo-200 text-indigo-800 font-semibold px-2 py-0.5 rounded-md">
                      Peso Estatutário: {item.peso.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-indigo-100/80">
                  <button
                    type="button"
                    disabled={isPending || !!solicitacaoPendente}
                    onClick={() => handleIniciarEdicaoSlot(item.slot)}
                    className="flex-1 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">sync_alt</span>
                    <span>Substituir</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending || !!solicitacaoPendente}
                    onClick={() => handleRemoverCargoSlot(item.slot)}
                    title="Remover cargo deste slot"
                    className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* JUSTIFICATIVA CASO HAJA ALTERAÇÃO */}
        {houveAlteracao && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Justificativa da Movimentação (opcional, enviada para a GP):
            </label>
            <textarea
              rows={2}
              value={justificativaMovimentacao}
              onChange={(e) => setJustificativaMovimentacao(e.target.value)}
              placeholder="Ex: Mudança de semestre na faculdade ou desejo de atuar em outro capítulo..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            ></textarea>
          </div>
        )}

        {/* RODAPÉ COM AÇÕES PRINCIPAIS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
          <div className="text-[11px] text-slate-500">
            {houveAlteracao ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">edit_note</span>
                Você alterou a configuração dos seus slots. Envie para aprovação da GP.
              </span>
            ) : (
              <span>Seus cargos estão em dia. Clique abaixo para confirmar para o semestre.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {houveAlteracao && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleRestaurar}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Desfazer Alterações
              </button>
            )}

            {!houveAlteracao ? (
              <button
                type="button"
                disabled={isPending || !!solicitacaoPendente}
                onClick={handleConfirmarSemAlteracoes}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Confirmar Meus Cargos (Sem Alterações)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending || !!solicitacaoPendente}
                onClick={handleEnviarMovimentacaoGP}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Enviar Movimentação para a GP</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DESBLOQUEIO DE SLOT EXTRA (SLOT 4 OU 5) */}
      {modalDesbloqueioAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-xl">key</span>
                <h4 className="font-bold text-sm text-gray-900">
                  Pedir Liberação do Slot {slotParaDesbloquear} (Excepcional)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalDesbloqueioAberto(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O estatuto do Ramo Estudantil IEEE estabelece 3 slots como limite padrão para preservar a saúde e a
              dedicação do membro. Para assumir um 4º ou 5º cargo, é obrigatória a autorização expressa da
              Diretoria de Gestão de Pessoas (GP).
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Justificativa para a GP *
              </label>
              <textarea
                rows={3}
                value={justificativaDesbloqueio}
                onChange={(e) => setJustificativaDesbloqueio(e.target.value)}
                placeholder="Explique detalhadamente como você pretende conciliar a carga horária deste cargo extra com suas atribuições atuais e a faculdade..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalDesbloqueioAberto(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmeterDesbloqueio}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Enviar Justificativa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
