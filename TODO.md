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
- [x] Stabilize local auth flow and session refresh
- [x] Add sign-out button to the dashboard
- [x] Organize auth UI into a shared `src/components/auth/` folder
- [x] Move dashboard UI into its own folder with local CSS module
- [x] Enforce “folder per CSS module” structure rule in `AGENTS.md`

## In Progress
- [ ] Rework the global design system to match Vercel's dark UI language

## Next Up
- [ ] Add analytics charts with Recharts
- [ ] Add summary cards for spend totals and category breakdown
- [ ] Refine the expense workspace interactions and visual hierarchy

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
- Any TSX component, view, or page that uses a `.module.css` file should live in its own folder with that CSS module beside it.
- If local Next dev starts throwing overlay/client-manifest issues after file moves, treat that as a dev-server/cache problem first, not necessarily an app bug.
- Global design tokens now live in `src/app/globals.css` and should be the source of truth for new UI surfaces.
