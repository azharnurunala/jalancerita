/* ===========================================================================
   SHARE — halaman publik (hanya-baca) untuk satu novel.
   Diakses lewat #/share/{ownerUid}/{projectId} tanpa perlu login.
   Cocok dibagikan ke editor & tim promosi.
   =========================================================================== */
window.JC = window.JC || {};
JC.share = (function () {
  const U = JC.ui;
  const { icon, el, clear, num, pct } = U;

  function render(rootEl, ownerUid, projectId) {
    clear(rootEl);
    rootEl.appendChild(el(`<div class="center-screen"><div class="spinner"></div></div>`));

    Promise.resolve(JC.store.getPublic(ownerUid, projectId))
      .then(p => {
        clear(rootEl);
        if (!p) { rootEl.appendChild(notAvailable()); return; }
        document.title = `${p.title} · Jalan Cerita`;
        rootEl.appendChild(paint(p));
      })
      .catch(() => { clear(rootEl); rootEl.appendChild(notAvailable()); });
  }

  function notAvailable() {
    return el(`<div class="share-wrap"><div class="empty" style="padding:90px 20px">
      <div class="ico">${icon("book")}</div>
      <h3>Halaman tidak tersedia</h3>
      <p>Tautan ini tidak aktif, atau pemiliknya menonaktifkan akses publik.</p>
      <a class="btn btn-primary" href="#/">Buka Jalan Cerita</a>
    </div></div>`);
  }

  function paint(p) {
    const percent = pct(p.currentWords, p.targetWords);
    const done = percent >= 100;
    const sm = JC.statusMeta(p.status);
    const ds = U.deadlineState(p.deadline);

    const view = el(`<div class="share-view">
      <header class="share-top">
        <div class="share-top-inner">
          <span class="brand"><span class="brand-mark">${icon("feather")}</span><span class="brand-name"><b>Jalan</b> Cerita</span></span>
          <span class="share-badge">${icon("user")} Tampilan publik · hanya-baca</span>
        </div>
      </header>
      <main class="share-wrap"></main>
    </div>`);
    const wrap = view.querySelector(".share-wrap");

    /* ---- hero ---- */
    const hero = el(`<section class="share-hero">
      <div class="share-cover">${JC.coverMarkup(p)}</div>
      <div class="share-head">
        <div class="share-status"><span class="ss-badge ${done ? "done" : ""}">${sm.emoji} ${sm.label}</span></div>
        <h1>${esc(p.title)}</h1>
        ${p.premise ? `<p class="share-premise">${esc(p.premise)}</p>` : ""}
      </div>
    </section>`);
    wrap.appendChild(hero);

    /* ---- stat strip: hanya Progres & Deadline ---- */
    const stats = el(`<section class="share-stats share-stats-2">
      <div class="sh-stat sh-prog">
        <div class="sh-k">Progres penulisan</div>
        <div class="sh-prog-row">
          <span class="sh-pct ${done ? "done" : ""}">${percent}<small>%</small></span>
          <span class="sh-words">${num(p.currentWords)} / ${num(p.targetWords)} kata</span>
        </div>
        <div class="prog-track"><div class="prog-fill ${done ? "done" : ""}" style="width:${percent}%"></div></div>
      </div>
      <div class="sh-stat">
        <div class="sh-k">Deadline</div>
        <div class="sh-v">${p.deadline ? U.fmtDate(p.deadline) : "—"}</div>
        <div class="sh-sub ${ds.cls === "over" ? "over" : ds.cls === "warn" ? "warn" : ""}">${ds.label}</div>
      </div>
    </section>`);
    wrap.appendChild(stats);

    /* ---- blurb ---- */
    if ((p.blurb || "").trim()) {
      wrap.appendChild(el(`<section class="share-block share-blurb">
        <h2>Blurb Kover Belakang</h2>
        <div class="blurb-card"><p class="share-prose">${esc(p.blurb)}</p></div>
      </section>`));
    }

    /* ---- footer ---- */
    wrap.appendChild(el(`<footer class="share-foot">
      <span>Dibagikan via <b>Jalan Cerita</b></span>
      ${p.updatedAt ? `<span class="dot"></span><span>Diperbarui ${U.fmtDate((p.updatedAt || "").slice(0,10))}</span>` : ""}
    </footer>`));

    return view;
  }

  function block(title, innerHtml) {
    return el(`<section class="share-block"><h2>${title}</h2>${innerHtml}</section>`);
  }

  function beatBlock(p) {
    const sec = el(`<section class="share-block"><h2>Struktur cerita · Save the Cat!</h2><div class="share-beats"></div></section>`);
    const host = sec.querySelector(".share-beats");
    let curAct = 0, actWrap = null;
    JC.BEATS.forEach(b => {
      if (b.act !== curAct) {
        curAct = b.act;
        actWrap = el(`<div class="sb-act"><div class="sb-act-h">${JC.ACTS[curAct]}</div><div class="sb-dots"></div></div>`);
        host.appendChild(actWrap);
      }
      const filled = !!(p.beats && p.beats[b.key] && String(p.beats[b.key]).trim());
      actWrap.querySelector(".sb-dots").appendChild(
        el(`<span class="sb-dot ${filled ? "on" : ""}" title="${esc(b.name)}${filled ? " · terisi" : ""}"><i>${b.no}</i></span>`)
      );
    });
    return sec;
  }

  function esc(s) { return JC.escapeHtml(s == null ? "" : String(s)); }

  return { render };
})();
