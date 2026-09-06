# SahyogGig — Cooperative Gig Services Platform

> **SIH26089** — Ministry of Cooperation
> A gig-services marketplace (like Urban Company) where local **cooperative societies** — not a private company — own, run, and profit from the platform. Workers register through their cooperative; customers book verified local workers; the cooperative admin manages onboarding, jobs, and payouts.

This README is the single source of truth for building this project. Follow it top to bottom. Do not deviate from the tech stack without a strong reason — consistency matters more than cleverness in a 36-hour build.

---

## 1. Problem Statement (Plain Language)

- Cooperative societies in India are trusted, community-owned institutions (dairy co-ops, credit co-ops, etc.) but have no digital platform to offer **on-demand services** (plumbing, cleaning, tutoring, elder care, tailoring, etc.).
- Today this either happens informally (unreliable, no trust layer) or through private gig apps (Urban Company, Uber) where profits leave the community.
- **Goal:** Build a platform where a **Cooperative Society** onboards its own members as service workers, customers book them through an app, and the cooperative — not a corporation — controls verification, commission, and payouts.

---

## 2. User Roles (4 total — build all 4, this is what makes it "cooperative" not just another gig app)

| Role | Description |
|---|---|
| **Customer** | Browses services, books a worker, tracks job, pays, rates |
| **Worker** | Cooperative member offering a service; toggles availability, accepts/completes jobs, sees earnings |
| **Cooperative Admin** | Manages their cooperative's worker roster, verifies workers, sets commission %, views analytics, approves payouts |
| **Super Admin** (platform level) | Onboards new cooperatives onto the platform, views platform-wide analytics |

---

## 3. Tech Stack (use exactly this — do not substitute)

### Frontend
- **Next.js 14+ (App Router, TypeScript)** — single fullstack framework, fast to scaffold
- **Tailwind CSS** for styling
- **shadcn/ui** for pre-built accessible components (buttons, dialogs, forms, tables, cards)
- **Zustand** for lightweight client-side state (booking flow, auth session cache)
- **React Hook Form + Zod** for all forms and validation
- **Framer Motion** for micro-animations (job status transitions, card hovers) — keep subtle, not decorative
- **Lucide-react** for icons
- **Recharts** for the Cooperative Admin analytics dashboard (earnings, jobs completed, active workers)

### Backend
- **Next.js API Routes / Route Handlers** (`app/api/**`) — no separate backend server needed
- **Prisma ORM** as the data layer
- **PostgreSQL** — provisioned via **Supabase** (also gives us Auth + Realtime + Storage for free, see below)
- **NextAuth.js v5 (Auth.js)** with the Credentials provider + Prisma adapter, **session strategy: `jwt`** (database sessions don't work reliably with the Credentials provider — use JWT sessions and read `role`/`id` off the token)
- **Zod** for API input validation on every route handler (never trust client input)

### Real-time & Location
- **Supabase Realtime** (Postgres change subscriptions) to push live booking-status updates to customer/worker screens without polling
  - **Setup step this needs (easy to miss):** Realtime does not work automatically just because you're on Supabase Postgres — you must explicitly enable replication on the `Booking` table (Supabase Dashboard → Database → Replication → toggle the `Booking` table on, or run `ALTER PUBLICATION supabase_realtime ADD TABLE "Booking";`). Do this in Phase 0, not Phase 4, so you're not debugging "why isn't realtime firing" with 8 hours left.
- **Worker location for the demo:** do not rely on live GPS/browser geolocation during judging — permissions can fail or be denied on stage. Instead, let workers set their location once via a **manual pin-drop on the map** during profile setup, and seed demo workers with real fixed coordinates near your venue/city so the map looks convincing without needing device GPS.
- **Leaflet.js + OpenStreetMap tiles** for the "nearby workers" map (free, no API key needed — faster to set up than Google Maps for a hackathon)
  - **Important:** Leaflet touches the browser `window` object, which breaks Next.js server-side rendering. Always load the map component with `next/dynamic` and `{ ssr: false }`, e.g. `const WorkerMap = dynamic(() => import('@/components/map/WorkerMap'), { ssr: false })`. Building the map component directly into a server component will crash the build — this is the single most common mistake agents make with Leaflet in Next.js.

### Payments
- **Mocked payment flow** — no external payment gateway. A `/api/payments/mock` route simulates a payment: server-side delay (~1.5s), then marks the payment successful and computes the commission split. This keeps the demo dependency-free (no signup, no KYC, no external service that can fail mid-demo) while still proving the commission logic that actually matters for judging.
- Platform logic must **split payment**: `worker_payout = amount - (amount * cooperative_commission_percent)` — this computation happens server-side regardless of which payment method is used, so swapping in a real gateway later only touches the mock route, not this logic.

### Notifications
- **In-app only** for the hackathon (a notification bell + toast via `sonner` or shadcn `toast`) — skip SMS/email/push, not worth the setup time in 36 hours

### Deployment
- **Vercel** for the Next.js app
- **Supabase** for DB + Auth + Realtime (already deployed/hosted, no DevOps needed)

### Why this stack
Everything here either ships with the framework or is a hosted service — there is **zero backend infrastructure to stand up**. Supabase gives you Postgres, Auth, Realtime, and file storage as one hosted service, so the team can spend its 36 hours on features and UI, not on servers.

---

## 4. Database Schema (Prisma models — implement exactly these tables first)

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  phone         String?
  passwordHash  String
  role          Role     @default(CUSTOMER)
  createdAt     DateTime @default(now())

  workerProfile   Worker?
  cooperativeAdmin Cooperative? @relation("AdminOf")
  bookingsAsCustomer Booking[]  @relation("CustomerBookings")
  reviewsWritten     Review[]
}

