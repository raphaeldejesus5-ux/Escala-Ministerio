import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name = '', size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const initials = name && name.length > 0
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const colors = [
    'bg-purple-100 text-purple-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-red-100 text-red-700',
  ]

  const color = name && name.length > 0
    ? colors[name.charCodeAt(0) % colors.length]
    : colors[0]

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizes[size],
        color,
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}