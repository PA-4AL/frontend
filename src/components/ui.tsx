import type { CSSProperties, ReactNode } from 'react'
import type { PhaseType, TournamentStatus } from '../api/types'

export function Avatar({
  children,
  color,
  size = 'sm',
  src,
  style,
}: {
  children: ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string | null
  style?: CSSProperties
}) {
  const cls = size === 'md' ? 'avatar' : `avatar avatar-${size}`
  return (
    <span className={cls} style={{ ...(color ? { background: color } : {}), ...style }}>
      {src ? <img src={src} alt="" /> : children}
    </span>
  )
}

export const FORMAT_LABELS: Record<PhaseType, string> = {
  single_elim: 'Single Elim.',
  double_elim: 'Double Elim.',
  round_robin: 'Round Robin',
  swiss: 'Suisse',
}

export function FmtBadge({ format, label }: { format?: PhaseType; label?: string }) {
  return <span className="fmt-badge">{label ?? (format ? FORMAT_LABELS[format] : '')}</span>
}

export function StatusBadge({ status }: { status: TournamentStatus }) {
  switch (status) {
    case 'ongoing':
      return (
        <span className="status-badge sb-live">
          <span className="dot live" />
          Live
        </span>
      )
    case 'registration':
    case 'check_in':
    case 'draft':
      return (
        <span className="status-badge sb-upcoming">
          <span className="dot" style={{ background: 'var(--status-warning)' }} />
          À venir
        </span>
      )
    case 'cancelled':
      return <span className="status-badge sb-cancelled">Annulé</span>
    case 'finished':
    default:
      return <span className="status-badge sb-finished">Terminé</span>
  }
}
