'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { UserPlus, Trash2, LogIn, User } from 'lucide-react'

export default function IntegrantesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profiles, setProfiles] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchAll = async () => {
    const { data: p } = await supabase.from('profiles').select('*').order('name')
    const { data: m } = await supabase.from('ministry_members').select('*').order('name')
    setProfiles(p || [])
    setMembers(m || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm('Excluir ' + name + '?')) return
    setDeleting(id)
    await supabase.from('ministry_members').delete().eq('id', id)
    await fetchAll()
    setDeleting(null)
  }

  const instrumentLabel: Record<string, string> = {
    drums: 'Bateria', bass: 'Baixo', both: 'Ambos',
  }
  const statusColor: Record<string, 'green' | 'red' | 'amber'> = {
    active: 'green', inactive: 'red', training: 'amber',
  }
  const statusLabel: Record<string, string> = {
    active: 'Ativo', inactive: 'Inativo', training: 'Em treinamento',
  }

  const total = profiles.length + members.length

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrantes</h1>
            <p className="text-gray-500 mt-1">{total} musico(s) no ministerio</p>
          </div>
          <Button onClick={() => router.push('/integrantes/novo')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Integrante
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : total === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum integrante cadastrado ainda.</p>
            <Button className="mt-4" onClick={() => router.push('/integrantes/novo')}>
              Cadastrar primeiro integrante
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {profiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LogIn className="w-4 h-4 text-primary-600" />
                  <h2 className="text-sm font-semibold text-gray-700">Com acesso ao app ({profiles.length})</h2>
                </div>
                <div className="grid gap-3">
                  {profiles.map((p) => (
                    <Card key={p.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                          {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.name || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{instrumentLabel[p.instrument] || p.instrument}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor[p.status] || 'green'}>
                          {statusLabel[p.status] || p.status}
                        </Badge>
                        <Badge color="blue">Com login</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {members.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Sem acesso ao app ({members.length})</h2>
                </div>
                <div className="grid gap-3">
                  {members.map((m) => (
                    <Card key={m.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                          {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{m.name || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{instrumentLabel[m.instrument] || m.instrument}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor[m.status] || 'green'}>
                          {statusLabel[m.status] || m.status}
                        </Badge>
                        <button
                          onClick={() => handleDeleteMember(m.id, m.name)}
                          disabled={deleting === m.id}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}