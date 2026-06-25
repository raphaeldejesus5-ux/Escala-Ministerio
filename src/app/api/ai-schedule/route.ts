import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticação e perfil de líder/admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (!['admin', 'leader'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { eventId } = await request.json()
    if (!eventId) return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })

    // Busca dados do evento
    const { data: event } = await supabase
      .from('events')
      .select('*, schedule_slots(role, member_id, ministry_members(name))')
      .eq('id', eventId)
      .single()

    if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    // Verifica quais funções ainda precisam ser preenchidas
    const existingSlots = event.schedule_slots ?? []
    const hasDrummer = existingSlots.some((s: any) => s.role === 'drummer')
    const hasBassist = existingSlots.some((s: any) => s.role === 'bassist')

    const neededRoles: string[] = []
    if (event.needs_drummer && !hasDrummer) neededRoles.push('drummer')
    if (event.needs_bassist && !hasBassist) neededRoles.push('bassist')

    if (neededRoles.length === 0) {
      return NextResponse.json({
        message: 'Escala já está completa para este evento!',
        suggestions: [],
        alreadyComplete: true,
      })
    }

    // Busca sugestões do banco para cada função necessária
    const suggestions: Record<string, any[]> = {}

    for (const role of neededRoles) {
      const { data: candidates } = await supabase
        .rpc('suggest_schedule_members', { p_event_id: eventId, p_role: role })

      suggestions[role] = candidates ?? []
    }

    // Busca contexto extra: serviços recentes de todos os membros ativos
    const { data: recentServices } = await supabase
      .from('schedule_slots')
      .select('member_id, ministry_members(name, instrument), events(event_date, type)')
      .gte('events.event_date',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .eq('status', 'confirmed')

    // Conta serviços por membro
    const serviceCount: Record<string, number> = {}
    recentServices?.forEach((s: any) => {
      if (s.events && s.member_id) {
        serviceCount[s.member_id] = (serviceCount[s.member_id] ?? 0) + 1
      }
    })

    // Monta contexto para o Claude
    const eventDate = new Date(event.event_date + 'T00:00:00')
    const dateStr = eventDate.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const eventTypeMap: Record<string, string> = {
      service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferência',
      cell: 'Célula', special: 'Evento especial'
    }

    const contextLines: string[] = [
      `Evento: ${eventTypeMap[event.type] ?? event.type} — ${dateStr} às ${event.event_time?.substring(0,5)}`,
      '',
      'Funções que precisam ser preenchidas:',
    ]

    for (const role of neededRoles) {
      const roleLabel = role === 'drummer' ? 'Baterista' : 'Baixista'
      contextLines.push(`\n${roleLabel}:`)
      const candidates = suggestions[role] ?? []

      if (candidates.length === 0) {
        contextLines.push('  Nenhum candidato disponível (todos indisponíveis nesta data)')
      } else {
        candidates.forEach((c: any, i: number) => {
          const services = serviceCount[c.profile_id] ?? 0
          contextLines.push(
            `  ${i + 1}. ${c.name} | Nível: ${c.experience} | Serviços nos últimos 30 dias: ${services} | Score de equilíbrio: ${Math.round(c.score)}`
          )
        })
      }
    }

    const prompt = `Você é um assistente especializado em gestão de escalas de ministérios de música em igrejas.

Com base nos dados abaixo, sugira qual integrante escalar para cada função do evento. Considere:
- Equilíbrio de participação (evitar sobrecarregar quem já serviu muito)
- Nível de experiência adequado ao tipo de evento
- O score já calcula: quanto maior, mais indicado (menos serviços recentes + mais tempo sem servir)

${contextLines.join('\n')}

Responda em JSON com este formato exato (sem markdown, só o JSON):
{
  "suggestions": [
    {
      "role": "drummer",
      "roleLabel": "Baterista", 
      "memberId": "id-do-membro",
      "memberName": "Nome do membro",
      "justification": "Justificativa em 1-2 frases simples e diretas"
    }
  ],
  "generalNote": "Observação geral sobre a escala sugerida (1 frase)"
}`

    // Chama a API do Claude
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiResponse.ok) {
      throw new Error(`Claude API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const rawText = aiData.content?.[0]?.text ?? '{}'

    // Parse seguro do JSON
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({
      event: {
        id: event.id,
        date: dateStr,
        type: eventTypeMap[event.type] ?? event.type,
        time: event.event_time?.substring(0, 5),
      },
      suggestions: result.suggestions ?? [],
      generalNote: result.generalNote ?? '',
      candidatesByRole: suggestions,
    })

  } catch (error: any) {
    console.error('AI Schedule error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sugestão: ' + error.message },
      { status: 500 }
    )
  }
}
