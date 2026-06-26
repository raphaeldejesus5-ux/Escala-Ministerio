'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function NovoEventoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('service')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [needsDrummer, setNeedsDrummer] = useState(true)
  const [needsBassist, setNeedsBassist] = useState(true)
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!date) { setError('Data obrigatoria'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.from('events').insert([{
      type,
      event_date: date,
      event_time: time,
      needs_drummer: needsDrummer,
      needs_bassist: needsBassist,
      notes,
      published: false,
    }])
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/escala')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Evento</h1>
          <Card className="p-6 space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrumentos necessarios</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={needsDrummer} onChange={e => setNeedsDrummer(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">🥁 Bateria</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={needsBassist} onChange={e => setNeedsBassist(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">🎸 Baixo</span>
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
                {loading ? 'Salvando...' : 'Criar Evento'}
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