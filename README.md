# Handoff: The Hustle — Golf Match Tracker

## Overview
The Hustle is a mobile-first app for tracking golf matches among a private group of up to 12 players: individual 9-hole and 18-hole rounds plus multi-day tournaments, with configurable side-bet games (Nassau, Wolf, 6-6-6, Skins, T&A/Vegas), configurable "junk" (birdies, greenies, sandies, polies, RRC, plus arbitrary custom junk), auto-computed net scoring from course/tee data, live standings, presses, greenie-sweep tracking, and a match/tournament history archive.

## About the Design Files
The files in `design/` are **design references built in HTML** (a single-file interactive prototype, `The Hustle.dc.html`, using a lightweight in-house template runtime — `support.js` is part of that prototyping tool, not a library to ship). They demonstrate exact layout, copy, colors, spacing, and interaction/animation behavior with mock data and simulated live updates. **Do not ship the HTML as-is.** The task is to recreate this design in a real, deployable web app — this handoff assumes **Next.js (React) + Supabase**, deployed on **Vercel**, per the user's request. If you use a different stack, keep the same screens, data model, and interaction behavior described below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and animation/notification behavior in the HTML prototype are final — recreate them pixel-for-pixel. The only things that are mocked (and need real implementations) are: authentication/authorization, persistence, realtime sync across devices, and the course-data lookup (currently a hardcoded 4-course sample standing in for the GolfCourseAPI integration).

## Visual System
- **Palette**: navy `#0f2a4a` (headers, nav bar, primary actions), gold `#d4a017` (live/highlight accents), cream/off-white background `#fbfaf7` / `#e5e2da`, card white `#fff`, muted text `#98928a`, dark text `#1a2733`, red `#c8102e` (negative values, delete, Start Event), green `#1e7a3d` (positive values).
- **Typography**: Archivo (weights 500–900) for UI labels/numbers, Archivo Black for the "MONEY BALLS" wordmark and big celebratory numbers, Georgia (serif) for scorecard numerals and dollar values — this serif/sans mix is a deliberate, consistent pairing throughout.
- **Shape language**: 10–12px card radii, 20px pill radii for chips/tags, soft shadows (`0 1px 2px rgba(15,42,74,.06)` on cards), no heavy borders except the 1.5px gold/navy accents used for emphasis (current hole, active toggle states, alert cards).
- **Device frame**: designed at 390×844 (iPhone-class viewport) — build mobile-first, responsive up to tablet, and it should also work acceptably as an installable PWA.

## Screens / Views
All screens share a navy status/header bar and a bottom nav bar (also navy, white icons/labels at full or 50% opacity for active/inactive).

### 1. Leaderboard ("board")
- Header: "MONEY BALLS" wordmark, gold "LIVE" pill, subheader line `{{COURSE}} · {{ROUND TYPE LABEL}} · THRU {{n}}`.
- Segmented control (LEADERBOARD / SCORECARD) directly under the header — this is the primary screen switcher for those two views.
- Horizontal scroll row of active-game chips (e.g. "NASSAU $10").
- Conditional gold-bordered "GREENIE SWEEP" banner when a sweep is in progress/achieved — tapping replays the full-screen celebration.
- Scrollable list of player rows: rank, initials avatar, name, `THRU n · GROSS g · CH x · y STROKES`, and net score (red if under par, black/navy if even or over — this rule is explicit and must be preserved).

### 2. Scorecard ("card")
- Same header, same LEADERBOARD/SCORECARD segmented control.
- Two-row hole strip: holes 1–9 on top, 10–18 below; current hole highlighted navy with gold border; holes with any score entered get a gold dot.
- Hole info line: `Hole n · Par p · Handicap si`.
- On par-3 holes (only if the Greenies junk bet is active): a "GREENIE — CLOSEST TO THE PIN (must also par)" row of tappable player-initial chips.
- Per-player rows with −/+ stroke steppers and a "stroke here" gold indicator when that player receives a handicap stroke on this hole.
- Footer: "CALL PRESS" button (toggles a player-picker to log who called a press) and "SAVE & NEXT HOLE" (navy, primary).

