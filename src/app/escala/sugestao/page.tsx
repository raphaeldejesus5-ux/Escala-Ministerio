'use client'
export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import {
  Wand2, CheckCircle2, AlertCircle, Loader2,
  Music2, Drum, ChevronRight, Sparkles
} from 'lucide-react'
import { USER_ROLE_LABELS, EVENT_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AISuggestion {
  role: string
  roleLabel: string
  memberId: string
  memberName: string
  justification: string
}

interface AIResult {
  event: { id: string; date: string; type: string; time: string }
  suggestions: AISuggestion[]
  generalNote: string
  alreadyComplete?: boolean
  message?: string
}

export default function SugestaoPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles').select('name, role').eq('id', user.id).single()
      setProfile(prof)

      // Busca eventos sem escala completa
      const today = new Date().toISOString().split('T')[0]
      const { data: evts } = await supabase
        .from('events')
        .select('id, event_date, event_time, type, needs_drummer, needs_bassist, schedule_slots(role)')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(20)

      // Filtra apenas eventos com slots faltando
      const incomplete = (evts ?? []).filter((e: any) => {
        const slots = e.schedule_slots ?? []
        const hasDrummer = slots.some((s: any) => s.role === 'drummer')
        const hasBassist = slots.some((s: any) => s.role === 'bassist')
        return (e.needs_drummer && !hasDrummer) || (e.needs_bassist && !hasBassist)
      })

      setEvents(incomplete)
      if (incomplete.length > 0) setSelectedEventId(incomplete[0].id)
    }
    load()
  }, [])

  async function handleSuggest() {
    if (!selectedEventId) { toast.error('Selecione um evento'); return }
    setLoading(true)
    setResult(null)
    setConfirmed(false)

    try {
      const res = await fetch('/api/ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setResult(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!result?.suggestions?.length) return
    setConfirming(true)

    try {
      const slots = result.suggestions.map(s => ({
        role: s.role,
        memberId: s.memberId,
        memberName: s.memberName,
      }))

      const res = await fetch('/api/ai-schedule/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, slots }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      setConfirmed(true)

      // Remove evento da lista
      setEvents(prev => prev.filter(e => e.id !== selectedEventId))
      setResult(null)
      setSelectedEventId(events.find(e => e.id !== selectedEventId)?.id ?? '')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const eventOptions = events.map(e => ({
    value: e.id,
    label: `${EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]} — ${
      new Date(e.event_date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'short', day: 'numeric', month: 'short'
      })
    } ${e.event_time?.substring(0, 5)}`,
  }))

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={profile?.name ?? 'Usuário'}
        userRole={(USER_ROLE_LABELS as Record<string, string>)[profile?.role ?? 'member']}
      />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sugestão de escala com IA</h1>
            <p className="text-sm text-gray-500">O Claude analisa o histórico e sugere quem deve servir</p>
          </div>
        </div>

        {/* Selector */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Selecione o evento</h2>

          {events.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" />
              Todos os eventos já estão com escala completa!
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Select
                  label="Eventos com escala incompleta"
                  value={selectedEventId}
                  onChange={e => { setSelectedEventId(e.target.value); setResult(null); setConfirmed(false) }}
                  options={eventOptions}
                />
              </div>
              <Button
                onClick={handleSuggest}
                loading={loading}
                disabled={!selectedEventId}
                className="flex-shrink-0"
              >
                <Wand2 className="w-4 h-4" />
                {loading ? 'Analisando...' : 'Sugerir com IA'}
              </Button>
            </div>
          )}

          {/* Como funciona */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Como funciona:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Analisa serviços nos últimos 30 dias',
                'Considera quem está sem servir há mais tempo',
                'Verifica indisponibilidades cadastradas',
                'Gera justificativa para cada sugestão',
              ].map(step => (
                <span key={step} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <ChevronRight className="w-3 h-3 text-primary-400" />
                  {step}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
              <p className="font-medium text-gray-800">Claude está analisando o histórico...</p>
              <p className="text-sm text-gray-500">Verificando serviços, disponibilidade e equilíbrio</p>
            </div>
          </Card>
        )}

        {/* Já completo */}
        {result?.alreadyComplete && (
          <Card>
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-medium">{result.message}</p>
            </div>
          </Card>
        )}

        {/* Resultado */}
        {result && !result.alreadyComplete && result.suggestions.length > 0 && (
          <div className="space-y-4">
            {/* Evento info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="purple">{result.event.type}</Badge>
              <span>{result.event.date}</span>
              <span>·</span>
              <span>{result.event.time}</span>
            </div>

            {/* Sugestões */}
            {result.suggestions.map(suggestion => (
              <Card key={suggestion.role}>
                <div className="flex items-start gap-4">
                  {/* Ícone da função */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    suggestion.role === 'drummer' ? 'bg-purple-50' : 'bg-teal-50'
                  }`}>
                    <span className="text-xl">
                      {suggestion.role === 'drummer' ? '🥁' : '🎸'}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={suggestion.role === 'drummer' ? 'purple' : 'teal'}>
                        {suggestion.roleLabel}
                      </Badge>
                      <span className="text-xs text-gray-400">sugerido pela IA</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={suggestion.memberName} size="sm" />
                      <span className="font-semibold text-gray-900 text-lg">
                        {suggestion.memberName}
                      </span>
                    </div>

                    {/* Justificativa */}
                    <div className="flex items-start gap-2 bg-primary-50 rounded-lg px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-primary-800 leading-relaxed">
                        {suggestion.justification}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Nota geral */}
            {result.generalNote && (
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <Music2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <p>{result.generalNote}</p>
              </div>
            )}

            {/* Ações */}
            {!confirmed ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  loading={confirming}
                  size="lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e escalar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSuggest}
                  loading={loading}
                  size="lg"
                >
                  <Wand2 className="w-4 h-4" />
                  Gerar nova sugestão
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">Escala confirmada! Os integrantes serão notificados.</p>
              </div>
            )}
          </div>
        )}

        {/* Sem sugestões */}
        {result && !result.alreadyComplete && result.suggestions.length === 0 && (
          <Card>
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Nenhum candidato disponível</p>
                <p className="text-sm text-amber-700 mt-1">
                  Todos os integrantes aptos estão indisponíveis nesta data ou já foram escalados.
                  Verifique as indisponibilidades cadastradas.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}



