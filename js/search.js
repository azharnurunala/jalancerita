/* ===========================================================================
   PENCARIAN GLOBAL — cari lintas novel, karakter, catatan, dan ide.
   Dibuka lewat tombol di bilah atas atau pintasan "/".
   =========================================================================== */
window.JC = window.JC || {};
JC.search = (function () {
  const U = JC.ui;
  const { icon, el } = U;

  let overlay = null, inputEl = null, resultsEl = null;
  let index = [];      // entri datar yang bisa dicari
  let loaded = false;

  function open() {
    if (overlay) { inputEl.focus(); return; }
    overlay = el(`<div class="search-back">
      <div class="search-panel" role="dialog" aria-modal="true">
        <div class="search-bar">
          ${icon("search")}
          <input class="search-input" type="text" placeholder="Cari novel, karakter, catatan, ide…" autocomplete="off" spellcheck="false">
          <button class="search-close" data-close title="Tutup (Esc)">${icon("x")}</button>
        </div>
        <div class="search-results" data-results></div>
        <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>Enter</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div>
      </div>
    </div>`);
    inputEl = overlay.querySelector(".search-input");
    resultsEl = overlay.querySelector("[data-results]");
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector("[data-close]").onclick = close;
    inputEl.addEventListener("input", () => paint(inputEl.value.trim()));
    inputEl.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.classList.add("show"); inputEl.focus(); });

    resultsEl.appendChild(el(`<div class="search-hint">${icon("search")}<p>Ketik untuk mencari di seluruh ruang kerjamu.</p></div>`));

    if (!loaded) buildIndex().then(() => { if (inputEl.value.trim()) paint(inputEl.value.trim()); });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("show");
    const o = overlay; overlay = null;
    setTimeout(() => o.remove(), 160);
  }

  function buildIndex() {
    index = [];
    return Promise.all([
      Promise.resolve(JC.store.getAllProjects()).catch(() => []),
      Promise.resolve(JC.store.getIdeas()).catch(() => []),
    ]).then(([projects, ideas]) => {
      (projects || []).forEach(p => {
        const title = p.title || "Tanpa judul";
        index.push({ type: "Novel", icon: "book", title, sub: JC.statusMeta(p.status).label,
          fields: [p.title, p.premise, p.synopsis, p.blurb, p.genre], pid: p.id, tab: "ikhtisar" });
        (p.characters || []).forEach(c => {
          if (!(c.name || c.role || c.description || c.motivation || c.conflict || c.arc)) return;
          index.push({ type: "Karakter", icon: "users", title: c.name || "Tanpa nama", sub: `${c.role || "Karakter"} · ${title}`,
            fields: [c.name, c.role, c.description, c.motivation, c.conflict, c.arc], pid: p.id, tab: "karakter" });
        });
        (p.notes || []).forEach(n => {
          if (!(n.title || n.body || n.tag)) return;
          index.push({ type: "Catatan", icon: "note", title: n.title || "Catatan", sub: `${n.tag ? n.tag + " · " : ""}${title}`,
            fields: [n.title, n.body, n.tag], pid: p.id, tab: "catatan" });
        });
      });
      (ideas || []).forEach(n => {
        if (!(n.text || "").trim()) return;
        index.push({ type: "Ide", icon: "bulb", title: firstLine(n.text), sub: "Bank Ide",
          fields: [n.text], idea: true });
      });
      loaded = true;
    });
  }

  function firstLine(s) { s = (s || "").trim(); const i = s.indexOf("\n"); return (i >= 0 ? s.slice(0, i) : s) || "Catatan"; }

  function paint(q) {
    resultsEl.innerHTML = "";
    if (!q) {
      resultsEl.appendChild(el(`<div class="search-hint">${icon("search")}<p>Ketik untuk mencari di seluruh ruang kerjamu.</p></div>`));
      return;
    }
    if (!loaded) { resultsEl.appendChild(el(`<div class="search-hint"><div class="spinner"></div></div>`)); return; }

    const ql = q.toLowerCase();
    const hits = [];
    index.forEach(it => {
      let snippet = null;
      for (const f of it.fields) {
        if (f && String(f).toLowerCase().includes(ql)) { snippet = makeSnippet(String(f), ql); break; }
      }
      if (snippet) hits.push(Object.assign({ snippet }, it));
    });

    if (!hits.length) {
      resultsEl.appendChild(el(`<div class="search-hint"><p>Tidak ada hasil untuk “${esc(q)}”.</p></div>`));
      return;
    }

    // urutkan: judul cocok dulu, lalu per tipe
    const order = { Novel: 0, Karakter: 1, Catatan: 2, Ide: 3 };
    hits.sort((a, b) => {
      const at = a.title.toLowerCase().includes(ql) ? 0 : 1;
      const bt = b.title.toLowerCase().includes(ql) ? 0 : 1;
      if (at !== bt) return at - bt;
      return (order[a.type] - order[b.type]);
    });

    hits.slice(0, 40).forEach((h, i) => {
      const row = el(`<button class="search-item ${i === 0 ? "active" : ""}" data-i="${i}">
        <span class="si-ico">${icon(h.icon)}</span>
        <span class="si-main">
          <span class="si-title">${highlight(h.title, ql)}</span>
          <span class="si-snip">${highlight(h.snippet, ql)}</span>
        </span>
        <span class="si-type">${h.type}</span>
      </button>`);
      row.onclick = () => goTo(h);
      resultsEl.appendChild(row);
    });
  }

  function goTo(h) {
    close();
    if (h.idea) { JC.go("/ideas"); return; }
    if (h.tab && h.tab !== "ikhtisar") JC.project.gotoTab(h.tab);
    JC.go("/novel/" + h.pid);
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    const items = [...resultsEl.querySelectorAll(".search-item")];
    if (!items.length) return;
    let idx = items.findIndex(x => x.classList.contains("active"));
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[idx]) items[idx].click(); return; }
    else return;
    items.forEach(x => x.classList.remove("active"));
    items[idx].classList.add("active");
    items[idx].scrollIntoView({ block: "nearest" });
  }

  function makeSnippet(text, ql) {
    const i = text.toLowerCase().indexOf(ql);
    const start = Math.max(0, i - 32);
    let s = text.slice(start, i + ql.length + 60).replace(/\s+/g, " ").trim();
    if (start > 0) s = "…" + s;
    if (i + ql.length + 60 < text.length) s = s + "…";
    return s;
  }
  function highlight(text, ql) {
    const t = esc(text || "");
    const i = t.toLowerCase().indexOf(ql.toLowerCase());
    if (i < 0) return t;
    return t.slice(0, i) + "<mark>" + t.slice(i, i + ql.length) + "</mark>" + t.slice(i + ql.length);
  }
  function esc(s) { return JC.escapeHtml(s == null ? "" : String(s)); }

  // segarkan indeks saat data berubah (dipanggil ringan)
  function invalidate() { loaded = false; }

  return { open, invalidate };
})();
