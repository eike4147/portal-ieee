'use client'

import React, { useState, useEffect, useTransition, useImperativeHandle, forwardRef } from 'react'
import {
  LISTA_CURSOS_CEFET,
  LISTA_PERIODOS,
  detectarCursoDaMatricula,
  sugerirPeriodoDaMatricula,
  aplicarMascaraCPF,
  aplicarMascaraTelefone,
  somenteNumeros,
} from '@/lib/curso-matricula'
import { salvarDadosCadastraisAction, DadosMembroPayload } from '@/app/perfil/actions'

export interface FormAtualizacaoCadastralInlineRef {
  salvar: () => void
  isPending: boolean
}

interface FormAtualizacaoCadastralInlineProps {
  usuario: {
    id: string
    nome: string
    matricula: string
  }
  dadosIniciais?: any
  onSalvoComSucesso?: (novosDados: any) => void
  onCancelar: () => void
  onPendingChange?: (isPending: boolean) => void
}

const FormAtualizacaoCadastralInline = forwardRef<
  FormAtualizacaoCadastralInlineRef,
  FormAtualizacaoCadastralInlineProps
>(function FormAtualizacaoCadastralInline(
  { usuario, dadosIniciais, onSalvoComSucesso, onCancelar, onPendingChange },
  ref
) {
  const [passoAtivo, setPassoAtivo] = useState<1 | 2 | 3>(1)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // ESTADO DO FORMULÁRIO (ETAPA 1: PESSOAIS & CONTATO)
  const [nomeCivil, setNomeCivil] = useState('')
  const [apelido, setApelido] = useState('')
  const [nomeSocial, setNomeSocial] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cpf, setCpf] = useState('')
  const [celular, setCelular] = useState('')
  const [telefoneFixo, setTelefoneFixo] = useState('')
  const [emailContato, setEmailContato] = useState('')
  const [etnia, setEtnia] = useState('')
  const [pcd, setPcd] = useState('Não possui')
  const [pcdOutro, setPcdOutro] = useState('')
  const [neuroatipicidade, setNeuroatipicidade] = useState('Não possui')
  const [neuroOutro, setNeuroOutro] = useState('')

  // ESTADO DO FORMULÁRIO (ETAPA 2: SAÚDE & EMERGÊNCIA)
  const [tipoSanguineo, setTipoSanguineo] = useState('')
  const [planoSaude, setPlanoSaude] = useState('Não possui')
  const [planoSaudeOutro, setPlanoSaudeOutro] = useState('')
  const [emergenciaNome, setEmergenciaNome] = useState('')
  const [emergenciaParentesco, setEmergenciaParentesco] = useState('')
  const [emergenciaParentescoOutro, setEmergenciaParentescoOutro] = useState('')
  const [emergenciaTelefone, setEmergenciaTelefone] = useState('')

  // Múltipla escolha de saúde (com botão exclusivo "Não possui")
  const [alergiaMed, setAlergiaMed] = useState<string[]>(['Não possui'])
  const [alergiaMedOutro, setAlergiaMedOutro] = useState('')
  const [alergiaAlim, setAlergiaAlim] = useState<string[]>(['Não possui'])
  const [alergiaAlimOutro, setAlergiaAlimOutro] = useState('')
  const [alergiaOutras, setAlergiaOutras] = useState<string[]>(['Não possui'])
  const [alergiaOutrasOutro, setAlergiaOutrasOutro] = useState('')
  const [tratamentoContinuo, setTratamentoContinuo] = useState<string[]>(['Não possui'])
  const [tratamentoContinuoOutro, setTratamentoContinuoOutro] = useState('')
  const [medicamentoContinuo, setMedicamentoContinuo] = useState<string[]>(['Não possui'])
  const [medicamentoContinuoOutro, setMedicamentoContinuoOutro] = useState('')
  const [glicosePressao, setGlicosePressao] = useState<string[]>(['Não possui'])
  const [glicosePressaoOutro, setGlicosePressaoOutro] = useState('')

  // ESTADO DO FORMULÁRIO (ETAPA 3: ACADÊMICO & IEEE)
  const [curso, setCurso] = useState('')
  const [cursoOutro, setCursoOutro] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [emailInstitucional, setEmailInstitucional] = useState('')
  const [tempoRamo, setTempoRamo] = useState('')
  const [membresiaIEEE, setMembresiaIEEE] = useState<'Não' | 'Sim (Estudantil)' | 'Sim (Profissional)'>('Não')
  const [numeroMembroIEEE, setNumeroMembroIEEE] = useState('')
  const [capitulosIEEE, setCapitulosIEEE] = useState<string[]>([])
  const [capitulosOutro, setCapitulosOutro] = useState('')

  // Atualiza pai com status isPending
  useEffect(() => {
    if (onPendingChange) {
      onPendingChange(isPending)
    }
  }, [isPending, onPendingChange])

  // Inicializa os dados com valores do Supabase ou pré-preenchimento automático da matrícula
  useEffect(() => {
    const d = dadosIniciais || {}
    const mat = usuario?.matricula || ''

    // Passo 1
    setNomeCivil(d.nome_civil || usuario?.nome || '')
    setApelido(d.apelido || '')
    setNomeSocial(d.nome_social || '')
    setDataNascimento(d.data_nascimento || '')
    setCpf(d.cpf ? aplicarMascaraCPF(d.cpf) : '')
    setCelular(d.celular ? aplicarMascaraTelefone(d.celular) : '')
    setTelefoneFixo(d.telefone_fixo ? aplicarMascaraTelefone(d.telefone_fixo) : '')
    setEmailContato(d.email_contato || '')
    setEtnia(d.etnia || '')

    const pcdVal = d.pcd || 'Não possui'
    if (['Não possui', 'Deficiência Visual', 'Deficiência Auditiva', 'Deficiência Física', 'Deficiência Intelectual', 'Deficiência Múltipla'].includes(pcdVal)) {
      setPcd(pcdVal)
      setPcdOutro('')
    } else {
      setPcd('OUTRO')
      setPcdOutro(pcdVal)
    }

    const neuroVal = d.neuroatipicidade || 'Não possui'
    if (['Não possui', 'TDAH', 'TEA (Espectro Autista)', 'Dislexia', 'AH/SD (Altas Habilidades)'].includes(neuroVal)) {
      setNeuroatipicidade(neuroVal)
      setNeuroOutro('')
    } else {
      setNeuroatipicidade('OUTRO')
      setNeuroOutro(neuroVal)
    }

    // Passo 2
    setTipoSanguineo(d.tipo_sanguineo || '')
    const planoVal = d.plano_saude || 'Não possui'
    if (['Não possui', 'Unimed', 'Bradesco Saúde', 'Amil', 'SulAmérica', 'Hapvida / NotreDame'].includes(planoVal)) {
      setPlanoSaude(planoVal)
      setPlanoSaudeOutro('')
    } else {
      setPlanoSaude('OUTRO')
      setPlanoSaudeOutro(planoVal)
    }

    setEmergenciaNome(d.emergencia_nome || '')
    const parVal = d.emergencia_parentesco || ''
    if (['Mãe', 'Pai', 'Cônjuge / Companheiro(a)', 'Filho(a)', 'Irmão / Irmã', 'Tio(a)', 'Avô / Avó', 'Tutor(a) / Responsável Legal', 'Amigo(a) / Colega'].includes(parVal)) {
      setEmergenciaParentesco(parVal)
      setEmergenciaParentescoOutro('')
    } else if (parVal) {
      setEmergenciaParentesco('OUTRO')
      setEmergenciaParentescoOutro(parVal)
    } else {
      setEmergenciaParentesco('')
      setEmergenciaParentescoOutro('')
    }
    setEmergenciaTelefone(d.emergencia_telefone ? aplicarMascaraTelefone(d.emergencia_telefone) : '')

    // Alergias e Condições
    const parseLista = (str?: string) => {
      if (!str || str === 'Não possui' || str === 'Nenhum' || str === '') return ['Não possui']
      return str.split(',').map((s) => s.trim())
    }
    setAlergiaMed(parseLista(d.alergia_medicamento))
    setAlergiaAlim(parseLista(d.alergia_alimento))
    setAlergiaOutras(parseLista(d.alergia_outras))
    setTratamentoContinuo(parseLista(d.tratamento_continuo))
    setMedicamentoContinuo(parseLista(d.medicamento_continuo))
    setGlicosePressao(parseLista(d.glicose_pressao))

    // Passo 3: AUTO-PREENCHIMENTO POR MATRÍCULA
    const cursoDetectado = detectarCursoDaMatricula(mat)
    const cursoBanco = d.curso || ''
    if (cursoBanco) {
      if (LISTA_CURSOS_CEFET.includes(cursoBanco)) {
        setCurso(cursoBanco)
        setCursoOutro('')
      } else {
        setCurso('Outro')
        setCursoOutro(cursoBanco)
      }
    } else if (cursoDetectado) {
      setCurso(cursoDetectado)
      setCursoOutro('')
    } else {
      setCurso('')
      setCursoOutro('')
    }

    const periodoSugerido = sugerirPeriodoDaMatricula(mat)
    setPeriodo(d.periodo || periodoSugerido || '1º Período')
    setEmailInstitucional(d.email_institucional || '')
    setTempoRamo(d.tempo_ramo || '')

    if (d.membresia_ieee === true) {
      setMembresiaIEEE('Sim (Estudantil)')
    } else {
      setMembresiaIEEE('Não')
    }
    setNumeroMembroIEEE(d.numero_membro_ieee ? somenteNumeros(d.numero_membro_ieee) : '')

    // Capítulos
    if (d.capitulos_ieee && d.capitulos_ieee !== 'Nenhum') {
      const caps = d.capitulos_ieee.split(',').map((s: string) => s.trim())
      setCapitulosIEEE(caps)
    } else {
      setCapitulosIEEE([])
    }

    setFeedback(null)
    setPassoAtivo(1)
  }, [dadosIniciais, usuario])

  // Helpers para Múltipla Escolha com "Não possui" exclusivo
  const toggleItemMulti = (
    item: string,
    listaAtual: string[],
    setLista: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === 'Não possui') {
      setLista(['Não possui'])
      return
    }

    let novaLista = listaAtual.filter((i) => i !== 'Não possui')
    if (novaLista.includes(item)) {
      novaLista = novaLista.filter((i) => i !== item)
      if (novaLista.length === 0) novaLista = ['Não possui']
    } else {
      novaLista.push(item)
    }
    setLista(novaLista)
  }

  // Validação estrita por etapa
  const validarPasso = (passo: number): boolean => {
    setFeedback(null)

    if (passo === 1) {
      if (!nomeCivil.trim() || nomeCivil.trim().length < 3) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, preencha seu Nome Civil Completo.' })
        return false
      }
      if (!dataNascimento) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, selecione sua Data de Nascimento.' })
        return false
      }
      const cpfLimpo = somenteNumeros(cpf)
      if (cpfLimpo.length !== 11) {
        setFeedback({ tipo: 'erro', texto: 'O CPF deve conter exatamente 11 dígitos numéricos.' })
        return false
      }
      const celLimpo = somenteNumeros(celular)
      if (celLimpo.length < 10) {
        setFeedback({ tipo: 'erro', texto: 'Informe seu Celular / WhatsApp com DDD (mínimo 10 dígitos).' })
        return false
      }
      if (!emailContato.trim() || !emailContato.includes('@')) {
        setFeedback({ tipo: 'erro', texto: 'Informe um E-mail Principal de contato válido.' })
        return false
      }
      if (!etnia) {
        setFeedback({ tipo: 'erro', texto: 'Selecione sua identificação étnico-racial.' })
        return false
      }
    }

    if (passo === 2) {
      if (!tipoSanguineo) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, selecione seu Tipo Sanguíneo.' })
        return false
      }
      if (!emergenciaNome.trim() || emergenciaNome.trim().length < 2) {
        setFeedback({ tipo: 'erro', texto: 'Informe o Nome Completo do Contato de Emergência.' })
        return false
      }
      if (!emergenciaParentesco) {
        setFeedback({ tipo: 'erro', texto: 'Selecione o Grau de Parentesco do Contato de Emergência.' })
        return false
      }
      const telEmergLimpo = somenteNumeros(emergenciaTelefone)
      if (telEmergLimpo.length < 10) {
        setFeedback({ tipo: 'erro', texto: 'Informe o Telefone de Emergência com DDD.' })
        return false
      }
    }

    if (passo === 3) {
      const emailInstNorm = emailInstitucional.trim().toLowerCase()
      if (!emailInstNorm || !emailInstNorm.endsWith('@aluno.cefet-rj.br')) {
        setFeedback({
          tipo: 'erro',
          texto: 'O E-mail Institucional deve ter domínio @aluno.cefet-rj.br',
        })
        return false
      }
      if (!curso) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, informe seu Curso no CEFET-RJ.' })
        return false
      }
      if (!periodo) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, informe seu Período Atual.' })
        return false
      }
      if (!tempoRamo) {
        setFeedback({ tipo: 'erro', texto: 'Por favor, informe seu Tempo de Ramo IEEE.' })
        return false
      }
      if (membresiaIEEE !== 'Não' && !numeroMembroIEEE.trim()) {
        setFeedback({
          tipo: 'erro',
          texto: 'Para membros pagantes, é obrigatório informar o Nº de Membro IEEE (apenas números).',
        })
        return false
      }
    }

    return true
  }

  const validarTudo = (): boolean => {
    if (!validarPasso(1)) {
      setPassoAtivo(1)
      return false
    }
    if (!validarPasso(2)) {
      setPassoAtivo(2)
      return false
    }
    if (!validarPasso(3)) {
      setPassoAtivo(3)
      return false
    }
    return true
  }

  const avancarPasso = () => {
    if (validarPasso(passoAtivo)) {
      if (passoAtivo < 3) setPassoAtivo((p) => (p + 1) as any)
    }
  }

  const voltarPasso = () => {
    setFeedback(null)
    if (passoAtivo > 1) setPassoAtivo((p) => (p - 1) as any)
  }

  // Ação de Salvar Tudo
  const handleSalvar = () => {
    if (!validarTudo()) return

    startTransition(async () => {
      const formatarMulti = (lista: string[], outro: string) => {
        if (lista.includes('Não possui')) return 'Não possui'
        let itens = [...lista]
        if (outro.trim()) itens.push(outro.trim())
        return itens.length > 0 ? itens.join(', ') : 'Não possui'
      }

      const cursoFinal = curso === 'Outro' && cursoOutro.trim() ? cursoOutro.trim() : curso
      const pcdFinal = pcd === 'OUTRO' && pcdOutro.trim() ? pcdOutro.trim() : pcd
      const neuroFinal = neuroatipicidade === 'OUTRO' && neuroOutro.trim() ? neuroOutro.trim() : neuroatipicidade
      const planoFinal = planoSaude === 'OUTRO' && planoSaudeOutro.trim() ? planoSaudeOutro.trim() : planoSaude
      const parFinal =
        emergenciaParentesco === 'OUTRO' && emergenciaParentescoOutro.trim()
          ? emergenciaParentescoOutro.trim()
          : emergenciaParentesco

      let capsFinal = [...capitulosIEEE]
      if (capitulosOutro.trim()) capsFinal.push(capitulosOutro.trim())

      const payload: DadosMembroPayload = {
        nome_civil: nomeCivil,
        apelido: apelido,
        nome_social: nomeSocial,
        data_nascimento: dataNascimento,
        cpf: cpf,
        celular: celular,
        telefone_fixo: telefoneFixo,
        email_contato: emailContato,
        email_institucional: emailInstitucional,
        curso: cursoFinal,
        periodo: periodo,
        etnia: etnia,
        pcd: pcdFinal,
        neuroatipicidade: neuroFinal,
        tipo_sanguineo: tipoSanguineo,
        plano_saude: planoFinal,
        emergencia_nome: emergenciaNome,
        emergencia_parentesco: parFinal,
        emergencia_telefone: emergenciaTelefone,
        alergia_medicamento: formatarMulti(alergiaMed, alergiaMedOutro),
        alergia_alimento: formatarMulti(alergiaAlim, alergiaAlimOutro),
        alergia_outras: formatarMulti(alergiaOutras, alergiaOutrasOutro),
        tratamento_continuo: formatarMulti(tratamentoContinuo, tratamentoContinuoOutro),
        medicamento_continuo: formatarMulti(medicamentoContinuo, medicamentoContinuoOutro),
        glicose_pressao: formatarMulti(glicosePressao, glicosePressaoOutro),
        tempo_ramo: tempoRamo,
        membresia_ieee: membresiaIEEE !== 'Não',
        numero_membro_ieee: somenteNumeros(numeroMembroIEEE),
        capitulos_ieee: capsFinal.length > 0 ? capsFinal.join(', ') : 'Nenhum',
      }

      const res = await salvarDadosCadastraisAction(payload)
      if (res.success) {
        setFeedback({ tipo: 'sucesso', texto: res.mensagem || 'Dados salvos com sucesso!' })
        if (onSalvoComSucesso) {
          onSalvoComSucesso({ ...payload, atualizado_em: new Date().toISOString() })
        }
      } else {
        setFeedback({ tipo: 'erro', texto: res.error || 'Erro ao salvar informações.' })
      }
    })
  }

  // Expõe a função de salvar para o cabeçalho externo
  useImperativeHandle(ref, () => ({
    salvar: handleSalvar,
    isPending,
  }))

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden text-left animate-in fade-in duration-200">
      {/* BARRA DE PROGRESSO EM 3 PASSOS */}
      <div className="bg-slate-50 border-b border-slate-200/80 p-2 sm:p-3 flex items-center justify-around gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (passoAtivo > 1 || validarPasso(1)) setPassoAtivo(1)
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
            passoAtivo === 1
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              passoAtivo === 1 ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            1
          </span>
          <span className="hidden sm:inline">1. Identificação Civil & Contato</span>
          <span className="sm:hidden">1. Identificação</span>
        </button>

        <span className="text-slate-300 font-bold">/</span>

        <button
          type="button"
          onClick={() => {
            if (passoAtivo === 1 && !validarPasso(1)) return
            setPassoAtivo(2)
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
            passoAtivo === 2
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              passoAtivo === 2 ? 'bg-white text-red-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            2
          </span>
          <span className="hidden sm:inline">2. Saúde & Emergência</span>
          <span className="sm:hidden">2. Saúde</span>
        </button>

        <span className="text-slate-300 font-bold">/</span>

        <button
          type="button"
          onClick={() => {
            if (passoAtivo === 1 && !validarPasso(1)) return
            if (passoAtivo === 2 && !validarPasso(2)) return
            setPassoAtivo(3)
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
            passoAtivo === 3
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              passoAtivo === 3 ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </span>
          <span className="hidden sm:inline">3. Acadêmico & IEEE</span>
          <span className="sm:hidden">3. Vínculo IEEE</span>
        </button>
      </div>

      {/* FEEDBACK DE VALIDAÇÃO OU SUCESSO */}
      {feedback && (
        <div
          className={`p-3 text-xs font-bold flex items-center gap-2 transition-all ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {feedback.tipo === 'sucesso' ? 'check_circle' : 'error'}
          </span>
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* CORPO DO FORMULÁRIO */}
      <div className="p-5 sm:p-6 space-y-4 text-xs">
        {/* ========================================================================= */}
        {/* ETAPA 1: IDENTIFICAÇÃO CIVIL & CONTATO */}
        {/* ========================================================================= */}
        {passoAtivo === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-blue-800 font-bold">
              <span className="material-symbols-outlined text-base">person</span>
              <span>Passo 1 de 3: Identificação Civil & Contato</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome Civil Completo *</label>
              <input
                type="text"
                value={nomeCivil}
                onChange={(e) => setNomeCivil(e.target.value)}
                placeholder="Nome completo de registro civil"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Apelido <span className="text-blue-600 font-normal">(como prefere ser chamado no Ramo)</span>
                </label>
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Ex: Luquinhas, Zeca, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Social (se houver)</label>
                <input
                  type="text"
                  value={nomeSocial}
                  onChange={(e) => setNomeSocial(e.target.value)}
                  placeholder="Nome social preferencial"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  CPF (apenas números) *
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(aplicarMascaraCPF(e.target.value))}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Identificação Étnico-Racial *</label>
              <select
                value={etnia}
                onChange={(e) => setEtnia(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Selecione...</option>
                <option value="Amarela">Amarela</option>
                <option value="Branca">Branca</option>
                <option value="Indígena">Indígena</option>
                <option value="Parda">Parda</option>
                <option value="Preta">Preta</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Celular / WhatsApp *</label>
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(aplicarMascaraTelefone(e.target.value))}
                  maxLength={15}
                  placeholder="(00) 90000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefone Residencial / Fixo</label>
                <input
                  type="tel"
                  value={telefoneFixo}
                  onChange={(e) => setTelefoneFixo(aplicarMascaraTelefone(e.target.value))}
                  maxLength={15}
                  placeholder="(00) 0000-0000 (Opcional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail Principal para Contato *</label>
              <input
                type="email"
                value={emailContato}
                onChange={(e) => setEmailContato(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Deficiência (PCD)</label>
                <select
                  value={pcd}
                  onChange={(e) => setPcd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Não possui">Não possui</option>
                  <option value="Deficiência Visual">Deficiência Visual</option>
                  <option value="Deficiência Auditiva">Deficiência Auditiva</option>
                  <option value="Deficiência Física">Deficiência Física</option>
                  <option value="Deficiência Intelectual">Deficiência Intelectual</option>
                  <option value="Deficiência Múltipla">Deficiência Múltipla</option>
                  <option value="OUTRO">Outro (especificar...)</option>
                </select>
                {pcd === 'OUTRO' && (
                  <input
                    type="text"
                    value={pcdOutro}
                    onChange={(e) => setPcdOutro(e.target.value)}
                    placeholder="Especifique a deficiência..."
                    className="w-full mt-2 bg-white border border-blue-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neurodivergência</label>
                <select
                  value={neuroatipicidade}
                  onChange={(e) => setNeuroatipicidade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Não possui">Não possui</option>
                  <option value="TDAH">TDAH</option>
                  <option value="TEA (Espectro Autista)">TEA (Espectro Autista)</option>
                  <option value="Dislexia">Dislexia</option>
                  <option value="AH/SD (Altas Habilidades)">AH/SD (Altas Habilidades)</option>
                  <option value="OUTRO">Outro (especificar...)</option>
                </select>
                {neuroatipicidade === 'OUTRO' && (
                  <input
                    type="text"
                    value={neuroOutro}
                    onChange={(e) => setNeuroOutro(e.target.value)}
                    placeholder="Especifique a condição..."
                    className="w-full mt-2 bg-white border border-blue-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: SAÚDE & EMERGÊNCIA */}
        {/* ========================================================================= */}
        {passoAtivo === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-red-700 font-bold">
              <span className="material-symbols-outlined text-base">medical_services</span>
              <span>Passo 2 de 3: Saúde & Contato de Emergência</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo Sanguíneo + RH *</label>
                <select
                  value={tipoSanguineo}
                  onChange={(e) => setTipoSanguineo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Não sei">Não sei</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Plano de Saúde</label>
                <select
                  value={planoSaude}
                  onChange={(e) => setPlanoSaude(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="Não possui">Não possui</option>
                  <option value="Unimed">Unimed</option>
                  <option value="Bradesco Saúde">Bradesco Saúde</option>
                  <option value="Amil">Amil</option>
                  <option value="SulAmérica">SulAmérica</option>
                  <option value="Hapvida / NotreDame">Hapvida / NotreDame</option>
                  <option value="OUTRO">Outro (especificar...)</option>
                </select>
                {planoSaude === 'OUTRO' && (
                  <input
                    type="text"
                    value={planoSaudeOutro}
                    onChange={(e) => setPlanoSaudeOutro(e.target.value)}
                    placeholder="Nome do plano de saúde..."
                    className="w-full mt-2 bg-white border border-red-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                )}
              </div>
            </div>

            {/* CARD DE CONTATO DE EMERGÊNCIA */}
            <div className="bg-red-50/60 p-3.5 rounded-2xl border border-red-200/80 space-y-3">
              <p className="font-bold text-red-900 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-red-600">contact_phone</span>
                <span>Contato de Emergência</span>
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo do Contato *</label>
                <input
                  type="text"
                  value={emergenciaNome}
                  onChange={(e) => setEmergenciaNome(e.target.value)}
                  placeholder="Ex: Maria das Graças"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grau de Parentesco *</label>
                  <select
                    value={emergenciaParentesco}
                    onChange={(e) => setEmergenciaParentesco(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Cônjuge / Companheiro(a)">Cônjuge / Companheiro(a)</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Irmão / Irmã">Irmão / Irmã</option>
                    <option value="Tio(a)">Tio(a)</option>
                    <option value="Avô / Avó">Avô / Avó</option>
                    <option value="Tutor(a) / Responsável Legal">Tutor(a) / Responsável Legal</option>
                    <option value="Amigo(a) / Colega">Amigo(a) / Colega</option>
                    <option value="OUTRO">Outro (especificar...)</option>
                  </select>
                  {emergenciaParentesco === 'OUTRO' && (
                    <input
                      type="text"
                      value={emergenciaParentescoOutro}
                      onChange={(e) => setEmergenciaParentescoOutro(e.target.value)}
                      placeholder="Especifique o parentesco..."
                      className="w-full mt-2 bg-white border border-red-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone de Emergência *</label>
                  <input
                    type="tel"
                    value={emergenciaTelefone}
                    onChange={(e) => setEmergenciaTelefone(aplicarMascaraTelefone(e.target.value))}
                    maxLength={15}
                    placeholder="(00) 90000-0000"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CHIPS DE MÚLTIPLA ESCOLHA: ALERGIAS & TRATAMENTOS */}
            <div className="space-y-3">
              {/* 1. Alergia Medicamento */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-2">
                <label className="font-bold text-slate-700 block text-xs">Alergia a Medicamentos</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Não possui', 'Dipirona', 'Penicilina / Amoxicilina', 'AAS / Aspirina', 'Ibuprofeno'].map(
                    (opt) => {
                      const ativo = alergiaMed.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleItemMulti(opt, alergiaMed, setAlergiaMed)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            ativo
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    }
                  )}
                </div>
                {!alergiaMed.includes('Não possui') && (
                  <input
                    type="text"
                    value={alergiaMedOutro}
                    onChange={(e) => setAlergiaMedOutro(e.target.value)}
                    placeholder="Outros medicamentos alérgicos..."
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  />
                )}
              </div>

              {/* 2. Alergia Alimento */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-2">
                <label className="font-bold text-slate-700 block text-xs">Alergia a Alimentos</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Não possui', 'Lactose / Leite', 'Glúten', 'Frutos do Mar / Camarão', 'Amendoim / Castanhas', 'Ovo'].map(
                    (opt) => {
                      const ativo = alergiaAlim.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleItemMulti(opt, alergiaAlim, setAlergiaAlim)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            ativo
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    }
                  )}
                </div>
                {!alergiaAlim.includes('Não possui') && (
                  <input
                    type="text"
                    value={alergiaAlimOutro}
                    onChange={(e) => setAlergiaAlimOutro(e.target.value)}
                    placeholder="Outros alimentos alérgicos..."
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  />
                )}
              </div>

              {/* 3. Medicamento Contínuo */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-2">
                <label className="font-bold text-slate-700 block text-xs">Uso de Medicamento Contínuo</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Não possui', 'Anticoncepcional', 'Ansiolítico / Antidepressivo', 'Anti-hipertensivo', 'Insulina'].map(
                    (opt) => {
                      const ativo = medicamentoContinuo.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleItemMulti(opt, medicamentoContinuo, setMedicamentoContinuo)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            ativo
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    }
                  )}
                </div>
                {!medicamentoContinuo.includes('Não possui') && (
                  <input
                    type="text"
                    value={medicamentoContinuoOutro}
                    onChange={(e) => setMedicamentoContinuoOutro(e.target.value)}
                    placeholder="Especifique outros medicamentos contínuos..."
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  />
                )}
              </div>

              {/* 4. Glicose ou Pressão */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-2">
                <label className="font-bold text-slate-700 block text-xs">Condições de Glicose ou Pressão</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Não possui', 'Hipertensão (Pressão Alta)', 'Hipotensão (Pressão Baixa)', 'Diabetes Tipo 1', 'Diabetes Tipo 2'].map(
                    (opt) => {
                      const ativo = glicosePressao.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleItemMulti(opt, glicosePressao, setGlicosePressao)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            ativo
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    }
                  )}
                </div>
                {!glicosePressao.includes('Não possui') && (
                  <input
                    type="text"
                    value={glicosePressaoOutro}
                    onChange={(e) => setGlicosePressaoOutro(e.target.value)}
                    placeholder="Especifique a condição..."
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 3: VÍNCULO ACADÊMICO & IEEE */}
        {/* ========================================================================= */}
        {passoAtivo === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-indigo-800 font-bold">
              <span className="material-symbols-outlined text-base">school</span>
              <span>Passo 3 de 3: Vínculo Acadêmico & IEEE</span>
            </div>

            {/* CARD DE MATRÍCULA E CURSO CEFET AUTO-PREENCHIDO */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-3.5 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-blue-600 text-white font-extrabold uppercase px-2 py-0.5 rounded-md">
                  CEFET/RJ - Campus Maracanã
                </span>
                <span className="text-slate-400 text-[10px] font-bold">Auto-detectado por Matrícula</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matrícula CEFET-RJ</label>
                  <input
                    type="text"
                    value={usuario?.matricula || ''}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-300/80 rounded-xl p-2.5 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Curso <span className="text-blue-600 font-normal">(detectado pelo sufixo)</span> *
                  </label>
                  <select
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione o curso...</option>
                    {LISTA_CURSOS_CEFET.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {curso === 'Outro' && (
                    <input
                      type="text"
                      value={cursoOutro}
                      onChange={(e) => setCursoOutro(e.target.value)}
                      placeholder="Nome do seu curso..."
                      className="w-full mt-2 bg-white border border-blue-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Período Atual *</label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione o período...</option>
                    {LISTA_PERIODOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    E-mail Institucional (@aluno.cefet-rj.br) *
                  </label>
                  <input
                    type="email"
                    value={emailInstitucional}
                    onChange={(e) => setEmailInstitucional(e.target.value)}
                    placeholder="nome.sobrenome@aluno.cefet-rj.br"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO RAMO IEEE & MEMBRESIA */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tempo de Participação no Ramo IEEE *</label>
                <select
                  value={tempoRamo}
                  onChange={(e) => setTempoRamo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Selecione o tempo de participação...</option>
                  <option value="Menos de 6 meses">Menos de 6 meses (Trainee / Recente)</option>
                  <option value="Entre 6 meses e 1 ano">Entre 6 meses e 1 ano</option>
                  <option value="Entre 1 e 2 anos">Entre 1 e 2 anos</option>
                  <option value="Mais de 2 anos">Mais de 2 anos</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Possui Membresia IEEE Internacional? *</label>
                  <select
                    value={membresiaIEEE}
                    onChange={(e) => setMembresiaIEEE(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Não">Não (Membro Ouvinte / Não Pagante)</option>
                    <option value="Sim (Estudantil)">Sim (Membro Estudantil Ativo)</option>
                    <option value="Sim (Profissional)">Sim (Membro Profissional)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nº de Membro IEEE <span className="text-slate-400 font-normal">(apenas números)</span>
                  </label>
                  <input
                    type="text"
                    value={numeroMembroIEEE}
                    onChange={(e) => setNumeroMembroIEEE(somenteNumeros(e.target.value))}
                    maxLength={10}
                    placeholder="Ex: 98765432"
                    disabled={membresiaIEEE === 'Não'}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none transition-all ${
                      membresiaIEEE !== 'Não'
                        ? 'bg-white border-indigo-300 focus:ring-2 focus:ring-indigo-500 text-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* CAPÍTULOS / SOCIEDADES */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-slate-700 block text-xs">
                  Capítulos e Sociedades IEEE Associadas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { sigla: 'RAS', nome: 'Robotics & Auto' },
                    { sigla: 'PES', nome: 'Power & Energy' },
                    { sigla: 'CS', nome: 'Computer Society' },
                    { sigla: 'WIE', nome: 'Women in Eng.' },
                    { sigla: 'AESS', nome: 'Aerospace' },
                    { sigla: 'IES', nome: 'Ind. Electronics' },
                    { sigla: 'SSIT', nome: 'Social Impl.' },
                    { sigla: 'PS', nome: 'Photonics' },
                  ].map((cap) => {
                    const ativo = capitulosIEEE.includes(cap.sigla)
                    return (
                      <button
                        key={cap.sigla}
                        type="button"
                        onClick={() => {
                          if (ativo) {
                            setCapitulosIEEE((prev) => prev.filter((c) => c !== cap.sigla))
                          } else {
                            setCapitulosIEEE((prev) => [...prev, cap.sigla])
                          }
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          ativo
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs">{cap.sigla}</div>
                        <div
                          className={`text-[9px] truncate ${
                            ativo ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {cap.nome}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={capitulosOutro}
                  onChange={(e) => setCapitulosOutro(e.target.value)}
                  placeholder="Outro capítulo ou sociedade..."
                  className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RODAPÉ COM BOTÕES DE AÇÃO */}
      <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {passoAtivo > 1 && (
            <button
              type="button"
              onClick={voltarPasso}
              disabled={isPending}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Anterior
            </button>
          )}

          {passoAtivo < 3 ? (
            <button
              type="button"
              onClick={avancarPasso}
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-xs hover:bg-blue-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Próximo Passo</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSalvar}
              disabled={isPending}
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs hover:bg-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {isPending ? 'sync' : 'save'}
              </span>
              <span>{isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

export default FormAtualizacaoCadastralInline
