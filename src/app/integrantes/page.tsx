export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { UserPlus, Phone } from 'lucide-react'
import {
  INSTRUMENT_LABELS, STATUS_LABELS, EXPERIENCE_LABELS,
  USER_ROLE_LABELS, type Profile
} from '@/types'
import Link from 'next/link'

const statusBadge: Record<string, 'green' | 'red' | 'amber'> = {
  active:   'green',
  inactive: 'red',
  training: 'amber',
}

const instrumentBadge: Record<string, 'purple' | 'teal' | 'blue'> = {
  drums: 'purple',
  bass:  'teal',
  both:  'blue',
}

export default async function IntegrantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = (USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']
  const isLeader = ['admin', 'leader'].includes(profile?.role ?? '')

  // Conta serviços por integrante nos últimos 30 dias
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: recentSlots } = await supabase
    .from('schedule_slots')
    .select('profile_id, events(event_date)')
    .gte('events.event_date', thirtyDaysAgo)
    .eq('status', 'confirmed')

  const serviceCount: Record<string, number> = {}
  recentSlots?.forEach((slot: any) => {
    if (slot.events) {
      serviceCount[slot.profile_id] = (serviceCount[slot.profile_id] ?? 0) + 1
    }
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Integrantes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{members?.length ?? 0} cadastrados</p>
          </div>
          {isLeader && (
            <Link href="/integrantes/novo">
              <Button size="sm">
                <UserPlus className="w-4 h-4" />
                Cadastrar
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members?.map((member: Profile) => {
            const count = serviceCount[member.id] ?? 0
            const overloaded = count >= 4
            const inactive = count === 0

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Avatar name={member.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant={instrumentBadge[member.instrument]}>
                        {INSTRUMENT_LABELS[member.instrument]}
                      </Badge>
                      <Badge variant={statusBadge[member.status]}>
                        {STATUS_LABELS[member.status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Nível: </span>
                    <span className="text-gray-700">{EXPERIENCE_LABELS[member.experience]}</span>
                  </div>
                  <div className={`font-medium text-xs px-2 py-0.5 rounded-full ${
                    overloaded ? 'bg-red-50 text-red-700' :
                    inactive   ? 'bg-amber-50 text-amber-700' :
                                 'bg-green-50 text-green-700'
                  }`}>
                    {count}× no mês
                  </div>
                </div>

                {member.phone && (
                  <a
                    href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {member.phone}
                  </a>
                )}

                {overloaded && (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    ⚠️ Muitos serviços este mês
                  </p>
                )}
                {!overloaded && inactive && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    🕐 Sem serviço este mês
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}

