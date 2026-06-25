import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role, name').eq('id', user.id).single()

    if (!['admin', 'leader'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { eventId, slots } = await request.json()
    // slots: [{ role: 'drummer' | 'bassist', memberId: string, memberName: string }]

    if (!eventId || !slots?.length) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const inserted = []
    const errors = []

    for (const slot of slots) {
      // Verifica se já existe slot para esta função
      const { data: existing } = await supabase
        .from('schedule_slots')
        .select('id')
        .eq('event_id', eventId)
        .eq('role', slot.role)
        .single()

      if (existing) {
        errors.push(`${slot.role === 'drummer' ? 'Baterista' : 'Baixista'} já escalado`)
        continue
      }

      const { data, error } = await supabase
        .from('schedule_slots')
        .insert({
          event_id:  eventId,
          member_id: slot.memberId,
          role:      slot.role,
          status:    'confirmed',
          assigned_by: user.id,
        })
        .select()
        .single()

      if (error) {
        errors.push(`Erro ao escalar ${slot.memberName}: ${error.message}`)
      } else {
        inserted.push(data)

        // Dispara notificação por e-mail (best-effort)
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'scheduled',
              memberId: slot.memberId,
              memberName: slot.memberName,
              role: slot.role,
              eventId,
            }),
          })
        } catch (notifError) {
          console.warn('Notificação falhou (não crítico):', notifError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: inserted.length,
      errors,
      message: inserted.length > 0
        ? `${inserted.length} integrante(s) escalado(s) com sucesso!`
        : 'Nenhum integrante foi escalado.',
    })

  } catch (error: any) {
    console.error('Confirm schedule error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
