'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Music2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', instrument: 'drums', experience: 'beginner'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.email) e.email = 'E-mail obrigatório'
    if (!form.password || form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    return e
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          instrument: form.instrument,
          experience: form.experience,
          role: 'member',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Conta criada! Verifique seu e-mail para confirmar.')
    router.push('/auth/login')
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">EscalaMinistério</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Criar conta</h2>
          <p className="text-sm text-gray-500 mb-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="João da Silva"
              value={form.name}
              onChange={f('name')}
              error={errors.name}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={f('email')}
              error={errors.email}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={f('password')}
              error={errors.password}
              hint="Use letras, números e símbolos para maior segurança"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Instrumento"
                value={form.instrument}
                onChange={f('instrument')}
                options={[
                  { value: 'drums', label: 'Bateria' },
                  { value: 'bass',  label: 'Baixo' },
                  { value: 'both',  label: 'Ambos' },
                ]}
              />
              <Select
                label="Nível"
                value={form.experience}
                onChange={f('experience')}
                options={[
                  { value: 'beginner',     label: 'Iniciante' },
                  { value: 'intermediate', label: 'Intermediário' },
                  { value: 'advanced',     label: 'Avançado' },
                ]}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Criar conta
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}


