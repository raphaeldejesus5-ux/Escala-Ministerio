'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Plus, CheckCircle2, AlertCircle, Trash2, ChevronDown, X } from 'lucide-react'

export default function EscalaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [turns, setTurns] = useState<Record<string, any[]>>({})
  const [slots, setSlots] = useState<Record<string, any[]>>({})
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [aba, setAba] = useState<'proximos' | 'todos' | 'passados'>('proximos')
  const [openSlot, setOpenSlot] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: p } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
    setProfile(p)

    const today = new Date().toISOString().split('T')[0]
    let query = supabase.from('events').select('*').order('event_date', { ascending: aba !== 'passados' })
    if (aba === 'proximos') query = query.gte('event_date', today)
    if (aba === 'passados') query = query.lt('event_date', today)
    const { data: ev } = await query.limit(50)
    setEvents(ev || [])

    if (ev && ev.length > 0) {
      const eventIds = ev.map((e: any) => e.id)
      const { data: tr } = await supabase.from('event_turns').select('*').in('event_id', eventIds).order('period')
      const { data: sl } = await supabase.from('schedule_slots').select('*, profiles(id, name)').in('event_id', eventIds)

      const turnsMap: Record<string, any[]> = {}
      const slotsMap: Record<string, any[]> = {}
      for (const t of tr || []) {
        if (!turnsMap[t.event_id]) turnsMap[t.event_id] = []
        turnsMap[t.event_id].push(t)
      }
      for (const s of sl || []) {
        if (!slotsMap[s.event_id]) slotsMap[s.event_id] = []
        slotsMap[s.event_id].push(s)
      }
      setTurns(turnsMap)
      setSlots(slotsMap)
    }

    const { data: prof } = await supabase.from('profiles').select('id, name, instrument, status').eq('status', 'active').order('name')
    setMembers(prof || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [aba])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenSlot(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este evento?')) return
    setDeleting(id)
    await supabase.from('schedule_slots').delete().eq('event_id', id)
    await supabase.from('event_turns').delete().eq('event_id', id)
    await supabase.from('events').delete().eq('id', id)
    await fetchAll()
    setDeleting(null)
  }

  const handleSelectMusician = async (eventId: string, turnId: string | null, role: 'drummer' | 'bassist', profileId: string) => {
    setSaving(`${eventId}-${turnId}-${role}`)
    const existing = slots[eventId]?.find(s => s.role === role && s.turn_id === turnId)
    if (existing) {
      await supabase.from('schedule_slots').update({ profile_id: profileId, status: 'pending' }).eq('id', existing.id)
    } else {
      await supabase.from('schedule_slots').insert([{ event_id: eventId, profile_id: profileId, role, status: 'pending', turn_id: turnId }])
    }
    setOpenSlot(null)
    setSaving(null)
    await fetchAll()
  }

  const handleRemoveMusician = async (eventId: string, turnId: string | null, role: 'drummer' | 'bassist') => {
    const existing = slots[eventId]?.find(s => s.role === role && s.turn_id === turnId)
    if (existing) {
      await supabase.from('schedule_slots').delete().eq('id', existing.id)
      await fetchAll()
    }
  }

  const isLeader = ['admin', 'leader'].includes(profile?.role ?? '')
  const drummers = members.filter(m => m.instrument === 'drums' || m.instrument === 'both')
  const bassists = members.filter(m => m.instrument === 'bass' || m.instrument === 'both')

  const typeLabel: Record<string, string> = {
    service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferencia', cell: 'Celula', special: 'Especial',
  }
  const typeColor: Record<string, string> = {
    service: 'bg-purple-100 text-purple-700', rehearsal: 'bg-teal-100 text-teal-700',
    conference: 'bg-amber-100 text-amber-700', cell: 'bg-blue-100 text-blue-700', special: 'bg-pink-100 text-pink-700',
  }
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']
  const periodLabel: Record<string, string> = { morning: 'Manha', afternoon: 'Tarde', evening: 'Noite' }
  const periodEmoji: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' }

  const SlotPicker = ({ eventId, turnId, role, label, options }: { eventId: string, turnId: string | null, role: 'drummer' | 'bassist', label: string, options: any[] }) => {
    const key = `${eventId}-${turnId}-${role}`
    const assigned = slots[eventId]?.find(s => s.role === role && s.turn_id === turnId)
    const isOpen = openSlot === key
    const isSaving = saving === key

    return (
      <div className="relative">
        {assigned ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-green-800 flex-1">{assigned.profiles?.name}</span>
            {isLeader && (
              <button onClick={() => handleRemoveMusician(eventId, turnId, role)} className="text-green-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => isLeader && setOpenSlot(isOpen ? null : key)}
            className={`w-full flex items-center gap-2 border-2 border-dashed rounded-lg px-3 py-2 transition-all ${
              isLeader ? 'border-gray-200 hover:border-primary-400 hover:bg-primary-50 cursor-pointer' : 'border-gray-100 cursor-default'
            }`}
          >
            <span className="text-sm text-gray-400 flex-1 text-left">{isSaving ? 'Salvando...' : label}</span>
            {isLeader && <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        )}

        {isOpen && (
          <div ref={dropdownRef} className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 px-2">Selecionar {label}</p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <p className="text-xs text-gray-400 p-3 text-center">Nenhum musico disponivel</p>
              ) : (
                options.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMusician(eventId, turnId, role, m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{m.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

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
          {(['proximos', 'todos', 'passados'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === a ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {a === 'proximos' ? 'Proximos' : a === 'todos' ? 'Todos' : 'Passados'}
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
              <Button className="mt-4" onClick={() => router.push('/escala/novo')}>Criar primeiro evento</Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event: any) => {
              const date = new Date(event.event_date + 'T00:00:00')
              const eventTurns = turns[event.id] || []
              const isPast = event.event_date < new Date().toISOString().split('T')[0]

              return (
                <Card key={event.id} className={`p-5 ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 text-center flex-shrink-0 rounded-lg p-2 ${isPast ? 'bg-gray-100' : 'bg-primary-50'}`}>
                      <p className={`text-2xl font-bold leading-tight ${isPast ? 'text-gray-400' : 'text-primary-600'}`}>{date.getDate()}</p>
                      <p className="text-xs text-gray-400 uppercase font-medium">{monthNames[date.getMonth()]}</p>
                      <p className="text-xs text-gray-400">{dayNames[date.getDay()]}</p>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[event.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {typeLabel[event.type] ?? event.type}
                        </span>
                        {event.published ? (
                          <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Publicado</span>
                        ) : (
                          <span className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rascunho</span>
                        )}
                        {event.notes && <span className="text-xs text-gray-400 italic">{event.notes}</span>}
                      </div>

                      {eventTurns.length > 0 ? (
                        <div className="space-y-3">
                          {eventTurns.map(turn => (
                            <div key={turn.id} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-base">{periodEmoji[turn.period]}</span>
                                <span className="text-sm font-medium text-gray-700">{periodLabel[turn.period]}</span>
                                <span className="text-xs text-gray-400">{turn.event_time?.substring(0,5)}</span>
                                {turn.arrival_time && <span className="text-xs text-gray-400">(chegar as {turn.arrival_time?.substring(0,5)})</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {event.needs_drummer && (
                                  <SlotPicker eventId={event.id} turnId={turn.id} role="drummer" label="Baterista" options={drummers} />
                                )}
                                {event.needs_bassist && (
                                  <SlotPicker eventId={event.id} turnId={turn.id} role="bassist" label="Baixista" options={bassists} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {event.needs_drummer && (
                            <SlotPicker eventId={event.id} turnId={null} role="drummer" label="Baterista" options={drummers} />
                          )}
                          {event.needs_bassist && (
                            <SlotPicker eventId={event.id} turnId={null} role="bassist" label="Baixista" options={bassists} />
                          )}
                        </div>
                      )}
                    </div>

                    {isLeader && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
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