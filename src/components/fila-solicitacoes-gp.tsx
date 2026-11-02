'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  SolicitacaoMovimentacao,
  obterSolicitacoesGPPendentesAction,
  decidirSolicitacaoGPAction,
} from '@/app/cargos/actions'

export default function FilaSolicitacoesGP() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoMovimentacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Estado para modal de recusa
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false)
  const [solicitacaoRecusando, setSolicitacaoRecusando] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')

  const carregarFila = async () => {
    setCarregando(true)
    const res = await obterSolicitacoesGPPendentesAction()
    if (res.sucesso && res.solicitacoes) {
      setSolicitacoes(res.solicitacoes)
    } else {
      setSolicitacoes([])
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarFila()
  }, [])

  const handleAprovar = (solicitacaoId: string) => {
    startTransition(async () => {
      const res = await decidirSolicitacaoGPAction(solicitacaoId, 'aprovado')
      if (res.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: res.mensagem })
        carregarFila()
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem })
      }
    })
  }

  const handleAbrirRecusa = (solicitacaoId: string) => {
    setSolicitacaoRecusando(solicitacaoId)
    setMotivoRecusa('')
    setModalRecusaAberto(true)
  }

  const handleConfirmarRecusa = () => {
    if (!solicitacaoRecusando) return

    startTransition(async () => {
      const res = await decidirSolicitacaoGPAction(
        solicitacaoRecusando,
        'rejeitado',
        motivoRecusa.trim() || undefined
      )
      if (res.sucesso) {
        setModalRecusaAberto(false)
        setSolicitacaoRecusando(null)
        setFeedback({ tipo: 'sucesso', texto: res.mensagem })
        carregarFila()
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem })
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">checklist_rtl</span>
          <span>Fila de Solicitações de Movimentação & Slots (GP)</span>
        </h4>
        <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full">
          {solicitacoes.length} pendente{solicitacoes.length === 1 ? '' : 's'}
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.texto}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {carregando ? (
        <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-center text-xs text-purple-600 animate-pulse">
          Carregando fila de solicitações...
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 text-center text-xs text-purple-800">
          ✨ Nenhuma solicitação de movimentação ou desbloqueio pendente de análise pela GP.
        </div>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((sol) => (
            <div
              key={sol.id}
              className="p-4 bg-white border border-purple-200 rounded-2xl shadow-xs space-y-3 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{sol.nome_usuario}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      ID: {sol.matricula_usuario}
                    </span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-1 ${
                      sol.tipo === 'desbloqueio_slot'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {sol.tipo === 'desbloqueio_slot'
                      ? `🔒 Pedido de Desbloqueio do Slot ${sol.slot_solicitado}`
                      : '🔄 Movimentação de Cargos nos Slots'}
                  </span>
                </div>

                <span className="text-[10px] text-gray-400">
                  {new Date(sol.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* CONTEÚDO DA SOLICITAÇÃO */}
              {sol.tipo === 'movimentacao_cargos' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Cargos Anteriores:
                    </span>
                    <p className="font-medium text-slate-700">
                      {sol.cargos_atuais?.length > 0 ? sol.cargos_atuais.join(', ') : 'Nenhum cargo'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                      Cargos Propostos:
                    </span>
                    <p className="font-bold text-emerald-950">
                      {sol.cargos_propostos?.length > 0 ? sol.cargos_propostos.join(', ') : 'Desligamento total'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                    Justificativa enviada pelo membro:
                  </span>
                  <p className="text-amber-950 italic">"{sol.justificativa || 'Sem justificativa'}"</p>
                </div>
              )}

              {sol.justificativa && sol.tipo === 'movimentacao_cargos' && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                  Justificativa: "{sol.justificativa}"
                </p>
              )}

              {/* BOTÕES DE AVALIAÇÃO DA GP */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAbrirRecusa(sol.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Recusar
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAprovar(sol.id)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Aprovar Solicitação</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE RECUSA COM MOTIVO */}
      {modalRecusaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-xl border border-gray-100">
            <h4 className="font-bold text-sm text-gray-900">Motivo da Recusa (Opcional)</h4>
            <p className="text-xs text-gray-500">
              Informe ao membro por que a solicitação de movimentação ou desbloqueio foi indeferida.
            </p>
            <textarea
              rows={3}
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Ex: Teto de carga ultrapassado ou conflito de horário..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-500 font-medium"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalRecusaAberto(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmarRecusa}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
