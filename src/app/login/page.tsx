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

  // Estados do formulário de login para atalhos
  const [loginIdentificador, setLoginIdentificador] = useState('1234567')
  const [loginSenha, setLoginSenha] = useState('ieee2026')

  // Estados do formulário de cadastro com presets
  const [cadNome, setCadNome] = useState('Lucas Líder de Equipe')
  const [cadMatricula, setCadMatricula] = useState('2323101')
  const [cadEmail, setCadEmail] = useState('lider.teste@cefet-rj.br')
  const [cadSenha, setCadSenha] = useState('ieee2026')
  const [cadCargo, setCadCargo] = useState('CS-GAME-GER-LID')

  const aplicarPresetCadastro = (tipo: 'pres' | 'lider' | 'membro' | 'trainee') => {
    if (tipo === 'pres') {
      setCadNome('Admin Presidente')
      setCadMatricula('1234567')
      setCadEmail('admin@cefet-rj.br')
      setCadSenha('ieee2026')
      setCadCargo('RAMO-EXEC-GER-PRES')
    } else if (tipo === 'lider') {
      setCadNome('Lucas Líder de Equipe')
      setCadMatricula('2323101')
      setCadEmail('lider.teste@cefet-rj.br')
      setCadSenha('ieee2026')
      setCadCargo('CS-GAME-GER-LID')
    } else if (tipo === 'membro') {
      setCadNome('Marcos Membro Projetista')
      setCadMatricula('2323102')
      setCadEmail('membro.teste@cefet-rj.br')
      setCadSenha('ieee2026')
      setCadCargo('AESS-TEC-AERO-MEM')
    } else if (tipo === 'trainee') {
      setCadNome('Tiago Trainee PSE')
      setCadMatricula('2323103')
      setCadEmail('trainee.teste@cefet-rj.br')
      setCadSenha('ieee2026')
      setCadCargo('WIE-TEC-GER-TRA')
    }
  }

  const preencherLoginRapido = (id: string) => {
    setLoginIdentificador(id)
    setLoginSenha('ieee2026')
  }

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
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Acessar
          </button>
          <button
            type="button"
            onClick={() => setActiveView('cadastro')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
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
                value={loginIdentificador}
                onChange={(e) => setLoginIdentificador(e.target.value)}
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
                  className="text-[11px] text-gray-400 hover:text-primary flex items-center gap-1 cursor-pointer"
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
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
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

            {/* ATALHOS RÁPIDOS PARA TESTE DE USUÁRIOS */}
            <div className="pt-3 border-t border-gray-100 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">speed</span>
                <span>Preencher Matrícula para Teste:</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => preencherLoginRapido('1234567')}
                  className="p-1.5 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-100 transition-colors cursor-pointer text-left truncate"
                >
                  👑 Admin (1234567)
                </button>
                <button
                  type="button"
                  onClick={() => preencherLoginRapido('2323101')}
                  className="p-1.5 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-100 transition-colors cursor-pointer text-left truncate"
                >
                  🛠️ Líder (2323101)
                </button>
                <button
                  type="button"
                  onClick={() => preencherLoginRapido('2323102')}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors cursor-pointer text-left truncate"
                >
                  👤 Membro (2323102)
                </button>
                <button
                  type="button"
                  onClick={() => preencherLoginRapido('2323103')}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors cursor-pointer text-left truncate"
                >
                  🐣 Trainee (2323103)
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setModalRecuperarAberto(true)}
                className="text-xs text-primary font-extrabold hover:underline py-2 flex items-center justify-center gap-1.5 bg-blue-50/50 hover:bg-blue-100/80 w-full rounded-xl border border-blue-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">lock_reset</span>
                <span>Esqueci minha senha / Redefinir</span>
              </button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE CADASTRO PILOTO COM PRESETS */}
        {activeView === 'cadastro' && (
          <form action={formCadastroAction} className="space-y-3 text-left">
            {/* SELEÇÃO RÁPIDA DE PRESET */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase ml-0.5 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">tune</span>
                <span>Preenchimento Rápido por Perfil:</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => aplicarPresetCadastro('lider')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left truncate ${
                    cadCargo === 'CS-GAME-GER-LID'
                      ? 'bg-blue-100 border-blue-300 text-primary ring-1 ring-primary'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🛠️ Líder (Opera Sala)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetCadastro('membro')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left truncate ${
                    cadCargo === 'AESS-TEC-AERO-MEM'
                      ? 'bg-amber-100 border-amber-300 text-amber-800 ring-1 ring-amber-600'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👤 Membro (Sem Sala)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetCadastro('trainee')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left truncate ${
                    cadCargo === 'WIE-TEC-GER-TRA'
                      ? 'bg-amber-100 border-amber-300 text-amber-800 ring-1 ring-amber-600'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🐣 Trainee (Sem Sala)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetCadastro('pres')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left truncate ${
                    cadCargo === 'RAMO-EXEC-GER-PRES'
                      ? 'bg-blue-100 border-blue-300 text-primary ring-1 ring-primary'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👑 Presidente (Total)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                Cargo e Permissão *
              </label>
              <select
                name="cargo_id"
                value={cadCargo}
                onChange={(e) => setCadCargo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer text-gray-800"
              >
                <option value="RAMO-EXEC-GER-PRES">👑 Presidente (Ramo IEEE • Acesso Total e Sala)</option>
                <option value="CS-GAME-GER-LID">🛠️ Líder (CS Games • Opera Sala)</option>
                <option value="AESS-TEC-AERO-MEM">👤 Membro Projetista (AESS Aero • Apenas Visualiza Sala)</option>
                <option value="WIE-TEC-GER-TRA">🐣 Trainee PSE (WIE • Apenas Visualiza Sala)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                required
                value={cadNome}
                onChange={(e) => setCadNome(e.target.value)}
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
                  value={cadMatricula}
                  onChange={(e) => setCadMatricula(e.target.value)}
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
                  value={cadSenha}
                  onChange={(e) => setCadSenha(e.target.value)}
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
                value={cadEmail}
                onChange={(e) => setCadEmail(e.target.value)}
                placeholder="email@cefet-rj.br"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <p className="text-[10px] text-gray-400 leading-tight">
              {cadCargo === 'MEMBRO_PROJ' || cadCargo === 'TRAINEE' ? (
                <span className="text-amber-700 font-medium">
                  ⚠️ Este usuário será criado com perfil <strong>sem autorização</strong> para abrir ou assumir a sala (apenas visualização).
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  ✅ Este usuário terá autorização de liderança para abrir, transferir e trancar a sala.
                </span>
              )}
            </p>

            <button
              type="submit"
              disabled={isCadastroPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {isCadastroPending ? 'Cadastrando...' : 'Cadastrar Usuário de Teste'}
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