enum Role {
  CUSTOMER
  WORKER
  COOP_ADMIN
  SUPER_ADMIN
}

model Cooperative {
  id            String   @id @default(cuid())
  name          String
  region        String
  commissionPct Float    @default(10)
  adminId       String   @unique
  admin         User     @relation("AdminOf", fields: [adminId], references: [id])
  workers       Worker[]
  createdAt     DateTime @default(now())
}

model Worker {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  cooperativeId String
  cooperative   Cooperative @relation(fields: [cooperativeId], references: [id])
  serviceCategoryId String
  serviceCategory ServiceCategory @relation(fields: [serviceCategoryId], references: [id])
  isVerified    Boolean  @default(false)
  isAvailable   Boolean  @default(false)
  latitude      Float?
  longitude     Float?
  ratingAvg     Float    @default(0)
  totalJobs     Int      @default(0)
  bookings      Booking[]
}

model ServiceCategory {
  id       String   @id @default(cuid())
  name     String   // "Electrician", "Plumber", "Tutor", "Cleaner", "Elder Care"
  icon     String?
  workers  Worker[]
}

model Booking {
  id            String   @id @default(cuid())
  customerId    String
  customer      User     @relation("CustomerBookings", fields: [customerId], references: [id])
  workerId      String
  worker        Worker   @relation(fields: [workerId], references: [id])
  status        BookingStatus @default(REQUESTED)
  scheduledAt   DateTime
  address       String
  amount        Float
  commissionAmt Float
  payoutAmt     Float
  createdAt     DateTime @default(now())
  review        Review?
  payment       Payment?
}

enum BookingStatus {
  REQUESTED
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Review {
  id         String   @id @default(cuid())
  bookingId  String   @unique
  booking    Booking  @relation(fields: [bookingId], references: [id])
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  rating     Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now())
}

