# TangoNest Beta81 Stable Sync + Page State + Defaults

## Fixes
- Mobile Log out button click/tap binding.
- Default Add Word languages forced to English -> Japanese.
- Reload keeps current page:
  - Create reload -> Create
  - Quiz reload -> Quiz
  - Cards reload -> Cards
  - etc.
- Cloud Status is compact/collapsible.
- Sync save/load improved without forcing Home.

## Sync stability
This keeps the current custom RPC sync model.
For a production-grade app, the more stable architecture is Supabase Auth + user_id-based tables or realtime subscriptions.
