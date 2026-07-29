import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { fetchBracket, fetchTournament, generateBracket, reportScore } from '../api/tournaments'
import { peutDemarrerUnGlissement } from './bracketDrag'
import type { BracketData, BracketMatch, BracketSlot, TournamentDetail } from '../api/types'
import { Shell } from '../components/Shell'
import { FmtBadge, StatusBadge } from '../components/ui'
import { IconDownload, IconFit, IconMinus, IconMove, IconPlus, IconTrophyCup } from '../lib/icons'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.6

function TeamRow({ t }: { t: BracketSlot }) {
  if (t.tbd) {
    return (
      <div className="bm-team tbd">
        <span className="bm-seed">·</span>
        <span className="bm-av">?</span>
        <span className="bm-name">{t.name}</span>
        <span className="bm-score">—</span>
      </div>
    )
  }
  const played = t.score !== null && t.score !== undefined
  const cls = 'bm-team' + (t.win ? ' win' : played ? ' lose' : '')
  return (
    <div className={cls}>
      <span className="bm-seed">{t.seed ?? '·'}</span>
      <span className="bm-av" style={{ background: t.color ?? 'var(--muted)' }}>
        {t.code ?? '?'}
      </span>
      <span className="bm-name">{t.name}</span>
      <span className="bm-score">{played ? t.score : '—'}</span>
    </div>
  )
}

function MatchCard({ m, onScore }: { m: BracketMatch; onScore?: (m: BracketMatch) => void }) {
  const scorable =
    onScore !== undefined &&
    m.matchId !== undefined &&
    (m.status === 'scheduled' || m.status === 'live') &&
    !m.a.tbd &&
    !m.b.tbd
  let head
  if (m.status === 'live') {
    head = (
      <div className="bm-head live">
        <span>{m.id}</span>
        <span className="live-tag">
          <span className="live-dot" />
          LIVE
        </span>
      </div>
    )
  } else if (m.status === 'done') {
    head = (
      <div className="bm-head">
        <span>{m.id}</span>
        <span>FINAL</span>
      </div>
    )
  } else if (m.status === 'scheduled') {
    head = (
      <div className="bm-head">
        <span>{m.id}</span>
        <span>{m.time ?? 'À VENIR'}</span>
      </div>
    )
  } else {
    head = (
      <div className="bm-head">
        <span>{m.id}</span>
        <span>EN ATTENTE</span>
      </div>
    )
  }
  return (
    <div className="match">
      <div
        className={'bm' + (m.status === 'live' ? ' live' : '')}
        onClick={scorable ? () => onScore?.(m) : undefined}
        title={scorable ? 'Cliquer pour saisir le score' : undefined}
        style={scorable ? { cursor: 'pointer' } : undefined}
      >
        {head}
        <TeamRow t={m.a} />
        <TeamRow t={m.b} />
      </div>
    </div>
  )
}

