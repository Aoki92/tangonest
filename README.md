# TangoNest Beta82 Core Function Final

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

### App name unified: VocabRise → TangoNest
- All user-visible strings now read TangoNest.
- Backup download filename changed to `tangonest_backup_YYYY-MM-DD.json`.
- Internal JS variable `VR_SESSION_KEY` renamed to `TN_SESSION_KEY`.
- localStorage key `vocabrise_production_stable_v1` kept as-is to preserve existing user data.
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
- `index.html` — mobile login fix, Chinese card removed, VocabRise removed
- `app.js` — backup filename, VR_SESSION_KEY → TN_SESSION_KEY
- `style.css` — comment-only VocabRise references removed
- `tn-fixes.js` — goPage auth-hide fix, DATA_KEY comment added
- `tn-cloud-first.js` — showApp scroll reset, showAuth focus delay, LOCAL_KEY comment added
