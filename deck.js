// deck.js — shared Wallet-style card deck (Mack, 2026-10-19). See deck.css for the markup contract.
// Builds the strip + controls for every <article class="dk"> inside #deck, keeps per-device order/open state in localStorage
// (data-key on #deck), and enforces zones: tally/about cards at the top, slate cards among slates (carrying their g cards),
// a g card only inside its own slate (data-win = the slate's data-id). Press-and-hold drag (any strip), ⤒ move to top, ⋯ menu.
(() => {
  const dk = document.getElementById("deck"); if (!dk) return;
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = dk.dataset.key || (location.pathname.replace(/[^A-Za-z0-9]/g, "") + "-deck");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  // ---- chrome ----
  for (const a of dk.querySelectorAll(".dk")) {
    if (a.querySelector(":scope > .hd")) continue;
    const id = a.dataset.id, body = document.createElement("div"); body.className = "body"; body.id = "bd-" + id;
    const bc = document.createElement("div"); bc.className = "bc"; while (a.firstChild) bc.appendChild(a.firstChild); body.appendChild(bc);
    const hd = document.createElement("div"); hd.className = "hd";
    hd.innerHTML = `<button class="strip" type="button" aria-expanded="false" aria-controls="bd-${esc(id)}"><span class="s1">${a.dataset.title || ""}</span><span class="s2">${a.dataset.sub || ""}</span></button>` +
      `<div class="ctl"><button class="ib" type="button" data-act="top" aria-label="Move to top" title="Move to top">⤒</button><details class="menu"><summary class="ib" aria-label="More options" role="button">⋯</summary>` +
      `<div class="mn"><button type="button" data-act="top">Move to top</button><button type="button" data-act="up">Move up</button><button type="button" data-act="down">Move down</button><hr><button type="button" data-act="collapse">Collapse all</button><button type="button" data-act="expand">Expand all</button></div></details><span class="ib handle" aria-hidden="true">≡</span></div>`;
    a.appendChild(hd); a.appendChild(body);
  }
  if (!$(".deck-bar")) { const bar = document.createElement("div"); bar.className = "deck-bar";
    bar.innerHTML = `<span class="lbl">${esc(dk.dataset.label || "Cards")}</span><button class="tb" type="button" id="reset-order">Reset order</button>`;
    const hint = document.createElement("p"); hint.className = "deck-hint"; hint.textContent = "Tap a card to open it. Press and hold a card, then slide it up or down to reorder. Order is saved on this device.";
    dk.parentNode.insertBefore(bar, dk); dk.parentNode.insertBefore(hint, dk); }
  // ---- state ----
  const DEF = [...dk.children].map(c => c.dataset.id); let deck = { order: [], open: {} };
  try { deck = Object.assign(deck, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(deck)); } catch (e) {} };
  const defOpen = el => el.dataset.open === "1";
  function setOpen(id, v, s = true) { const el = dk.querySelector(`.dk[data-id="${CSS.escape(id)}"]`); if (!el) return; el.classList.toggle("open", v); el.querySelector(".strip").setAttribute("aria-expanded", String(v)); deck.open[id] = v; if (s) save(); }
  function applyOrder() { const known = new Set(DEF); let order = [...new Set(deck.order.filter(id => known.has(id)))];
    for (let i = 0; i < DEF.length; i++) { const id = DEF[i]; if (order.includes(id)) continue; const p = i ? order.indexOf(DEF[i - 1]) : -1; order.splice(p + 1, 0, id); }
    deck.order = order; for (const id of order) { const el = dk.querySelector(`.dk[data-id="${CSS.escape(id)}"]`); if (el) dk.appendChild(el); } }
  function normalize() {   // zones: tallies/about first, then each slate followed by its own g cards (relative order kept)
    const kids = [...dk.children], top = kids.filter(c => c.classList.contains("tally") || c.classList.contains("about")), slates = kids.filter(c => c.classList.contains("slate")), gs = kids.filter(c => c.classList.contains("g"));
    const frag = document.createDocumentFragment(); for (const t of top) frag.appendChild(t);
    const slateIds = new Set(slates.map(sl => sl.dataset.id));
    for (const g of gs) if (!slateIds.has(g.dataset.win)) frag.appendChild(g);   // free cards (no slate) sit right under the top zone (Scott 10/19: no "This week" header needed)
    for (const sl of slates) { frag.appendChild(sl); for (const g of gs) if (g.dataset.win === sl.dataset.id) frag.appendChild(g); }
    dk.appendChild(frag); }
  const readOrder = () => { deck.order = [...dk.children].map(c => c.dataset.id); save(); };
  applyOrder(); normalize(); readOrder();
  for (const k of dk.children) setOpen(k.dataset.id, k.dataset.id in deck.open ? deck.open[k.dataset.id] : defOpen(k), false);
  // ---- zones ----
  function groupOf(el) { const nodes = [el]; if (el.classList.contains("slate")) for (let n = el.nextElementSibling; n && n.classList.contains("g"); n = n.nextElementSibling) nodes.push(n); return nodes; }
  function slateOf(el) { for (let n = el.previousElementSibling; n; n = n.previousElementSibling) if (n.classList.contains("slate")) return n; return null; }
  function allowedBefore(nodes) { const kids = [...dk.children].filter(c => !nodes.includes(c)), head = nodes[0];
    if (head.classList.contains("g")) { const S = slateOf(head); const out = []; let n = S ? S.nextElementSibling : (kids.find(c => c.classList.contains("g")) || null);
      if (!S) { const firstSlate = kids.find(c => c.classList.contains("slate")) || null; for (const c of kids) { if (c === firstSlate) break; if (c.classList.contains("g")) out.push(c); } out.push(firstSlate); return out; }   // free card: among the free cards, above the first slate
      for (; n && n.classList.contains("g"); n = n.nextElementSibling) if (!nodes.includes(n)) out.push(n); out.push(n || null); return out; }
    if (head.classList.contains("slate")) return [...kids.filter(c => c.classList.contains("slate")), null];
    const firstSlate = kids.find(c => c.classList.contains("slate")) || null; return [...kids.filter(c => c.classList.contains("tally") || c.classList.contains("about")), firstSlate]; }
  function clampBefore(nodes, before) { const kids = [...dk.children].filter(c => !nodes.includes(c)), allowed = allowedBefore(nodes);
    const ix = x => x === null ? kids.length : kids.indexOf(x); const want = ix(before); const sorted = allowed.slice().sort((a, b) => ix(a) - ix(b)); return sorted.find(x => ix(x) >= want) ?? sorted[sorted.length - 1]; }
  function moveBefore(nodes, before) { before = clampBefore(nodes, before); if ((nodes[nodes.length - 1].nextElementSibling || null) === before) return; for (const n of nodes) dk.insertBefore(n, before); readOrder(); }
  function act(what, id) { const kids = [...dk.children], el = dk.querySelector(`.dk[data-id="${CSS.escape(id)}"]`);
    if (what === "collapse") { for (const k of kids) if (!k.contains(document.activeElement) || document.activeElement === document.body) setOpen(k.dataset.id, false, false); save(); return; }
    if (what === "expand") { for (const k of kids) setOpen(k.dataset.id, true, false); save(); return; }
    const nodes = groupOf(el), rest = kids.filter(c => !nodes.includes(c)), ix = x => x === null ? rest.length : rest.indexOf(x);
    const slots = allowedBefore(nodes).slice().sort((a, b) => ix(a) - ix(b)), here = slots.indexOf(nodes[nodes.length - 1].nextElementSibling || null);
    if (what === "top") moveBefore(nodes, slots[0]); else if (what === "up") { if (here > 0) moveBefore(nodes, slots[here - 1]); } else if (what === "down") { if (here >= 0 && here < slots.length - 1) moveBefore(nodes, slots[here + 1]); }
    if (what === "top" || what === "up") nodes[0].scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
  // ---- events ----
  dk.addEventListener("click", e => { const strip = e.target.closest(".strip"); if (strip) { const a = strip.closest(".dk"); setOpen(a.dataset.id, !a.classList.contains("open")); return; }
    const btn = e.target.closest("button[data-act]"); if (btn) { const d = btn.closest("details.menu"); if (d) d.open = false; act(btn.dataset.act, btn.closest(".dk").dataset.id); } });
  dk.addEventListener("toggle", e => { if (e.target.open) for (const d of dk.querySelectorAll("details.menu[open]")) if (d !== e.target) d.open = false; }, true);
  document.addEventListener("click", e => { if (!e.target.closest("details.menu")) for (const d of dk.querySelectorAll("details.menu[open]")) d.open = false; });
  $("#reset-order").addEventListener("click", () => { deck = { order: [], open: {} }; try { localStorage.removeItem(KEY); } catch (e) {} applyOrder(); normalize(); for (const k of dk.children) setOpen(k.dataset.id, defOpen(k), false); deck.open = {}; });
  // ---- drag (same as the picks board): any strip, press and hold ~300 ms on touch; mouse lifts after 6 px, or at once on the ≡ handle ----
  let drag = null, raf = 0, dragged = 0;
  const place = y => { if (!drag || !drag.active) return; const kids = [...dk.children].filter(c => !drag.nodes.includes(c)); let before = null;
    for (const c of kids) { const r = c.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = c; break; } }
    const cur = drag.nodes[drag.nodes.length - 1].nextElementSibling || null; if (before === cur) return; before = clampBefore(drag.nodes, before); if (cur === before) return; for (const n of drag.nodes) dk.insertBefore(n, before); };
  const loop = () => { if (!drag || !drag.active) { raf = 0; return; } const y = drag.cy, m = 70; if (y < m) scrollBy(0, -Math.ceil((m - y) / 4)); else if (y > innerHeight - m) scrollBy(0, Math.ceil((y - innerHeight + m) / 4)); place(y); raf = requestAnimationFrame(loop); };
  const lift = () => { if (!drag) return; drag.active = true; drag.nodes.forEach(n => n.classList.add("lift")); document.body.classList.add("dragging"); if (!raf) raf = requestAnimationFrame(loop); };
  const end = () => { if (!drag) return; clearTimeout(drag.hold); try { drag.h.releasePointerCapture(drag.pid); } catch (e) {} if (drag.active) { drag.nodes.forEach(n => n.classList.remove("lift")); document.body.classList.remove("dragging"); readOrder(); dragged = Date.now(); } drag = null; };
  dk.addEventListener("click", e => { if (Date.now() - dragged < 400 && e.target.closest(".strip")) { e.stopPropagation(); e.preventDefault(); } }, true);
  dk.addEventListener("touchmove", e => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
  dk.addEventListener("pointerdown", e => { const h = e.target.closest(".handle, .strip"); if (!h || (e.pointerType === "mouse" && e.button !== 0)) return; end(); const onHandle = h.classList.contains("handle");
    drag = { h, nodes: groupOf(h.closest(".dk")), pid: e.pointerId, y0: e.clientY, cy: e.clientY, active: false, hold: 0 }; try { h.setPointerCapture(e.pointerId); } catch (e) {}
    if (e.pointerType === "mouse") { if (onHandle) lift(); } else drag.hold = setTimeout(lift, onHandle ? 200 : 300); if (onHandle) e.preventDefault(); });
  dk.addEventListener("pointermove", e => { if (!drag || e.pointerId !== drag.pid) return; drag.cy = e.clientY; if (!drag.active) { const dy = Math.abs(e.clientY - drag.y0); if (e.pointerType === "mouse") { if (dy > 6) lift(); } else if (dy > 8) end(); return; } e.preventDefault(); place(e.clientY); });
  dk.addEventListener("pointerup", e => { if (drag && e.pointerId === drag.pid) end(); }); dk.addEventListener("pointercancel", e => { if (drag && e.pointerId === drag.pid) end(); });
  dk.addEventListener("dragstart", e => { if (e.target.closest(".handle,.strip")) e.preventDefault(); });
  window.Deck = { act, setOpen };
})();
