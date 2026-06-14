# TangoNest Beta83 Library Refine Patch

## Emergency stability patch - 2026-06-14

This build prioritizes stability over preserving corrupted local word data.

### Critical fixes
- Added `tn-emergency-guard.js` before the legacy app bundle to block old maintenance intervals and old auto cloud-load timers.
- Added `tn-emergency-stability.js` after all app scripts to enforce explicit page-key navigation.
- Navigation now uses only stable page keys: `home`, `create`, `library`, `cards`, `quiz`, `listen`, `settings`.
- Library can no longer open Settings because of old tab/index mismatch.
- Old focus/visibility/storage cloud auto-load handlers are blocked to prevent rollback from stale cloud/local state.
- If local data contains more than 500 words, the app performs a one-time emergency reset to a clean empty state with one `New Playlist`.
- Library renders at most 200 word rows at once to stay responsive with large collections.
- Missing/corrupted `words`, `lists`, or playlist references are normalized defensively.
- Header cloud labels remain fixed-size (`Cloud` / `Sync`) to avoid layout shifts.

### Data reset behavior
- Current large/corrupted local word data may be cleared once using `tangonest_emergency_reset_20260614_v1`.
- Login/auth keys are not cleared by this reset.
- New words can still be added normally after reset.

## Fixed
- Library All shows every registered word.
- Add Word immediately appears in Library.
- Playlist Rename works with a stable manager.
- Reload keeps the current page.
- Default languages are always English -> Japanese.
- Phone/PC sync saves after local changes and polls cloud.
- Demo apple/りんご starter data is removed only if it is the only sample.

## Verification
Open Library after adding a word. It must show under All.
Open Settings and rename a playlist. Rename must apply immediately.
Open Create, reload, and it must stay on Create.

---

## Beta83 — Patch Notes

### Library detail and navigation stability update
- Library keeps the Words / Playlists selector.
- Word rows now include favorite, audio, and delete actions.
- Clicking a word opens a dictionary-style detail panel with metadata, example, edit, audio, favorite, and delete.
- Playlists view now includes Quiz, Cards, and Listen actions for each playlist.
- Quiz, Cards, Listen, and Library navigation no longer gets overwritten by old timed render loops.
- Hidden login/page layers are removed from layout after login to prevent unexpected height shifts.
- Old repeated Library render calls in app, fix, and cloud helper scripts now defer to the enhanced Library renderer.
- Fixed repeated unsafe Cloud box insertBefore calls that could throw every two seconds.
- Mobile bottom navigation now includes Home, Create, Library, Cards, Quiz, Listen, and Settings.

### Library management improvements
- Added Library Words / Playlists segmented views.
- Words view includes search by front word, back meaning, memo/example, tags, POS, and playlist name.
- Words view includes filters for language, alphabet/first letter, playlist, and POS.
- Added a reset filters button and clean "No words found" empty state.
- Playlists view shows playlist name, word count, and updated date.
- Added visible playlist delete buttons.
- Added right-click playlist context menu with "Delete playlist".
- Deleting a playlist keeps its words in Library by moving them to a safe default playlist.
- Cloud sync is triggered after playlist deletion when available.
- Removed unnecessary blue circular h2/card indicators.
- Stabilized the header cloud pill so it no longer switches between changing sync labels.
- Local words/demo data are reset once for this update so the app can start fresh.

### App name unified
- All user-visible strings now read TangoNest.
- Backup download filename changed to `tangonest_backup_YYYY-MM-DD.json`.
- Legacy localStorage key is kept as-is to preserve existing user data.
- style.css comments updated.

### Chinese default playlist removed
- Hardcoded Chinese demo cards in loginGate removed.
- No Chinese playlist is auto-generated on first launch.
- Initial state: one blank "New Playlist" only.

### Mobile login bug fixed (critical)
Root causes identified and resolved:

| Issue | Fix |
|---|---|
| `height:100vh` cut off login card on mobile Safari | Changed to `min-height:100vh; min-height:100dvh` with `overflow-y:auto` |
| Card `max-height` trapped content, hiding the Login button | Removed card-level overflow constraint; container scrolls instead |
| iOS Safari tap not firing on buttons | Added `ontouchend` handlers with `preventDefault()` to all auth buttons |
| Keyboard opened before layout settled (50ms focus) | Delayed input focus to 300ms |
| Keyboard remained open after login, causing blank screen | `showApp()` now calls `activeElement.blur()` + `window.scrollTo(0,0)` |
| iPhone notch obscured content | Added `viewport-fit=cover` + `env(safe-area-inset-*)` padding |
| Tap target too small on mobile | Button `min-height` raised to 52px; added `touch-action:manipulation` |
| Auth overlay remained interactive after login in tn-fixes.js | `goPage()` now force-hides auth element before page transition |

### Files changed
- `index.html` — mobile login fix, Chinese card removed, Library management script added
- `app.js` — backup filename, session naming cleanup, stable render delegation, safe Cloud box insertion
- `style.css` — Library Words/Playlists tabs, search/filter/menu/modal styles, word detail panel, blue-dot removal, header/layout stability
- `tn-fixes.js` — goPage auth-hide fix, DATA_KEY comment added, enhanced Library render delegation
- `tn-cloud-first.js` — showApp scroll reset, showAuth focus delay, LOCAL_KEY comment added, enhanced Library render delegation
- `tn-library-management.js` — Library Words/Playlists structure, playlist delete, right-click menu, word actions, detail panel, search/filter logic
