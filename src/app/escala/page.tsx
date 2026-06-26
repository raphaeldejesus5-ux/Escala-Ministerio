import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Calendar, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { EVENT_TYPE_LABELS, USER_ROLE_LABELS } from '@/types'
import Link from 'next/link'

const typeBadge: Record<string, 'purple' | 'teal' | 'amber' | 'blue' | 'pink'> = {
  service:    'purple',
  rehearsal:  'teal',
  conference: 'amber',
  cell:       'blue',
  special:    'pink',
}

export default async function EscalaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      schedule_slots (
        id, role, status,
        profiles ( id, name, instrument )
      )
    `)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(20)

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = (USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']
  const isLeader = ['admin', 'leader'].includes(profile?.role ?? '')

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Escala</h1>
            <p className="text-sm text-gray-500 mt-0.5">Próximos eventos</p>
          </div>
          {isLeader && (
            <Link href="/escala/novo">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Novo evento
              </Button>
            </Link>
          )}
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event: any) => {
              const slots = event.schedule_slots ?? []
              const drummer = slots.find((s: any) => s.role === 'drummer')
              const bassist = slots.find((s: any) => s.role === 'bassist')
              const isComplete = (!event.needs_drummer || drummer) && (!event.needs_bassist || bassist)

              return (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Data */}
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-2xl font-bold text-primary-600 leading-tight">
                        {new Date(event.event_date + 'T00:00:00').getDate()}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-medium">
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </p>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant={typeBadge[event.type] ?? 'gray'}>
                          {EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(event.event_time)}</span>
                        {event.published ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Publicado
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Rascunho
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {event.needs_drummer && (
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥁</span>
                            {drummer ? (
                              <div>
                                <p className="text-sm font-medium text-gray-800">{drummer.profiles?.name}</p>
                                <p className="text-xs text-green-600">Confirmado</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-red-500">Não escalado</p>
                                {isLeader && (
                                  <Link href={`/escala/${event.id}/escalar?role=drummer`}
                                    className="text-xs text-primary-600 hover:underline">
                                    Escalar
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {event.needs_bassist && (
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎸</span>
                            {bassist ? (
                              <div>
                                <p className="text-sm font-medium text-gray-800">{bassist.profiles?.name}</p>
                                <p className="text-xs text-green-600">Confirmado</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-red-500">Não escalado</p>
                                {isLeader && (
                                  <Link href={`/escala/${event.id}/escalar?role=bassist`}
                                    className="text-xs text-primary-600 hover:underline">
                                    Escalar
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {event.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {event.notes}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    {!isComplete && isLeader && (
                      <div className="flex-shrink-0">
                        <Link href={`/escala/${event.id}/escalar`}>
                          <Button variant="secondary" size="sm">Completar</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum evento cadastrado</p>
            {isLeader && (
              <Link href="/escala/novo">
                <Button className="mt-4" size="sm">Criar primeiro evento</Button>
              </Link>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
