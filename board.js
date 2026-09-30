/* Discussion board component — Mack, 2026-09-30.
   Board.mount(el, {topic:"picks", week:4, ver:"v15", collapsible:true, chips:false, topicSelect:false, showTopic:false, label:"Week 4 picks"})
   Reads the shared store (open); writes need the board key (asked once, kept in localStorage). All user text via textContent. */
(function () {
  const STORE = "https://script.google.com/macros/s/AKfycbwy0C0StLOn41vJQOeqBElzg1QyAu84evLOujqtUO_0bKWTL3v_WS-YBCjaUgnvhjat/exec";
  const TOPICS = ["general", "picks", "rankings", "season", "injuries"];
  const LABEL = { general: "General", picks: "Week 4 picks", rankings: "Power rankings", season: "Season projection", injuries: "Injuries" };
  const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;
  const SIG_RE = /^- Mack \(\d+\)$/;
  const store = { get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const fmt = iso => { const d = new Date(iso); return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const topicOf = p => p.topic || "general";

  // user text -> nodes: plain text via textContent, http(s) URLs as safe anchors, trailing "- Mack (N)" line as a signature
  function renderText(container, text) {
    container.textContent = "";
    let body = text, sig = "";
    const lines = text.split("\n"); const last = lines[lines.length - 1].trim();
    if (lines.length > 1 && SIG_RE.test(last)) { sig = last; body = lines.slice(0, -1).join("\n").replace(/\s+$/, ""); }
    body.split(URL_RE).forEach((part, i) => {
      if (i % 2 === 1 && /^https?:\/\//i.test(part)) { const a = document.createElement("a"); a.href = part; a.textContent = part; a.rel = "noopener noreferrer"; a.target = "_blank"; container.appendChild(a); }
      else if (part) container.appendChild(document.createTextNode(part));
    });
    if (sig) { container.appendChild(document.createElement("br")); container.appendChild(h("span", "bd-sig", sig)); }
  }

  function mount(el, opts) {
    opts = Object.assign({ topic: "general", week: 4, ver: "", collapsible: false, chips: false, topicSelect: false, showTopic: false }, opts || {});
    const label = opts.label || LABEL[opts.topic] || opts.topic;
    el.classList.add("bd");
    let posts = [], rendered = {}, replyTo = "", pendingId = "", filter = opts.chips ? "all" : opts.topic, timer = null;

    // header / collapse
    const head = h("h2", "bd-h"); const toggle = h("button", "bd-toggle"); toggle.type = "button";
    const title = h("span", "", opts.chips ? "Discussion" : "Discussion — " + label); const count = h("small", "", "loading…");
    toggle.appendChild(title); toggle.appendChild(count); head.appendChild(toggle); el.appendChild(head);
    const body = h("div", "bd-body"); el.appendChild(body);
    const collapsed = opts.collapsible && window.matchMedia("(max-width: 700px)").matches;
    el.dataset.collapsed = collapsed ? "1" : "0"; toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.addEventListener("click", () => { const c = el.dataset.collapsed === "1"; el.dataset.collapsed = c ? "0" : "1"; toggle.setAttribute("aria-expanded", c ? "true" : "false"); updateCount(); });
    if (!opts.collapsible) toggle.style.cursor = "default";

    // chips (all-topics view)
    let chips = null;
    if (opts.chips) {
      chips = h("div", "bd-chips");
      ["all"].concat(TOPICS).forEach(t => { const c = h("button", "bd-chip", t === "all" ? "All" : LABEL[t]); c.type = "button"; c.dataset.topic = t; c.setAttribute("aria-pressed", t === filter ? "true" : "false"); c.addEventListener("click", () => { filter = t; chips.querySelectorAll(".bd-chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.topic === t ? "true" : "false")); if (topicSel && t !== "all") topicSel.value = t; render(true); }); chips.appendChild(c); });
      body.appendChild(chips);
    }

    // composer
    const compose = h("div", "bd-compose");
    const row = h("div", "bd-row");
    const whoL = h("label", "", "You"); const who = document.createElement("select"); [["", "Choose…"], ["Todd", "Todd"], ["Ryota", "Ryota"], ["Scott", "Scott"]].forEach(([v, t]) => { const o = h("option", "", t); o.value = v; who.appendChild(o); }); whoL.appendChild(who); row.appendChild(whoL);
    const wkL = h("label", "", "Week"); const wk = document.createElement("select"); for (let i = 1; i <= 18; i++) { const o = h("option", "", "Week " + i); o.value = i; wk.appendChild(o); } wkL.appendChild(wk); row.appendChild(wkL);
    let topicSel = null;
    if (opts.topicSelect) { const tL = h("label", "", "About"); topicSel = document.createElement("select"); TOPICS.forEach(t => { const o = h("option", "", LABEL[t]); o.value = t; topicSel.appendChild(o); }); tL.appendChild(topicSel); row.appendChild(tL); }
    compose.appendChild(row);
    const replying = h("div", "bd-replying"); const replyMsg = h("span"); const cancel = h("button", "", "cancel"); cancel.type = "button"; replying.appendChild(replyMsg); replying.appendChild(cancel); compose.appendChild(replying);
    const ta = document.createElement("textarea"); ta.maxLength = 600; ta.rows = 1; ta.placeholder = opts.chips ? "What do you see this week?" : "Say something about " + label.toLowerCase() + "…"; compose.appendChild(ta);
    const row2 = h("div", "bd-row"); row2.style.justifyContent = "space-between";
    const cnt = h("span", "bd-count", "0 / 600"); const hint = h("span", "bd-hint", "Enter sends · Shift+Enter for a new line"); const postBtn = h("button", "bd-post", "Post"); postBtn.type = "button";
    const left = h("div", "bd-row"); left.appendChild(cnt); left.appendChild(hint); row2.appendChild(left); row2.appendChild(postBtn); compose.appendChild(row2);
    body.appendChild(compose);
    const status = h("div", "bd-status"); const dot = h("span", "bd-dot"); const msg = h("span", "", "Connecting to the board…"); status.appendChild(dot); status.appendChild(msg); body.appendChild(status);
    const list = h("div"); body.appendChild(list);

    who.value = store.get("board-who"); wk.value = store.get("board-week") || String(opts.week); if (!wk.value) wk.value = String(opts.week);
    who.addEventListener("change", () => store.set("board-who", who.value)); wk.addEventListener("change", () => store.set("board-week", wk.value));
    if (topicSel) topicSel.value = filter === "all" ? "general" : filter;
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, window.innerHeight * 0.4) + "px"; };
    ta.addEventListener("input", () => { cnt.textContent = ta.value.length + " / 600"; grow(); });
    ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); post(); } });
    cancel.addEventListener("click", () => { replyTo = ""; replying.classList.remove("on"); });
    postBtn.addEventListener("click", post);

    function setDb(state, text) { dot.className = "bd-dot " + state; msg.textContent = text + (opts.ver ? " Board " + opts.ver + "." : ""); }
    function visible() { return posts.filter(p => filter === "all" || topicOf(p) === filter); }
    function updateCount() { const n = visible().length; const c = el.dataset.collapsed === "1"; count.textContent = n + (n === 1 ? " comment" : " comments") + (opts.collapsible ? (c ? " · tap to open" : " · tap to close") : ""); }

    function weekSection(w) {
      let sec = list.querySelector('section[data-week="' + w + '"]'); if (sec) return sec;
      sec = h("section", "bd-week"); sec.dataset.week = w; const hh = h("h3", "", "Week " + w); hh.appendChild(h("small", "bd-n")); sec.appendChild(hh);
      const after = [...list.querySelectorAll("section.bd-week")].find(x => Number(x.dataset.week) < w); list.insertBefore(sec, after || null); return sec;
    }
    function makeArticle(p, byId) {
      const a = h("article", "bd-post " + p.person); a.id = "bd-" + p.id; a.dataset.t = p.t;
      const meta = h("div", "bd-meta"); meta.appendChild(h("b", "", p.person)); if (p.person === "Mack") meta.appendChild(h("span", "bd-badge", "Mack")); meta.appendChild(h("span", "", fmt(p.t)));
      if (opts.showTopic) meta.appendChild(h("span", "bd-tag", LABEL[topicOf(p)] || topicOf(p)));
      a.appendChild(meta);
      if (p.reply_to && byId[p.reply_to]) { const q = byId[p.reply_to]; a.appendChild(h("div", "bd-quote", q.person + ": " + (q.text.length > 140 ? q.text.slice(0, 140) + "…" : q.text).split("\n").filter(l => !SIG_RE.test(l.trim())).join("\n"))); }
      const tx = h("div", "bd-text"); renderText(tx, p.text); a.appendChild(tx);
      const r = h("button", "bd-reply", "Reply"); r.type = "button"; r.addEventListener("click", () => startReply(p)); a.appendChild(r);
      return a;
    }
    function render(reset) {
      if (reset) { list.textContent = ""; rendered = {}; }
      const empty = list.querySelector(".bd-empty"); if (empty) empty.remove();
      const show = visible(); const byId = {}; posts.forEach(p => byId[p.id] = p); const showIds = {}; show.forEach(p => showIds[p.id] = 1);
      Object.keys(rendered).forEach(id => { if (!showIds[id]) { rendered[id].remove(); delete rendered[id]; } });
      show.forEach(p => {
        const cur = rendered[p.id];
        if (cur) { const tx = cur.querySelector(".bd-text"); if (tx.dataset.text !== p.text) { renderText(tx, p.text); tx.dataset.text = p.text; } return; }
        const sec = weekSection(p.week), a = makeArticle(p, byId); a.querySelector(".bd-text").dataset.text = p.text;
        const before = [...sec.querySelectorAll("article")].find(x => x.dataset.t < p.t); sec.insertBefore(a, before || null); rendered[p.id] = a;
      });
      list.querySelectorAll("section.bd-week").forEach(sec => { const n = sec.querySelectorAll("article").length; if (!n) { sec.remove(); return; } sec.querySelector(".bd-n").textContent = n + (n === 1 ? " post" : " posts"); });
      if (!show.length) list.appendChild(h("p", "bd-empty", "No posts yet. Start the thread."));
      updateCount();
    }
    function startReply(p) {
      replyTo = p.id; replyMsg.textContent = "Replying to " + p.person + ": " + (p.text.length > 60 ? p.text.slice(0, 60) + "…" : p.text.split("\n")[0]); replying.classList.add("on"); wk.value = p.week; if (topicSel) topicSel.value = topicOf(p);
      compose.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); } }, 450);
    }
    async function load(quiet) {
      try {
        const r = await fetch(STORE + "?board=1&t=" + Date.now(), { cache: "no-store" }); const j = await r.json();
        if (!j.ok) throw new Error(j.error || "store error");
        posts = j.posts || []; render(false);
        if (!quiet) setDb("on", "Connected. Same thread on every device.");
      } catch (e) { setDb("off", "Could not reach the board just now, showing what loaded last. Retrying in 20 s."); updateCount(); }
    }
    async function post() {
      const person = who.value, text = ta.value.trim(), week = Number(wk.value), topic = topicSel ? topicSel.value : opts.topic;
      if (!person) { setDb("off", "Pick your name first."); who.focus(); return; }
      if (!text) { ta.focus(); return; }
      if (!pendingId) pendingId = newId();
      let key = store.get("board-key");
      if (!key) { key = (prompt("Board key (ask Scott or Mack once; it is remembered on this device):") || "").trim(); if (!key) return; store.set("board-key", key); }
      postBtn.disabled = true; setDb("", "Posting…");
      try {
        const u = STORE + "?board=1&key=" + encodeURIComponent(key) + "&id=" + encodeURIComponent(pendingId) + "&person=" + encodeURIComponent(person) + "&week=" + week + "&topic=" + encodeURIComponent(topic) + "&text=" + encodeURIComponent(text) + "&reply_to=" + encodeURIComponent(replyTo) + "&t=" + Date.now();
        const r = await fetch(u, { cache: "no-store" }); const j = await r.json();
        if (!j.ok) {
          if (j.error === "bad key") { store.del("board-key"); throw new Error("that board key was not accepted, try again"); }
          if (j.error === "slow down") throw new Error("the board is busy, wait a minute");
          if (j.error === "links only") throw new Error("add a few words with the link");
          throw new Error(j.error || "store error");
        }
        pendingId = ""; ta.value = ""; cnt.textContent = "0 / 600"; grow(); replyTo = ""; replying.classList.remove("on");
        await load(true); setDb("on", "Posted at " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".");
      } catch (e) { setDb("off", "Post did not save (" + (e && e.message ? e.message : e) + "). Your text is still in the box."); }
      postBtn.disabled = false;
    }
    load(false); timer = setInterval(() => load(true), 20000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) load(true); });
    return { reload: () => load(true), destroy: () => clearInterval(timer) };
  }
  window.Board = { mount, TOPICS, LABEL };
})();
