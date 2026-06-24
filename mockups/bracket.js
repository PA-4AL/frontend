/* ============================================================
   PA Tournament — Rendu du bracket + zoom/pan
   ============================================================ */
initShell('bracket');

(function () {
  const data = window.BRACKET_DATA;
  const bracket = document.getElementById('bracket');

  function teamRow(t) {
    if (!t) return '';
    if (t.tbd) {
      return '<div class="bm-team tbd"><span class="bm-seed">·</span><span class="bm-av">?</span><span class="bm-name">' + t.name + '</span><span class="bm-score">—</span></div>';
    }
    const cls = 'bm-team' + (t.win ? ' win' : (t.score !== null && t.score !== undefined ? ' lose' : ''));
    const score = (t.score === null || t.score === undefined) ? '—' : t.score;
    return '<div class="' + cls + '">' +
      '<span class="bm-seed">' + (t.seed || '·') + '</span>' +
      '<span class="bm-av" style="background:' + (t.color || 'var(--muted)') + '">' + (t.code || '?') + '</span>' +
      '<span class="bm-name">' + t.name + '</span>' +
      '<span class="bm-score">' + score + '</span>' +
    '</div>';
  }

  function matchCard(m) {
    let head;
    if (m.status === 'live') {
      head = '<div class="bm-head" style="color:var(--pa-live-dark)"><span>' + m.id + '</span><span style="display:flex;align-items:center;gap:5px"><span class="dot live" style="width:7px;height:7px;border-radius:50%;background:var(--pa-live)"></span>LIVE</span></div>';
    } else if (m.status === 'done') {
      head = '<div class="bm-head"><span>' + m.id + '</span><span>FINAL</span></div>';
    } else if (m.status === 'scheduled') {
      head = '<div class="bm-head"><span>' + m.id + '</span><span>' + (m.time || 'À VENIR') + '</span></div>';
    } else {
      head = '<div class="bm-head"><span>' + m.id + '</span><span>EN ATTENTE</span></div>';
    }
    const liveCls = m.status === 'live' ? ' live' : '';
    return '<div class="match"><div class="bm' + liveCls + '">' + head + teamRow(m.a) + teamRow(m.b) + '</div></div>';
  }

  let html = '';
  data.rounds.forEach((round, ri) => {
    const first = ri === 0 ? ' first' : '';
    const last = ri === data.rounds.length - 1 && !data.champion ? ' last' : '';
    html += '<div class="round">' +
      '<div class="round-label">' + round.label + '</div>' +
      '<div class="round-body' + first + last + '">' +
        round.matches.map(matchCard).join('') +
      '</div>' +
    '</div>';
  });

  // Colonne champion
  html += '<div class="round"><div class="round-label">Champion</div><div class="round-body last first">' +
    '<div class="match"><div class="champion">' +
      '<div class="cup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg></div>' +
      '<div class="c-label">À déterminer</div>' +
      '<div class="c-name">En attente<br>de la finale</div>' +
    '</div></div>' +
  '</div></div>';

  bracket.innerHTML = html;

  /* ---------------- Zoom & Pan ---------------- */
  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('canvas');
  const zVal = document.getElementById('zVal');
  const hint = document.getElementById('hint');

  let scale = 1, tx = 40, ty = 20;
  const MIN = 0.4, MAX = 1.6;

  function apply() {
    canvas.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    zVal.textContent = Math.round(scale * 100) + '%';
  }

  function fit() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const cw = bracket.scrollWidth + 120, ch = bracket.scrollHeight + 120;
    scale = Math.min(MAX, Math.max(MIN, Math.min(vw / cw, vh / ch)));
    tx = (vw - cw * scale) / 2 + 60 * scale;
    ty = (vh - ch * scale) / 2 + 60 * scale;
    apply();
  }

  function zoomAt(cx, cy, factor) {
    const newScale = Math.min(MAX, Math.max(MIN, scale * factor));
    const k = newScale / scale;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    scale = newScale;
    apply();
  }

  document.getElementById('zIn').addEventListener('click', () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.2));
  document.getElementById('zOut').addEventListener('click', () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1 / 1.2));
  document.getElementById('zFit').addEventListener('click', fit);

  // Molette : zoom au curseur
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    dismissHint();
  }, { passive: false });

  // Drag pan (souris)
  let dragging = false, lastX = 0, lastY = 0;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.bm-team') || e.target.closest('.zoom-bar')) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    viewport.classList.add('grabbing');
    viewport.setPointerCapture(e.pointerId);
    dismissHint();
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    tx += e.clientX - lastX; ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  function endDrag(e) { dragging = false; viewport.classList.remove('grabbing'); }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Pinch (touch)
  let pinchDist = 0;
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) pinchDist = touchDist(e);
  }, { passive: true });
  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = touchDist(e);
      const rect = viewport.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      if (pinchDist) zoomAt(mx, my, d / pinchDist);
      pinchDist = d;
    }
  }, { passive: false });
  function touchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  let hintTimer = setTimeout(dismissHint, 4000);
  function dismissHint() { hint.classList.add('gone'); clearTimeout(hintTimer); }

  // Init
  requestAnimationFrame(fit);
  window.addEventListener('resize', () => { /* garder la position, juste reclamp si besoin */ apply(); });
})();
