# Xpenses Project Context

## What This Is
Xpenses is a simple personal expense tracker built with:
- Next.js App Router
- Supabase for auth and database
- Bun for package management and scripts
- CSS Modules for styling
- Radix UI primitives for accessible interactive components
- Recharts for analytics

The product goal is a clean, premium dashboard for tracking expenses with Google sign-in, fast entry, and lightweight analytics.

## Current Product Direction
The UI should feel very close to Vercel's product surfaces:
- matte dark surfaces
- crisp low-contrast borders
- restrained spacing and typography
- minimal, premium dashboard feel
- polished but not flashy

Important:
- Take design cues only (card/table/input/button style language).
- Do not copy Vercel-specific product content, labels, navigation, or fake deployment/log data into Xpenses.

Do not introduce Tailwind. Do not change the visual direction unless the user asks.

## Current Routes
- `/` public landing shell
- `/sign-in` Google sign-in page
- `/auth/callback` Supabase OAuth callback handler
- `/dashboard` protected authenticated dashboard
- `/api/expenses` expense API
- `/api/pots` pots API

## Auth Flow
Google sign-in is enabled through Supabase.

The intended flow is:
1. User opens `/sign-in`
2. Client-side Supabase OAuth starts Google sign-in
3. Google returns to `/auth/callback`
4. Supabase exchanges the code for a session
5. User is redirected to `/dashboard`

Notes:
- `window.location.origin/auth/callback` is used as the redirect target in the browser sign-in flow.
- `/dashboard` is the protected route that checks the user session server-side.
- The root route `/` is currently a public shell and should not perform risky auth logic during initial render.

## Supabase Environment Variables
The project currently accepts:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Preferred usage:
- Client/browser code should use the publishable key.
- Server-only code should never expose the service role key to the browser.

## Database
The core tables are `public.expenses` and `public.pots`.

`public.expenses` schema fields:
- `id`
- `user_id`
- `label`
- `category`
- `amount`
- `type` (credit | debit | savings)
- `pot_id` (uuid references public.pots on delete set null)
- `created_at`
- `updated_at`

`public.pots` schema fields:
- `id`
- `user_id`
- `name`
- `goal`
- `color`
- `created_at`
- `updated_at`

Row Level Security is expected to be enabled.
Policies should ensure users only see and mutate their own rows.

## API Contract
`/api/expenses`
- `GET` returns the current user's expenses
- `POST` creates an expense (accepts optional client-generated `id` for UUID persistence)
- `PUT` updates an expense
- `DELETE` removes an expense

Expected create payload:
- `id` (optional, client-generated UUID for optimistic persistence)
- `label`
- `category`
- `amount`
- `type` (credit | debit | savings)
- `pot_id` (optional)
- `created_at` (optional, defaults to now if missing)

`/api/pots`
- `GET` returns the current user's pots
- `POST` creates a pot (accepts optional client-generated `id` for UUID persistence)
- `PUT` updates a pot
- `DELETE` removes a pot (`/api/pots?id=<id>`)

Expected create payload:
- `id` (optional, client-generated UUID for optimistic persistence)
- `name`
- `goal`
- `color`

## Implementation Notes
- Prefer server components for reads when safe.
- Keep client components limited to interactive pieces like OAuth buttons and future forms.
- Avoid introducing extra abstraction unless it solves a real problem.
- If a runtime issue appears in Next dev, check for stale `.next` output before assuming the code is broken.
- Any TSX component, view, or page that has a `.module.css` file must live in its own folder alongside that CSS module.
- Keep component folders shallow and obvious. Prefer `src/components/<feature>/` or `src/app/<route>/` with local CSS modules.
- Dashboard header actions should stay in the top-right. Add expense opens a modal; sign out stays adjacent.
- `createSupabaseBrowserClient()` must remain initialized globally within `PwaProvider` to maintain the authentication heartbeat and circumvent Next.js RSC Set-Cookie drop bugs.
- `public/sw.js` contains an internal localhost kill-switch loop-protection. Do not remove the localhost detection headers as this shields Next.js Turbopack from infinite HMR reloads.
- The "What's New" modal triggers based on comparisons between `localStorage` and `CURRENT_VERSION` in `features-config.ts`. Bump that string to fire a global update visual.

## Commands
Use Bun:
- `bun install`
- `bun run dev`
- `bun run build`
- `bun run lint`

## Style Guidance
- Write clear, calm UI with strong spacing and hierarchy.
- Match Vercel's dashboard language more than generic SaaS templates.
- Keep forms simple and readable.
- Avoid overdesigning charts or controls in early phases.
- Utilize ONLY standardized design tokens from `globals.css` for module colors and spacing; avoid hardcoding hex codes.

## Current Build Status
The core architecture is fully stabilized with an optimistic UI and hardened PWA Offline Sync engine (self-healing 4xx, optimistic client UUID persistence across expenses and pots, in-flight mutex with drain loop, FIFO network-drop preservation, and non-blocking inline error banners). The project is 100% lint-clean, passes full TypeScript production builds, and is hardened for production usage. The immediate focus is now:
- Table filters
- Export and sharing features (CSV/PDF)
- Final polish and visual transitions
