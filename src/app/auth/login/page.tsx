'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Music2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'E-mail obrigatório'
    if (!form.password) e.password = 'Senha obrigatória'
    if (form.password && form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error('E-mail ou senha incorretos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">EscalaMinistério</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Organize as escalas do seu ministério com inteligência
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Controle de frequência, sugestão automática, trocas com aprovação e alertas de sobrecarga — tudo em um lugar.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Integrantes', value: '∞' },
            { label: 'Trocas automáticas', value: '✓' },
            { label: 'Alertas inteligentes', value: '✓' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-primary-400">{item.value}</p>
              <p className="text-sm text-white/50 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">EscalaMinistério</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h2>
          <p className="text-sm text-gray-500 mb-8">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
              Criar conta
            </Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

