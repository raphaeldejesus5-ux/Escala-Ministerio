export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Bell, AlertTriangle, Clock, Calendar, ArrowLeftRight, CheckCircle2 } from 'lucide-react'
import { formatRelative } from '@/lib/utils'
import { USER_ROLE_LABELS } from '@/types'

const icons: Record<string, React.ElementType> = {
  schedule_published: Calendar,
  service_reminder:   Clock,
  swap_requested:     ArrowLeftRight,
  swap_accepted:      CheckCircle2,
  swap_rejected:      ArrowLeftRight,
  swap_approved:      CheckCircle2,
  overload_alert:     AlertTriangle,
  inactivity_alert:   Clock,
}

const colors: Record<string, string> = {
  schedule_published: 'text-blue-600 bg-blue-50',
  service_reminder:   'text-primary-600 bg-primary-50',
  swap_requested:     'text-amber-600 bg-amber-50',
  swap_accepted:      'text-green-600 bg-green-50',
  swap_rejected:      'text-red-600 bg-red-50',
  swap_approved:      'text-green-600 bg-green-50',
  overload_alert:     'text-red-600 bg-red-50',
  inactivity_alert:   'text-amber-600 bg-amber-50',
}

export default async function NotificacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', user.id).single()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Marca todas como lidas
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', user.id)
    .eq('read', false)

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const userRole = (USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']

  const unread = notifications?.filter((n: any) => !n.read) ?? []
  const read   = notifications?.filter((n: any) => n.read)  ?? []

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread.length} não lidas</p>
        </div>

        {notifications && notifications.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-gray-100">
              {notifications.map((notif: any) => {
                const Icon = icons[notif.type] ?? Bell
                const color = colors[notif.type] ?? 'text-gray-600 bg-gray-50'

                return (
                  <div key={notif.id} className={`flex items-start gap-3 px-4 py-3.5 ${!notif.read ? 'bg-primary-50/30' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma notificação</p>
          </Card>
        )}
      </main>
    </div>
  )
}

