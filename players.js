// Player pop-up (Mack 2026-10-14, Scott: "a tidbit about the players that can be clicked and it pops a small window").
// One <dialog> at <body> level; data from players.json (built by scripts/nfl_player_cards.py), loaded on first click.
// A player is found by the ESPN id in his headshot URL, or by <b class="pn" data-team="Team">Name</b> on pages without photos.
(function () {
  const me = document.currentScript, ver = (me.src.split("?v=")[1] || ""), base = me.src.replace(/players\.js.*$/, "");
  let DB = null, dlg = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const HS = 'img[src*="/headshots/nfl/players/full/"]';
  async function load() { if (!DB) DB = await (await fetch(base + "players.json?v=" + ver, { cache: "force-cache" })).json(); return DB; }
  function find(t) {
    const pn = t.closest && t.closest("b.pn[data-team]");
    if (pn) return { key: pn.dataset.team + "|" + pn.textContent.trim() };
    const host = (t.matches && t.matches(HS)) ? t : (t.closest && t.closest(".pmr,.ihp,.pl")) ||
      (t.querySelector && t.querySelector(":scope > " + HS) ? t : null);
    const img = host && (host.matches(HS) ? host : host.querySelector(HS));
    const m = img && img.src.match(/players\/full\/(\d+)\.png/);
    return m ? { id: m[1] } : null;
  }
  function html(c) {
    const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
    return `<div class="pc-top">${c.head ? `<img src="${esc(c.head)}" alt="">` : ""}<div><h2 id="pc-name">${esc(c.name)}</h2>
      <div class="sub">${esc([c.pos, c.team].filter(Boolean).join(" · "))}</div>${c.status ? `<span class="st">${esc(c.status)}</span>` : ""}</div>
      <button class="x" type="button" aria-label="Close">✕</button></div>
      <dl>${row("Age", c.age)}${row("Size", c.size)}${row("Hometown", c.home)}${row("College", c.college)}${row("Drafted", c.draft)}</dl>
      ${c.line ? `<div class="season"><b>2026:</b> ${esc(c.line)}</div>` : ""}
      ${c.bio ? `<p class="bio">${esc(c.bio)}</p>` : ""}
      <div class="src">Facts: ESPN${c.bio && c.wiki ? ` · Bio: <a href="${esc(c.wiki)}" target="_blank" rel="noopener">Wikipedia</a>` : ""}</div>`;
  }
  function open(c) {
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "pcard"; dlg.setAttribute("aria-labelledby", "pc-name");
      dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".x")) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = html(c); dlg.showModal();
  }
  document.addEventListener("click", async e => {
    if (e.target.closest("a,select,input,button,dialog")) return;
    const f = find(e.target); if (!f) return;
    e.preventDefault();
    try {
      const db = await load(); const id = f.id || db.by_name[f.key]; const c = id && db.by_id[id];
      if (c) open(c);
    } catch (err) { /* players.json unreachable: do nothing */ }
  });
})();
