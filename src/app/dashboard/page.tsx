import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  Users, Calendar, ArrowLeftRight, Bell,
  AlertTriangle, Clock, CheckCircle2, TrendingUp
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS, USER_ROLE_LABELS } from '@/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // KPIs em paralelo
  const [
    { count: totalMembers },
    { count: totalEvents },
    { count: pendingSwaps },
    { count: unreadNotifs },
    { data: upcomingEvents },
    { data: alerts },
    { data: memberServices },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .gte('event_date', new Date().toISOString().split('T')[0]),
    supabase.from('swap_requests').select('*', { count: 'exact', head: true })
      .in('status', ['pending_substitute', 'pending_leader']),
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id).eq('read', false),
    supabase.from('events')
      .select(`*, schedule_slots(*, profiles(name, instrument))`)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5),
    supabase.from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .in('type', ['overload_alert', 'inactivity_alert'])
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('schedule_slots')
      .select('profile_id, profiles(name), events(event_date)')
      .gte('events.event_date',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .limit(100),
  ])

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = USER_ROLE_LABELS[(profile?.role as UserRole) ?? 'member']

  const kpis = [
    { label: 'Integrantes ativos', value: totalMembers ?? 0, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Próximos eventos', value: totalEvents ?? 0, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Trocas pendentes', value: pendingSwaps ?? 0, icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Alertas não lidos', value: unreadNotifs ?? 0, icon: Bell, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Olá, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos cultos */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos eventos</CardTitle>
              <Link href="/escala">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </CardHeader>
            <div className="space-y-3">
              {upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => {
                const slots = event.schedule_slots ?? []
                const drummer = slots.find((s: any) => s.role === 'drummer')
                const bassist = slots.find((s: any) => s.role === 'bassist')

                return (
                  <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-primary-600 leading-tight">
                        {new Date(event.event_date + 'T00:00:00').getDate()}
                      </p>
                      <p className="text-xs text-gray-400 uppercase">
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={event.type === 'service' ? 'purple' : event.type === 'rehearsal' ? 'teal' : 'amber'}>
                          {EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatTime(event.event_time)}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>🥁 {drummer?.profiles?.name ?? <span className="text-red-500">Não escalado</span>}</span>
                        <span>🎸 {bassist?.profiles?.name ?? <span className="text-red-500">Não escalado</span>}</span>
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum evento próximo</p>
              )}
            </div>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas ativos</CardTitle>
              <Link href="/notificacoes">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </CardHeader>
            <div className="space-y-2">
              {alerts && alerts.length > 0 ? alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
                    alert.type === 'overload_alert'
                      ? 'bg-red-50 text-red-800 border border-red-100'
                      : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}
                >
                  {alert.type === 'overload_alert'
                    ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  }
                  <p className="leading-snug">{alert.message}</p>
                </div>
              )) : (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  Nenhum alerta ativo no momento
                </div>
              )}

              {(pendingSwaps ?? 0) > 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-100">
                  <ArrowLeftRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{pendingSwaps} troca(s) aguardando aprovação</span>
                  <Link href="/trocas" className="ml-auto text-xs underline">Ver</Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
