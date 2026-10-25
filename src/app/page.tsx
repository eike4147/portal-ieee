import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalIEEEApp from '@/components/portal-ieee-app'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Verifica autenticação do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Busca perfil e cargos do usuário logado
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
    (c: any) =>
      c?.permite_abrir_sala === true ||
      (c?.permite_abrir_sala !== false &&
        ['Admin', 'Gestor', 'Lider', 'Diretoria', 'Lideranca'].includes(c?.nivel_acesso))
  )

  // 3. Busca o último registro de abertura/fechamento da sala (Status atual)
  const { data: logsRecentes } = await supabase
    .from('log_sala')
    .select(`
      id,
      status,
      responsavel_id,
      data_hora,
      observacao,
      usuarios (
        id,
        nome,
        matricula
      )
    `)
    .order('data_hora', { ascending: false })
    .limit(10)

  const ultimoRegistro = logsRecentes && logsRecentes.length > 0 ? logsRecentes[0] : null
  const estaAberta = ultimoRegistro?.status === 'Aberta'
  const ultimoResponsavelId = ultimoRegistro?.responsavel_id || null

  // 4. Busca lista de membros elegíveis para transferência da sala (Líderes, Diretoria, etc.)
  const { data: todosUsuarios } = await supabase
    .from('usuarios')
    .select(`
      id,
      nome,
      matricula,
      usuario_cargos (
        cargos (
          nome_cargo,
          nivel_acesso,
          permite_abrir_sala
        )
      )
    `)
    .order('nome')

  const usuariosElegiveis = (todosUsuarios || [])
    .filter((u: any) => {
      if (u.id === user.id) return false
      const cargosUser = u.usuario_cargos?.map((uc: any) => uc.cargos) || []
      return cargosUser.some(
        (c: any) =>
          c?.permite_abrir_sala === true ||
          (c?.permite_abrir_sala !== false &&
            ['Admin', 'Gestor', 'Lider', 'Diretoria', 'Lideranca'].includes(c?.nivel_acesso))
      )
    })
    .map((u: any) => ({
      id: u.id,
      nome: u.nome,
      matricula: u.matricula,
      cargo: u.usuario_cargos?.[0]?.cargos?.nome_cargo || 'Líder / Diretoria',
    }))

  return (
    <PortalIEEEApp
      usuario={{
        id: user.id,
        nome: perfil?.nome || user.email || 'Membro',
        matricula: perfil?.matricula || '',
        tipo_membro: perfil?.tipo_membro || 'Membro',
        cargos: cargos.map((c: any) => c?.nome_cargo).filter(Boolean),
        podeGerenciarSala,
      }}
      statusSala={{
        aberta: estaAberta,
        ultimoResponsavel:
          (Array.isArray(ultimoRegistro?.usuarios)
            ? (ultimoRegistro?.usuarios as any)[0]?.nome
            : (ultimoRegistro?.usuarios as any)?.nome) || 'Nenhum registro',
        ultimoResponsavelId: ultimoResponsavelId,
        dataHora: ultimoRegistro?.data_hora || null,
      }}
      historicoSala={logsRecentes || []}
      usuariosElegiveisSala={usuariosElegiveis}
    />
  )
}
