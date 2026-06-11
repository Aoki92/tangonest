# TangoNest Beta61 Add Register Fix

## Critical fix
Add Word + Register now uses an isolated stable function:
- Reads form
- Adds word to db
- Saves directly to localStorage
- Updates counters safely
- Cloud saves in background
- Does not depend on old save()/render() chain

## Deploy
Upload the whole folder to Netlify.
