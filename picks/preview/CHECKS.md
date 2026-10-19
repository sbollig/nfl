# Preview deck — verification log · 2026-10-19 · Prepared by: Mack

Page: `picks/preview/index.html` (879 lines) built from `picks/week6.html` by an exact-string substitution script
(`~/.claude/jobs/cd6a5e83/tmp/build_preview.py`; every anchor asserted to exist exactly once). Spec: `~/PKA/analysis/2026-10-19-nfl-wallet-board-spec.md`.
Screenshots and temp files: `/Users/sbollig/.claude/jobs/cd6a5e83/tmp/`.

## 1. Node harness (spec §5.1)
- `node --check` on the extracted inline script → parse ok.
- Tuesday harness JS (the `js = r'''…'''` block of `scripts/nfl_tuesday_check.py`, copied to `tmp/harness.js`) run against the preview → **`rendered 14 cards`** (Week 6 has 14 games; the live `week6.html` prints the same 14 as a control). It evals `const GAMES…const LOGO`, `const lockAt`, `const started`, `const num…function grade`, `function grade…function render`, `function card…function tiles`, `function tiles…const WEEK` with the stub `$`; every card contains `<label class="lbl">Mack</label>`, a typed final yields `final`, `tiles()` output contains `Finals in`.

## 2. WebKit renders (spec §5.2) — `scripts/webkit_snap`, local `http.server 8765`, killed after
| File | Size | What it shows |
|---|---|---|
| `tmp/phone-collapsed.png` | 390×2400 | Default deck: Week tally open (5 tiles, 👑 on Ryota), Last week / Mack's record / slate cards collapsed, 14 team-colored game strips stacked with the −10 px overlap. Game strips measure 64–65 px (`.hd` heights read by JS); tally strips 69–71 px. `scrollWidth` 390. |
| `tmp/phone-expanded.png` | 390×2600 | `g03` (Bears–Falcons) expanded after `.strip.click()`: score inputs, numbers, matchup table, playmakers, injuries with headshots, pick chips, selects (Todd/Ryota/Scott + Mack read-only row). `aria-expanded="true"`, body 1359 px. |
| `tmp/phone-live.png` | 390×900 | Simulated in-run data: `LIVE.g03` live (14 · 7:31 3rd · 10, 🏈 possession, "Mack leads · 2 pts" pill) and `state.g04` typed final (Ravens 20 Final 17 Browns, `.final`, "Mack won · 2 pts"); slate strip "Mack leads · 4 pts"; week strip re-sorted "Mack 2 · Todd 1 · 👑 Ryota 0 · Scott 0"; slate body table + "Finals in 1 / 7". Strips with scores stay 69 px (record hidden, logo hidden on phone). |
| `tmp/phone-seeded.png` | 390×1600 | After seeding `localStorage["wk99-deck"] = {order:["sl-Mondaynight","g14","week","g03","bogus"],open:{week:false,g14:true}}` in one run and reloading in a fresh run: deck order came back `sl-Mondaynight, g14, week, last, mack, sl-Thursdaynight, …` (unknown `bogus` dropped, missing ids slotted after their default predecessor), only `g14` open. |
| `tmp/desktop.png` | 1280×2000 | Deck 720 px centered; `g01` expanded with the matchup table in column 2 (`grid-template-columns: 332px 332px`); the `⋯` menu open on the week card (Move to top / up / down · Collapse all / Expand all). |
| `tmp/phone-360.png` | 360×1400 | All cards expanded: `scrollWidth` 360 (no horizontal scroll); selects 40 px, Mack's read-only selects 40 px, props inputs 40 px, score inputs 52 px. |

Menu actions exercised by JS (`act()`): Move up on `g03`, Move to top on `sl-Sunday10AM` moved the slate **and** its 6 following game cards as a block, Expand all → 23 open, Collapse all with `#as-g03` focused left only `g03` open, Reset order restored the default order, only `week` open, storage key removed.
Harness caveat: inside `webkit_snap` the view is hidden (`document.hidden === true`, rAF never fires), so CSS transitions never tick; a strip click in the same run only renders after `transition:none` is applied inline — the class/aria flip and layout were verified either way (`tmp/phone-expanded-notrans.png` and probe log in `tmp/server.log`).

## 3. Firefox (spec §5.3)
`firefox --headless --new-instance --profile tmp/ffprof --screenshot tmp/firefox-390.png --window-size=390,2400` → `tmp/firefox-390.png`: same deck layout as WebKit (tiles, stacked strips, team colors, faces).

## 4. Store safety (spec §5.4)
- `grep -n 'week=6\|wk06\|WEEK = 6' index.html` → no matches. Line 701: `const WEEK = 99, KEY = "wk99-cache", BOARD_VER = "v116";`
- Resource log from the loaded page (`performance.getEntriesByType("resource")`): `…/exec?week=99`, `…/exec?ping=1&ver=v116&ev=load…`, ESPN scoreboard `…&week=99`, `/version.txt`. Nothing touches week 6. Store replied ok, `data:{}` ("Connected to the shared board … Board v116").
- Sandbox localStorage (`wk99-deck`, `wk99-cache`) cleared in the test browser after the runs. No synthetic input/change events were sent to the live `week6.html`.
- `git status`: only `picks/preview/` is new; `week6.html`, `index.html`, `version.txt`, `~/PKA/scripts`, `AITeam/Village/NFL_PicksStore` untouched (md5 of week6.html 11b2efde80c842abc5507d9e6e85bdd0).

