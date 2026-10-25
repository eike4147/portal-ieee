'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSalaAction(
  novoStatus: 'Aberta' | 'Fechada',
  observacao?: string,
  novoResponsavelId?: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  // Verifica permissão do usuário que está executando a ação
  const { data: usuarioCargos } = await supabase
    .from('usuario_cargos')
    .select('cargos (permite_abrir_sala, nivel_acesso)')
    .eq('usuario_id', user.id)

  const temPermissao = usuarioCargos?.some((item: any) => {
    const c = item.cargos
    return (
      c?.permite_abrir_sala ||
      ['Admin', 'Gestor', 'Lider', 'Diretoria', 'Lideranca'].includes(c?.nivel_acesso)
    )
  })

  if (!temPermissao) {
    return { error: 'Você não possui permissão de cargo para alterar o status da sala.' }
  }

  // Define quem será gravado como responsável
  const responsavelAlvo = novoResponsavelId || user.id

  const { error } = await supabase.from('log_sala').insert({
    responsavel_id: responsavelAlvo,
    status: novoStatus,
    observacao: observacao || null,
  })

  if (error) {
    return { error: 'Erro ao registrar status: ' + error.message }
  }

  revalidatePath('/')
  revalidatePath('/sala')
  return { success: true }
}
