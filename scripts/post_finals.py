#!/usr/bin/env python3
"""post_finals.py — post each NFL final to the shared picks board as ESPN marks the game complete.
Runs on GitHub Actions every 5 minutes (.github/workflows/finals.yml), so no Village machine has to be awake
(Scott 2026-10-18: "my laptop was closed" / "build it on GitHub"). Trimmed from ~/PKA/scripts/nfl_finals_post.py:
game order comes from picks/games.json in this repo (written by nfl_picks_board.py), the board is the only state.
Rules: write only when ESPN says completed AND the board has no score for that game; a score anyone typed is never
overwritten (a disagreement is logged as MISMATCH). Each write is read back. The props row g99 stays with the laptop job.
Usage: post_finals.py [--dry-run]
"""
import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

STORE = "https://script.google.com/macros/s/AKfycbwy0C0StLOn41vJQOeqBElzg1QyAu84evLOujqtUO_0bKWTL3v_WS-YBCjaUgnvhjat/exec"
ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
GAMES = Path(__file__).resolve().parent.parent / "picks" / "games.json"
DRY = "--dry-run" in sys.argv


def log(msg):
    print(time.strftime("%Y-%m-%d %H:%M:%S") + " " + msg, flush=True)


def get(url, params=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "nfl-finals/1.0"}), timeout=45) as r:
        body = r.read().decode("utf-8")
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        raise RuntimeError(f"non-JSON from {url[:60]}: {body[:80]!r}")


def finals(week):
    """{(away, home): (away_score, home_score)} for completed games of a regular-season week."""
    out = {}
    for e in get(ESPN, {"week": week, "seasontype": 2}).get("events", []):
        if not e["status"]["type"].get("completed"):
            continue
        t = {c["homeAway"]: c for c in e["competitions"][0]["competitors"]}
        out[(t["away"]["team"]["name"], t["home"]["team"]["name"])] = (str(t["away"]["score"]), str(t["home"]["score"]))
    return out


def main():
    gj = json.loads(GAMES.read_text())
    week = int(gj["week"])
    fin = finals(week)
    board = get(STORE, {"week": week, "t": int(time.time())})
    if not board.get("ok"):
        raise RuntimeError(f"store error: {board}")
    data = board.get("data", {})
    todo = [(g["id"], (g["away"], g["home"])) for g in gj["games"] if (g["away"], g["home"]) in fin]
    posted = 0
    for gid, key in todo:
        row = data.get(gid, {})
        a, h = fin[key]
        if row.get("as") or row.get("hs"):
            same = (row.get("as"), row.get("hs")) == (a, h)
            if not same:
                log(f"wk{week} {gid} {key[0]}@{key[1]}: board has a score (MISMATCH with ESPN final, left as typed)")
            continue
        if DRY:
            log(f"wk{week} {gid} {key[0]}@{key[1]}: would post final")
            continue
        get(STORE, {"week": week, "game": gid, "as": a, "hs": h})
        time.sleep(2)
        back = get(STORE, {"week": week, "t": int(time.time())})["data"].get(gid, {})
        if (back.get("as"), back.get("hs")) == (a, h):
            posted += 1
            log(f"wk{week} {gid} {key[0]}@{key[1]}: final posted and read back")
        else:
            log(f"wk{week} {gid} {key[0]}@{key[1]}: write did NOT read back; will retry next run")
    log(f"wk{week}: {len(fin)} finals on ESPN, {len(todo)} on this board, {posted} posted now")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"error: {e}")
        sys.exit(1)
