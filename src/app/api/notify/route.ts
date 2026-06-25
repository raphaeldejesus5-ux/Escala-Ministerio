import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'escala@seudominio.com.br'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'EscalaMinistério'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Templates de e-mail
function templateScheduled(data: {
  memberName: string
  roleLabel: string
  eventType: string
  eventDate: string
  eventTime: string
}) {
  return {
    subject: `🎵 Você foi escalado — ${data.eventType} em ${data.eventDate}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
    
    <!-- Header -->
    <div style="background: #1a0a3c; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
      <div style="width: 40px; height: 40px; background: #7C3AED; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 20px;">🎵</span>
      </div>
      <div>
        <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">${APP_NAME}</h1>
        <p style="color: #a78bd4; margin: 0; font-size: 13px;">Ministério de Louvor</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Olá, ${data.memberName}!</p>
      <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 24px; line-height: 1.3;">
        Você foi escalado como <span style="color: #7C3AED;">${data.roleLabel}</span>
      </h2>

      <!-- Event card -->
      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="background: #ede9fe; color: #5b21b6; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px;">${data.eventType}</span>
        </div>
        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">
          📅 ${data.eventDate}
        </p>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">
          🕐 ${data.eventTime}
        </p>
      </div>

      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Caso não possa comparecer, acesse o sistema e solicite uma troca com antecedência.
      </p>

      <!-- CTA -->
      <a href="${APP_URL}/escala" 
         style="display: inline-block; background: #7C3AED; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
        Ver minha escala →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; background: #fafafa;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        ${APP_NAME} · Sistema de gestão de escalas
      </p>
    </div>
  </div>
</body>
</html>`,
  }
}

function templateSwapRequest(data: {
  substituteName: string
  requesterName: string
  roleLabel: string
  eventType: string
  eventDate: string
  swapId: string
}) {
  return {
    subject: `🔄 Pedido de troca — ${data.requesterName} precisa de substituto`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="background: #1a0a3c; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">${APP_NAME}</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 16px;">
        ${data.requesterName} precisa de um substituto
      </h2>
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Função:</strong> ${data.roleLabel}<br>
          <strong>Evento:</strong> ${data.eventType}<br>
          <strong>Data:</strong> ${data.eventDate}
        </p>
      </div>
      <p style="color: #374151; font-size: 14px; margin: 0 0 24px;">
        Você foi sugerido como substituto. Acesse o sistema para aceitar ou recusar.
      </p>
      <a href="${APP_URL}/trocas" 
         style="display: inline-block; background: #7C3AED; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
        Ver solicitação →
      </a>
    </div>
  </div>
</body>
</html>`,
  }
}

function templateOverloadAlert(data: {
  leaderName: string
  memberName: string
  count: number
}) {
  return {
    subject: `⚠️ Alerta de sobrecarga — ${data.memberName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="background: #1a0a3c; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">${APP_NAME}</h1>
    </div>
    <div style="padding: 32px;">
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #dc2626; font-size: 16px; font-weight: 700; margin: 0 0 8px;">
          ⚠️ Alerta de sobrecarga
        </h2>
        <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
          <strong>${data.memberName}</strong> serviu <strong>${data.count}×</strong> nos últimos 30 dias. Considere dar um descanso na próxima escala.
        </p>
      </div>
      <a href="${APP_URL}/relatorios" 
         style="display: inline-block; background: #7C3AED; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
        Ver relatórios →
      </a>
    </div>
  </div>
</body>
</html>`,
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurado — e-mail não enviado')
    return { success: false, error: 'RESEND_API_KEY não configurado' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err }
  }

  return { success: true, data: await res.json() }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { type } = body

    // ── Tipo: membro escalado ────────────────────────────────────────────────
    if (type === 'scheduled') {
      const { memberId, memberName, role, eventId } = body

      // Busca e-mail do membro (se tiver perfil vinculado)
      const { data: member } = await supabase
        .from('ministry_members')
        .select('email, name, profile_id, profiles(id)')
        .eq('id', memberId)
        .single()

      const { data: event } = await supabase
        .from('events')
        .select('event_date, event_time, type')
        .eq('id', eventId)
        .single()

      if (!member?.email || !event) {
        return NextResponse.json({ success: false, reason: 'sem e-mail cadastrado' })
      }

      const roleLabel = role === 'drummer' ? 'Baterista' : 'Baixista'
      const eventTypeMap: Record<string, string> = {
        service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferência',
        cell: 'Célula', special: 'Evento especial',
      }
      const eventDate = new Date(event.event_date + 'T00:00:00')
        .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

      const { subject, html } = templateScheduled({
        memberName: member.name,
        roleLabel,
        eventType: eventTypeMap[event.type] ?? event.type,
        eventDate,
        eventTime: event.event_time?.substring(0, 5) ?? '',
      })

      const result = await sendEmail(member.email, subject, html)

      // Salva notificação interna também
      if (member.profile_id) {
        await supabase.from('notifications').insert({
          profile_id: member.profile_id,
          type: 'schedule_published',
          title: 'Você foi escalado',
          message: `Você foi escalado como ${roleLabel} no ${eventTypeMap[event.type]} do dia ${eventDate}.`,
        })
      }

      return NextResponse.json(result)
    }

    // ── Tipo: solicitação de troca ───────────────────────────────────────────
    if (type === 'swap_request') {
      const { substituteId, requesterName, role, eventId, swapId } = body

      const { data: substitute } = await supabase
        .from('ministry_members')
        .select('email, name')
        .eq('id', substituteId)
        .single()

      const { data: event } = await supabase
        .from('events')
        .select('event_date, type')
        .eq('id', eventId)
        .single()

      if (!substitute?.email || !event) {
        return NextResponse.json({ success: false, reason: 'sem e-mail' })
      }

      const roleLabel = role === 'drummer' ? 'Baterista' : 'Baixista'
      const eventTypeMap: Record<string, string> = {
        service: 'Culto', rehearsal: 'Ensaio', conference: 'Conferência',
        cell: 'Célula', special: 'Evento especial',
      }
      const eventDate = new Date(event.event_date + 'T00:00:00')
        .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

      const { subject, html } = templateSwapRequest({
        substituteName: substitute.name,
        requesterName,
        roleLabel,
        eventType: eventTypeMap[event.type] ?? event.type,
        eventDate,
        swapId,
      })

      const result = await sendEmail(substitute.email, subject, html)
      return NextResponse.json(result)
    }

    // ── Tipo: alerta de sobrecarga ───────────────────────────────────────────
    if (type === 'overload') {
      const { leaderEmail, leaderName, memberName, count } = body

      if (!leaderEmail) {
        return NextResponse.json({ success: false, reason: 'sem e-mail do líder' })
      }

      const { subject, html } = templateOverloadAlert({ leaderName, memberName, count })
      const result = await sendEmail(leaderEmail, subject, html)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Tipo de notificação inválido' }, { status: 400 })

  } catch (error: any) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
