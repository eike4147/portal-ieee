'use client'

import { useActionState, useState } from 'react'
import { loginAction, cadastrarPilotoAction, resetPasswordAction, AuthState } from './actions'
import { KeyRound, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, UserPlus, User } from 'lucide-react'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro' | 'reset'>('login')
  const [showPassword, setShowPassword] = useState(false)

  const [loginState, formLoginAction, isLoginPending] = useActionState(loginAction, null)
  const [cadastroState, formCadastroAction, isCadastroPending] = useActionState(cadastrarPilotoAction, null)
  const [resetState, formResetAction, isResetPending] = useActionState(resetPasswordAction, null)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 relative z-10">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">PORTAL IEEE CEFET-RJ</h1>
          <p className="text-xs text-slate-400 mt-1">Sistema de Gestão Interna do Ramo Estudantil</p>
        </div>

        {/* Abas de Navegação */}
        {activeTab !== 'reset' && (
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cadastro')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'cadastro'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Usuário Piloto
            </button>
          </div>
        )}

        {/* Feedback de erro */}
        {activeTab === 'login' && loginState?.error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{loginState.error}</span>
          </div>
        )}

        {activeTab === 'cadastro' && cadastroState?.error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{cadastroState.error}</span>
          </div>
        )}

        {activeTab === 'cadastro' && cadastroState?.success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{cadastroState.success}</span>
          </div>
        )}

        {activeTab === 'reset' && resetState?.error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{resetState.error}</span>
          </div>
        )}

        {activeTab === 'reset' && resetState?.success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{resetState.success}</span>
          </div>
        )}

        {/* ABA: LOGIN */}
        {activeTab === 'login' && (
          <form action={formLoginAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Matrícula ou E-mail
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="identificador"
                  required
                  defaultValue="1234567"
                  placeholder="Ex: 1234567 ou nome@cefet-rj.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  required
                  defaultValue="ieee2026"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoginPending}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {isLoginPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  <span>Entrar no Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ABA: CADASTRO PILOTO */}
        {activeTab === 'cadastro' && (
          <form action={formCadastroAction} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nome"
                  required
                  defaultValue="Admin Presidente"
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  name="matricula"
                  required
                  defaultValue="1234567"
                  placeholder="Ex: 1234567"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  name="senha"
                  required
                  defaultValue="ieee2026"
                  placeholder="Mínimo 6 dígitos"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                E-mail Institucional ou Pessoal
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="admin@cefet-rj.br"
                  placeholder="exemplo@cefet-rj.br"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Este usuário será cadastrado no Supabase com permissão de <strong>Presidente</strong> para testar a abertura e fechamento da sala.
            </p>

            <button
              type="submit"
              disabled={isCadastroPending}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {isCadastroPending ? 'Criando usuário...' : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Usuário Piloto</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ABA: RECUPERAÇÃO DE SENHA */}
        {activeTab === 'reset' && (
          <form action={formResetAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Matrícula ou E-mail
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="identificador"
                  required
                  placeholder="Ex: 1234567 ou seu-email@cefet-rj.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Enviaremos um link de recuperação diretamente para seu e-mail cadastrado.
              </p>
            </div>

            <button
              type="submit"
              disabled={isResetPending}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg transition-all text-sm disabled:opacity-60 cursor-pointer"
            >
              {isResetPending ? 'Enviando link...' : 'Enviar Link de Recuperação'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2 cursor-pointer"
            >
              ← Voltar para o login
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Ramo Estudantil IEEE CEFET-RJ • 2026
          </p>
        </div>
      </div>
    </div>
  )
}
