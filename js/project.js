/* ===========================================================================
   PROJECT — halaman detail novel (editor lengkap, autosave)
   =========================================================================== */
window.JC = window.JC || {};
JC.project = (function () {
  const U = JC.ui;
  const { icon, el, clear, num, pct } = U;

  let _unsub = null;
  let model = null, id = null, built = false;
  let _pendingTab = null;
  let pending = {}, flush = null;
  let activeTab = "ikhtisar";
  let savedFlag = null;

  function cleanup() {
    if (flush) flush.flush();
    if (Object.keys(pending).length && id) { JC.store.update(id, pending); pending = {}; }
    if (_unsub) { _unsub(); _unsub = null; }
    built = false; activeTab = "ikhtisar";
  }

  /* ---- autosave plumbing ---- */
  function showSaving() { if (!savedFlag) return; savedFlag.innerHTML = `<span class="spinner" style="width:12px;height:12px;border-width:2px"></span> Menyimpan…`; savedFlag.style.opacity = "1"; }
  function showSaved()  { if (!savedFlag) return; savedFlag.innerHTML = `${icon("check")} Tersimpan`; setTimeout(() => { if (savedFlag) savedFlag.style.opacity = "0"; }, 1600); }
  function commit(patch) {
    Object.assign(model, patch);
    Object.assign(pending, patch);
    showSaving();
    flush();
  }
  function doFlush() {
    if (!Object.keys(pending).length) { showSaved(); return; }
    const p = pending; pending = {};
    if (JC.search) JC.search.invalidate();
    Promise.resolve(JC.store.update(id, p)).then(showSaved)
      .catch(() => { if (savedFlag) savedFlag.innerHTML = `Gagal menyimpan`; });
  }

  /* =======================================================================
     render
     ======================================================================= */
  function render(rootEl, projectId, cached) {
    cleanup();
    id = projectId; built = false; pending = {}; activeTab = _pendingTab || "ikhtisar"; _pendingTab = null;
    flush = U.debounce(doFlush, 650);

    clear(rootEl);
    rootEl.appendChild(buildTopbarSlot());
    const main = el(`<main><div class="wrap"></div></main>`);
    rootEl.appendChild(main);
    const wrap = main.querySelector(".wrap");

    if (cached) { model = JSON.parse(JSON.stringify(cached)); built = true; paint(wrap); }
    else wrap.appendChild(el(`<div class="center-screen"><div class="spinner"></div></div>`));

    _unsub = JC.store.observeProject(projectId, data => {
      if (built) return;                 // satu kali bangun; hindari rebuild saat mengetik
      if (!data) { wrap.innerHTML = `<div class="empty"><div class="ico">${icon("book")}</div><h3>Novel tidak ditemukan</h3><p>Mungkin sudah dihapus.</p><a class="btn btn-primary" href="#/">Kembali ke beranda</a></div>`; return; }
      model = JSON.parse(JSON.stringify(data)); built = true; paint(wrap);
    });
  }

  function buildTopbarSlot() {
    // reuse the app topbar by re-triggering route topbar — simplest: build minimal here
    const u = JC.store.user();
    const av = u && u.photoURL ? `<img class="avatar" src="${u.photoURL}" referrerpolicy="no-referrer" alt="">`
                               : `<span class="avatar fallback">${U.initials(u ? u.name : "")}</span>`;
    const bar = el(`<header class="topbar"><div class="topbar-inner">
      <a class="brand" href="#/"><span class="brand-mark">${icon("feather")}</span><span class="brand-name"><b>Jalan</b> Cerita</span></a>
      <span class="topbar-spacer"></span>
      <span class="save-flag" data-saveflag></span>
      ${JC.store.mode === "local" ? `<span class="mode-badge">Mode Lokal</span>` : ""}
      <button class="icon-btn topbar-search" data-search title="Cari (tekan /)">${icon("search")}<span>Cari</span></button>
      <button class="user-chip" data-home><span class="uname">${u ? u.name : ""}</span>${av}</button>
    </div></header>`);
    bar.querySelector("[data-home]").onclick = () => JC.go("/");
    const sb = bar.querySelector("[data-search]"); if (sb) sb.onclick = () => JC.search.open();
    return bar;
  }

  /* =======================================================================
     paint — full layout
     ======================================================================= */
  function paint(wrap) {
    clear(wrap);
    savedFlag = document.querySelector("[data-saveflag]");

    wrap.appendChild((function () {
      const b = el(`<a class="proj-back" href="#/">${icon("arrowLeft")} Semua Novel</a>`);
      return b;
    })());

    const layout = el(`<div class="proj-layout"></div>`);
    layout.appendChild(buildRail());
    layout.appendChild(buildMain());
    wrap.appendChild(layout);
  }

  /* ----------------------------------------- RAIL ---------- */
  function buildRail() {
    const rail = el(`<aside class="proj-rail"></aside>`);

    // cover
    const cover = el(`<div class="cover-edit">
      ${JC.coverMarkup(model)}
      <div class="cover-overlay">${icon("camera")} Ganti kover</div>
      <input type="file" accept="image/*" hidden>
    </div>`);
    const fileInput = cover.querySelector("input");
    cover.querySelector(".cover").onclick = () => fileInput.click();
    cover.querySelector(".cover-overlay").onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const f = fileInput.files[0]; if (!f) return;
      U.resizeImage(f, 760).then(dataUrl => {
        commit({ coverImage: dataUrl });
        const holder = cover.querySelector(".cover");
        holder.outerHTML = `<div class="cover"><img src="${dataUrl}" alt=""></div>`;
        cover.querySelector(".cover").onclick = () => fileInput.click();
        U.toast("Kover diperbarui");
      }).catch(() => U.toast("Gagal memuat gambar", "err"));
    };
    rail.appendChild(cover);

    // progress card
    const percent = pct(model.currentWords, model.targetWords);
    const done = percent >= 100;
    const prog = el(`<div class="rail-card bigprog">
      <h4>Progres Kata</h4>
      <div class="pct-big ${done ? "done" : ""}" data-pctbig>${percent}<span style="font-size:18px">%</span></div>
      <div class="words-big" data-wordsbig>${num(model.currentWords)} dari ${num(model.targetWords)} kata</div>
      <div class="prog-track"><div class="prog-fill ${done ? "done" : ""}" data-fill style="width:${percent}%"></div></div>
      <div class="wordedit">
        <label>Kata Saat Ini</label>
        <input class="inp inp-sm" type="number" min="0" data-cur value="${Number(model.currentWords) || 0}">
      </div>
      <div class="wordedit">
        <label>Target Kata</label>
        <input class="inp inp-sm" type="number" min="0" step="1000" data-tgt value="${Number(model.targetWords) || 0}">
      </div>
    </div>`);
    const refreshProg = () => {
      const pc = pct(model.currentWords, model.targetWords); const d = pc >= 100;
      prog.querySelector("[data-pctbig]").innerHTML = `${pc}<span style="font-size:18px">%</span>`;
      prog.querySelector("[data-pctbig]").className = `pct-big ${d ? "done" : ""}`;
      prog.querySelector("[data-wordsbig]").textContent = `${num(model.currentWords)} dari ${num(model.targetWords)} kata`;
      const fill = prog.querySelector("[data-fill]"); fill.style.width = pc + "%"; fill.className = `prog-fill ${d ? "done" : ""}`;
    };
    prog.querySelector("[data-cur]").addEventListener("input", e => { commit({ currentWords: Math.max(0, parseInt(e.target.value) || 0) }); refreshProg(); });
    prog.querySelector("[data-tgt]").addEventListener("input", e => { commit({ targetWords: Math.max(0, parseInt(e.target.value) || 0) }); refreshProg(); });
    rail.appendChild(prog);

    // detail card
    const ds = U.deadlineState(model.deadline);
    const detail = el(`<div class="rail-card">
      <h4>Detail</h4>
      <div class="meta-row">
        <span class="lbl">${icon("calendar")} Deadline</span>
        <span class="deadline-pill ${ds.cls}" data-dlpill>${ds.label}</span>
      </div>
      <input class="inp inp-sm" type="date" data-deadline value="${model.deadline || ""}" style="margin:4px 0 10px">
      <div class="meta-row" style="border-top:1px solid var(--line);padding-top:12px">
        <span class="lbl">${icon("sparkle")} Status</span>
      </div>
      <select class="inp inp-sm" data-status style="margin-top:4px">
        ${JC.STATUS.map(s => `<option value="${s.key}">${s.emoji} ${s.label}</option>`).join("")}
      </select>
    </div>`);
    detail.querySelector("[data-deadline]").addEventListener("input", e => {
      commit({ deadline: e.target.value });
      const s = U.deadlineState(e.target.value);
      const pill = detail.querySelector("[data-dlpill]"); pill.className = `deadline-pill ${s.cls}`; pill.textContent = s.label;
    });
    const sel = detail.querySelector("[data-status]"); sel.value = JC.statusMeta(model.status).key;
    sel.addEventListener("change", e => commit({ status: e.target.value }));
    rail.appendChild(detail);

    // manuscript (Google Docs) card
    rail.appendChild(buildDocsCard());

    // sales card
    rail.appendChild(buildSalesCard());

    // share card
    rail.appendChild(buildShareCard());

    // delete
    const del = el(`<button class="btn btn-danger-ghost btn-block btn-sm">${icon("trash")} Hapus Novel</button>`);
    del.onclick = () => {
      U.confirmDialog("Hapus novel ini?", `“${model.title}” akan dihapus permanen beserta seluruh catatannya.`, "Hapus Permanen")
        .then(ok => { if (ok) { JC.store.remove(id).then(() => { U.toast("Novel dihapus"); JC.go("/"); }); } });
    };
    rail.appendChild(del);

    return rail;
  }

  /* ----------------------------------------- NASKAH (Google Docs) --------- */
  function normalizeUrl(v) {
    v = (v || "").trim();
    if (!v) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    return v;
  }
  // Ubah URL Google Docs menjadi versi /preview yang bisa ditanam di iframe.
  function docsPreviewUrl(v) {
    v = normalizeUrl(v);
    const m = v.match(/\/document\/d\/([^/]+)/);
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
    // Dokumen Google lain (sheet/slide) — coba ganti /edit → /preview
    if (/docs\.google\.com|drive\.google\.com/.test(v)) return v.replace(/\/(edit|view)(\?.*)?$/, "/preview");
    return v;
  }
  function openDocsModal() {
    const editUrl = normalizeUrl(model.docsUrl);
    const prevUrl = docsPreviewUrl(model.docsUrl);
    const embeddable = /docs\.google\.com|drive\.google\.com/.test(prevUrl);
    const back = el(`<div class="docs-modal-back">
      <div class="docs-modal" role="dialog" aria-modal="true">
        <div class="docs-modal-head">
          <div class="dm-title">${icon("doc")} <span>Pratinjau Naskah</span></div>
          <div class="dm-actions">
            <a class="btn btn-accent btn-sm" data-cont href="${attr(editUrl)}" target="_blank" rel="noopener">${icon("external")} Lanjutkan Cerita</a>
            <button class="btn btn-icon btn-sm btn-soft" data-close title="Tutup">${icon("x")}</button>
          </div>
        </div>
        <div class="docs-modal-body">
          ${embeddable
            ? `<iframe class="docs-frame" src="${attr(prevUrl)}" referrerpolicy="no-referrer"></iframe>`
            : `<div class="docs-noembed">
                 <div class="ico">${icon("doc")}</div>
                 <p>Tautan ini tidak bisa dipratinjau di sini.</p>
                 <a class="btn btn-accent btn-sm" href="${attr(editUrl)}" target="_blank" rel="noopener">${icon("external")} Buka di Tab Baru</a>
               </div>`}
        </div>
        <div class="docs-modal-foot">Pratinjau hanya-baca · klik <b>Lanjutkan Cerita</b> untuk menulis di tab penuh.</div>
      </div>
    </div>`);
    const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    back.addEventListener("click", e => { if (e.target === back) close(); });
    back.querySelector("[data-close]").onclick = close;
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
  }
  function buildDocsCard() {
    const has = !!(model.docsUrl || "").trim();
    const card = el(`<div class="rail-card docs-rail">
      <h4>${icon("doc")} Naskah</h4>
      <p class="docs-note">Tautkan dokumen Google Docs naskahmu agar bisa langsung dibuka dari sini.</p>
      <button class="docs-open ${has ? "" : "is-empty"}" type="button" data-open>
        ${icon("external")} <span>Buka Naskah</span>
      </button>
      <div class="docs-link-row">
        <input class="inp inp-sm" data-docs type="url" inputmode="url" placeholder="Tempel tautan Google Docs…" value="${attr(model.docsUrl)}">
      </div>
    </div>`);
    const input = card.querySelector("[data-docs]");
    const openBtn = card.querySelector("[data-open]");
    const sync = () => { openBtn.classList.toggle("is-empty", !input.value.trim()); };
    input.addEventListener("input", e => { commit({ docsUrl: e.target.value.trim() }); sync(); });
    openBtn.addEventListener("click", () => {
      if (!input.value.trim()) { input.focus(); return; }
      openDocsModal();
    });
    return card;
  }

  /* ----------------------------------------- SHARE --------- */
  function shareUrl() {
    const u = JC.store.user();
    const uid = u ? u.uid : "";
    return `${location.origin}${location.pathname}#/share/${encodeURIComponent(uid)}/${encodeURIComponent(id)}`;
  }
  function buildShareCard() {
    const card = el(`<div class="rail-card share-rail">
      <h4>${icon("share")} Bagikan</h4>
      <label class="share-toggle">
        <input type="checkbox" data-share ${model.shared ? "checked" : ""}>
        <span class="st-track"><span class="st-knob"></span></span>
        <span class="st-txt">Halaman Publik</span>
      </label>
      <div class="share-body" data-body style="${model.shared ? "" : "display:none"}">
        <p class="share-note">Siapa pun dengan tautan bisa melihat progres novel ini — <b>hanya-baca</b>. Cocok untuk editor &amp; tim promosi.</p>
        <div class="share-link-row">
          <input class="inp inp-sm" data-link readonly value="${attr(shareUrl())}">
          <button class="btn btn-icon btn-sm btn-soft" data-copy title="Salin tautan">${icon("copy")}</button>
        </div>
        <a class="share-open" data-open href="${attr(shareUrl())}" target="_blank" rel="noopener">${icon("external")} Buka Pratinjau Publik</a>
      </div>
    </div>`);
    const body = card.querySelector("[data-body]");
    const linkI = card.querySelector("[data-link]");
    const openA = card.querySelector("[data-open]");
    const sync = () => { const url = shareUrl(); linkI.value = url; openA.href = url; };
    card.querySelector("[data-share]").addEventListener("change", e => {
      const on = e.target.checked;
      const patch = { shared: on };
      if (on && !model.ownerName) patch.ownerName = (JC.store.user() && JC.store.user().name) || "";
      commit(patch);
      body.style.display = on ? "" : "none";
      if (on) { sync(); U.toast("Halaman publik aktif"); } else { U.toast("Akses publik dimatikan"); }
    });
    card.querySelector("[data-copy]").onclick = () => {
      sync();
      const done = () => U.toast("Tautan disalin");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(linkI.value).then(done).catch(() => { linkI.select(); document.execCommand("copy"); done(); });
      } else { linkI.select(); document.execCommand("copy"); done(); }
    };
    sync();
    return card;
  }

  /* ----------------------------------------- SALES --------- */
  function buildSalesCard() {
    // migrasi dari format lama (daftar penjualan) → satu angka total
    if (model.salesCopies == null && Array.isArray(model.sales) && model.sales.length) {
      model.salesCopies = model.sales.reduce((s, r) => s + (Number(r.copies) || 0), 0);
      model.salesUpdated = model.sales[0].date || new Date().toISOString().slice(0, 10);
    }
    const copies = Number(model.salesCopies) || 0;
    const card = el(`<div class="rail-card sales-card">
      <h4>${icon("tag")} Penjualan</h4>
      <div class="sales-total"><span class="st-num" data-total>${num(copies)}</span><span class="st-lbl">eksemplar terjual</span></div>
      <div class="sales-edit">
        <label>Perbarui jumlah terjual</label>
        <input class="inp inp-sm" type="number" min="0" data-copies value="${copies}">
      </div>
      <div class="sales-updated" data-upd>${model.salesUpdated ? `Diperbarui ${U.fmtDate(model.salesUpdated)}` : "Belum pernah diperbarui"}</div>
    </div>`);
    const totalEl = card.querySelector("[data-total]");
    const updEl = card.querySelector("[data-upd]");
    card.querySelector("[data-copies]").addEventListener("input", e => {
      const v = Math.max(0, parseInt(e.target.value) || 0);
      const today = new Date().toISOString().slice(0, 10);
      model.salesCopies = v; model.salesUpdated = today;
      commit({ salesCopies: v, salesUpdated: today });
      totalEl.textContent = num(v);
      updEl.textContent = `Diperbarui ${U.fmtDate(today)}`;
    });
    return card;
  }

  /* ----------------------------------------- MAIN ---------- */
  const TABS = [
    { key: "ikhtisar", label: "Preview", ic: "pen" },
    { key: "karakter", label: "Karakter", ic: "users", count: m => (m.characters || []).length },
    { key: "beat",     label: "Beat Sheet", ic: "layers", count: m => Object.values(m.beats || {}).filter(Boolean).length + "/15" },
    { key: "plot",     label: "Plot Points", ic: "clapper", count: m => (m.plotPoints || []).length },
    { key: "catatan",  label: "Catatan", ic: "note", count: m => (m.notes || []).length },
  ];

  function buildMain() {
    const main = el(`<div class="proj-main"></div>`);

    const titleInput = el(`<input class="proj-title-input" value="${attr(model.title)}" placeholder="Judul novel">`);
    titleInput.addEventListener("input", e => commit({ title: e.target.value || "Novel Tanpa Judul" }));
    main.appendChild(titleInput);

    if (model.premise) {
      main.appendChild(el(`<p class="muted" style="font-family:var(--serif);font-size:16px;font-style:italic;margin-top:2px">${JC.escapeHtml(model.premise.slice(0,140))}${model.premise.length>140?"…":""}</p>`));
    }

    const tabs = el(`<div class="tabs"></div>`);
    TABS.forEach(t => {
      const c = t.count ? t.count(model) : null;
      const tab = el(`<button class="tab ${t.key === activeTab ? "active" : ""}" data-tab="${t.key}">${icon(t.ic)} ${t.label}${c != null ? `<span class="count">${c}</span>` : ""}</button>`);
      tab.onclick = () => { activeTab = t.key; main.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === t.key)); renderTab(content); };
      tabs.appendChild(tab);
    });
    main.appendChild(tabs);

    const content = el(`<div class="tab-content"></div>`);
    main.appendChild(content);
    renderTab(content);
    return main;
  }

  function refreshTabCounts() {
    document.querySelectorAll(".tab").forEach(tab => {
      const def = TABS.find(t => t.key === tab.dataset.tab);
      if (def && def.count) { const c = tab.querySelector(".count"); if (c) c.textContent = def.count(model); }
    });
  }

  function renderTab(content) {
    clear(content);
    if (activeTab === "ikhtisar") content.appendChild(tabIkhtisar());
    else if (activeTab === "karakter") content.appendChild(tabKarakter(content));
    else if (activeTab === "beat") content.appendChild(tabBeat());
    else if (activeTab === "plot") content.appendChild(tabPlot(content));
    else if (activeTab === "catatan") content.appendChild(tabCatatan(content));
  }

  /* ---------- Ikhtisar ---------- */
  function tabIkhtisar() {
    const c = el(`<div></div>`);
    const premise = el(`<div class="premise-box field">
      <label>Premis ${icon("sparkle", 'style="width:13px;height:13px;vertical-align:-2px;color:var(--accent)"')}<span class="help">Satu-dua kalimat inti cerita.</span></label>
      <textarea class="ta" data-premise rows="2" placeholder="Seorang ___ yang ___ harus ___ sebelum ___.">${text(model.premise)}</textarea>
    </div>`);
    const pta = premise.querySelector("textarea"); U.autosize(pta);
    pta.addEventListener("input", e => commit({ premise: e.target.value }));
    c.appendChild(premise);

    const syn = el(`<div class="field">
      <label>Sinopsis Panjang <span class="help">Ringkasan alur dari awal sampai akhir.</span></label>
      <textarea class="ta lg prose" data-syn placeholder="Tuliskan jalan cerita lengkap di sini…">${text(model.synopsis)}</textarea>
    </div>`);
    syn.querySelector("textarea").addEventListener("input", e => commit({ synopsis: e.target.value }));
    c.appendChild(syn);

    const blurb = el(`<div class="field">
      <label>Blurb di Kover Belakang <span class="help">Teks penggoda singkat untuk sampul belakang.</span></label>
      <textarea class="ta prose" data-blurb rows="4" placeholder="Kalimat-kalimat penggoda yang membuat orang ingin membaca…">${text(model.blurb)}</textarea>
    </div>`);
    blurb.querySelector("textarea").addEventListener("input", e => commit({ blurb: e.target.value }));
    c.appendChild(blurb);

    c.appendChild(buildSellingPoints(c));
    return c;
  }

  /* ---------- Selling Points ---------- */
  const SP_COLORS = [
    { c: "#2563EB", soft: "#E7EFFD" },  // biru
    { c: "#E8722A", soft: "#FCEADC" },  // oranye
    { c: "#1F8A5B", soft: "#DEF1E8" },  // hijau
    { c: "#7C5CDB", soft: "#ECE6FB" },  // violet
    { c: "#0E9AA8", soft: "#DAF1F3" },  // teal
    { c: "#D2417E", soft: "#FBE3EE" },  // magenta
  ];
  function buildSellingPoints(tabRoot) {
    if (!model.sellingPoints) model.sellingPoints = [];
    const wrap = el(`<div class="field sp-field">
      <label>${icon("star", 'style="width:14px;height:14px;vertical-align:-2px;color:var(--accent2)"')} Selling Points <span class="help">Poin-poin yang jadi nilai jual novel ini — untuk pitch ke penerbit & promosi.</span></label>
      <div class="sp-grid" data-spgrid></div>
    </div>`);
    const grid = wrap.querySelector("[data-spgrid]");
    const renderPoints = () => {
      clear(grid);
      model.sellingPoints.forEach((sp, i) => grid.appendChild(spCard(sp, i, renderPoints)));
      const add = el(`<button class="sp-add" type="button">${icon("plus")} Tambah Selling Point</button>`);
      add.onclick = () => {
        model.sellingPoints.push({ id: U.uid(), text: "" });
        commit({ sellingPoints: model.sellingPoints });
        renderPoints();
        const tas = grid.querySelectorAll(".sp-card textarea");
        if (tas.length) tas[tas.length - 1].focus();
      };
      grid.appendChild(add);
    };
    renderPoints();
    return wrap;
  }
  function spCard(sp, i, rerender) {
    const col = SP_COLORS[i % SP_COLORS.length];
    const card = el(`<div class="sp-card" style="--sp:${col.c};--sp-soft:${col.soft}">
      <span class="sp-badge">${icon("star")}</span>
      <textarea class="sp-text" rows="1" placeholder="mis. Mengangkat sejarah perkeretaapian yang belum pernah difiksikan…">${text(sp.text)}</textarea>
      <button class="sp-del" type="button" title="Hapus">${icon("x")}</button>
    </div>`);
    const ta = card.querySelector("textarea"); U.autosize(ta);
    ta.addEventListener("input", e => { sp.text = e.target.value; commit({ sellingPoints: model.sellingPoints }); });
    card.querySelector(".sp-del").onclick = () => {
      model.sellingPoints.splice(i, 1); commit({ sellingPoints: model.sellingPoints }); rerender();
    };
    return card;
  }

  /* ---------- Karakter ---------- */
  const CHAR_FIELDS = [
    { k: "description", l: "Deskripsi" },
    { k: "motivation", l: "Motivasi" },
    { k: "conflict", l: "Konflik" },
    { k: "arc", l: "Arc / perubahan" },
  ];
  function tabKarakter(content) {
    const c = el(`<div></div>`);
    c.appendChild(el(`<div class="section-intro"><h2>Karakter</h2><p>Siapa yang menggerakkan cerita ini? Catat peran, motivasi, konflik, dan bagaimana mereka berubah.</p></div>`));
    if (!model.characters) model.characters = [];

    const grid = el(`<div class="char-grid"></div>`);
    model.characters.forEach((ch, i) => grid.appendChild(charCard(ch, i, content)));
    const add = el(`<button class="add-tile">${icon("plus")} Tambah Karakter</button>`);
    add.onclick = () => {
      model.characters.push({ id: U.uid(), name: "", role: "", description: "", motivation: "", conflict: "", arc: "" });
      commit({ characters: model.characters }); renderTab(content); refreshTabCounts();
      const cards = content.querySelectorAll(".char-card"); const last = cards[cards.length - 1];
      if (last) last.querySelector(".cname").focus();
    };
    grid.appendChild(add);
    c.appendChild(grid);
    return c;
  }
  function charCard(ch, i, content) {
    const card = el(`<div class="char-card">
      <div class="char-head">
        <button class="char-ava" type="button" data-ava title="Tambah / ganti foto"></button>
        <input type="file" accept="image/*" hidden data-avafile>
        <div class="ci">
          <input class="cname" placeholder="Nama karakter" value="${attr(ch.name)}">
          <input class="crole" placeholder="Peran — mis. Protagonis" value="${attr(ch.role)}">
        </div>
      </div>
      <div class="char-fields"></div>
      <div class="char-foot"><button class="btn btn-icon btn-sm btn-soft" data-del title="Hapus">${icon("trash")}</button></div>
    </div>`);
    const ava = card.querySelector(".char-ava");
    const avaFile = card.querySelector("[data-avafile]");
    const avaInner = () => {
      const base = ch.photo
        ? `<img src="${ch.photo}" alt="">`
        : (U.initials(ch.name) === "?" ? icon("user", 'style="width:20px;height:20px"') : `<span class="ava-ini">${U.initials(ch.name)}</span>`);
      return base + `<span class="ava-edit">${icon("camera")}</span>`;
    };
    ava.innerHTML = avaInner();
    ava.classList.toggle("has-photo", !!ch.photo);
    ava.onclick = () => avaFile.click();
    avaFile.onchange = () => {
      const f = avaFile.files[0]; if (!f) return;
      U.resizeImage(f, 360).then(d => {
        ch.photo = d; commit({ characters: model.characters });
        ava.innerHTML = avaInner(); ava.classList.add("has-photo");
        U.toast("Foto karakter diperbarui");
      }).catch(() => U.toast("Gagal memuat gambar", "err"));
    };
    const nameI = card.querySelector(".cname");
    nameI.addEventListener("input", e => { ch.name = e.target.value; commit({ characters: model.characters }); if (!ch.photo) ava.innerHTML = avaInner(); });
    card.querySelector(".crole").addEventListener("input", e => { ch.role = e.target.value; commit({ characters: model.characters }); });
    const ff = card.querySelector(".char-fields");
    CHAR_FIELDS.forEach(f => {
      const cf = el(`<div class="cf"><label>${f.l}</label><textarea rows="1" placeholder="…">${text(ch[f.k])}</textarea></div>`);
      const ta = cf.querySelector("textarea"); U.autosize(ta);
      ta.addEventListener("input", e => { ch[f.k] = e.target.value; commit({ characters: model.characters }); });
      ff.appendChild(cf);
    });
    card.querySelector("[data-del]").onclick = () => {
      U.confirmDialog("Hapus karakter?", ch.name ? `“${ch.name}” akan dihapus.` : "Karakter ini akan dihapus.").then(ok => {
        if (!ok) return;
        model.characters.splice(i, 1); commit({ characters: model.characters }); renderTab(content); refreshTabCounts();
      });
    };
    return card;
  }

  /* ---------- Beat Sheet ---------- */
  function tabBeat() {
    const c = el(`<div></div>`);
    c.appendChild(el(`<div class="section-intro"><h2>Beat Sheet · Save the Cat!</h2><p>15 beat klasik Blake Snyder. Isi tiap beat dengan apa yang terjadi di novelmu — kosongkan yang belum.</p></div>`));
    if (!model.beats) model.beats = {};
    let curAct = 0;
    JC.BEATS.forEach(b => {
      if (b.act !== curAct) { curAct = b.act; c.appendChild(el(`<div class="act-label"><span class="a-no">${rom(curAct)}</span><h3>${JC.ACTS[curAct]}</h3><span class="a-line"></span></div>`)); }
      const filled = !!(model.beats[b.key] && model.beats[b.key].trim());
      const beat = el(`<div class="beat ${filled ? "filled" : ""}">
        <div class="beat-num">${b.no}</div>
        <div class="beat-body">
          <div class="beat-name">${b.name} <span class="pct">${b.id} · ${b.pos}</span></div>
          <div class="beat-desc">${b.desc}</div>
          <textarea rows="1" placeholder="Apa yang terjadi di sini…">${text(model.beats[b.key])}</textarea>
        </div>
      </div>`);
      const ta = beat.querySelector("textarea"); U.autosize(ta);
      ta.addEventListener("input", e => { model.beats[b.key] = e.target.value; commit({ beats: model.beats }); beat.classList.toggle("filled", !!e.target.value.trim()); refreshTabCounts(); });
      c.appendChild(beat);
    });
    return c;
  }

  /* ---------- Plot Points ---------- */
  function tabPlot(content) {
    const c = el(`<div></div>`);
    c.appendChild(el(`<div class="section-intro"><h2>Plot Points</h2><p>Momen-momen kunci yang menggerakkan cerita, berurutan. Seret untuk menyusun ulang.</p></div>`));
    if (!model.plotPoints) model.plotPoints = [];
    const stack = el(`<div class="list-stack" data-stack></div>`);
    model.plotPoints.forEach((pp, i) => stack.appendChild(plotRow(pp, i, content, stack)));
    c.appendChild(stack);
    const add = el(`<button class="add-tile" style="margin-top:14px">${icon("plus")} Tambah plot point</button>`);
    add.onclick = () => {
      model.plotPoints.push({ id: U.uid(), text: "" });
      commit({ plotPoints: model.plotPoints }); renderTab(content); refreshTabCounts();
      const rows = content.querySelectorAll(".row-card textarea"); const last = rows[rows.length - 1]; if (last) last.focus();
    };
    c.appendChild(add);
    return c;
  }
  function plotRow(pp, i, content, stack) {
    const row = el(`<div class="row-card" data-i="${i}">
      <span class="row-handle" title="Seret">${icon("grip")}</span>
      <span class="plot-num">${i + 1}</span>
      <div class="row-main"><textarea rows="1" placeholder="Plot point…">${text(pp.text)}</textarea></div>
      <button class="btn btn-icon btn-sm btn-soft row-del" title="Hapus">${icon("trash")}</button>
    </div>`);
    const ta = row.querySelector("textarea"); U.autosize(ta);
    ta.addEventListener("input", e => { pp.text = e.target.value; commit({ plotPoints: model.plotPoints }); });
    row.querySelector(".row-del").onclick = () => { model.plotPoints.splice(i, 1); commit({ plotPoints: model.plotPoints }); renderTab(content); refreshTabCounts(); };
    enableDrag(row, stack, content);
    return row;
  }
  function enableDrag(row, stack, content) {
    const handle = row.querySelector(".row-handle");
    handle.addEventListener("mousedown", () => row.setAttribute("draggable", "true"));
    handle.addEventListener("touchstart", () => row.setAttribute("draggable", "true"), { passive: true });
    row.addEventListener("dragend", () => row.removeAttribute("draggable"));
    row.addEventListener("dragstart", e => { row.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text", row.dataset.i); });
    row.addEventListener("dragover", e => { e.preventDefault();
      const dragging = stack.querySelector(".dragging"); if (!dragging || dragging === row) return;
      const rect = row.getBoundingClientRect(); const after = e.clientY > rect.top + rect.height / 2;
      stack.insertBefore(dragging, after ? row.nextSibling : row);
    });
    row.addEventListener("drop", e => {
      e.preventDefault(); row.classList.remove("dragging");
      const order = [...stack.querySelectorAll(".row-card")].map(r => parseInt(r.dataset.i));
      model.plotPoints = order.map(idx => model.plotPoints[idx]);
      commit({ plotPoints: model.plotPoints }); renderTab(content);
    });
  }

  /* ---------- Catatan ---------- */
  function tabCatatan(content) {
    const c = el(`<div></div>`);
    c.appendChild(el(`<div class="section-intro"><h2>Catatan</h2><p>Bahan riset, ide, world-building, referensi — apa pun yang menunjang novel ini.</p></div>`));
    if (!model.notes) model.notes = [];
    const grid = el(`<div class="notes-grid"></div>`);
    model.notes.forEach((n, i) => grid.appendChild(noteCard(n, i, content)));
    const add = el(`<button class="add-tile" style="min-height:120px">${icon("plus")} Tambah Catatan</button>`);
    add.onclick = () => {
      model.notes.unshift({ id: U.uid(), tag: "", title: "", body: "", createdAt: new Date().toISOString() });
      commit({ notes: model.notes }); renderTab(content); refreshTabCounts();
      const t = content.querySelector(".note-card .note-title"); if (t) t.focus();
    };
    grid.appendChild(add);
    c.appendChild(grid);
    return c;
  }
  function noteCard(n, i, content) {
    const card = el(`<div class="note-card">
      <div class="nc-top">
        <input class="ntag" placeholder="label" value="${attr(n.tag)}" style="border:none;background:var(--accent-soft);color:var(--accent);font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:99px;width:auto;max-width:120px">
        <button class="btn btn-icon btn-sm btn-soft" data-del title="Hapus">${icon("trash")}</button>
      </div>
      <input class="note-title" placeholder="Judul catatan" value="${attr(n.title)}" style="border:none;background:transparent;font-weight:700;font-size:15px;padding:2px 0">
      <textarea class="note-body" rows="3" placeholder="Tulis catatan…" style="border:none;background:transparent;resize:none;padding:0">${text(n.body)}</textarea>
    </div>`);
    const ta = card.querySelector("textarea"); U.autosize(ta);
    card.querySelector(".ntag").addEventListener("input", e => { n.tag = e.target.value; commit({ notes: model.notes }); });
    card.querySelector(".note-title").addEventListener("input", e => { n.title = e.target.value; commit({ notes: model.notes }); });
    ta.addEventListener("input", e => { n.body = e.target.value; commit({ notes: model.notes }); });
    card.querySelector("[data-del]").onclick = () => { model.notes.splice(i, 1); commit({ notes: model.notes }); renderTab(content); refreshTabCounts(); };
    return card;
  }

  /* ---------- utils ---------- */
  function attr(s) { return (s == null ? "" : String(s)).replace(/"/g, "&quot;"); }
  function text(s) { return JC.escapeHtml(s == null ? "" : String(s)); }
  function rom(n) { return ["", "I", "II", "III"][n] || n; }

  return { render, cleanup, gotoTab(t) { _pendingTab = t; } };
})();
