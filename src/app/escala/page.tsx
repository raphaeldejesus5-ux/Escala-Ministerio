'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Calendar, Plus, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'

export default function EscalaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [aba, setAba] = useState<'proximos' | 'todos' | 'passados'>('proximos')

  const fetchAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: p } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
    setProfile(p)

    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('events')
      .select('*, schedule_slots(id, role, status, profiles(id, name))')
      .order('event_date', { ascending: aba !== 'passados' })

    if (aba === 'proximos') query = query.gte('event_date', today)
    if (aba === 'passados') query = query.lt('event_date', today)

    const { data: ev } = await query.limit(50)
    setEvents(ev || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [aba])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este evento?')) return
    setDeleting(id)
    await supabase.from('schedule_slots').delete().eq('event_id', id)
    await supabase.from('events').delete().eq('id', id)
    await fetchAll()
    setDeleting(null)
  }

  const isLeader = ['admin', 'leader'].includes(profile?.role ?? '')

  const typeLabel: Record<string, string> = {
    service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferencia',
    cell: 'Celula', special: 'Especial',
  }
  const typeColor: Record<string, any> = {
    service: 'purple', rehearsal: 'teal', conference: 'amber',
    cell: 'blue', special: 'pink',
  }
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']

  const abas = [
    { key: 'proximos', label: 'Proximos' },
    { key: 'todos', label: 'Todos' },
    { key: 'passados', label: 'Passados' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escala</h1>
            <p className="text-gray-500 mt-1">{events.length} evento(s) encontrado(s)</p>
          </div>
          {isLeader && (
            <Button onClick={() => router.push('/escala/novo')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {abas.map(a => (
            <button
              key={a.key}
              onClick={() => setAba(a.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                aba === a.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum evento encontrado</p>
            {isLeader && aba !== 'passados' && (
              <Button className="mt-4" onClick={() => router.push('/escala/novo')}>
                Criar primeiro evento
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((event: any) => {
              const slots = event.schedule_slots ?? []
              const drummer = slots.find((s: any) => s.role === 'drummer')
              const bassist = slots.find((s: any) => s.role === 'bassist')
              const date = new Date(event.event_date + 'T00:00:00')
              const isPast = event.event_date < new Date().toISOString().split('T')[0]

              return (
                <Card key={event.id} className={`p-4 ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 text-center flex-shrink-0 rounded-lg p-2 ${isPast ? 'bg-gray-100' : 'bg-primary-50'}`}>
                      <p className={`text-2xl font-bold leading-tight ${isPast ? 'text-gray-400' : 'text-primary-600'}`}>
                        {date.getDate()}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-medium">{monthNames[date.getMonth()]}</p>
                      <p className="text-xs text-gray-400">{dayNames[date.getDay()]}</p>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge color={typeColor[event.type] ?? 'gray'}>
                          {typeLabel[event.type] ?? event.type}
                        </Badge>
                        {event.event_time && (
                          <span className="text-xs text-gray-500">
                            {event.event_time.substring(0,5)}
                          </span>
                        )}
                        {event.arrival_time && (
                          <span className="text-xs text-gray-400">
                            (chegar as {event.arrival_time.substring(0,5)})
                          </span>
                        )}
                        {event.period && (
                          <span className="text-xs text-gray-400 capitalize">
                            {event.period === 'morning' ? '🌅 Manha' : event.period === 'afternoon' ? '☀️ Tarde' : '🌙 Noite'}
                          </span>
                        )}
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

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {event.needs_drummer && (
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥁</span>
                            {drummer ? (
                              <div>
                                <p className="text-sm font-medium text-gray-800">{drummer.profiles?.name}</p>
                                <p className="text-xs text-green-600">Confirmado</p>
                              </div>
                            ) : (
                              <p className="text-sm text-red-500">Nao escalado</p>
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
                              <p className="text-sm text-red-500">Nao escalado</p>
                            )}
                          </div>
                        )}
                      </div>

                      {event.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{event.notes}</p>
                      )}
                    </div>

                    {isLeader && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}