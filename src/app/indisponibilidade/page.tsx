'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { CalendarX, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { USER_ROLE_LABELS } from '@/types'
import toast from 'react-hot-toast'

const periodLabels: Record<string, string> = {
  all_day:   'Dia inteiro',
  morning:   'Manhã',
  afternoon: 'Tarde',
  evening:   'Noite',
}

export default function IndisponibilidadePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unavailabilities, setUnavailabilities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    unavailable_date: '',
    period: 'all_day',
    reason: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: prof } = await supabase
        .from('profiles').select('name, role').eq('id', user.id).single()
      setProfile(prof)

      const { data } = await supabase
        .from('unavailabilities')
        .select('*')
        .eq('profile_id', user.id)
        .order('unavailable_date', { ascending: true })
      setUnavailabilities(data ?? [])
    }
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.unavailable_date) { toast.error('Selecione uma data'); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('unavailabilities')
      .insert({ ...form, profile_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao registrar indisponibilidade')
    } else {
      setUnavailabilities(prev => [...prev, data].sort((a, b) => a.unavailable_date.localeCompare(b.unavailable_date)))
      setForm({ unavailable_date: '', period: 'all_day', reason: '' })
      setShowForm(false)
      toast.success('Indisponibilidade registrada!')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('unavailabilities').delete().eq('id', id)
    if (!error) {
      setUnavailabilities(prev => prev.filter(u => u.id !== id))
      toast.success('Removido')
    }
  }

  const upcoming = unavailabilities.filter(u => u.unavailable_date >= new Date().toISOString().split('T')[0])
  const past = unavailabilities.filter(u => u.unavailable_date < new Date().toISOString().split('T')[0])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={profile?.name ?? 'Usuário'}
        userRole={USER_ROLE_LABELS[profile?.role ?? 'member']}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Indisponibilidades</h1>
            <p className="text-sm text-gray-500 mt-0.5">Informe quando não poderá servir</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            Registrar
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Nova indisponibilidade</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Data"
                  type="date"
                  value={form.unavailable_date}
                  onChange={e => setForm(f => ({ ...f, unavailable_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Select
                  label="Período"
                  value={form.period}
                  onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  options={Object.entries(periodLabels).map(([v, l]) => ({ value: v, label: l }))}
                />
              </div>
              <Input
                label="Motivo (opcional)"
                placeholder="Ex: viagem, consulta médica..."
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={loading} size="sm">Salvar</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Próximas */}
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Próximas ({upcoming.length})</h2>
          {upcoming.length > 0 ? (
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {upcoming.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <CalendarX className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{formatDate(u.unavailable_date, "EEEE, dd 'de' MMMM")}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="red">{periodLabels[u.period]}</Badge>
                        {u.reason && <span className="text-xs text-gray-400">"{u.reason}"</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <p className="text-sm text-gray-400">Nenhuma indisponibilidade registrada</p>
            </Card>
          )}
        </section>

        {/* Passadas */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Anteriores ({past.length})</h2>
            <Card padding="none" className="opacity-60">
              <div className="divide-y divide-gray-100">
                {past.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                    <p className="text-sm text-gray-500">{formatDate(u.unavailable_date)}</p>
                    <Badge variant="gray">{periodLabels[u.period]}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}
