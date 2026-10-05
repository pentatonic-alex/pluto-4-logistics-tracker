# Pluto 4 Logistics Tracker

LEGO REPLAY Logistics Tracker - tracks PCR (Post-Consumer Recycled) LEGO brick material through a circular supply chain.

## Supply Chain Flow

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

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon Postgres database account (https://neon.tech)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pluto-4-logistics-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Neon database**
   - Go to https://neon.tech and create a new database
   - Copy the connection string

4. **Run database migrations**
   ```bash
   psql $DATABASE_URL < db/migrations/001_initial_schema.sql
   ```

5. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in the required values:
     - `DATABASE_URL` - Your Neon connection string
     - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
     - `APP_USER_EMAIL` - Your login email
     - `APP_USER_PASSWORD_HASH` - Generate with the setup script

6. **Run the setup script**
   ```bash
   npm run setup
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run E2E tests with UI
npm run test:all      # Run all tests (unit + E2E)
npm run setup         # Run setup script
npm run seed          # Seed database with test data
```

## File Structure

```
src/
├── app/
│   ├── (authenticated)/     # Protected routes
│   │   ├── page.tsx         # Dashboard
│   │   └── campaigns/       # Campaign management
│   ├── api/                 # API routes
│   └── login/              # Public login page
├── components/             # React components
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── db.ts              # Database connection
│   ├── ids.ts             # ID generation (ULID)
│   └── events.ts          # Event store
└── types/                 # TypeScript types

db/
└── migrations/            # SQL migration scripts

docs/
├── brainstorms/          # Design decisions
└── plans/                # Implementation plans
```

## Development Conventions

- Follow Pentatonic coding standards
- Use TES events for state changes - every mutation emits an event
- Canonical IDs for all entities
- Keep projections in sync with events
- Close Beads tasks as you complete them

## Task Tracking

This project uses Beads for task tracking:

```bash
bd ready              # See unblocked tasks
bd show <id>          # View task details
bd close <id> --reason "Completed: brief description"
bd status             # Overview
```

## Documentation

- `CLAUDE.md` - Detailed development guide
- `docs/brainstorms/` - Design decisions and architecture discussions
- `docs/plans/` - Implementation plans and specifications

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Neon Postgres Documentation](https://neon.tech/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
