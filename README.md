# TangoNest Beta66 Overlay Kill Fix

## Critical fix
The invisible login overlay no longer blocks clicks on the home screen.

Login gate is now:
- display:none
- pointer-events:none
- inert
- z-index:-1
- moved off-screen

It only becomes clickable when Login / Sync is opened.

## Included
- Beta65 no-login-on-reload
- Beta64 Add Word critical fix
- English -> Japanese default language fix
- PWA icon files
