import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  confirmRegistration,
  fetchPendingRegistrations,
  rejectRegistration,
} from '../api/tournaments'
import type { PendingRegistration } from '../api/types'
import { Shell } from '../components/Shell'
import { Avatar } from '../components/ui'
import { Display } from '../lib/display'

export function ValidationsPage() {
  const [items, setItems] = useState<PendingRegistration[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    fetchPendingRegistrations().then(setItems).catch(() => setItems([]))
  }, [])

  useEffect(reload, [reload])

  async function action(fn: () => Promise<unknown>) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell breadcrumbs={[{ label: 'Admin', to: '/' }, { label: 'Validations' }]}>
      <main className="app-content" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1 className="page-title">Validations</h1>
            <p className="page-sub">
              {items.length === 0
                ? 'Aucune inscription à traiter.'
                : `${items.length} inscription${items.length > 1 ? 's' : ''} en attente de traitement.`}
            </p>
          </div>
        </div>

        {message && <p className="field-hint is-error" style={{ marginBottom: 16 }}>{message}</p>}

        <div className="card">
          <table className="t-list">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Tournoi</th>
                <th>Statut</th>
                <th className="hide-sm">Inscrit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    Rien à valider — tout est à jour ✓
                  </td>
                </tr>
              )}
              {items.map((r, i) => (
                <tr key={r.registrationId} style={{ cursor: 'default' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar color={Display.colorFor(i)}>{Display.initials(r.participant)}</Avatar>
                      <span className="t-name">{r.participant}</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/tournois/${r.tournamentId}`} className="btn-link" style={{ fontSize: 14 }}>
                      {r.tournamentName}
                    </Link>
                  </td>
                  <td>
                    <span className="status-badge sb-pending">
                      {r.status === 'waitlist' ? "Liste d'attente" : 'En attente'}
                    </span>
                  </td>
                  <td className="hide-sm t-meta">{r.registeredLabel}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-h8 btn-primary"
                      disabled={busy}
                      onClick={() => action(() => confirmRegistration(r.registrationId))}
                      style={{ marginRight: 8 }}
                    >
                      Valider
                    </button>
                    <button
                      className="btn btn-h8 btn-outline"
                      disabled={busy}
                      onClick={() => action(() => rejectRegistration(r.registrationId))}
                    >
                      Refuser
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </Shell>
  )
}
