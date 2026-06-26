'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function NovoIntegrantePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instrument, setInstrument] = useState('drums')
  const [experience, setExperience] = useState('intermediate')
  const [status, setStatus] = useState('active')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nome obrigatorio'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.from('ministry_members').insert([{
      name, phone, instrument, experience, status
    }])
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do musico" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
              <select value={instrument} onChange={e => setInstrument(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="drums">Bateria</option>
                <option value="bass">Baixo</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia</label>
              <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediario</option>
                <option value="advanced">Avancado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="training">Em treinamento</option>
              </select>
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