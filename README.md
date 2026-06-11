# TangoNest Beta62 True Login Gate

## Fix
The login screen is no longer treated like a normal overlay.
By default it is hidden at CSS level.

It appears only when there is no remembered TangoNest sync account or guest mode.

## Result
After logging in once, reload should keep you on the app/home screen instead of showing the login screen again.

## Upload
Upload these files to GitHub root:
- index.html
- style.css
- app.js
- README.md
- SUPABASE_SQL_RUN_ONCE.sql
