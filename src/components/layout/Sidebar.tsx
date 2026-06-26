'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Users, ArrowLeftRight,
  Bell, BarChart2, LogOut, Music2, CalendarX, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard',         label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/escala',            label: 'Escala',       icon: Calendar },
  { href: '/escala/sugestao',   label: 'Sugestao IA',  icon: Sparkles },
  { href: '/integrantes',       label: 'Integrantes',  icon: Users },
  { href: '/trocas',            label: 'Trocas',       icon: ArrowLeftRight },
  { href: '/indisponibilidade', label: 'Indisponivel', icon: CalendarX },
  { href: '/notificacoes',      label: 'Alertas',      icon: Bell },
  { href: '/relatorios',        label: 'Relatorios',   icon: BarChart2 },
]

interface SidebarProps {
  userName?: string
  userRole?: string
}

export function Sidebar({ userName = '', userRole = '' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = userName && userName.trim().length > 0
    ? userName.charAt(0).toUpperCase()
    : '?'

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-brand-dark border-r border-white/10">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <Music2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Escala</p>
          <p className="text-xs text-white/50 leading-tight">Ministerio</p>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                active
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary-600/40 flex items-center justify-center text-xs font-bold text-primary-200">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName || 'Usuario'}</p>
            <p className="text-xs text-white/40">{userRole || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </aside>
  )
}