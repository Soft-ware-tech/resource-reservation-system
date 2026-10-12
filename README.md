# PrimeWave Resource Reserve

A responsive web application for PrimeWave Lab to manage shared rooms, equipment, vehicles, and reservations in one place. Staff can see what is available, reserve a resource, and return it early. Administrators can manage the catalogue, users, and bookings.

## Features

- Separate administrator and user sign-in, role-protected pages, and secure HTTP-only sessions.
- Admin dashboard with live resource counts, current use, and today’s bookings.
- Booking management with category, user, status, and Colombo-local start-date filters.
- Dedicated available-resources and currently-in-use pages, with return controls.
- User management, including creating accounts and activating or suspending access.
- Resource categories and resource administration.
- User catalogue with availability, a monthly calendar/list toggle, and mobile agenda.
- My Bookings previews for active, upcoming, and history reservations; cancel, start, and return actions.
- Dark and light themes, responsive navigation, accessible confirmation dialogs, loading states, and notifications.
- Asia/Colombo display and form entry; timestamps are stored as UTC instants.

## Tech stack

- Next.js App Router and React
- TypeScript
- PostgreSQL, installed locally (no Docker)
- Prisma ORM and SQL migrations
- Tailwind CSS 4, application-specific CSS, and glassmorphism UI
- bcryptjs password hashes and signed JWT sessions in HTTP-only cookies
- Zod validation, date-fns, and date-fns-tz
- Node.js test runner through `tsx`

## Architecture

```text
src/
  app/
    (admin)/admin/       Admin dashboard and management pages
    (user)/user/         User dashboard, catalogue, and bookings
    actions/             Server actions with role checks and validation
    globals.css          Shared themes, responsive layout, and components
  components/            Forms, navigation, booking actions, and schedule views
  lib/
    auth/                Session signing and server-side role checks
    bookings/            Time conversion and overlap helpers
    db/                  Shared Prisma client
    resources/            Resource availability and Colombo formatting
    validation/          Zod input schemas
prisma/
  migrations/            Schema and PostgreSQL constraints
  schema.prisma           Relational data model
  seed.ts                 Demo users, categories, resources, and bookings
docs/
  DECISIONS.md            Short explanations for technical interview discussion
  er-diagram.md           Standalone Mermaid ER diagram
```

Pages under `/admin` and `/user` are protected by middleware and checked again on the server. Mutations use server actions; these re-check the user’s role, validate inputs, write through Prisma, and revalidate affected pages.

## Windows setup

### 1. Install prerequisites

Install Node.js LTS, Git, and PostgreSQL 16 if they are not already installed. One option is an elevated PowerShell window:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install PostgreSQL.PostgreSQL.16
```

Open a new terminal after installation and check:

```powershell
node --version
git --version
psql --version
```

Node.js 20 or newer is recommended. PostgreSQL 16 is the version used during development.

### 2. Create the local database

Make sure the PostgreSQL Windows service is running. Connect with the password you chose in the PostgreSQL installer:

```powershell
psql -U postgres -h localhost
```

At the `postgres=#` prompt, create the application database, then exit:

```sql
CREATE DATABASE resource_reservation;
\q
```

The migration enables PostgreSQL’s `btree_gist` extension. The PostgreSQL installation account used by migrations must be allowed to create that extension.

### 3. Configure the application

In PowerShell, from the project directory:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL` to the local database and your PostgreSQL password. For example:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/resource_reservation?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
```

Generate a suitable session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste that value as `AUTH_SECRET`. If the PostgreSQL password contains URL-special characters, URL-encode those characters in `DATABASE_URL`.

### 4. Install, migrate, seed, and run

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build, use `npm run build` and `npm start`.

The database scripts are:

- `npm run db:migrate` — apply Prisma migrations to the local database.
- `npm run db:seed` — insert or update the demo accounts, three example categories, and ten resources. Sample bookings are added only when the bookings table is empty.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `Admin@123` |
| User | `user@demo.com` | `User@123` |

Change demo credentials and the session secret before exposing any deployment beyond your local machine. Keep `.env` private; it is ignored by Git.

## How double-booking is prevented

The server validates each request and checks for existing overlaps to give the user a helpful conflict message and the next available start time. That check by itself cannot prevent two requests arriving simultaneously, so PostgreSQL is the final authority.

The migration enables `btree_gist` and adds an exclusion constraint on each resource and its `tstzrange(startAt, endAt, '[)')` for active `BOOKED` and `IN_USE` records. The `[)` interval includes the start and excludes the end, so a reservation can begin exactly when the previous one ends. PostgreSQL rejects concurrent overlapping reservations even if both requests pass the earlier application check; the server translates that constraint error into the same helpful conflict response.

## Tests and quality checks

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The booking logic tests cover overlapping intervals, non-overlapping intervals, the allowed back-to-back boundary, next-slot suggestions, UTC conversion, and Colombo day boundaries.

## Data model

```mermaid
erDiagram
    User ||--o{ Booking : makes
    Category ||--o{ Resource : groups
    Resource ||--o{ Booking : receives

    User {
        UUID id PK
        string name
        string email UK
        string passwordHash
        Role role
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Category {
        UUID id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    Resource {
        UUID id PK
        string name
        UUID categoryId FK
        string description
        string details
        string imageUrl
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        UUID id PK
        UUID userId FK
        UUID resourceId FK
        datetime startAt
        datetime endAt
        string purpose
        BookingStatus status
        datetime createdAt
        datetime updatedAt
    }
```

The standalone copy-ready Mermaid diagram is in [`docs/er-diagram.md`](./docs/er-diagram.md). Simple explanations of the main technical choices are in [`docs/DECISIONS.md`](./docs/DECISIONS.md).
