import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTournament, type GameSpec } from '../api/tournaments'
import { Shell } from '../components/Shell'
import { FORMATS, aideFormat } from '../lib/formats'
import { IconPlus, IconTrophy, IconXCircle } from '../lib/icons'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [games, setGames] = useState<GameSpec[]>([{ name: '', bestOf: 1 }])
  const [description, setDescription] = useState('')
  // Le format se fixe ici, une fois pour toutes : l'écran Bracket l'applique.
  const [format, setFormat] = useState('single_elim')
  const [startAt, setStartAt] = useState('')
  const [teamSize, setTeamSize] = useState(1)
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateGame(i: number, patch: Partial<GameSpec>) {
    setGames((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const cleanGames = games
      .map((g) => ({ name: g.name.trim(), bestOf: g.bestOf }))
      .filter((g) => g.name !== '')
    if (!name.trim() || cleanGames.length === 0) {
      setError('Le nom et au moins un jeu sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createTournament({
        name: name.trim(),
        games: cleanGames,
        description: description.trim() || undefined,
        format,
        teamSize,
        maxParticipants: maxParticipants === '' ? undefined : maxParticipants,
        visibility,
        startAt: startAt || undefined,
      })
      navigate(`/tournois/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.')
      setSaving(false)
    }
  }

  return (
    <Shell breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Tournois' }, { label: 'Nouveau' }]}>
      <main className="app-content" style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1 className="page-title">Créer un tournoi</h1>
            <p className="page-sub">
              Le tournoi est créé en brouillon. Choisis son format ici, puis ajoute les
              participants, place les seeds et génère le bracket.
            </p>
          </div>
        </div>

        <form className="card card-pad" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field-group">
            <label className="field-label" htmlFor="t-name">Nom du tournoi *</label>
            <input
              id="t-name"
              className="input"
              placeholder="APEX Invitational 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="t-format">Format du tournoi *</label>
            <select
              id="t-format"
              className="input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f.valeur} value={f.valeur} disabled={f.indisponible}>
                  {f.libelle}
                </option>
              ))}
            </select>
            <p className="field-hint">{aideFormat(format)}</p>
            <p className="field-hint">
              Ce choix est définitif pour la génération de l'arbre : l'écran Bracket
              l'applique sans le redemander.
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">Jeux / disciplines * (un bracket par jeu, avec son format de matchs)</label>
            {games.map((g, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 38px', gap: 10 }}>
                <input
                  className="input"
                  placeholder={i === 0 ? 'Apex Legends' : 'Autre jeu…'}
                  value={g.name}
                  onChange={(e) => updateGame(i, { name: e.target.value })}
                />
                <select
                  className="input"
                  value={g.bestOf}
                  onChange={(e) => updateGame(i, { bestOf: Number(e.target.value) })}
                  aria-label="Best of"
                >
                  <option value={1}>BO1</option>
                  <option value={3}>BO3</option>
                  <option value={5}>BO5</option>
                </select>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  aria-label="Retirer ce jeu"
                  disabled={games.length === 1}
                  onClick={() => setGames((gs) => gs.filter((_, j) => j !== i))}
                >
                  <IconXCircle />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-h8"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setGames((gs) => [...gs, { name: '', bestOf: 1 }])}
            >
              <IconPlus />
              Ajouter un jeu
            </button>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="t-desc">Description</label>
            <textarea
              id="t-desc"
              className="textarea"
              placeholder="Règles, cash prize, planning…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field-group">
              <label className="field-label" htmlFor="t-start">Début du tournoi</label>
              <input
                id="t-start"
                className="input"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="t-vis">Visibilité</label>
              <select
                id="t-vis"
                className="input"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              >
                <option value="public">Public</option>
                <option value="private">Privé</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field-group">
              <label className="field-label" htmlFor="t-size">Taille des équipes</label>
              <select
                id="t-size"
                className="input"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
              >
                <option value={1}>Solo (1v1)</option>
                <option value={2}>2v2</option>
                <option value={3}>3v3</option>
                <option value={5}>5v5</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="t-max">Participants max</label>
              <input
                id="t-max"
                className="input"
                type="number"
                min={2}
                placeholder="16"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          {error && <p className="field-hint is-error" style={{ margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <IconTrophy />
              {saving ? 'Création…' : 'Créer le tournoi'}
            </button>
          </div>
        </form>
      </main>
    </Shell>
  )
}