## 5. Anchors (spec §0.3 / §5.5) — what survived and what changed
Unchanged (verified by grep): `<title>Week 6 Board</title>` · `<div class="lbl">NFL 2026 · Week 6 · ratings after Week 5 (all 15 final)</div>` · `<h1>Week 6 <span>Board</span></h1>` · `(via ESPN, fetched Oct 14 9:13 AM PT)` · `picks/week6.html" aria-current="page">Week 6 Picks` (×2) · `<!-- LASTWEEK -->…<!-- /LASTWEEK -->` with its `<section class="rec">` · Mack's record section with `<div class="recrow">\n … \n    </div>` (same order, same indentation) · `// Game data: from …` · `const GAMES = [` one game per line, `const HS = …` then `const LOGO=…` · `const lockAt`, `const started`, `const num` one-liners · `function grade` → `function render` → `function card` → `function tiles` → `const WEEK = …, KEY = "wkNN-cache", BOARD_VER = "v116";` · footer `depth chart. "Depth piece" … Fetched Oct 18.</p>` and `<p><b>QB notes applied.</b> …</p>` · `v=116"` on all four asset refs and `"v116"` · all `data-id`, `as-/hs-/su-P-/ats-P-/ou-P-/sk-/tk-`, `#sv- #lk- #ld- #at- #pa- #ph-`, `sl-…`, `#dbdot/#dbmsg`.

Changed (before → after):
1. Asset/nav/link paths, one level deeper (spec §4): `../theme.css?v=116` → `../../theme.css?v=116` (same for players.css, players.js, faces.js); nav `href="../…"` → `href="../../…"` (both navs); `<a href="../picks/week5.html">` → `../../picks/week5.html`; `fetch("../version.txt?t="` → `fetch("../../version.txt?t="`; game data `pre:"../broncos/week6.html"` → `pre:"../../broncos/week6.html"` (the only data edit). The Week 7 builder writes to `picks/week7.html`, so when this file becomes the template these must go back to `../` (one `s.replace("../../", "../")` on the head/nav/version lines, or build the template from `picks/`).
2. `<div class="preview-banner">PREVIEW · test board · picks here go to a sandbox, not the real week</div>` inserted on its own line after the `<h1>` (spec's one-line `re.sub` removes it).
3. Static `<section class="tiles" id="tiles"></section>` + `<div class="status">…</div>` + `<div id="windows"></div>` → `<div class="toolbar">` (status + `#reset-order` button) + `<div id="deck" class="deck">`. `#tiles` is now created inside the week card body at render; `tiles()` still writes `$("#tiles").innerHTML` with `"Finals in"` and `"/ " + GAMES.length`.
4. `slateInfo(w)` return gains `pts` and `finals` (same loop; `slateText/slateClass` unchanged). New helpers between `grade()` and `render()`: `deck`, `defaultOpen`, `isOpen`, `ctlHTML`, `hdHTML`, `bodyHTML`, `tally()` (the points loop lifted verbatim out of `tiles()`; `tiles()` now reads it), `weekStripText`, `slateBody`, `refreshStrips` (DOM-guarded). `render()` rewritten (deck build, moves the two `.rec` sections into their cards with `appendChild`, derives the Last-week / Mack strip text from their text, `applyOrder()`, `tiles()`). `card()` returns `<article class="g dk pick-… [open]" data-id>` = `.hd` (strip button + controls) + `.body > .bi > .bc` (today's body markup, ids unchanged; `.kick/#lk-/#ld-/#at-/#pa-/#ph-` now live in the strip; new `#sa-/#sh-` strip score spans).
5. `focusout`: `if (e.target.tagName !== "SELECT") dirty.add(id)` → `if (e.target.tagName === "INPUT") dirty.add(id)` — a strip/menu button losing focus must not rebuild the card (same regrade-on-typed-score behavior).
6. `liveScores()`: after the `#pa-/#ph-` line, also patches `#sa-/#sh-` strip scores (only when no typed final), and calls `refreshStrips()` after the slate loop.
7. Footer copy: "Card colours … colours … colours" → "Card colors … colors … colors" (US English, spec §0.6; not a builder anchor).
8. CSS: the `@media (min-width:900px)` block now targets `.g.has-mu .bc` (body grid) instead of `.g.has-mu`; deck CSS appended before `</style>`.

Not done / notes:
- Live ESPN scores use `week=99` (tied to `WEEK` as today), so the preview shows no real live scores until it becomes the Week 7 template; live strips were verified with injected `LIVE`/`state` data instead.
- Drag-to-reorder (pointer events, 250 ms touch hold, auto-scroll near edges, slate group drag) is implemented but could only be reviewed by reading the code; the headless harness has no pointer. The `⋯` menu and `⤒` (hidden ≤480 px; the menu carries Move to top) are the verified fallbacks.
