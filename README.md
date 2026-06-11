# TangoNest Beta65 No Login On Reload

## Critical reload fix
The app no longer opens the login screen automatically on reload.

New behavior:
- App/home opens first
- If saved sync account exists, cloud sync runs in background
- Login screen opens only when the user clicks Login / Sync
- Logout keeps the app usable in local mode

## Also included
- Beta64 Add Word critical fix
- English -> Japanese default language fix
- PWA icon files from Beta63
