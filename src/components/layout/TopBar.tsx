'use client'

import { Music2, Bell } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  title: string
  notifCount?: number
}

export function TopBar({ title, notifCount = 0 }: TopBarProps) {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-brand-dark border-b border-white/10">
      <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
        <Music2 className="w-3.5 h-3.5 text-white" />
      </div>
      <h1 className="flex-1 text-sm font-semibold text-white">{title}</h1>
      <Link href="/notificacoes" className="relative p-1.5 text-white/60 hover:text-white">
        <Bell className="w-5 h-5" />
        {notifCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
            {notifCount}
          </span>
        )}
      </Link>
    </header>
  )
}
