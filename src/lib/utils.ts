import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

export function formatDateLong(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatTime(time: string) {
  return time ? time.substring(0, 5) : ''
}

export function getInitials(name?: string) {
  if (!name || name.trim() === '') return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
}

export function avatarColor(name?: string) {
  const colors = [
    'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-blue-100 text-blue-700',
    'bg-pink-100 text-pink-700',
    'bg-green-100 text-green-700',
  ]
  if (!name || name.trim() === '') return colors[0]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}