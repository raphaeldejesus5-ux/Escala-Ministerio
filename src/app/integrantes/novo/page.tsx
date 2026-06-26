'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'

export default function NovoIntegrantePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    instrument: 'drums',
    experience: 'intermediate',
    status: 'active',
    notes: '',
  })

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.from('ministry_members').insert([form])
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/integrantes')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Integrante</h1>
          <Card className="p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Nome do musico" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <Input name="phone" value={form.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
              <Select name="instrument" value={form.instrument} onChange={handleChange}>
                <option value="drums">Bateria</option>
                <option value="bass">Baixo</option>
                <option value="both">Ambos</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia</label>
              <Select name="experience" value={form.experience} onChange={handleChange}>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediario</option>
                <option value="advanced">Avancado</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="training">Em treinamento</option>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Cadastrar Integrante'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/integrantes')}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}