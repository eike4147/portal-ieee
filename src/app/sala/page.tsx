import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalaClient from './sala-client'

export const dynamic = 'force-dynamic'

export default async function SalaPage() {
  const supabase = await createClient()

  // 1. Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Busca perfil e cargos do usuário
  const { data: perfil } = await supabase
    .from('usuarios')
    .select(`
      id,
      nome,
      matricula,
      tipo_membro,
      usuario_cargos (
        cargos (
          nome_cargo,
          nivel_acesso,
          permite_abrir_sala
        )
      )
    `)
    .eq('id', user.id)
    .single()

  const cargos = perfil?.usuario_cargos?.map((uc: any) => uc.cargos) || []
  const podeGerenciarSala = cargos.some(
    (c: any) => c?.permite_abrir_sala || ['Admin', 'Gestor', 'Lider'].includes(c?.nivel_acesso)
  )

  // 3. Busca o último registro da sala (Status atual)
  const { data: logsRecentes } = await supabase
    .from('log_sala')
    .select(`
      id,
      status,
      data_hora,
      observacao,
      usuarios (
        nome,
        matricula
      )
    `)
    .order('data_hora', { ascending: false })
    .limit(10)

  const ultimoRegistro = logsRecentes && logsRecentes.length > 0 ? logsRecentes[0] : null
  const estaAberta = ultimoRegistro?.status === 'Aberta'

  return (
    <SalaClient
      usuario={{
        id: user.id,
        nome: perfil?.nome || user.email || 'Membro',
        matricula: perfil?.matricula || '',
        cargos: cargos.map((c: any) => c?.nome_cargo).filter(Boolean),
        podeGerenciarSala,
      }}
      statusAtual={{
        aberta: estaAberta,
        ultimoResponsavel: (ultimoRegistro?.usuarios as any)?.nome || 'Nenhum registro',
        dataHora: ultimoRegistro?.data_hora || null,
      }}
      historico={logsRecentes || []}
    />
  )
}
