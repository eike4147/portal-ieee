'use client'

import React from 'react'
import { SlotRecomendadoPCH } from '@/lib/pch-matching'

interface PainelRecomendacaoPCHProps {
  slots: SlotRecomendadoPCH[]
  modalidade: 'Presencial' | 'Online' | 'Gravada' | 'Híbrido'
  totalParticipantes: number
  isCalculando?: boolean
  onSelecionarSlot: (slot: SlotRecomendadoPCH) => void
  onAbrirGradeCompleta?: () => void
}

export const PainelRecomendacaoPCH: React.FC<PainelRecomendacaoPCHProps> = ({
  slots,
  modalidade,
  totalParticipantes,
  isCalculando = false,
  onSelecionarSlot,
  onAbrirGradeCompleta,
}) => {
  if (totalParticipantes === 0) {
    return (
      <div className="p-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-500">
        💡 Selecione pelo menos 1 participante no público-alvo acima para a PCH calcular os melhores horários.
      </div>
    )
  }

  const slotsOuro = slots.filter((s) => s.ehOuro)
  const outrosSlots = slots.filter((s) => !s.ehOuro)

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-200 rounded-2xl p-4 space-y-3 text-xs">
      {/* Header do Painel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="font-headline font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <span>Horários Recomendados pela PCH</span>
              {slotsOuro.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {slotsOuro.length} Slot(s) de Ouro
                </span>
              )}
            </h4>
            <p className="text-[10px] text-gray-500">
              {modalidade === 'Presencial'
                ? 'Cruzando disponibilidades presenciais no CEFET dos participantes convocados.'
                : 'Considerando disponibilidades presenciais e remotas dos convocados.'}
            </p>
          </div>
        </div>

        {onAbrirGradeCompleta && (
          <button
            type="button"
            onClick={onAbrirGradeCompleta}
            className="text-[11px] font-bold text-primary hover:text-blue-800 underline cursor-pointer"
          >
            Ver Grade Completa ▾
          </button>
        )}
      </div>

      {isCalculando ? (
        <div className="py-4 text-center text-xs text-gray-400">
          Calculando disponibilidade em tempo real...
        </div>
      ) : slots.length === 0 ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          ⚠️ Nenhum horário comum com quórum expressivo foi encontrado para este grupo na semana.
          Tente ajustar os participantes ou definir o horário manualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {slots.slice(0, 4).map((slot) => {
            return (
              <div
                key={slot.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  slot.ehOuro
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-200'
                    : 'bg-white border-blue-100 hover:border-blue-300'
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-xs truncate">
                      {slot.slotFormatado}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    {slot.ehOuro ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <span>⭐</span>
                        <span>100% Livres ({slot.totalParticipantes}/{slot.totalParticipantes})</span>
                      </span>
                    ) : (
                      <span className="text-blue-700 font-semibold">
                        ⚡ {slot.percentualQuorum}% livres ({slot.disponiveisCount}/{slot.totalParticipantes})
                      </span>
                    )}

                    {!slot.ehOuro && slot.nomesOcupados.length > 0 && (
                      <span
                        className="text-gray-400 truncate max-w-[120px]"
                        title={`Ocupado: ${slot.nomesOcupados.join(', ')}`}
                      >
                        Ocupado: {slot.nomesOcupados[0]}
                        {slot.nomesOcupados.length > 1 ? ` (+${slot.nomesOcupados.length - 1})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelecionarSlot(slot)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer shadow-xs ${
                    slot.ehOuro
                      ? 'bg-amber-500 hover:bg-amber-600 text-white font-black'
                      : 'bg-primary hover:bg-blue-700 text-white'
                  }`}
                >
                  Usar Horário
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
