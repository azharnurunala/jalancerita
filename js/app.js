/* ===========================================================================
   APP — boot, auth, routing, landing, dashboard
   =========================================================================== */
window.JC = window.JC || {};
(function () {
  const { icon, el, clear, num, pct, coverColors, initials, deadlineState, fmtDate } = JC.ui;

  const root = document.getElementById("app");
  let unsubList = null;   // dashboard listener
  let cachedProjects = [];

  /* -------------------------------------------------- routing -------- */
  function route() {
    const hash = location.hash.slice(1);
    if (!JC.store.user()) { if (JC.project) JC.project.cleanup(); renderLanding(); return; }
    const m = hash.match(/^\/novel\/(.+)$/);
    if (m) { JC.project.render(root, m[1], cachedProjects.find(p => p.id === m[1])); }
    else { if (JC.project) JC.project.cleanup(); renderDashboard(); }
  }
  function go(hash) { location.hash = hash; }
  JC.go = go;

  /* -------------------------------------------------- top bar -------- */
  function topbar() {
    const u = JC.store.user();
    const av = u && u.photoURL
      ? `<img class="avatar" src="${u.photoURL}" alt="" referrerpolicy="no-referrer">`
      : `<span class="avatar fallback">${initials(u ? u.name : "")}</span>`;
    const bar = el(`<header class="topbar"><div class="topbar-inner">
      <a class="brand" href="#/">
        <span class="brand-mark">${icon("feather")}</span>
        <span class="brand-name"><b>Jalan</b> Cerita</span>
      </a>
      <span class="brand-sub">— pantau perjalanan novelmu</span>
      <span class="topbar-spacer"></span>
      ${JC.store.mode === "local" ? `<span class="mode-badge" title="Firebase belum dikonfigurasi — data tersimpan di browser ini saja">Mode Lokal</span>` : ""}
      <button class="user-chip" data-menu>
        <span class="uname">${u ? u.name : ""}</span>${av}
      </button>
    </div></header>`);
    bar.querySelector("[data-menu]").onclick = userMenu;
    return bar;
  }

  function userMenu() {
    JC.ui.modal({
      title: JC.store.user().name,
      body: JC.store.user().email + (JC.store.mode === "local"
        ? " · Mode Lokal aktif. Hubungkan Firebase untuk sinkron antar perangkat (lihat PANDUAN.md)."
        : " · Tersinkron via Firebase."),
      confirmText: "Keluar", danger: true,
    }).then(v => { if (v !== null) JC.store.signOut(); });
  }

  /* -------------------------------------------------- landing -------- */
  function renderLanding() {
    if (unsubList) { unsubList(); unsubList = null; }
    clear(root);
    const view = el(`<div class="landing">
      <div class="landing-left">
        <div class="landing-brand"><span class="brand-mark">${icon("feather")}</span> Jalan Cerita</div>
        <div class="landing-hero">
          <h1>Dari ide pertama hingga <em>halaman terakhir</em>.</h1>
          <p>Semua rancangan dan progres ceritamu, dalam satu ruang kerja.</p>
          <div class="landing-feats">
            <span>${icon("pen")} Gambaran Cerita</span>
            <span>${icon("users")} Profil Karakter</span>
            <span>${icon("note")} Catatan riset</span>
            <span>${icon("target")} Target & Progres</span>
          </div>
          <div class="landing-cta">
            <button class="gbtn" data-signin>${icon("google")} Masuk dengan Google</button>
            <span class="hint">${JC.store.mode === "local"
              ? "Mode demo — datamu tersimpan di browser ini. Hubungkan Firebase untuk sinkron penuh."
              : "Datamu aman & tersinkron lewat akun Google."}</span>
          </div>
        </div>
        <div class="landing-foot"></div>
      </div>
      <div class="landing-right"><div class="landing-shelf"><div class="shelf-row">
        <div class="shelf-book b1"><h4>Senja di Batas Kota</h4><span>72.000 kata</span></div>
        <div class="shelf-book b2"><h4>Aksara yang Hilang</h4><span>54.000 kata</span></div>
        <div class="shelf-book b3"><h4>Musim Penghujan</h4><span>diary</span></div>
      </div></div></div>
    </div>`);
    view.querySelector("[data-signin]").onclick = (e) => {
      const b = e.currentTarget; b.disabled = true; b.style.opacity = ".6";
      JC.store.signIn().catch(() => { b.disabled = false; b.style.opacity = "1"; });
    };
    root.appendChild(view);
  }

  /* -------------------------------------------------- dashboard ------ */
  function renderDashboard() {
    clear(root);
    root.appendChild(topbar());
    const main = el(`<main><div class="wrap"></div></main>`);
    const wrap = main.querySelector(".wrap");
    root.appendChild(main);

    wrap.appendChild(el(`<div class="center-screen"><div class="spinner"></div></div>`));

    if (unsubList) unsubList();
    unsubList = JC.store.observeProjects(projects => {
      cachedProjects = projects;
      paintDashboard(wrap, projects);
    });
  }

  function paintDashboard(wrap, projects) {
    clear(wrap);

    // header
    const first = (JC.store.user().name || "").split(" ")[0];
    wrap.appendChild(el(`<div class="page-head">
      <div>
        <h1>Halo, ${first} 👋</h1>
        <div class="sub">${projects.length ? `${projects.length} novel dalam perjalanan` : "Mulai perjalanan menulismu"}</div>
      </div>
      <button class="btn btn-accent" data-new>${icon("plus")} Novel baru</button>
    </div>`));
    wrap.querySelector("[data-new]").onclick = newNovel;

    // stats
    if (projects.length) {
      const totalWords = projects.reduce((s, p) => s + (Number(p.currentWords) || 0), 0);
      const totalTarget = projects.reduce((s, p) => s + (Number(p.targetWords) || 0), 0);
      const withDl = projects.filter(p => JC.ui.daysLeft(p.deadline) !== null && JC.ui.daysLeft(p.deadline) >= 0)
                             .sort((a, b) => JC.ui.daysLeft(a.deadline) - JC.ui.daysLeft(b.deadline));
      const nextDl = withDl[0];
      wrap.appendChild(el(`<div class="stat-strip">
        <div class="stat"><div class="k">Total novel</div><div class="v">${projects.length}</div></div>
        <div class="stat"><div class="k">Total kata ditulis</div><div class="v">${num(totalWords)}</div></div>
        <div class="stat"><div class="k">Progres keseluruhan</div><div class="v">${pct(totalWords, totalTarget)}<small>%</small></div></div>
        <div class="stat"><div class="k">Deadline terdekat</div><div class="v" style="font-size:18px">${nextDl ? fmtDate(nextDl.deadline) : "—"}</div></div>
      </div>`));
    }

    // grid
    if (!projects.length) {
      const empty = el(`<div class="empty">
        <div class="ico">${icon("feather")}</div>
        <h3>Belum ada novel</h3>
        <p>Buat project pertamamu — beri judul, lalu lengkapi premis, karakter, dan beat sheet seiring jalan.</p>
        <button class="btn btn-accent" data-new2>${icon("plus")} Buat novel pertama</button>
      </div>`);
      empty.querySelector("[data-new2]").onclick = newNovel;
      wrap.appendChild(empty);
      return;
    }

    const grid = el(`<div class="grid"></div>`);
    projects.forEach(p => grid.appendChild(novelCard(p)));
    const add = el(`<button class="add-card"><span class="plus">${icon("plus")}</span><span>Novel baru</span></button>`);
    add.onclick = newNovel;
    grid.appendChild(add);
    wrap.appendChild(grid);
  }

  function novelCard(p) {
    const percent = pct(p.currentWords, p.targetWords);
    const done = percent >= 100;
    const dl = deadlineState(p.deadline);
    const sm = JC.statusMeta(p.status);
    const card = el(`<div class="novel-card">
      ${coverMarkup(p)}
      <div class="nc-body">
        <div class="nc-title">${escapeHtml(p.title)}</div>
        <div class="prog">
          <div class="prog-track"><div class="prog-fill ${done ? "done" : ""}" style="width:${percent}%"></div></div>
          <div class="prog-row"><span class="pct">${percent}%</span><span class="words">${num(p.currentWords)} / ${num(p.targetWords)}</span></div>
        </div>
        <div class="nc-meta">
          <span class="nc-status">${sm.emoji} ${sm.label}</span><span class="dot"></span>
          <span style="${dl.cls === "over" ? "color:var(--danger)" : dl.cls === "warn" ? "color:var(--warn)" : ""}">${dl.label}</span>
        </div>
      </div>
    </div>`);
    card.onclick = () => go(`/novel/${p.id}`);
    return card;
  }

  function coverMarkup(p) {
    if (p.coverImage) return `<div class="cover"><img src="${p.coverImage}" alt=""></div>`;
    const [c1, c2] = coverColors(p.id || p.title);
    return `<div class="cover"><div class="cover-gen" style="background:linear-gradient(155deg,${c1},${c2})">
      <div class="top">Jalan Cerita</div>
      <div><div class="rule"></div><div class="ttl">${escapeHtml(p.title)}</div></div>
    </div></div>`;
  }
  JC.coverMarkup = coverMarkup;

  function newNovel() {
    JC.ui.modal({
      title: "Novel baru",
      body: "Beri judul untuk memulai. Semua detail lain bisa dilengkapi setelahnya.",
      fields: [{ key: "title", label: "Judul novel", placeholder: "mis. Senja di Batas Kota" }],
      confirmText: "Buat novel",
    }).then(v => {
      if (!v) return;
      const title = (v.title || "").trim() || "Novel Tanpa Judul";
      JC.store.create({ title }).then(id => { JC.ui.toast("Novel dibuat"); go(`/novel/${id}`); });
    });
  }

  function escapeHtml(s) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  JC.escapeHtml = escapeHtml;

  /* -------------------------------------------------- boot ----------- */
  JC.store.onAuth(() => { route(); });
  window.addEventListener("hashchange", route);

  if (JC.store.mode === "firebase") {
    try { JC.store.init(); }
    catch (e) { console.error(e); JC.ui.toast("Konfigurasi Firebase bermasalah", "err"); }
  } else {
    JC.store.init();
  }
})();