model Payment {
  id            String   @id @default(cuid())
  bookingId     String   @unique
  booking       Booking  @relation(fields: [bookingId], references: [id])
  mockReference  String?  // simulated transaction ref, e.g. `MOCK-${cuid()}`
  status        PaymentStatus @default(PENDING)
  createdAt     DateTime @default(now())
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}
```

---

## 5. Full Functionality List (build in this order — each is independently demoable)

### 5.1 Authentication & Onboarding
- Sign up / login for Customer and Worker (email + password via NextAuth Credentials)
- Role-based redirect after login (Customer → `/dashboard`, Worker → `/worker`, Coop Admin → `/admin`)
- Worker signup requires selecting a **Cooperative** to join (dropdown, seeded data) and a **Service Category**
- New workers start `isVerified = false` until a Coop Admin approves them

### 5.2 Cooperative Admin Panel (`/admin`)
- List of workers in this cooperative with verification toggle (Approve / Reject)
- Set commission percentage for the cooperative
- Table of all bookings routed through this cooperative's workers, with status
- Analytics cards: total active workers, jobs completed this week, total revenue, average rating (use Recharts for a simple bar/line chart)

### 5.3 Customer Flow (`/dashboard`)
- Browse service categories (grid of cards: Electrician, Plumber, Tutor, Cleaner, Elder Care…)
- Select a category → see a **map (Leaflet)** with nearby available, verified workers as pins
- Click a worker pin → see profile (name, cooperative, rating, jobs completed, price)
- Book: pick date/time + enter address → creates a `Booking` with status `REQUESTED`
- Track live booking status (Requested → Accepted → In Progress → Completed) via Supabase Realtime — no page refresh needed
- After completion: rate 1–5 stars + optional comment

### 5.4 Worker Flow (`/worker`)
- Toggle `isAvailable` on/off (only shows on customer map when true)
- See incoming booking requests, Accept / Reject
- Update status: Accepted → In Progress → Completed
- Earnings dashboard: list of completed jobs, amount earned per job (after commission), total earnings this month

### 5.5 Payments (mocked)
- On booking confirmation, call `POST /api/payments/mock` with the `bookingId`
- The route: waits ~1.5s server-side (simulate gateway latency), generates a fake `mockReference`, computes `commissionAmt`/`payoutAmt` **server-side** using the cooperative's `commissionPct` (never trust an amount sent from the client), then marks `Payment.status = SUCCESS`
- Frontend shows a realistic "Processing payment…" spinner state during the delay, then a success screen — visually indistinguishable from a real gateway for demo purposes
- Show payout math transparently to the worker (this is a key "cooperative fairness" selling point in your pitch)
- Add one line to your pitch deck: "Payment gateway integration point is mocked for the demo; production would plug in Razorpay/PayU here without changing any of the commission logic above"

### 5.6 Notifications (in-app only)
- Toast/badge when: booking accepted, status changes, payment succeeds, worker verified

---

## 6. Folder Structure

```
sahyoggig/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── dashboard/page.tsx              # customer home
│   ├── dashboard/book/[categoryId]/page.tsx
│   ├── dashboard/bookings/[id]/page.tsx  # live status tracking
│   ├── worker/page.tsx
│   ├── worker/earnings/page.tsx
│   ├── admin/page.tsx
│   ├── admin/workers/page.tsx
│   ├── admin/analytics/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── bookings/route.ts
│       ├── bookings/[id]/route.ts
│       ├── workers/route.ts
│       ├── workers/[id]/verify/route.ts
│       ├── cooperatives/route.ts
│       ├── categories/route.ts
│       ├── reviews/route.ts
│       └── payments/route.ts
├── components/
│   ├── ui/                # shadcn components
│   ├── map/WorkerMap.tsx
│   ├── booking/BookingStatusTracker.tsx
│   └── admin/AnalyticsCharts.tsx
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── auth.ts
│   └── zod-schemas.ts
├── prisma/schema.prisma
└── README.md
```

---

## 7. Step-by-Step Build Guide (36-hour timeline)

### Phase 0 — Setup (Hour 0–2)
1. `npx create-next-app@latest sahyoggig --typescript --tailwind --app`
2. Install deps: `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `framer-motion`, `lucide-react`, `recharts`, `leaflet`, `react-leaflet`, `sonner`
3. Add `shadcn/ui`: `npx shadcn@latest init` → add `button`, `card`, `dialog`, `input`, `form`, `table`, `badge`, `toast`
4. Create a Supabase project → copy Postgres connection string into `.env` as `DATABASE_URL`
5. Write `prisma/schema.prisma` (Section 4 above) → `npx prisma db push` → `npx prisma generate`
6. Seed script: create 2 cooperatives, 5 service categories, 1 super admin, and **5–8 workers with fixed real-world lat/lng coordinates near your demo city** (not random) plus 10 past completed bookings with ratings, so the app looks alive on first load instead of empty
7. Enable Supabase Realtime replication on the `Booking` table now (Dashboard → Database → Replication) — don't leave this for Phase 4

### Phase 1 — Auth & Roles (Hour 2–6)
1. Configure NextAuth with Credentials provider + Prisma adapter
2. Build signup form (role selector, cooperative dropdown for workers)
3. Build login form
4. Middleware to protect `/admin`, `/worker`, `/dashboard` routes by role

### Phase 2 — Cooperative Admin Core (Hour 6–10)
1. Worker list table with Verify/Reject buttons (API: `PATCH /api/workers/[id]/verify`)
2. Commission % editable field on Cooperative model
3. Basic analytics cards (static queries first, charts later)

