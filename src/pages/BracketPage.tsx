import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  exportTournament,
  fetchBracket,
  fetchJob,
  fetchTournament,
  generateBracket,
  reportScore,
  startMatch,
  swapBracketSlots,
} from '../api/tournaments'
import { useAnnoncesEnDirect } from '../components/Annonces'
import { peutDemarrerUnGlissement } from './bracketDrag'
import { estReorganisable, memeEmplacement, prochaineAction, type Emplacement } from './bracketSwap'
import { aideFormat, libelleFormat } from '../lib/formats'
import { base64EnOctets, jobTermine, nomDeFichier } from '../lib/telechargement'
import type { BracketData, BracketMatch, BracketSlot, TournamentDetail } from '../api/types'
import { Shell } from '../components/Shell'
import { FmtBadge, StatusBadge } from '../components/ui'
import { IconDownload, IconFit, IconMinus, IconMove, IconPlus, IconTrophyCup } from '../lib/icons'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.6

/**
 * @param onPick clic en mode réorganisation ; absent hors de ce mode
 * @param selected cet emplacement est celui qu'on est en train de déplacer
 */
function TeamRow({
  t,
  onPick,
  selected,
}: {
  t: BracketSlot
  onPick?: () => void
  selected?: boolean
}) {
  // En réorganisation, la ligne devient cliquable ; le titre explique le geste,
  // qui n'est pas devinable.
  const interactif = onPick
    ? {
        onClick: onPick,
        style: { cursor: 'pointer', outline: selected ? '2px solid var(--pa-primary, #1437D9)' : undefined },
        title: selected ? 'Cliquer pour annuler' : 'Cliquer pour déplacer cette équipe',
      }
    : {}

  if (t.tbd) {
    return (
      <div className="bm-team tbd" {...interactif}>
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
    <div className={cls} {...interactif}>
      <span className="bm-seed">{t.seed ?? '·'}</span>
      <span className="bm-av" style={{ background: t.color ?? 'var(--muted)' }}>
        {t.code ?? '?'}
      </span>
      <span className="bm-name">{t.name}</span>
      <span className="bm-score">{played ? t.score : '—'}</span>
    </div>
  )
}

function MatchCard({
  m,
  onScore,
  onStart,
  reorganisation,
  selection,
  onPick,
}: {
  m: BracketMatch
  onScore?: (m: BracketMatch) => void
  /** Démarre le match — absent si le lecteur n'organise pas ce tournoi. */
  onStart?: (m: BracketMatch) => void
  /** Mode réorganisation actif : les clics déplacent, ils ne saisissent plus. */
  reorganisation?: boolean
  selection?: Emplacement | null
  onPick?: (emplacement: Emplacement, vide: boolean) => void
}) {
  const deplacable = reorganisation === true && estReorganisable(m)
  // Démarrable : les deux équipes sont connues, le match n'a pas commencé et n'est
  // pas joué. C'est ce qui déclenche l'annonce « Début du match ».
  const demarrable =
    !reorganisation &&
    onStart !== undefined &&
    m.matchId !== undefined &&
    m.status === 'scheduled' &&
    !m.a.tbd &&
    !m.b.tbd
  const scorable =
    !reorganisation &&
    onScore !== undefined &&
    m.matchId !== undefined &&
    (m.status === 'scheduled' || m.status === 'live') &&
    !m.a.tbd &&
    !m.b.tbd

  const pick = (slot: 1 | 2, vide: boolean) =>
    deplacable && m.matchId !== undefined
      ? () => onPick?.({ matchId: m.matchId as string, slot }, vide)
      : undefined
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
        <TeamRow
          t={m.a}
          onPick={pick(1, m.a.tbd === true)}
          selected={memeEmplacement(selection ?? null, { matchId: m.matchId ?? '', slot: 1 })}
        />
        <TeamRow
          t={m.b}
          onPick={pick(2, m.b.tbd === true)}
          selected={memeEmplacement(selection ?? null, { matchId: m.matchId ?? '', slot: 2 })}
        />
        {demarrable && (
          <button
            className="btn btn-outline btn-h8"
            data-no-drag
            style={{ width: '100%', borderRadius: 0 }}
            // Arrête la propagation : sans cela, le clic ouvrirait aussi la saisie
            // de score, qui est posée sur la carte entière.
            onClick={(e) => {
              e.stopPropagation()
              onStart?.(m)
            }}
          >
            Lancer le match
          </button>
        )}
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

export function BracketPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<BracketData | null>(null)
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [zoomPct, setZoomPct] = useState(100)
  const [hintGone, setHintGone] = useState(false)
  const [scoring, setScoring] = useState<BracketMatch | null>(null)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scoreBusy, setScoreBusy] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genBusy, setGenBusy] = useState(false)
  const [reorganisation, setReorganisation] = useState(false)
  const [selection, setSelection] = useState<Emplacement | null>(null)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [exportEtat, setExportEtat] = useState<string | null>(null)
  const [exportErreur, setExportErreur] = useState<string | null>(null)
  const [derniereAnnonce, setDerniereAnnonce] = useState<string | null>(null)

  /**
   * Réorganisation en deux clics : sélectionner une équipe, puis sa destination.
   * La décision est prise par `prochaineAction`, testée à part ; ici il ne reste
   * que l'appel réseau et l'état.
   */
  async function choisirEmplacement(cible: Emplacement, vide: boolean) {
    const action = prochaineAction(selection, cible, vide)
    setSwapError(null)
    if (action.type === 'rien') return
    if (action.type === 'annuler') return setSelection(null)
    if (action.type === 'selectionner') return setSelection(action.emplacement)

    // Optimisme volontairement absent : l'échange peut être refusé par le
    // backend (match joué, doublon), et un arbre affiché faux serait pire
    // qu'un instant d'attente.
    setSelection(null)
    try {
      setData(await swapBracketSlots(id, action.de, action.vers))
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Échange impossible.')
    }
  }

  /**
   * Export .xlsx : le backend rend un job, le worker Rust produit le fichier, et
   * on interroge le job jusqu'à ce qu'il aboutisse.
   *
   * L'attente est bornée : sans plafond, un worker en panne laisserait le bouton
   * tourner indéfiniment sans jamais rien dire à l'utilisateur.
   */
  // Le direct sert deux choses : afficher l'annonce, et rafraîchir l'arbre — un
  // score saisi par un autre organisateur doit apparaître sans rechargement.
  useAnnoncesEnDirect(id, (a) => {
    setDerniereAnnonce(a.message)
    fetchBracket(id).then(setData).catch(() => undefined)
  })

  /**
   * Démarre un match : il passe en direct et l'annonce part.
   *
   * L'arbre est remplacé par la réponse du serveur, qui porte déjà le nouveau
   * statut — pas de mise à jour optimiste, un match affiché en direct alors que
   * l'appel a échoué serait un mensonge.
   */
  async function demarrer(m: BracketMatch) {
    if (!m.matchId) return
    setScoreError(null)
    try {
      setData(await startMatch(m.matchId))
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Impossible de lancer ce match.')
    }
  }

  async function exporter() {
    setExportErreur(null)
    setExportEtat('Export…')
    try {
      let job = await exportTournament(id)
      for (let essai = 0; essai < 40 && !jobTermine(job.status); essai++) {
        await new Promise((r) => setTimeout(r, 1500))
        job = await fetchJob(job.id)
      }
      if (job.status === 'failed') throw new Error(job.error ?? 'Le traitement a échoué.')
      if (!jobTermine(job.status)) {
        throw new Error("L'export prend un temps inhabituel. Réessaie dans un instant.")
      }
      const base64 = job.result?.file_base64
      if (!base64) throw new Error("Le traitement s'est terminé sans produire de fichier.")

      const url = URL.createObjectURL(
        new Blob([base64EnOctets(base64) as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      )
      const lien = document.createElement('a')
      lien.href = url
      lien.download = job.result?.filename ?? nomDeFichier(tournament?.name ?? 'tournoi')
      lien.click()
      // Sans révocation, le blob resterait en mémoire jusqu'au rechargement.
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportErreur(err instanceof Error ? err.message : 'Export impossible.')
    } finally {
      setExportEtat(null)
    }
  }

  async function generate() {
    setGenBusy(true)
    setGenError(null)
    try {
      // Aucun format transmis : le backend applique celui de la phase,
      // défini à la création du tournoi.
      const generated = await generateBracket(id)
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
        { label: 'Accueil', to: '/' },
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
        {data && data.rounds.length > 0 && (
          <button
            className={'btn btn-h9 ' + (reorganisation ? 'btn-primary' : 'btn-outline')}
            onClick={() => {
              setReorganisation((actif) => !actif)
              setSelection(null)
              setSwapError(null)
            }}
            title="Déplacer les équipes dans l'arbre"
          >
            {reorganisation ? 'Terminer' : 'Réorganiser'}
          </button>
        )}
        <button className="btn btn-outline btn-h9" disabled={exportEtat !== null} onClick={exporter}>
          <IconDownload />
          {exportEtat ?? 'Exporter'}
        </button>
      </div>

      {derniereAnnonce && (
        <div className="card card-pad" data-no-drag style={{ margin: '0 0 12px' }}>
          <strong>En direct</strong> — {derniereAnnonce}
        </div>
      )}

      {exportErreur && (
        <div className="card card-pad" data-no-drag style={{ margin: '0 0 12px' }}>
          <p className="field-hint is-error" style={{ margin: 0 }}>{exportErreur}</p>
        </div>
      )}

      {reorganisation && (
        <div className="card card-pad" data-no-drag style={{ margin: '0 0 12px' }}>
          <strong>Réorganisation</strong> — clique une équipe, puis l'emplacement où la
          poser. Les deux équipes échangent leurs places ; poser sur un emplacement libre
          déplace simplement. Les matchs déjà joués ne sont pas modifiables.
          {selection && <span> · Équipe sélectionnée, choisis sa destination.</span>}
          {swapError && <p className="field-hint is-error" style={{ marginTop: 8 }}>{swapError}</p>}
        </div>
      )}

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
                <p className="page-sub" style={{ marginBottom: 18 }}>
                  Format du tournoi : <strong>{libelleFormat(tournament?.format)}</strong>,
                  choisi à la création. Place d'abord les seeds dans l'onglet Participants
                  si tu veux décider qui affronte qui.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-primary" disabled={genBusy} onClick={generate}>
                    {genBusy ? 'Génération…' : 'Générer le bracket'}
                  </button>
                </div>
                <p className="field-hint" style={{ marginTop: 10 }}>
                  {aideFormat(tournament?.format)}
                </p>
                {genError && <p className="field-hint is-error" style={{ marginTop: 12 }}>{genError}</p>}
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
                        <MatchCard
                          m={m}
                          key={m.id}
                          onScore={setScoring}
                          // Réservé à l'organisateur du tournoi : afficher un
                          // bouton qui échoue en 403 au clic serait pire que ne
                          // pas l'afficher.
                          onStart={tournament?.viewerIsOrganizer ? demarrer : undefined}
                          reorganisation={reorganisation}
                          selection={selection}
                          onPick={choisirEmplacement}
                        />
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
