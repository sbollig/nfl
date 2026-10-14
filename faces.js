// Friend faces next to names (Scott 2026-10-14: "add this one as a crop next to Ryota's name everywhere in the site").
// Wraps each "Name" text in <span class="who"><img>Name</span>; a MutationObserver re-applies it when the picks board re-renders.
(function () {
  const base = document.currentScript.src.replace(/faces\.js.*$/, ""), ver = (document.currentScript.src.split("?v=")[1] || "");
  const FACES = { Ryota: "img/ryota.jpg", Scott: "img/scott.jpg", Todd: "img/todd.jpg", Mack: "img/mack.svg" };   // Mack = robot coach (Scott 10/14: "make your pic a robot pic")   // Todd pending Scott's confirmation of the photo
  const only = (document.currentScript.dataset.only || "").split(",").filter(Boolean);   // e.g. data-only="Todd": limit a page to these faces
  if (only.length) for (const k of Object.keys(FACES)) if (!only.includes(k)) delete FACES[k];
  const SKIP = "script,style,title,textarea,select,option,input,.who,dialog,.inj,.mu,.pm,.pmr,.ihp,.pl,.numbers,.chip,footer,.byline,h1,h2";   // player areas: an NFL player named Scott must not get the face
  const re = new RegExp("\\b(" + Object.keys(FACES).join("|") + ")\\b");
  const css = document.createElement("style");
  css.textContent = ".who{white-space:nowrap}.who img{width:1.9em;height:1.9em;border-radius:50%;object-fit:cover;vertical-align:-.55em;margin-right:.35em;border:2px solid #FB4F14;background:#fff;cursor:zoom-in}"
    + ".tile .who{display:flex;flex-direction:column;align-items:flex-start;gap:4px}.tile .who img{width:56px;height:56px;margin:0;vertical-align:0}"   // score boxes: big face above the name (Scott 10/14: "the pics are so small")
    + "dialog.face{border:3px solid #FB4F14;border-radius:14px;background:#0d2f57;color:#fff;padding:16px;text-align:center;font:600 20px Barlow,system-ui,sans-serif}dialog.face::backdrop{background:rgba(0,10,25,.65)}"
    + "dialog.face img{width:min(280px,70vw);height:min(280px,70vw);border-radius:50%;object-fit:cover;border:4px solid #FB4F14;display:block;margin:0 auto 10px}";
  document.head.appendChild(css);
  function apply(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      re.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const hits = []; while (w.nextNode()) hits.push(w.currentNode);
    for (const t of hits) {
      const m = t.nodeValue.match(re); if (!m) continue;
      const after = t.splitText(m.index); after.splitText(m[1].length);
      const s = document.createElement("span"); s.className = "who";
      const img = document.createElement("img"); img.src = base + FACES[m[1]] + "?v=" + ver; img.alt = ""; img.loading = "lazy";
      s.append(img, m[1]); after.replaceWith(s);
      if (re.test(s.nextSibling && s.nextSibling.nodeValue || "")) apply(s.parentNode);   // a second mention in the same text
    }
  }
  let dlg = null;   // tap a face to see it large
  document.addEventListener("click", e => {
    const img = e.target.closest && e.target.closest(".who img"); if (!img) { if (dlg && e.target === dlg) dlg.close(); return; }
    e.preventDefault(); e.stopPropagation();
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "face"; dlg.addEventListener("click", () => dlg.close()); document.body.appendChild(dlg); }
    dlg.innerHTML = `<img src="${img.src}" alt="">${img.parentElement.textContent.trim()}`; dlg.showModal();
  }, true);
  const go = () => { apply(document.body); new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 || n.nodeType === 3) apply(n.nodeType === 1 ? n : n.parentNode || document.body); }).observe(document.body, { childList: true, subtree: true }); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
})();
