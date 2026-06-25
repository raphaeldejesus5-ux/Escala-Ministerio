// ─── Enums (espelham os tipos do PostgreSQL) ────────────────────────────────

export type InstrumentType = 'drums' | 'bass' | 'both'
export type MemberStatus   = 'active' | 'inactive' | 'training'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type EventType      = 'service' | 'rehearsal' | 'conference' | 'cell' | 'special'
export type SlotRole       = 'drummer' | 'bassist'
export type SlotStatus     = 'confirmed' | 'pending' | 'cancelled'
export type PeriodType     = 'all_day' | 'morning' | 'afternoon' | 'evening'
export type SwapStatus     = 'pending_substitute' | 'pending_leader' | 'approved' | 'rejected' | 'cancelled'
export type UserRole       = 'admin' | 'leader' | 'member'
export type NotificationType =
  | 'schedule_published'
  | 'service_reminder'
  | 'swap_requested'
  | 'swap_accepted'
  | 'swap_rejected'
  | 'swap_approved'
  | 'overload_alert'
  | 'inactivity_alert'

// ─── Tabelas ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  phone: string | null
  instrument: InstrumentType
  status: MemberStatus
  experience: ExperienceLevel
  role: UserRole
  preferences: string | null
  notes: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string | null
  event_date: string
  event_time: string
  type: EventType
  needs_drummer: boolean
  needs_bassist: boolean
  notes: string | null
  published: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleSlot {
  id: string
  event_id: string
  profile_id: string
  role: SlotRole
  status: SlotStatus
  assigned_by: string | null
  assigned_at: string
  // joins
  profile?: Profile
  event?: Event
}

export interface Unavailability {
  id: string
  profile_id: string
  unavailable_date: string
  period: PeriodType
  reason: string | null
  recurring: boolean
  recurrence_rule: string | null
  created_at: string
}

export interface SwapRequest {
  id: string
  slot_id: string
  requester_id: string
  substitute_id: string | null
  reason: string | null
  status: SwapStatus
  leader_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // joins
  slot?: ScheduleSlot & { event?: Event; profile?: Profile }
  requester?: Profile
  substitute?: Profile
}

export interface Notification {
  id: string
  profile_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ─── Helpers de UI ──────────────────────────────────────────────────────────

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  drums: 'Bateria',
  bass:  'Baixo',
  both:  'Bateria e Baixo',
}

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active:   'Ativo',
  inactive: 'Inativo',
  training: 'Em treinamento',
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner:     'Iniciante',
  intermediate: 'Intermediário',
  advanced:     'Avançado',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service:   'Culto',
  rehearsal: 'Ensaio',
  conference:'Conferência',
  cell:      'Célula',
  special:   'Evento especial',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  service:    'bg-primary-50 text-primary-800',
  rehearsal:  'bg-teal-50 text-teal-800',
  conference: 'bg-amber-50 text-amber-800',
  cell:       'bg-blue-50 text-blue-800',
  special:    'bg-pink-50 text-pink-800',
}

export const ROLE_LABELS: Record<SlotRole, string> = {
  drummer: 'Baterista',
  bassist: 'Baixista',
}

export const SWAP_STATUS_LABELS: Record<SwapStatus, string> = {
  pending_substitute: 'Aguardando substituto',
  pending_leader:     'Aguardando aprovação',
  approved:           'Aprovada',
  rejected:           'Recusada',
  cancelled:          'Cancelada',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin:  'Administrador',
  leader: 'Líder',
  member: 'Integrante',
}
