# CLAUDE.md - Pluto 4 Logistics Tracker

## Project Overview

LEGO REPLAY Logistics Tracker - tracks PCR (Post-Consumer Recycled) LEGO brick material through a circular supply chain:

```
LEGO Warehouse → MBA (Compounder) → RGE (Manufacturer) → LEGO Warehouse
```

Single-user web app for a project manager to record events and track campaign status.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon Postgres (Vercel-compatible)
- **Auth**: NextAuth.js v5 (credentials provider)
- **Styling**: Tailwind CSS
- **Pattern**: Event-sourced (TES-like) with projections

### Key Patterns

1. **Events table** - append-only log of all changes
2. **Campaign projections** - materialized current state for fast queries
3. **Canonical IDs** - `cmp_xxx` for campaigns, `evt_xxx` for events (ULID-based)

## Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Run ESLint
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Database Setup

1. Create a Neon database at https://neon.tech
2. Copy the connection string
3. Run migrations: `psql $DATABASE_URL < db/migrations/001_initial_schema.sql`

### Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL` - Neon connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `APP_USER_EMAIL` - Your login email
- `APP_USER_PASSWORD_HASH` - Generate with the setup script

## Conventions

- Follow Pentatonic coding standards
- Use TES events for state changes - every mutation emits an event
- Canonical IDs for all entities
- Keep projections in sync with events

## File Structure

```
src/
├── app/
│   ├── (authenticated)/     # Protected routes
│   │   ├── page.tsx         # Dashboard
│   │   └── campaigns/
│   ├── api/                  # API routes
│   └── login/               # Public login page
├── components/              # React components
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Database connection
│   ├── ids.ts               # ID generation
│   └── events.ts            # Event store (Phase 2)
└── types/                   # TypeScript types
```

## Task Tracking (Beads)

This project uses Beads for task tracking. **Close tasks as you complete them.**

```bash
bd ready              # See unblocked tasks
bd show <id>          # View task details
bd close <id> --reason "Completed: brief description"
bd status             # Overview
```

### Current Tasks

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 2: Event Infrastructure | pluto-740, pluto-voc, pluto-6d0 | P1 |
| Phase 3: Campaign CRUD | pluto-jcj, pluto-zcx, pluto-k6f | P2 |
| Phase 4: Event Logging UI | pluto-cfs, pluto-pql, pluto-45c | P2 |
| Phase 5: Polish & UX | pluto-imy, pluto-t25, pluto-r20 | P3 |

**After completing work, always close the relevant Beads task.**

## Documentation

- `docs/brainstorms/` - Design decisions
- `docs/plans/` - Implementation plans
