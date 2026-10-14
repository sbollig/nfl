// Friend faces next to names (Scott 2026-10-14: "add this one as a crop next to Ryota's name everywhere in the site").
// Wraps each "Name" text in <span class="who"><img>Name</span>; a MutationObserver re-applies it when the picks board re-renders.
(function () {
  const base = document.currentScript.src.replace(/faces\.js.*$/, ""), ver = (document.currentScript.src.split("?v=")[1] || "");
  const FACES = { Ryota: "img/ryota.jpg", Scott: "img/scott.jpg" };   // Todd pending Scott's confirmation of the photo
  const SKIP = "script,style,title,textarea,select,option,input,.who,dialog,.inj,.mu,.pm,.pmr,.ihp,.pl";   // player areas: an NFL player named Scott must not get the face
  const re = new RegExp("\\b(" + Object.keys(FACES).join("|") + ")\\b");
  const css = document.createElement("style");
  css.textContent = ".who{white-space:nowrap}.who img{width:1.35em;height:1.35em;border-radius:50%;object-fit:cover;vertical-align:-.3em;margin-right:.3em;border:1.5px solid #FB4F14;background:#fff}";
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
  const go = () => { apply(document.body); new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 || n.nodeType === 3) apply(n.nodeType === 1 ? n : n.parentNode || document.body); }).observe(document.body, { childList: true, subtree: true }); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
})();