### 3. Wagering ("games")
- Header with back arrow → Leaderboard.
- ROUND TYPE card: 9 HOLES / 18 HOLES / TOURNAMENT segmented control; TOURNAMENT reveals a numeric "days" field.
- EVENT NAME text input.
- Red "START EVENT" button → navigates to Leaderboard and resets to hole 1.
- NASSAU card: on/off toggle, three currency inputs (FRONT / BACK / OVERALL).
- 6-6-6 card: on/off toggle, per-hole $ value, and (when on) a "SHOW/HIDE PAIRINGS" toggle revealing auto-generated rotating partner pairings per 4-player group across HOLES 1–6 / 7–12 / 13–18 (the standard round-robin: for players W/X/Y/Z → W+X vs Y+Z, then W+Y vs X+Z, then W+Z vs X+Y).
- WOLF / SKINS / T&A-VEGAS cards: label, sub-copy, $ value, on/off toggle.
- JUNK section: BIRDIES ("For birdie or better."), GREENIES ("Closest on the par 3s — must also par the hole."), SANDIES ("Par or better from a bunker"), POLIES ("Made putt longer than the flagstick."), RRC ("Rolling card — awarded for a gross birdie", shows current holder's name once assigned) — each with $ value input and on/off toggle. Below the list: a free-text input + "ADD" button to create arbitrary custom junk bets, each rendered with its own $ value, toggle, and a red "×" delete button.

### 4. Settings ("settings")
- Header with back arrow → Leaderboard. **No password gate** — open access.
- SCORING MODE card: GROSS / FULL HDCP / LOW HDCP segmented control (see Scoring Rules below).
- ROSTER section: up to 12 players, each showing initials, name, index, tee (with a per-player tee dropdown sourced from the selected course's available tees), and an active/benched toggle. "+ ADD PLAYER" form (name, index, tee) with a 12-player cap message.
- COURSE section: current course name + its tees with rating/slope, a "SYNCED VIA GOLFCOURSEAPI" badge, and "CHANGE" → search UI listing matching courses (name, par, tees, rating/slope) to select from.

### 5. History ("history")
- Header with back arrow → Leaderboard.
- Expandable list of past rounds/tournaments: title, date, course, format, and (expanded) a payouts breakdown per player (green `+$` / red `-$`).

## Interactions & Behavior
- **Segmented control** (Leaderboard/Scorecard): switches `screen` state; active = navy bg/white text, inactive = light gray bg/muted text.
- **Hole strokes**: tapping −/+ mutates that player's gross score for the current hole; defaults to par if unset.
- **Net scoring recompute**: any score change recomputes standings live for all connected clients (see State Management).
- **Greenie selection**: tapping a player chip on a par-3 hole toggles them as the closest-to-pin winner for that hole (tap again to unset). The greenie only "counts" once that player's score on the hole is ≤ par.
- **Greenie sweep logic** (must be preserved exactly):
  1. The first player to earn a *valid* greenie (closest + par-or-better) on any par-3 becomes the sweep candidate. Fire a "GREENIE SWEEP ALIVE" toast (gold-bordered, slides down from top, auto-persists until dismissed) naming them and showing `x of y par-3s`.
  2. If the same candidate earns every subsequent par-3's valid greenie, re-fire the "still alive" toast each time, until...
  3. ...they've won **all** par-3s in the round, at which point fire the full-screen gold "GREENIE SWEEP" celebration (dismissable, and the Leaderboard's banner becomes tap-to-replay).
  4. If a *different* player earns a valid greenie at any point, the sweep is dead: fire a navy/red "GREENIE SWEEP DEAD" toast naming both the new winner and the player whose sweep just broke, and no further sweep notifications fire that round.
  5. A par-3 where the closest-to-pin player did **not** par the hole does not affect the sweep either way (no valid winner recorded).
- **RRC ("Rolling Card")**: a rolling piece of junk. Any time a player records a **gross** birdie (never counted on a net birdie) and isn't already the holder, they become the new RRC holder. Fire a full-screen takeover: congratulate the new holder; if there was a previous holder, needle them by name ("well played, clown").
- **Press**: "CALL PRESS" reveals player chips; tapping one logs `{hole, player}` and fires a gold-bordered toast "PRESS CALLED — {name} called a press on hole {n}". Presses are additive (Nassau-style double-the-bet-from-here semantics) — persist the log; computing the resulting payout adjustment is a scoring-engine detail left to the implementer, but the log itself must be visible/auditable.
- **Stroke alert toast**: when advancing to a new hole, if any player(s) receive a handicap stroke there, fire a gold-bordered toast "STROKES ON #{n}" listing them.
- **Course change**: selecting a different course swaps par, stroke index, and per-tee slope/rating everywhere (Leaderboard header, Scorecard, and all net-handicap math) instantly.
- **Round type**: 9 HOLES / 18 HOLES / TOURNAMENT selection changes the Leaderboard subheader label; TOURNAMENT additionally tracks a day count and (per the data model below) should let each day carry its own scores/course while rolling up into one event history entry.
- **Animations**: toasts slide down from the top (`translateY(-100%)→0`, ~0.25s ease-out) and auto-stack above content (z-index 20); full-screen celebrations (RRC, Sweep) pop in (`scale(.92)→1` + fade, ~0.3s ease-out) over a navy full-bleed background (z-index 30) and require an explicit CLOSE tap to dismiss.

## State Management
Represent per-event (a single day's round, or one day within a multi-day tournament) at minimum:
- `roster`: players `{id, name, initials, index, tee, active}` — shared across the whole club/group, not per-event (players persist across events; `active` is per-event/per-day participation).
- `course`: selected course + tee set (par[18], strokeIndex[18], tees `{name: {rating, slope}}`).
- `roundType`: `'9' | '18' | 'tournament'`, `tournamentDays` (int), `eventName` (string).
- `scoringMode`: `'gross' | 'full' | 'low'`.
- `scores`: per player per hole gross strokes.
- `games`: Nassau (front/back/overall $, active), 6-6-6 ($ value, active), Wolf/Skins/Vegas ($ value, active).
- `junk`: birdies/greenies/sandies/polies/rrc (value, active) + arbitrary custom junk entries (id, label, value, active).
- `greenieWinners`: per par-3 hole → player id (closest-to-pin), plus derived sweep candidate/count/dead state.
- `rrcHolder`: current holder player id.
- `presses`: append-only log of `{hole, playerId, timestamp}`.
- `history`: archive of completed events with final payouts per player — **must be immutable once written** (true historical preservation, match-over-match and year-over-year — do not let later edits to a live event mutate archived history rows).

### Net scoring rules (must match exactly)
- **Gross**: no strokes applied; net = gross.
- **Full handicap**: each player's course handicap = `round(index × slope / 113)` for their selected tee; a player gets a stroke on a hole where that hole's stroke-index ≤ their course handicap (with a second stroke if course handicap > 18, etc. — standard allocation).
- **Low handicap ("spin off the lowest")**: same course-handicap math, but subtract the lowest course handicap among today's active players from everyone's, so the low-handicap player plays scratch and everyone else gets the *difference*.
- Course handicap always derives from the **selected tee's slope**, recomputed live if a player's tee or the course changes.

## Realtime & Multi-user Requirements
This is a hard requirement from the original spec, not optional: **all players see the same live state.** Any player can enter scores after a hole and standings update for everyone in real time — implement via Supabase Realtime (Postgres changes) subscriptions on `scores`, `greenie_winners`, `presses`, `games`, and `junk_items` for the active event. Push notifications (sweep alive/dead, RRC awarded, stroke alerts, press called) should be triggered by whichever client made the write, but **received/displayed by all connected clients** — implement as either (a) Supabase Realtime broadcast/presence channels carrying ephemeral notification events, or (b) a `notifications` table each client subscribes to and marks read.

## Design Tokens
- Colors: `#0f2a4a` (navy/primary), `#d4a017` (gold/accent), `#fbfaf7` (card bg / app bg light), `#e5e2da` (app shell bg), `#98928a` (muted text), `#1a2733` (dark text), `#c8102e` (red/negative/delete), `#1e7a3d` (green/positive), `#e9e5dc` (hairline borders), `#f3f1ea` (input/inset bg).
- Radii: 6px (small controls/toggles), 10–12px (cards), 20px (pill chips), 30px (device shell corner, if kept).
- Shadow: `0 1px 2px rgba(15,42,74,.06)` (cards), `0 12px 30px rgba(0,0,0,.3)` (toasts), `0 24px 60px rgba(15,42,74,.28)` (device shell).
- Fonts: Archivo (500/600/700/800/900), Archivo Black, Georgia (system serif, no import needed).

## Assets
- `icons/wagering-white.png`, `icons/history-white.png` — user-supplied bottom-nav icons (masked to solid white via CSS `mask-image`, sized 23–29px in a fixed 23×23 alignment box so labels stay baseline-aligned). Settings uses an inline SVG cog (no asset).
- Course data currently mocked as a small in-file object (`COURSE_DB`) standing in for the real GolfCourseAPI (https://www.golfcourseapi.com) integration — see Supabase section below for how to wire the real thing.

## Files in This Bundle
- `design/The Hustle.dc.html` — the full interactive HTML prototype (source of truth for visuals/copy/behavior). This file, plus `design/support.js`, IS the deployable app repo — copy these two (+ `design/icons/`) into their own GitHub repo and deploy as a static Vercel project.
- `design/icons/` — the nav bar icon assets referenced above.
- `../the-hustle-feed/` — the sibling "middleman" folder (its own GitHub repo + Vercel project): Supabase-backed shared state + GolfCourseAPI proxy. See its own README for deploy steps.

## Architecture (mirrors the Mickeltitties Cup app exactly)
Two small Vercel projects, no traditional backend framework:
1. **App repo** — `The Hustle.dc.html` + `support.js`, deployed as a static site (this is the
   whole frontend; identical pattern to `mickeltitties-app`). Domain: **thehustleapp.net**.
2. **Feed repo** — `the-hustle-feed/` (sibling folder in this bundle), a few Vercel serverless
   functions:
   - `api/state.js` — the shared match state. Every phone GETs it to read live standings/scores/
     games/junk/history and POSTs to write, gated by a shared write password. Backed by **one
     Supabase table holding one JSON row per friend group** — same "single blob" approach
     Mickeltitties uses with Redis, just swapped to Supabase per your instruction. This is
     intentionally NOT a normalized relational schema — it's the simplest thing that makes every
     player's phone see the same state, and it's what the reference app actually runs in
     production.
   - `api/course.js` — the GolfCourseAPI middleman (hides your API key, normalizes course/tee
     data to what Settings' course search expects).
   See `the-hustle-feed/README.md` for the exact ~1-hour deploy steps.

## Wiring the app to live data
`The Hustle.dc.html`'s logic class has a small constants block and `loadState()`/`pushState()`
stubs mirroring Mickeltitties' `LIVE_ENDPOINT`/`USE_LIVE_FEED` pattern — fill in the three
constants (`SYNC_ENDPOINT`, `COURSE_ENDPOINT`, `GROUP_KEY`) and flip `USE_LIVE_SYNC = true` once
`the-hustle-feed` is deployed. See the comment block at the top of the logic class.

