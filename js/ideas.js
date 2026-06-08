/* ===========================================================================
   BANK IDE — papan catatan ide bebas dalam format sticky notes.
   Setiap catatan bisa diganti warnanya. Tersimpan per pengguna (lintas novel).
   Route: #/ideas
   =========================================================================== */
window.JC = window.JC || {};
JC.ideas = (function () {
  const U = JC.ui;
  const { icon, el, clear } = U;

  // Palet warna sticky — 4 pilihan, hangat & lembut.
  const COLORS = [
    { key: "kuning",  bg: "#FDF1B8", ink: "#6B5512", line: "#EBD877" },
    { key: "pink",    bg: "#FAD6DE", ink: "#7C3B4C", line: "#F0B3C0" },
    { key: "biru",    bg: "#D2E6F7", ink: "#27506F", line: "#AFD0EE" },
    { key: "hijau",   bg: "#D6EBCF", ink: "#3C5E33", line: "#B6D9AB" },
  ];
  const colorOf = k => COLORS.find(c => c.key === k) || COLORS[0];

  let notes = [];
  let saveT = null;

  function persist() {
    clearTimeout(saveT);
    if (JC.search) JC.search.invalidate();
    saveT = setTimeout(() => { JC.store.saveIdeas(notes); }, 350);
  }

  function render(root) {
    clear(root);
    root.appendChild(JC.topbar());
    const main = el(`<main><div class="wrap ideas-wrap"></div></main>`);
    const wrap = main.querySelector(".wrap");
    root.appendChild(main);

    wrap.appendChild(el(`<div class="page-head ideas-head">
      <div>
        <a class="back-link" href="#/">${icon("arrowLeft")} Dasbor</a>
        <h1>${icon("bulb")} Bank Ide</h1>
        <div class="sub">Tangkap ide cerita, judul, atau adegan yang melintas — sebelum lupa.</div>
      </div>
      <button class="btn btn-accent" data-add>${icon("plus")} Catatan Baru</button>
    </div>`));

    const board = el(`<div class="ideas-board"></div>`);
    wrap.appendChild(board);

    const loading = el(`<div class="center-screen" style="min-height:200px"><div class="spinner"></div></div>`);
    board.appendChild(loading);

    Promise.resolve(JC.store.getIdeas()).then(arr => {
      notes = Array.isArray(arr) ? arr : [];
      paint(board);
    }).catch(() => { notes = []; paint(board); });

    wrap.querySelector("[data-add]").onclick = () => addNote(board);
  }

  function addNote(board, color) {
    const n = { id: U.uid(), text: "", color: color || COLORS[(notes.length) % COLORS.length].key, createdAt: new Date().toISOString() };
    notes.unshift(n);
    persist();
    paint(board);
    const first = board.querySelector(".sticky textarea");
    if (first) first.focus();
  }

  function paint(board) {
    clear(board);
    if (!notes.length) {
      board.appendChild(el(`<div class="ideas-empty">
        <div class="ico">${icon("bulb")}</div>
        <h3>Belum ada ide</h3>
        <p>Mulai tempel catatan pertamamu — premis liar, judul alternatif, atau sepenggal dialog.</p>
      </div>`));
      return;
    }
    notes.forEach(n => board.appendChild(stickyCard(n, board)));
  }

  function stickyCard(n, board) {
    const c = colorOf(n.color);
    const card = el(`<div class="sticky" style="--n-bg:${c.bg};--n-ink:${c.ink};--n-line:${c.line}">
      <div class="sticky-bar">
        <div class="swatches"></div>
        <button class="sticky-del" data-del title="Hapus catatan">${icon("trash")}</button>
      </div>
      <textarea class="sticky-text" placeholder="Tulis ide…">${text(n.text)}</textarea>
      <div class="sticky-foot">${U.fmtDate((n.createdAt || "").slice(0, 10)) || ""}</div>
    </div>`);

    const sw = card.querySelector(".swatches");
    COLORS.forEach(col => {
      const dot = el(`<button class="swatch ${col.key === n.color ? "on" : ""}" style="background:${col.bg};border-color:${col.line}" title="Warna ${col.key}"></button>`);
      dot.onclick = () => {
        n.color = col.key; persist();
        card.style.setProperty("--n-bg", col.bg);
        card.style.setProperty("--n-ink", col.ink);
        card.style.setProperty("--n-line", col.line);
        sw.querySelectorAll(".swatch").forEach(s => s.classList.remove("on"));
        dot.classList.add("on");
      };
      sw.appendChild(dot);
    });

    const ta = card.querySelector(".sticky-text");
    ta.addEventListener("input", e => { n.text = e.target.value; persist(); });

    card.querySelector("[data-del]").onclick = () => {
      U.confirmDialog("Hapus catatan?", n.text.trim() ? "Catatan ini akan dihapus." : "").then(ok => {
        if (!ok) return;
        notes = notes.filter(x => x.id !== n.id);
        persist(); paint(board);
      });
    };
    return card;
  }

  function text(s) { return JC.escapeHtml(s == null ? "" : String(s)); }

  return { render };
})();
