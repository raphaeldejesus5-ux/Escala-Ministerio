'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Users, Calendar, ArrowLeftRight, Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalMembers, setTotalMembers] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)
  const [pendingSwaps, setPendingSwaps] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
      setProfile(p)
      const today = new Date().toISOString().split('T')[0]
      const [
        { count: members },
        { count: events },
        { count: swaps },
        { count: notifs },
        { data: upcoming },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', today),
        supabase.from('swap_requests').select('*', { count: 'exact', head: true }).in('status', ['pending_substitute', 'pending_leader']),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('read', false),
        supabase.from('events').select('*, schedule_slots(id, role, profiles(name))').gte('event_date', today).order('event_date', { ascending: true }).limit(5),
      ])
      setTotalMembers(members || 0)
      setTotalEvents(events || 0)
      setPendingSwaps(swaps || 0)
      setUnreadNotifs(notifs || 0)
      setUpcomingEvents(upcoming || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const typeLabel: Record<string, string> = {
    service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferencia',
    cell: 'Celula', special: 'Especial',
  }
  const typeColor: Record<string, string> = {
    service: 'bg-purple-100 text-purple-700',
    rehearsal: 'bg-teal-100 text-teal-700',
    conference: 'bg-amber-100 text-amber-700',
    cell: 'bg-blue-100 text-blue-700',
    special: 'bg-pink-100 text-pink-700',
  }
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']
  const today = new Date()
  const dayOfWeek = ['domingo','segunda-feira','terca-feira','quarta-feira','quinta-feira','sexta-feira','sabado'][today.getDay()]
  const dateStr = `${dayOfWeek}, ${today.getDate()} de ${['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][today.getMonth()]}`

  const kpis = [
    { label: 'Integrantes ativos', value: totalMembers, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', href: '/integrantes' },
    { label: 'Proximos eventos', value: totalEvents, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50', href: '/escala' },
    { label: 'Trocas pendentes', value: pendingSwaps, icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-50', href: '/trocas' },
    { label: 'Alertas nao lidos', value: unreadNotifs, icon: Bell, color: 'text-red-600', bg: 'bg-red-50', href: '/notificacoes' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Ola, {profile?.name?.split(' ')[0] ?? 'Usuario'} 👋</h1>
              <p className="text-gray-500 mt-1">{dateStr}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {kpis.map(({ label, value, icon: Icon, color, bg, href }) => (
                <div
                  key={label}
                  onClick={() => router.push(href)}
                  className="cursor-pointer group"
                >
                  <Card className="p-4 hover:shadow-md hover:border-primary-200 transition-all group-hover:scale-105">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Proximos eventos</h2>
                  <Link href="/escala" className="text-xs text-primary-600 hover:underline">Ver todos</Link>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Nenhum evento proximo</p>
                    <Link href="/escala/novo" className="text-xs text-primary-600 hover:underline mt-2">Criar evento</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event: any) => {
                      const date = new Date(event.event_date + 'T00:00:00')
                      const slots = event.schedule_slots ?? []
                      const drummer = slots.find((s: any) => s.role === 'drummer')
                      const bassist = slots.find((s: any) => s.role === 'bassist')
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer" onClick={() => router.push('/escala')}>
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary-600 leading-tight">{date.getDate()}</span>
                            <span className="text-xs text-gray-400">{monthNames[date.getMonth()]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[event.type] ?? 'bg-gray-100 text-gray-600'}`}>
                                {typeLabel[event.type] ?? event.type}
                              </span>
                              <span className="text-xs text-gray-400">{dayNames[date.getDay()]}</span>
                              {event.event_time && <span className="text-xs text-gray-400">{event.event_time.substring(0,5)}</span>}
                            </div>
                            <div className="flex gap-3 mt-1">
                              {event.needs_drummer && (
                                <span className="text-xs text-gray-500">🥁 {drummer?.profiles?.name ?? '—'}</span>
                              )}
                              {event.needs_bassist && (
                                <span className="text-xs text-gray-500">🎸 {bassist?.profiles?.name ?? '—'}</span>
                              )}
                            </div>
                          </div>
                          {event.published ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Alertas ativos</h2>
                  <Link href="/notificacoes" className="text-xs text-primary-600 hover:underline">Ver todos</Link>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-sm text-gray-400">Nenhum alerta ativo no momento</p>
                </div>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}