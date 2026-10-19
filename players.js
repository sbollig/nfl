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
      <div class="news" id="pc-news"><div class="lbl">Latest news</div><div class="nl">Loading…</div></div>
      <div class="src">Facts and news: ESPN</div>`;
  }
  // Latest news per player (Scott 10/19: "NFL player news instead of the boring Wikipedia link"): ESPN's athlete overview feed,
  // fetched when the card opens so it is always current; cached per player for the session. Failure leaves a one-line note.
  const NEWS = {};
  async function news(c) {
    const id = c.id || (c.head && (c.head.match(/players\/full\/(\d+)\.png/) || [])[1]); const box = dlg && dlg.querySelector("#pc-news .nl"); if (!id || !box) return;
    try {
      if (!NEWS[id]) { const r = await fetch("https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/" + id + "/overview", { cache: "no-store" });
        const j = await r.json(); NEWS[id] = (j.news || []).slice(0, 5); }
      const items = NEWS[id]; if (!dlg.open || dlg.querySelector("#pc-name").textContent !== c.name) return;
      if (!items.length) { box.textContent = "No recent stories on ESPN."; return; }
      box.innerHTML = items.map(a => { const d = a.published ? new Date(a.published) : null, when = d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
        const href = (a.links && a.links.web && a.links.web.href) || "#", vid = a.type === "Media" || /\/video\//.test(href);
        return `<a class="ni" href="${esc(href)}" target="_blank" rel="noopener"><span class="nd">${esc(when)}${vid ? " · video" : ""}</span><span class="nh">${esc(a.headline || "")}</span></a>`; }).join("");
    } catch (e) { box.textContent = "News is not reachable right now."; }
  }
  function open(c) {
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "pcard"; dlg.setAttribute("aria-labelledby", "pc-name");
      dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".x")) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = html(c); dlg.showModal(); news(c);
  }
  document.addEventListener("click", async e => {
    const onStrip = e.target.closest && e.target.closest("b.pn") && e.target.closest("button.strip");   // a name on a card strip opens the player, not the card (10/19)
    if (!onStrip && e.target.closest("a,select,input,button,dialog")) return;
    const f = find(e.target); if (!f) return;
    e.preventDefault(); if (onStrip) e.stopPropagation();
    try {
      const db = await load(); const id = f.id || db.by_name[f.key]; const c = id && db.by_id[id];
      if (c) open(c);
    } catch (err) { /* players.json unreachable: do nothing */ }
  }, true);   // capture: runs before the deck's own click handler
})();
