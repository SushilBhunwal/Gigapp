# SahyogGig — Cooperative Gig Services Platform

> **SIH26089** — Ministry of Cooperation  
> A gig-services marketplace where local cooperative societies own, run, and profit from the platform.

## Quick Start (after Supabase setup)

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your Supabase credentials
cp .env.example .env.local

# 3. Push schema to Supabase Postgres
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Seed demo data
npx prisma db seed

# 6. Start dev server
npm run dev
```

## Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@sahyoggig.in | superadmin123 |
| Coop Admin 1 | admin@janaseva.coop | admin1234 |
| Coop Admin 2 | admin@nagara.coop | admin1234 |
| Worker | arun@worker.in | worker1234 |
| Customer | demo@customer.in | customer123 |

## Environment Variables

See `.env.example` for the full list. You need:
- `DATABASE_URL` — Supabase Postgres connection string
- `NEXTAUTH_SECRET` — any 32+ char random string  
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard

## ⚠️ Supabase Realtime Setup (required before demo)

Enable replication on the `Booking` table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE "Booking";
```
Or: Supabase Dashboard → Database → Replication → toggle `Booking` ON.
