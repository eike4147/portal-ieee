'use client'

import React, { useState } from 'react'

interface ConfiguradorListasAgendaProps {
  salasIniciais?: string[]
  categoriasRamoIniciais?: string[]
  categoriasPseIniciais?: string[]
  onSalvarListas: (
    salas: string[],
    categoriasRamo: string[],
    categoriasPse: string[]
  ) => Promise<{ sucesso: boolean; mensagem: string }>
}

export const SALAS_PADRAO = [
  'E-213 - Sala do Ramo',
  'Auditório 1',
  'Lab Maker (E-205)',
  'Laboratório de Informática',
  'Sala de Estudos',
  'Pátio / Espaço Aberto',
]

export const CATEGORIAS_RAMO_PADRAO = [
  'Capacitação Técnica',
  'Reunião de Equipe',
  'Reunião Geral do Ramo',
  'Reunião de Diretoria / Lideranças',
  'Workshop / Hackathon',
  'Alinhamento 1:1',
]

export const CATEGORIAS_PSE_PADRAO = [
  'Capacitação Trainee',
  'Reunião 360',
  'Dinâmica em Grupo',
  'Entrevista Individual',
  'Follow Up Trainee',
]

export const ConfiguradorListasAgenda: React.FC<ConfiguradorListasAgendaProps> = ({
  salasIniciais,
  categoriasRamoIniciais,
  categoriasPseIniciais,
  onSalvarListas,
}) => {
  const [salas, setSalas] = useState<string[]>(salasIniciais || SALAS_PADRAO)
  const [categoriasRamo, setCategoriasRamo] = useState<string[]>(
    categoriasRamoIniciais || CATEGORIAS_RAMO_PADRAO
  )
  const [categoriasPse, setCategoriasPse] = useState<string[]>(
    categoriasPseIniciais || CATEGORIAS_PSE_PADRAO
  )

  const [abaAtiva, setAbaAtiva] = useState<'salas' | 'categorias_ramo' | 'categorias_pse'>('salas')
  const [novoItemTexto, setNovoItemTexto] = useState('')
  const [isSalvando, setIsSalvando] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  const handleAdicionarItem = () => {
    const texto = novoItemTexto.trim()
    if (!texto) return

    if (abaAtiva === 'salas') {
      if (salas.includes(texto)) {
        alert('Esta sala já está cadastrada.')
        return
      }
      setSalas((prev) => [...prev, texto])
    } else if (abaAtiva === 'categorias_ramo') {
      if (categoriasRamo.includes(texto)) {
        alert('Esta categoria já existe.')
        return
      }
      setCategoriasRamo((prev) => [...prev, texto])
    } else {
      if (categoriasPse.includes(texto)) {
        alert('Esta categoria já existe.')
        return
      }
      setCategoriasPse((prev) => [...prev, texto])
    }

    setNovoItemTexto('')
  }

  const handleRemoverItem = (index: number) => {
    if (abaAtiva === 'salas') {
      setSalas((prev) => prev.filter((_, i) => i !== index))
    } else if (abaAtiva === 'categorias_ramo') {
      setCategoriasRamo((prev) => prev.filter((_, i) => i !== index))
    } else {
      setCategoriasPse((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleRestaurarPadroes = () => {
    if (!confirm('Deseja restaurar as opções padrões oficiais do Ramo?')) return
    if (abaAtiva === 'salas') setSalas(SALAS_PADRAO)
    else if (abaAtiva === 'categorias_ramo') setCategoriasRamo(CATEGORIAS_RAMO_PADRAO)
    else setCategoriasPse(CATEGORIAS_PSE_PADRAO)
  }

  const handleSalvarTudo = async () => {
    setIsSalvando(true)
    setFeedback(null)
    try {
      const res = await onSalvarListas(salas, categoriasRamo, categoriasPse)
      if (res.sucesso) {
        setFeedback({ tipo: 'ok', msg: res.mensagem || 'Opções salvas com sucesso no banco!' })
      } else {
        setFeedback({ tipo: 'erro', msg: res.mensagem })
      }
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: err.message || 'Erro ao salvar.' })
    } finally {
      setIsSalvando(false)
    }
  }

  const listaAtual =
    abaAtiva === 'salas'
      ? salas
      : abaAtiva === 'categorias_ramo'
      ? categoriasRamo
      : categoriasPse

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 text-xs shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-headline font-bold text-base text-gray-900 flex items-center gap-2">
            <span>⚙️</span>
            <span>Configurações de Listas da Agenda</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            Adicione ou edite salas físicas e categorias de compromissos sem precisar alterar o banco de dados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSalvarTudo}
          disabled={isSalvando}
          className="px-4 py-2 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSalvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.tipo === 'ok' ? '✓ ' : '✕ '} {feedback.msg}
        </div>
      )}

      {/* Tabs de Seleção */}
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        <button
          type="button"
          onClick={() => setAbaAtiva('salas')}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
            abaAtiva === 'salas'
              ? 'bg-blue-50 text-primary border border-blue-200'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          🏢 Salas Físicas ({salas.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('categorias_ramo')}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
            abaAtiva === 'categorias_ramo'
              ? 'bg-blue-50 text-primary border border-blue-200'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          🏷️ Categorias do Ramo ({categoriasRamo.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('categorias_pse')}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
            abaAtiva === 'categorias_pse'
              ? 'bg-blue-50 text-primary border border-blue-200'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          🎓 Categorias do PSE ({categoriasPse.length})
        </button>
      </div>

      {/* Adicionar Novo Item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={novoItemTexto}
          onChange={(e) => setNovoItemTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdicionarItem()
            }
          }}
          placeholder={
            abaAtiva === 'salas'
              ? 'Nome da sala (ex: E-214 - Sala de Robótica, Auditório 2...)'
              : 'Nome da categoria de evento (ex: Alinhamento Estratégico...)'
          }
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleAdicionarItem}
          className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 cursor-pointer"
        >
          + Adicionar
        </button>
        <button
          type="button"
          onClick={handleRestaurarPadroes}
          className="px-3 py-2 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 cursor-pointer text-[11px]"
          title="Restaurar valores padrões recomendados"
        >
          Restaurar Padrões
        </button>
      </div>

      {/* Lista de Itens */}
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
        {listaAtual.map((item, idx) => (
          <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
            <span className="font-semibold text-gray-800">{item}</span>
            <button
              type="button"
              onClick={() => handleRemoverItem(idx)}
              className="text-gray-400 hover:text-red-600 font-bold px-2 py-0.5 rounded text-xs"
              title="Remover opção"
            >
              ✕
            </button>
          </div>
        ))}
        {listaAtual.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-xs">
            Nenhum item cadastrado nesta lista.
          </div>
        )}
      </div>
    </div>
  )
}
