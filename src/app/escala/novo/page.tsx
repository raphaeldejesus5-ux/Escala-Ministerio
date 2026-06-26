'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const TURNOS = [
  { value: 'morning', label: 'Manha', emoji: '🌅', defaultEvent: '09:00', defaultArrival: '08:00' },
  { value: 'afternoon', label: 'Tarde', emoji: '☀️', defaultEvent: '14:00', defaultArrival: '13:00' },
  { value: 'evening', label: 'Noite', emoji: '🌙', defaultEvent: '19:00', defaultArrival: '18:00' },
]

type TurnoConfig = {
  selected: boolean
  eventTime: string
  arrivalTime: string
}

export default function NovoEventoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('service')
  const [date, setDate] = useState('')
  const [needsDrummer, setNeedsDrummer] = useState(true)
  const [needsBassist, setNeedsBassist] = useState(true)
  const [notes, setNotes] = useState('')
  const [turnos, setTurnos] = useState<Record<string, TurnoConfig>>({
    morning: { selected: false, eventTime: '09:00', arrivalTime: '08:00' },
    afternoon: { selected: false, eventTime: '14:00', arrivalTime: '13:00' },
    evening: { selected: false, eventTime: '19:00', arrivalTime: '18:00' },
  })

  const toggleTurno = (turno: string) => {
    setTurnos(prev => ({
      ...prev,
      [turno]: { ...prev[turno], selected: !prev[turno].selected }
    }))
  }

  const updateTurno = (turno: string, field: 'eventTime' | 'arrivalTime', value: string) => {
    setTurnos(prev => ({
      ...prev,
      [turno]: { ...prev[turno], [field]: value }
    }))
  }

  const selectedTurnos = TURNOS.filter(t => turnos[t.value].selected)

  const handleSubmit = async () => {
    if (!date) { setError('Data obrigatoria'); return }
    if (selectedTurnos.length === 0) { setError('Selecione pelo menos um turno'); return }
    setLoading(true)
    setError('')

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{
        type,
        event_date: date,
        event_time: turnos[selectedTurnos[0].value].eventTime,
        needs_drummer: needsDrummer,
        needs_bassist: needsBassist,
        notes,
        published: false,
      }])
      .select()
      .single()

    if (eventError || !event) {
      setError(eventError?.message || 'Erro ao criar evento')
      setLoading(false)
      return
    }

    for (const t of selectedTurnos) {
      await supabase.from('event_turns').insert([{
        event_id: event.id,
        period: t.value,
        event_time: turnos[t.value].eventTime,
        arrival_time: turnos[t.value].arrivalTime,
      }])
    }

    setLoading(false)
    router.push('/escala')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Evento</h1>
          <Card className="p-6 space-y-5">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de evento</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="service">Culto</option>
                <option value="rehearsal">Ensaio</option>
                <option value="conference">Conferencia</option>
                <option value="cell">Celula</option>
                <option value="special">Especial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Turnos</label>
              <p className="text-xs text-gray-400 mb-3">Selecione os turnos e defina os horarios de cada um</p>
              <div className="space-y-3">
                {TURNOS.map(t => (
                  <div key={t.value} className={`border-2 rounded-xl transition-all ${turnos[t.value].selected ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                    <button
                      type="button"
                      onClick={() => toggleTurno(t.value)}
                      className="w-full flex items-center gap-3 p-4"
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className={`text-sm font-medium ${turnos[t.value].selected ? 'text-primary-700' : 'text-gray-600'}`}>
                        {t.label}
                      </span>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${turnos[t.value].selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {turnos[t.value].selected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>

                    {turnos[t.value].selected && (
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora do evento</label>
                          <input
                            type="time"
                            value={turnos[t.value].eventTime}
                            onChange={e => updateTurno(t.value, 'eventTime', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora de chegada</label>
                          <input
                            type="time"
                            value={turnos[t.value].arrivalTime}
                            onChange={e => updateTurno(t.value, 'arrivalTime', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrumentos necessarios</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={needsDrummer} onChange={e => setNeedsDrummer(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Bateria</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={needsBassist} onChange={e => setNeedsBassist(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Baixo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observacoes sobre o evento..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : `Criar Evento${selectedTurnos.length > 1 ? ` (${selectedTurnos.length} turnos)` : ''}`}
              </Button>
              <Button variant="outline" onClick={() => router.push('/escala')}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}