'use client'

import { useActionState, useState } from 'react'
import { loginAction, cadastrarPilotoAction, resetPasswordAction } from './actions'

export default function LoginPage() {
  const [activeView, setActiveView] = useState<'login' | 'cadastro'>('login')
  const [modalRecuperarAberto, setModalRecuperarAberto] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [loginState, formLoginAction, isLoginPending] = useActionState(loginAction, null)
  const [cadastroState, formCadastroAction, isCadastroPending] = useActionState(cadastrarPilotoAction, null)
  const [resetState, formResetAction, isResetPending] = useActionState(resetPasswordAction, null)

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center p-6 antialiased font-body relative">
      {/* CARD PRINCIPAL DE LOGIN (EXATO DO INDEX.HTML) */}
      <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-lg text-center relative z-10 border border-blue-100">
        <div className="w-16 h-16 bg-blue-100 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="font-headline font-bold text-2xl text-primary mb-2">Portal IEEE</h1>
        <p className="text-xs text-gray-400 mb-6 font-medium">Insira seus dados para acessar</p>

        {/* Alternador sutil entre Login e Criação de Piloto */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5 text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => setActiveView('login')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeView === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Acessar
          </button>
          <button
            type="button"
            onClick={() => setActiveView('cadastro')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeView === 'cadastro' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Cadastrar Piloto
          </button>
        </div>

        {/* FEEDBACKS */}
        {activeView === 'login' && loginState?.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{loginState.error}</span>
          </div>
        )}

        {activeView === 'cadastro' && cadastroState?.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{cadastroState.error}</span>
          </div>
        )}

        {activeView === 'cadastro' && cadastroState?.success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{cadastroState.success}</span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN (INDEX.HTML STYLE) */}
        {activeView === 'login' && (
          <form action={formLoginAction} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                Matrícula ou E-mail
              </label>
              <input
                type="text"
                name="identificador"
                required
                defaultValue="1234567"
                placeholder="2323162GADM ou email"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary uppercase transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-gray-400 hover:text-primary flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="senha"
                required
                defaultValue="ieee2026"
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-lg outline-none focus:ring-2 focus:ring-primary font-semibold transition-all tracking-widest"
              />
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={isLoginPending}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoginPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            <div className="flex flex-col items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setModalRecuperarAberto(true)}
                className="text-xs text-primary font-extrabold hover:underline py-2.5 flex items-center justify-center gap-1.5 bg-blue-50/80 hover:bg-blue-100/80 w-full rounded-xl border border-blue-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">lock_reset</span>
                <span>Esqueci minha senha / Redefinir</span>
              </button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE CADASTRO PILOTO */}
        {activeView === 'cadastro' && (
          <form action={formCadastroAction} className="space-y-3 text-left">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                required
                defaultValue="Admin Presidente"
                placeholder="Nome do Membro"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  name="matricula"
                  required
                  defaultValue="1234567"
                  placeholder="1234567"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  name="senha"
                  required
                  defaultValue="ieee2026"
                  placeholder="Mín. 6 dígitos"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue="admin@cefet-rj.br"
                placeholder="email@cefet-rj.br"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <p className="text-[10px] text-gray-400 leading-tight">
              * O usuário piloto será vinculado automaticamente ao cargo de <strong>Presidente</strong> para testes.
            </p>

            <button
              type="submit"
              disabled={isCadastroPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {isCadastroPending ? 'Cadastrando...' : 'Criar Usuário Piloto'}
            </button>
          </form>
        )}
      </div>

      {/* MODAL DE RECUPERAÇÃO DE PIN NO LOGIN (INDEX.HTML STYLE) */}
      {modalRecuperarAberto && (
        <div className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lock_reset</span> Recuperar Acesso
              </h4>
              <button
                type="button"
                onClick={() => setModalRecuperarAberto(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Digite sua matrícula ou e-mail cadastrado para redefinir sua senha:
            </p>

            {resetState?.error && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                {resetState.error}
              </div>
            )}

            {resetState?.success && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {resetState.success}
              </div>
            )}

            <form action={formResetAction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Matrícula ou E-mail *</label>
                <input
                  type="text"
                  name="identificador"
                  required
                  placeholder="Ex: 1234567 ou email@cefet-rj.br"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold uppercase focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalRecuperarAberto(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetPending}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md hover:bg-blue-700 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <span>{isResetPending ? 'Enviando...' : 'Enviar Link'}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <footer className="mt-8 text-center text-xs text-gray-400">
        Ramo Estudantil IEEE CEFET-RJ • 2026
      </footer>
    </div>
  )
}
