/* ============================================================
   PA Tournament — Shell partagé (sidebar + thème + collapse)
   Usage : <script src="shell.js"></script><script>initShell('dashboard')</script>
   ============================================================ */
(function () {
  const NAV = [
    { key: 'dashboard',    href: 'Tableau de bord.html', label: 'Tableau de bord', icon: '<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>' },
    { key: 'tournaments',  href: 'Détail tournoi.html',  label: 'Tournois',        icon: '<path d="M6 9V3h12v6"></path><path d="M6 9a6 6 0 0 0 12 0"></path><path d="M9 21h6"></path><path d="M12 15v6"></path>' },
    { key: 'participants', href: 'Participants.html',     label: 'Participants',     icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
    { key: 'validations',  href: '#',                     label: 'Validations',      badge: '7', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' },
    { key: 'bracket',      href: 'Bracket.html',          label: 'Brackets',         icon: '<path d="M3 3v6h6"></path><path d="M3 12h6a3 3 0 0 1 3 3v3"></path><path d="M3 21h6"></path><path d="M21 6h-6a3 3 0 0 0-3 3"></path><path d="M21 12h-6"></path>' },
    { section: 'Système' },
    { key: 'components',   href: 'Bibliothèque de composants.html', label: 'Composants', icon: '<path d="M12 2 2 7l10 5 10-5-10-5z"></path><path d="m2 17 10 5 10-5"></path><path d="m2 12 10 5 10-5"></path>' },
    { key: 'settings',     href: '#',                     label: 'Paramètres',       icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' },
  ];

  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  function buildSidebar(active) {
    let items = '';
    for (const n of NAV) {
      if (n.section) { items += '<div class="sidebar-section">' + n.section + '</div>'; continue; }
      const cls = 'nav-item' + (n.key === active ? ' is-active' : '');
      const badge = n.badge ? '<span class="nav-badge">' + n.badge + '</span>' : '';
      items += '<a class="' + cls + '" href="' + n.href + '">' + svg(n.icon) + '<span class="label">' + n.label + '</span>' + badge + '</a>';
    }
    return '' +
      '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-logo"><div class="mark">PA</div><div class="word">TOURNAMENT</div></div>' +
        '<button class="sidebar-toggle" id="sidebarToggle" aria-label="Replier la sidebar">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
        '</button>' +
        '<nav class="sidebar-nav">' + items + '</nav>' +
        '<div class="sidebar-foot"><a class="nav-item" href="#"><span class="avatar avatar-sm" style="background:var(--pa-accent)">LM</span><span class="label">Léa Moreau</span></a></div>' +
      '</aside>';
  }

  window.initShell = function (active) {
    // Injecter la sidebar
    const slot = document.getElementById('shell-sidebar');
    if (slot) slot.outerHTML = buildSidebar(active);

    // Collapse
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (toggle && sidebar) {
      const saved = localStorage.getItem('pa-sidebar-collapsed') === '1';
      if (saved) sidebar.classList.add('collapsed');
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('pa-sidebar-collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
      });
    }

    // Menu mobile : ouvre/ferme la sidebar en overlay
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && sidebar) {
      mobileMenu.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
    }

    // Thème — partagé via localStorage
    const stored = localStorage.getItem('pa-theme');
    if (stored === 'light') document.body.classList.remove('dark');
    else if (stored === 'dark') document.body.classList.add('dark');
    syncThemeIcons();

    const tBtn = document.getElementById('themeToggle');
    if (tBtn) tBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('pa-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      syncThemeIcons();
    });
  };

  function syncThemeIcons() {
    const dark = document.body.classList.contains('dark');
    const m = document.getElementById('iconMoon');
    const s = document.getElementById('iconSun');
    if (m) m.classList.toggle('hidden', dark);
    if (s) s.classList.toggle('hidden', !dark);
  }
})();
