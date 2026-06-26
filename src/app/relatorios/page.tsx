export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { USER_ROLE_LABELS } from '@/types'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', user.id).single()

  if (!['admin', 'leader'].includes(profile?.role ?? '')) redirect('/dashboard')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: memberSlots },
    { data: swapStats },
    { count: totalEvents },
  ] = await Promise.all([
    supabase
      .from('schedule_slots')
      .select('profile_id, profiles(name, instrument), events(event_date, type)')
      .gte('events.event_date', thirtyDaysAgo)
      .eq('status', 'confirmed'),
    supabase
      .from('swap_requests')
      .select('status')
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', thirtyDaysAgo),
  ])

  // Agrega por integrante
  const memberMap: Record<string, { name: string; instrument: string; count: number }> = {}
  memberSlots?.forEach((slot: any) => {
    if (!slot.profiles || !slot.events) return
    const pid = slot.profile_id
    if (!memberMap[pid]) {
      memberMap[pid] = { name: slot.profiles.name, instrument: slot.profiles.instrument, count: 0 }
    }
    memberMap[pid].count++
  })

  const memberList = Object.values(memberMap).sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...memberList.map(m => m.count), 1)

  const swapApproved  = swapStats?.filter((s: any) => s.status === 'approved').length ?? 0
  const swapRejected  = swapStats?.filter((s: any) => s.status === 'rejected').length ?? 0
  const swapPending   = swapStats?.filter((s: any) => ['pending_substitute','pending_leader'].includes(s.status)).length ?? 0
  const totalSwaps    = swapStats?.length ?? 0

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = (USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Últimos 30 dias</p>
        </div>

        {/* KPIs do período */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Eventos no período', value: totalEvents ?? 0 },
            { label: 'Integrantes escalados', value: memberList.length },
            { label: 'Trocas realizadas', value: swapApproved },
            { label: 'Trocas pendentes', value: swapPending },
          ].map(kpi => (
            <Card key={kpi.label}>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Serviços por integrante */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Serviços por integrante</h2>
            <div className="space-y-2.5">
              {memberList.length > 0 ? memberList.map(m => {
                const pct = Math.round((m.count / maxCount) * 100)
                const overloaded = m.count >= 4
                const inactive   = m.count === 0
                return (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-600 truncate">{m.name.split(' ')[0]}</div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center px-2 transition-all ${
                          overloaded ? 'bg-red-500' : inactive ? 'bg-amber-400' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{m.count}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        overloaded ? 'bg-red-50 text-red-700' :
                        inactive   ? 'bg-amber-50 text-amber-700' :
                                     'bg-green-50 text-green-700'
                      }`}>
                        {overloaded ? 'sobrecarregado' : inactive ? 'inativo' : 'ok'}
                      </span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-400 text-center py-4">Sem dados no período</p>
              )}
            </div>
          </Card>

          {/* Trocas */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Trocas de escala</h2>
            {totalSwaps > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Aprovadas', value: swapApproved, color: 'bg-green-500', pct: Math.round(swapApproved / totalSwaps * 100) },
                  { label: 'Recusadas', value: swapRejected, color: 'bg-red-500',   pct: Math.round(swapRejected / totalSwaps * 100) },
                  { label: 'Pendentes', value: swapPending,  color: 'bg-amber-400', pct: Math.round(swapPending  / totalSwaps * 100) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-600">{item.label}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.max(item.pct, 2)}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-gray-600 text-right">{item.value}</div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1">Total: {totalSwaps} solicitações</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Sem trocas no período</p>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

