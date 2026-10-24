'use client'

import { useState, useTransition } from 'react'
import { toggleSalaAction } from './actions'
import { logoutAction } from '../login/actions'
import {
  DoorOpen,
  DoorClosed,
  Clock,
  User,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react'

type SalaClientProps = {
  usuario: {
    id: string
    nome: string
    matricula: string
    cargos: string[]
    podeGerenciarSala: boolean
  }
  statusAtual: {
    aberta: boolean
    ultimoResponsavel: string
    dataHora: string | null
  }
  historico: any[]
}

export default function SalaClient({ usuario, statusAtual, historico }: SalaClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const formatarDataHora = (iso: string | null) => {
    if (!iso) return 'Sem registro'
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleToggle = (novoStatus: 'Aberta' | 'Fechada') => {
    setFeedbackError(null)
    startTransition(async () => {
      const res = await toggleSalaAction(novoStatus)
      if (res?.error) {
        setFeedbackError(res.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de Navegação Superior */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              IEEE
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide text-white block">Portal IEEE CEFET-RJ</span>
              <span className="text-xs text-slate-400">Controle de Acesso da Sala</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200">{usuario.nome}</span>
              <span className="text-[11px] text-slate-400">
                {usuario.cargos[0] || (usuario.matricula ? `Mat. ${usuario.matricula}` : 'Membro')}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sair da conta"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors border border-slate-700/60 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Alerta de erro */}
        {feedbackError && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{feedbackError}</span>
          </div>
        )}

        {/* Card Principal: Status da Sala */}
        <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          statusAtual.aberta
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 border-emerald-500/30 shadow-2xl shadow-emerald-950/40'
            : 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border-slate-800 shadow-xl'
        }`}>
          {/* Efeito luminoso de fundo */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
            statusAtual.aberta ? 'bg-emerald-500/10' : 'bg-slate-700/10'
          }`} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border">
                {statusAtual.aberta ? (
                  <span className="flex items-center gap-2 text-emerald-400 border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sala Aberta no Momento
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-slate-400 border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Sala Fechada
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                  {statusAtual.aberta ? (
                    <>
                      <DoorOpen className="w-8 h-8 text-emerald-400" />
                      <span>Sala do Ramo Aberta</span>
                    </>
                  ) : (
                    <>
                      <DoorClosed className="w-8 h-8 text-slate-400" />
                      <span>Sala do Ramo Fechada</span>
                    </>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Última atualização por: <strong className="text-slate-200">{statusAtual.ultimoResponsavel}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Horário: {formatarDataHora(statusAtual.dataHora)}
                </p>
              </div>
            </div>

            {/* Ações de Abertura / Fechamento */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {usuario.podeGerenciarSala ? (
                statusAtual.aberta ? (
                  <button
                    onClick={() => handleToggle('Fechada')}
                    disabled={isPending}
                    className="py-3 px-6 bg-red-600/90 hover:bg-red-500 text-white font-medium rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <DoorClosed className="w-4 h-4" />
                    )}
                    <span>Registrar Fechamento</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggle('Aberta')}
                    disabled={isPending}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <DoorOpen className="w-4 h-4" />
                    )}
                    <span>Registrar Abertura</span>
                  </button>
                )
              ) : (
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Apenas membros com cargo ativo podem abrir ou fechar a sala.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico Recente de Acessos */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Histórico Recente de Acessos</span>
            </h3>
            <span className="text-xs text-slate-500">Últimos 10 registros</span>
          </div>

          {historico.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Nenhum registro de acesso na sala ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Data e Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historico.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.status === 'Aberta'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'Aberta' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {log.usuarios?.nome || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                        {log.usuarios?.matricula || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {formatarDataHora(log.data_hora)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