function ScoreModal({
  match,
  onClose,
  onSubmit,
  error,
  busy,
}: {
  match: BracketMatch
  onClose: () => void
  onSubmit: (scoreA: number, scoreB: number) => void
  error: string | null
  busy: boolean
}) {
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(scoreA, scoreB)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.55)',
        display: 'grid', placeItems: 'center',
      }}
      onClick={onClose}
    >
      <form
        className="card card-pad"
        style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div>
          <div className="panel-title">Score — {match.id}</div>
          <p className="page-sub" style={{ marginTop: 4 }}>
            Le vainqueur est propagé automatiquement dans l'arbre.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <div className="field-group">
            <label className="field-label">{match.a.name}</label>
            <input
              className="input"
              type="number"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              autoFocus
            />
          </div>
          <span className="font-mono" style={{ paddingBottom: 9, color: 'var(--muted-foreground)' }}>—</span>
          <div className="field-group">
            <label className="field-label">{match.b.name}</label>
            <input
              className="input"
              type="number"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
            />
          </div>
        </div>
        {error && <p className="field-hint is-error" style={{ margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Envoi…' : 'Valider le score'}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Ce que chaque format implique concrètement, affiché sous le sélecteur. */
const FORMAT_AIDE: Record<string, string> = {
  single_elim: 'Une défaite élimine. Le tableau compte n\u00a0−\u00a01 matchs.',
  double_elim:
    'Une première défaite fait basculer dans le tableau des perdants, une seconde élimine. '
    + 'Deux fois plus de matchs, et une grande finale entre les deux tableaux. Minimum 4 participants.',
  round_robin:
    'Chacun rencontre tous les autres, réparti en journées. Le classement se fait aux victoires, '
    + 'sans élimination.',
  swiss: 'Les appariements dépendent du classement après chaque tour : génération tour par tour, pas encore disponible.',
}

export function BracketPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<BracketData | null>(null)
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [zoomPct, setZoomPct] = useState(100)
  const [hintGone, setHintGone] = useState(false)
  const [scoring, setScoring] = useState<BracketMatch | null>(null)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scoreBusy, setScoreBusy] = useState(false)
  const [genFormat, setGenFormat] = useState('single_elim')
  const [genError, setGenError] = useState<string | null>(null)
  const [genBusy, setGenBusy] = useState(false)

  // Mêmes statuts que la règle du backend (BracketService.generate) : au-delà,
  // la génération est refusée en 409. Tant que le tournoi n'est pas chargé, on
  // laisse le bouton disponible plutôt que de le griser à tort.
  const generationPossible =
    !tournament || ['draft', 'registration', 'check_in'].includes(tournament.status)

  async function generate() {
    setGenBusy(true)
    setGenError(null)
    try {
      const generated = await generateBracket(id, genFormat)
      setData(generated)
      fetchTournament(id).then(setTournament).catch(() => undefined)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setGenBusy(false)
    }
  }

  async function submitScore(scoreA: number, scoreB: number) {
    if (!scoring?.matchId) return
    setScoreBusy(true)
    setScoreError(null)
    try {
      const updated = await reportScore(scoring.matchId, scoreA, scoreB)
      setData(updated)
      setScoring(null)
      fetchTournament(id).then(setTournament).catch(() => undefined)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setScoreBusy(false)
    }
  }

  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const bracketRef = useRef<HTMLDivElement>(null)
  // Transformation appliquée en impératif pour rester fluide pendant le drag.
  const view = useRef({ scale: 1, tx: 40, ty: 20 })

  useEffect(() => {
    fetchBracket(id).then(setData).catch(() => setData(null))
    fetchTournament(id).then(setTournament).catch(() => setTournament(null))
  }, [id])

  useEffect(() => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    const bracket = bracketRef.current
    if (!viewport || !canvas || !bracket || !data) return

    const v = view.current

    function apply() {
      canvas!.style.transform = `translate(${v.tx}px,${v.ty}px) scale(${v.scale})`
      setZoomPct(Math.round(v.scale * 100))
    }

    function fit() {
      const vw = viewport!.clientWidth
      const vh = viewport!.clientHeight
      const cw = bracket!.scrollWidth + 120
      const ch = bracket!.scrollHeight + 120
      v.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(vw / cw, vh / ch)))
      v.tx = (vw - cw * v.scale) / 2 + 60 * v.scale
      v.ty = (vh - ch * v.scale) / 2 + 60 * v.scale
      apply()
    }

    function zoomAt(cx: number, cy: number, factor: number) {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale * factor))
      const k = next / v.scale
      v.tx = cx - (cx - v.tx) * k
      v.ty = cy - (cy - v.ty) * k
      v.scale = next
      apply()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = viewport!.getBoundingClientRect()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor)
      setHintGone(true)
    }

    let dragging = false
    let lastX = 0
    let lastY = 0
    const onPointerDown = (e: PointerEvent) => {
      // Capturer le pointeur au-dessus d'un contrôle le rendrait inerte : le
      // `click` serait délivré au viewport et non au bouton (voir bracketDrag).
      if (e.button !== 0 || !peutDemarrerUnGlissement(e.target)) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      viewport!.classList.add('grabbing')
      viewport!.setPointerCapture(e.pointerId)
      setHintGone(true)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      v.tx += e.clientX - lastX
      v.ty += e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      apply()
    }
    const endDrag = () => {
      dragging = false
      viewport!.classList.remove('grabbing')
    }

    let pinchDist = 0
    const touchDist = (e: TouchEvent) =>
      Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) pinchDist = touchDist(e)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      const d = touchDist(e)
      const rect = viewport!.getBoundingClientRect()
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
      if (pinchDist) zoomAt(mx, my, d / pinchDist)
      pinchDist = d
    }

    const onResize = () => apply()

    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('pointerdown', onPointerDown)
    viewport.addEventListener('pointermove', onPointerMove)
    viewport.addEventListener('pointerup', endDrag)
    viewport.addEventListener('pointercancel', endDrag)
    viewport.addEventListener('touchstart', onTouchStart, { passive: true })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('resize', onResize)

    const zoomHandlers = {
      in: () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.2),
      out: () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1 / 1.2),
      fit,
    }
    ;(viewport as HTMLDivElement & { __zoom?: typeof zoomHandlers }).__zoom = zoomHandlers

    const raf = requestAnimationFrame(fit)
    const hintTimer = setTimeout(() => setHintGone(true), 4000)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hintTimer)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointermove', onPointerMove)
      viewport.removeEventListener('pointerup', endDrag)
      viewport.removeEventListener('pointercancel', endDrag)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', onResize)
    }
  }, [data])

  function zoomAction(kind: 'in' | 'out' | 'fit') {
    const vp = viewportRef.current as
      | (HTMLDivElement & { __zoom?: Record<string, () => void> })
      | null
    vp?.__zoom?.[kind]?.()
  }

  return (
    <Shell
      className="bracket-page"
      breadcrumbs={[
        { label: 'Admin', to: '/' },
        { label: tournament?.name ?? 'Tournoi', to: `/tournois/${id}` },
        { label: 'Bracket' },
      ]}
    >
      <div className="bracket-head">
        <span className="title">Bracket</span>
        {tournament && <StatusBadge status={tournament.status} />}
        {tournament && <FmtBadge format={tournament.format} />}
        <div className="spacer" />
        <div className="tabs hide-sm" style={{ height: 34 }}>
          <button className="tab is-active">Principal</button>
          <button className="tab">Repêchage</button>
        </div>
        <button className="btn btn-outline btn-h9">
          <IconDownload />
          Exporter
        </button>
      </div>

      <main className="app-content">
        <div className="bracket-viewport" ref={viewportRef}>
          <div className={'hint' + (hintGone ? ' gone' : '')}>
            <IconMove width={14} height={14} />
            Glissez pour vous déplacer · molette pour zoomer
          </div>
          {data && data.rounds.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 4 }}>
              {/* data-no-drag : le viewport ne doit pas capturer le pointeur ici,
                  sinon les clics n'atteignent jamais le bouton. */}
              <div className="card card-pad" data-no-drag style={{ maxWidth: 440, textAlign: 'center' }}>
                <div className="panel-title" style={{ marginBottom: 6 }}>Pas encore de bracket</div>
                {!generationPossible ? (
                  // Le backend refuse de générer un tournoi démarré (409). Proposer
                  // le bouton quand même reviendrait à promettre une action qui ne
                  // peut qu'échouer — cas rencontré sur un tournoi « en cours »
                  // dont l'arbre n'avait jamais été généré.
                  <p className="page-sub">
                    Ce tournoi est déjà démarré : son arbre ne peut plus être généré.
                    La génération n'est possible qu'avant le lancement — en brouillon,
                    pendant les inscriptions ou le check-in.
                  </p>
                ) : (
                <>
                <p className="page-sub" style={{ marginBottom: 18 }}>
                  Choisis le format puis génère l'arbre. Place d'abord les seeds dans
                  l'onglet Participants si tu veux décider qui affronte qui.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <select
                    className="input"
                    style={{ width: 200 }}
                    value={genFormat}
                    onChange={(e) => setGenFormat(e.target.value)}
                  >
                    <option value="single_elim">Élimination simple</option>
                    <option value="double_elim">Élimination double</option>
                    <option value="round_robin">Round robin (toutes les rencontres)</option>
                    {/* Le suisse apparie selon le classement après chaque tour : il ne
                        peut pas être pré-généré comme un arbre. */}
                    <option value="swiss" disabled>Suisse (à venir)</option>
                  </select>
                  <button className="btn btn-primary" disabled={genBusy} onClick={generate}>
                    {genBusy ? 'Génération…' : 'Générer le bracket'}
                  </button>
                </div>
                <p className="field-hint" style={{ marginTop: 10 }}>
                  {FORMAT_AIDE[genFormat]}
                </p>
                {genError && <p className="field-hint is-error" style={{ marginTop: 12 }}>{genError}</p>}
                </>
                )}
              </div>
            </div>
          )}
          <div className="bracket-canvas" ref={canvasRef}>
            <div className="bracket" ref={bracketRef}>
              {data?.rounds.map((round, ri) => {
                const first = ri === 0 ? ' first' : ''
                const last = ri === data.rounds.length - 1 && !data.champion ? ' last' : ''
                return (
                  <div className="round" key={round.label}>
                    <div className="round-label">{round.label}</div>
                    <div className={'round-body' + first + last}>
                      {round.matches.map((m) => (
                        <MatchCard m={m} key={m.id} onScore={setScoring} />
                      ))}
                    </div>
                  </div>
                )
              })}
              {data && data.rounds.length > 0 && (
                <div className="round">
                  <div className="round-label">Champion</div>
                  <div className="round-body last first">
                    <div className="match">
                      <div className="champion">
                        <div className="cup">
                          <IconTrophyCup />
                        </div>
                        <div className="c-label">
                          {data.champion ? 'Champion' : 'À déterminer'}
                        </div>
                        <div className={'c-name' + (data.champion ? ' is-champion' : '')}>
                          {data.champion ?? (
                            <>
                              En attente
                              <br />
                              de la finale
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="zoom-bar">
            <button onClick={() => zoomAction('out')} aria-label="Dézoomer">
              <IconMinus />
            </button>
            <span className="z-val">{zoomPct}%</span>
            <button onClick={() => zoomAction('in')} aria-label="Zoomer">
              <IconPlus />
            </button>
            <div className="div" />
            <button onClick={() => zoomAction('fit')} aria-label="Ajuster" title="Ajuster à l'écran">
              <IconFit />
            </button>
          </div>
        </div>
      </main>

      {scoring && (
        <ScoreModal
          match={scoring}
          onClose={() => {
            setScoring(null)
            setScoreError(null)
          }}
          onSubmit={submitScore}
          error={scoreError}
          busy={scoreBusy}
        />
      )}
    </Shell>
  )
}
