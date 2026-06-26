'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { UserPlus } from 'lucide-react'

export default function IntegrantesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('ministry_members')
        .select('*')
        .order('name')
      setMembers(data || [])
      setLoading(false)
    }
    fetchMembers()
  }, [])

  const instrumentLabel: Record<string, string> = {
    drums: 'Bateria',
    bass: 'Baixo',
    both: 'Ambos',
  }

  const statusLabel: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    training: 'Em treinamento',
  }

  const statusColor: Record<string, 'green' | 'red' | 'amber'> = {
    active: 'green',
    inactive: 'red',
    training: 'amber',
  }

  const experienceLabel: Record<string, string> = {
    beginner: 'Iniciante',
    intermediate: 'Intermediario',
    advanced: 'Avancado',
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrantes</h1>
            <p className="text-gray-500 mt-1">Gerencie os musicos do ministerio</p>
          </div>
          <Button onClick={() => router.push('/integrantes/novo')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Integrante
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : members.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum integrante cadastrado ainda.</p>
            <Button className="mt-4" onClick={() => router.push('/integrantes/novo')}>
              Cadastrar primeiro integrante
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500">{instrumentLabel[member.instrument] || member.instrument} • {experienceLabel[member.experience] || member.experience}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={statusColor[member.status] || 'green'}>
                    {statusLabel[member.status] || member.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}