### Phase 3 — Customer Booking Flow (Hour 10–18)
1. Service category grid page
2. `WorkerMap.tsx` using `react-leaflet`, plot workers with `isAvailable && isVerified`
3. Booking form (date/time picker via shadcn, address input)
4. `POST /api/bookings` → creates booking with status `REQUESTED`
5. Booking detail page showing current status

### Phase 4 — Worker Flow + Realtime (Hour 18–24)
1. Worker dashboard: incoming requests, Accept/Reject buttons
2. Status update buttons: Accepted → In Progress → Completed
3. Wire Supabase Realtime: subscribe to `Booking` table changes, push live status to customer's booking detail page (no refresh)
4. Earnings list for worker

### Phase 5 — Payments (Hour 24–28)
1. Build `POST /api/payments/mock` (simulated delay + success + commission split, see Section 5.5)
2. Frontend "Processing payment…" state → success screen
3. Show payout breakdown on worker earnings page

### Phase 6 — Reviews + Admin Analytics (Hour 28–32)
1. Star rating form after job marked `COMPLETED`
2. Update `Worker.ratingAvg` on new review
3. Recharts bar chart (jobs/week) + line chart (revenue) on admin analytics page

### Phase 7 — Polish & Demo Prep (Hour 32–36)
1. Framer Motion transitions on booking status changes
2. Empty states, loading skeletons, error toasts
3. Seed realistic demo data (5 workers, 10 past bookings, ratings)
4. **Rehearse the demo script** (see Section 9)

---

## 8. API Endpoints Reference

| Method | Route | Purpose | Role |
|---|---|---|---|
| POST | `/api/auth/signup` | Register customer/worker | Public |
| GET | `/api/categories` | List service categories | Public |
| GET | `/api/workers?categoryId=&lat=&lng=` | Nearby available workers | Customer |
| PATCH | `/api/workers/[id]/verify` | Approve/reject worker | Coop Admin |
| PATCH | `/api/workers/[id]/availability` | Toggle available | Worker |
| POST | `/api/bookings` | Create booking | Customer |
| PATCH | `/api/bookings/[id]` | Update status (accept/progress/complete) | Worker |
| GET | `/api/bookings/[id]` | Get booking + live status | Customer/Worker |
| POST | `/api/payments/mock` | Simulate payment success, split commission | Customer |
| POST | `/api/reviews` | Submit rating | Customer |
| GET | `/api/cooperatives/[id]/analytics` | Dashboard data | Coop Admin |

Every route handler **must** validate input with a Zod schema from `lib/zod-schemas.ts` before touching Prisma.

---

## 9. Demo Script (what to show the judges in ~4 minutes)

1. **Hook (20s):** "Urban Company takes a cut and controls everything. We let cooperatives run their own gig platform, keep profits local, and pick their own commission."
2. **Coop Admin view (40s):** Show a worker signup pending verification → approve it live → set commission %.
3. **Customer view (90s):** Browse categories → see map with nearby verified workers → book one → watch live status change to "Accepted" in real time (open two browser windows side by side: customer + worker).
4. **Worker view (60s):** Accept the job → mark completed → show earnings breakdown with commission split visible.
5. **Payment + Rating (30s):** Show the simulated payment complete → customer leaves a 5-star review → rating updates on worker profile.
6. **Close (20s):** Admin analytics dashboard — jobs this week, revenue, active workers — "this is the transparency a private gig app never gives back to the community."

---

## 10. What to Skip (do not build these — not worth the time)

- Native mobile app (web is fine, make it responsive)
- SMS/email notifications
- Multi-language support
- Any real payment gateway integration at all — mock it entirely (see Section 5.5)
- Admin approval workflows beyond a single verify/reject toggle
- Chat/messaging between customer and worker

---

## 11. Environment Variables (`.env.example`)

```
DATABASE_URL=postgresql://...supabase...
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 12. Definition of Done (MVP checklist)

- [ ] All 4 roles can sign up and log in
- [ ] Coop Admin can verify a worker
- [ ] Customer can see nearby workers on a map and book one
- [ ] Worker can accept and complete a booking
- [ ] Booking status updates live without refresh (Realtime working)
- [ ] Mocked payment flow completes with commission split shown
- [ ] Customer can rate a completed job, rating reflects on worker profile
- [ ] Admin analytics page shows at least 2 charts with real seeded data
- [ ] App is deployed on Vercel with a public URL for judges to click through
