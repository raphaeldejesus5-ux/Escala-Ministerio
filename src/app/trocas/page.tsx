import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowLeftRight } from 'lucide-react'
import { formatDate, formatRelative } from '@/lib/utils'
import { SWAP_STATUS_LABELS, USER_ROLE_LABELS } from '@/types'

const swapBadge: Record<string, 'amber' | 'green' | 'red' | 'gray'> = {
  pending_substitute: 'amber',
  pending_leader:     'amber',
  approved:           'green',
  rejected:           'red',
  cancelled:          'gray',
}

export default async function TrocasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', user.id).single()

  const isLeader = ['admin', 'leader'].includes(profile?.role ?? '')
  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = (USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']

  // Líderes veem todas; membros veem as próprias
  let query = supabase
    .from('swap_requests')
    .select(`
      *,
      requester:requester_id ( name ),
      substitute:substitute_id ( name ),
      slot:slot_id (
        role,
        event:event_id ( event_date, event_time, type )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!isLeader) {
    query = query.or(`requester_id.eq.${user.id},substitute_id.eq.${user.id}`)
  }

  const { data: swaps } = await query
  const pending = swaps?.filter((s: any) => ['pending_substitute', 'pending_leader'].includes(s.status)) ?? []
  const history = swaps?.filter((s: any) => !['pending_substitute', 'pending_leader'].includes(s.status)) ?? []

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Trocas de escala</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pendente(s) de aprovação
          </p>
        </div>

        {/* Pendentes */}
        {pending.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aguardando ação</h2>
            <div className="space-y-3">
              {pending.map((swap: any) => (
                <Card key={swap.id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={swap.requester?.name ?? '?'} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-gray-900">{swap.requester?.name}</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {swap.substitute?.name ?? 'substituto não definido'}
                        </span>
                      </div>
                      {swap.slot?.event && (
                        <p className="text-xs text-gray-500">
                          {swap.slot.role === 'drummer' ? '🥁 Bateria' : '🎸 Baixo'} ·{' '}
                          {formatDate(swap.slot.event.event_date)}
                        </p>
                      )}
                      {swap.reason && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{swap.reason}"</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={swapBadge[swap.status]}>
                          {SWAP_STATUS_LABELS[swap.status as keyof typeof SWAP_STATUS_LABELS]}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatRelative(swap.created_at)}</span>
                      </div>
                    </div>
                    {isLeader && swap.status === 'pending_leader' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <form action={`/api/swaps/${swap.id}/approve`} method="POST">
                          <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                            Aprovar
                          </button>
                        </form>
                        <form action={`/api/swaps/${swap.id}/reject`} method="POST">
                          <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                            Recusar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Histórico */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Histórico</h2>
          {history.length > 0 ? (
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {history.map((swap: any) => (
                  <div key={swap.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={swap.requester?.name ?? '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {swap.requester?.name} → {swap.substitute?.name ?? '—'}
                      </p>
                      {swap.slot?.event && (
                        <p className="text-xs text-gray-400">
                          {formatDate(swap.slot.event.event_date)}
                        </p>
                      )}
                    </div>
                    <Badge variant={swapBadge[swap.status]}>
                      {SWAP_STATUS_LABELS[swap.status as keyof typeof SWAP_STATUS_LABELS]}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <p className="text-sm text-gray-400">Nenhuma troca registrada</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
