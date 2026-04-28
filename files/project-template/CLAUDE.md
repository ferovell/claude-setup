# Project: <PROJECT NAME>

This file extends `~/.claude/CLAUDE.md` with project-specific context.
The user-global rules (orchestrator behavior, no-self-edits, delegation map)
apply here too.

## What this project is

<one paragraph: what it does, who uses it, what stage it's at>

## Stack overrides (if any)

<delete this section if you're using the defaults: Next.js + Supabase + Python>

## Layout

```
src/
  app/          — Next.js App Router pages
  components/   — UI components
  lib/          — shared utilities, supabase client
supabase/
  migrations/   — DB schema migrations
  seed.sql      — local seed data
scripts/        — one-off Python scripts
```

## Commands the agents can run

- `pnpm dev` — start dev server
- `pnpm test` — run tests
- `pnpm typecheck` — TS check
- `pnpm lint` — eslint
- `supabase db reset` — wipe + replay migrations + seed

## Things to never touch without asking

- Production Supabase project (anything with `prod` in the URL)
- `.env.production`
- Migrations that have already been applied to prod

## Project-specific patterns

<note any non-obvious conventions, e.g. "all server actions live in
src/app/_actions" or "we use Zod for all form validation">

## Followups / known issues

<running list — agents should append here, not silently fix unrelated things>
