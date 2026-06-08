/* ===========================================================================
   UI helpers — icons, DOM, toast, modal, formatters, image resize
   =========================================================================== */
window.JC = window.JC || {};
JC.ui = (function () {

  /* ---- icons (Lucide-style, 24x24 stroke) ---- */
  const ICONS = {
    book:     '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    plus:     '<path d="M5 12h14M12 5v14"/>',
    google:   '<path fill="#4285F4" stroke="none" d="M21.35 11.1H12v2.92h5.35c-.23 1.24-.94 2.3-2 3.01v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.34 0-.7-.07-1.38-.2-2.03z"/><path fill="#34A853" stroke="none" d="M12 21c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A9.99 9.99 0 0 0 12 21z"/><path fill="#FBBC05" stroke="none" d="M6.41 12.9a6 6 0 0 1 0-3.8V6.52H3.07a10 10 0 0 0 0 8.96l3.34-2.58z"/><path fill="#EA4335" stroke="none" d="M12 6.58c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 3.6 14.7 2.7 12 2.7A9.99 9.99 0 0 0 3.07 6.52l3.34 2.58C7.2 8.74 9.4 6.58 12 6.58z"/>',
    arrowLeft:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    target:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trash:    '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    camera:   '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    check:    '<path d="M20 6 9 17l-5-5"/>',
    checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    user:     '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/>',
    grip:     '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
    sparkle:  '<path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    feather:  '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22M17.5 15H9"/>',
    pen:      '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    layers:   '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    note:     '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M15 3v6h6"/>',
    users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>',
    clapper:  '<path d="M20.2 6 3 11l-.9-2.4c-.3-.8.1-1.7.9-2l13.5-4.4c.8-.3 1.7.1 2 .9L20.2 6Z"/><path d="m6.2 5.3 3.1 3.9M12.4 3.4l3.1 4M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Z"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    tag:      '<path d="M20.59 13.41 12 22l-9-9V3h10l7.59 7.59a2 2 0 0 1 0 2.82z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>',
    share:    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 3.98M15.4 6.5 8.6 10.49"/>',
    copy:     '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    link:     '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    cloud:    '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 14"/><path d="M6 14h11.5"/>',
    refresh:  '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  };
  function icon(name, attrs) {
    const a = attrs || "";
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${a}>${ICONS[name] || ""}</svg>`;
  }

  /* ---- DOM ---- */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* ---- formatters ---- */
  function num(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString("id-ID");
  }
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : ""));
    if (isNaN(d)) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function daysLeft(iso) {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.round((d - today) / 86400000);
  }
  function deadlineState(iso) {
    const dl = daysLeft(iso);
    if (dl === null) return { cls: "none", label: "Tanpa deadline" };
    if (dl < 0)   return { cls: "over", label: `Telat ${Math.abs(dl)} hari` };
    if (dl === 0) return { cls: "warn", label: "Hari ini!" };
    if (dl <= 14) return { cls: "warn", label: `${dl} hari lagi` };
    return { cls: "ok", label: `${dl} hari lagi` };
  }
  function pct(cur, target) {
    target = Number(target) || 0; cur = Number(cur) || 0;
    if (target <= 0) return 0;
    return Math.min(100, Math.round((cur / target) * 100));
  }
  function debounce(fn, ms) {
    let t; const d = function () { clearTimeout(t); const args = arguments, ctx = this; t = setTimeout(() => fn.apply(ctx, args), ms); };
    d.flush = () => clearTimeout(t);
    return d;
  }
  function initials(name) {
    const w = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!w.length) return "?";
    return (w[0][0] + (w[1] ? w[1][0] : "")).toUpperCase();
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---- cover color from title (stable) ---- */
  const COVER_PALETTES = [
    ["#3f4d6b","#28324a"], ["#b14a2b","#8f3a20"], ["#3c5a4a","#26392f"],
    ["#5a3a52","#3a2436"], ["#2f4858","#1d2f3a"], ["#7a5230","#56381f"],
    ["#4a3f6b","#2e2747"], ["#6b3f3f","#472727"],
  ];
  function coverColors(seed) {
    let h = 0; const s = seed || "x";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return COVER_PALETTES[h % COVER_PALETTES.length];
  }

  /* ---- image resize -> base64 jpeg ---- */
  function resizeImage(file, maxW) {
    maxW = maxW || 720;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---- toast ---- */
  let toastWrap;
  function toast(msg, kind) {
    if (!toastWrap) { toastWrap = el('<div class="toast-wrap"></div>'); document.body.appendChild(toastWrap); }
    const ic = kind === "err" ? "trash" : "check";
    const t = el(`<div class="toast ${kind === "err" ? "err" : "good"}">${icon(ic)}<span></span></div>`);
    t.querySelector("span").textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s, transform .3s"; t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 300); }, 2400);
  }

  /* ---- modal ---- */
  function modal(opts) {
    // opts: { title, body(html), fields:[{key,label,type,value,placeholder}], confirmText, danger, onConfirm(values) }
    return new Promise((resolve) => {
      const fieldsHtml = (opts.fields || []).map(f =>
        `<div class="modal-field"><label>${f.label}</label>
         <input class="inp" data-k="${f.key}" type="${f.type || "text"}" placeholder="${f.placeholder || ""}" value="${(f.value ?? "").toString().replace(/"/g, "&quot;")}"></div>`
      ).join("");
      const ov = el(`<div class="overlay"><div class="modal">
        <h3></h3>${opts.body ? `<p>${opts.body}</p>` : ""}
        ${fieldsHtml}
        <div class="modal-actions">
          <button class="btn btn-ghost" data-x>${opts.cancelText || "Batal"}</button>
          <button class="btn ${opts.danger ? "btn-accent" : "btn-primary"}" data-ok style="${opts.danger ? "background:var(--danger)" : ""}">${opts.confirmText || "Simpan"}</button>
        </div></div></div>`);
      ov.querySelector("h3").textContent = opts.title || "";
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add("show"));
      const close = (val) => { ov.classList.remove("show"); setTimeout(() => ov.remove(), 200); resolve(val); };
      const collect = () => {
        const v = {}; ov.querySelectorAll("[data-k]").forEach(i => v[i.dataset.k] = i.value.trim()); return v;
      };
      ov.querySelector("[data-x]").onclick = () => close(null);
      ov.querySelector("[data-ok]").onclick = () => close(collect());
      ov.onclick = (e) => { if (e.target === ov) close(null); };
      const first = ov.querySelector("[data-k]");
      if (first) { first.focus(); first.select(); first.onkeydown = (e) => { if (e.key === "Enter") close(collect()); }; }
      document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(null); document.removeEventListener("keydown", esc); } });
    });
  }
  function confirmDialog(title, body, confirmText) {
    return modal({ title, body, confirmText: confirmText || "Hapus", danger: true }).then(v => v !== null);
  }

  /* autosize textarea */
  function autosize(ta) {
    const fit = () => { ta.style.height = "auto"; ta.style.height = (ta.scrollHeight + 2) + "px"; };
    ta.addEventListener("input", fit);
    requestAnimationFrame(fit);
    return fit;
  }

  return { icon, el, clear, num, fmtDate, daysLeft, deadlineState, pct, debounce, initials, uid, coverColors, resizeImage, toast, modal, confirmDialog, autosize };
})();
