# Spendaro TODO

This file tracks the current build plan and the remaining work.

## Done
- [x] Scaffold Next.js app with Bun
- [x] Set up Supabase client helpers
- [x] Add project context in `AGENTS.md`
- [x] Create Supabase expense table schema
- [x] Add Google auth setup guidance
- [x] Build sign-in page and OAuth callback route
- [x] Add protected dashboard route
- [x] Add initial expenses API route
- [x] Add a baseline dashboard shell

## In Progress
- [ ] Stabilize local auth and rendering flow
- [ ] Make the `/` and `/sign-in` experience feel polished and Vercel-like

## Next Up
- [ ] Build expense entry form
- [ ] Fetch and render the user’s expenses
- [ ] Add edit expense flow
- [ ] Add delete expense flow
- [ ] Add analytics charts with Recharts
- [ ] Add summary cards for spend totals and category breakdown
- [ ] Add loading and empty states

## Later
- [ ] Add PWA support
- [ ] Add app icons and manifest
- [ ] Add offline-friendly behavior
- [ ] Prepare an iPhone Shortcut-friendly API path
- [ ] Add shortcut authentication strategy
- [ ] Add budgets or recurring expense support

## Supabase Checklist
- [x] Create Supabase project
- [x] Enable Google provider
- [x] Configure OAuth client in Google Cloud
- [x] Add callback URL to Google OAuth client
- [x] Add Google client ID and secret to Supabase
- [x] Run expense table SQL
- [x] Enable RLS on `public.expenses`

## Environment Checklist
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `NEXT_PUBLIC_APP_URL`

## Verification Checklist
- [x] `bun run build`
- [x] `bun run lint`
- [ ] Confirm local sign-in flow works end to end
- [ ] Confirm deployed sign-in flow works end to end
- [ ] Confirm dashboard loads after OAuth callback

## Notes
- Keep the UI close to Vercel's product design language.
- Avoid Tailwind.
- Prefer CSS Modules plus small reusable components.
- Keep auth and server-side data access simple until the app is stable.

