import { PrismaClient, Role, BookingStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Service Categories ───────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { id: "cat-electrician" },
      update: {},
      create: { id: "cat-electrician", name: "Electrician", icon: "Zap" },
    }),
    prisma.serviceCategory.upsert({
      where: { id: "cat-plumber" },
      update: {},
      create: { id: "cat-plumber", name: "Plumber", icon: "Droplets" },
    }),
    prisma.serviceCategory.upsert({
      where: { id: "cat-tutor" },
      update: {},
      create: { id: "cat-tutor", name: "Tutor", icon: "BookOpen" },
    }),
    prisma.serviceCategory.upsert({
      where: { id: "cat-cleaner" },
      update: {},
      create: { id: "cat-cleaner", name: "Cleaner", icon: "Sparkles" },
    }),
    prisma.serviceCategory.upsert({
      where: { id: "cat-eldercare" },
      update: {},
      create: { id: "cat-eldercare", name: "Elder Care", icon: "Heart" },
    }),
  ]);
  console.log("✅ Service categories seeded");

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("superadmin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@sahyoggig.in" },
    update: {},
    create: {
      id: "user-superadmin",
      name: "Platform Super Admin",
      email: "superadmin@sahyoggig.in",
      passwordHash: superAdminHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log("✅ Super admin seeded");

  // ─── Coop Admin 1 ────────────────────────────────────────────────────────
  const admin1Hash = await bcrypt.hash("admin1234", 12);
  const coopAdmin1 = await prisma.user.upsert({
    where: { email: "admin@janaseva.coop" },
    update: {},
    create: {
      id: "user-admin1",
      name: "Ramesh Kumar",
      email: "admin@janaseva.coop",
      passwordHash: admin1Hash,
      role: Role.COOP_ADMIN,
    },
  });

  const coop1 = await prisma.cooperative.upsert({
    where: { adminId: "user-admin1" },
    update: {},
    create: {
      id: "coop-janaseva",
      name: "Jana Seva Cooperative",
      region: "Bengaluru South",
      commissionPct: 10,
      adminId: "user-admin1",
    },
  });

  // ─── Coop Admin 2 ────────────────────────────────────────────────────────
  const admin2Hash = await bcrypt.hash("admin1234", 12);
  const coopAdmin2 = await prisma.user.upsert({
    where: { email: "admin@nagara.coop" },
    update: {},
    create: {
      id: "user-admin2",
      name: "Sunita Bhat",
      email: "admin@nagara.coop",
      passwordHash: admin2Hash,
      role: Role.COOP_ADMIN,
    },
  });

  const coop2 = await prisma.cooperative.upsert({
    where: { adminId: "user-admin2" },
    update: {},
    create: {
      id: "coop-nagara",
      name: "Nagara Sahakara Cooperative",
      region: "Bengaluru North",
      commissionPct: 8,
      adminId: "user-admin2",
    },
  });
  console.log("✅ Cooperatives seeded");

  // ─── Workers (real Bengaluru lat/lng coordinates) ─────────────────────────
  const workerDefs = [
    {
      userId: "user-w1",
      name: "Arun Gowda",
      email: "arun@worker.in",
      categoryId: "cat-electrician",
      coopId: "coop-janaseva",
      lat: 12.9279,
      lng: 77.6271, // Koramangala
      rating: 4.7,
      jobs: 38,
    },
    {
      userId: "user-w2",
      name: "Priya Nair",
      email: "priya@worker.in",
      categoryId: "cat-cleaner",
      coopId: "coop-janaseva",
      lat: 12.9352,
      lng: 77.6245, // HSR Layout
      rating: 4.9,
      jobs: 52,
    },
    {
      userId: "user-w3",
      name: "Suresh Babu",
      email: "suresh@worker.in",
      categoryId: "cat-plumber",
      coopId: "coop-janaseva",
      lat: 12.9165,
      lng: 77.6101, // BTM Layout
      rating: 4.5,
      jobs: 29,
    },
    {
      userId: "user-w4",
      name: "Kavitha Reddy",
      email: "kavitha@worker.in",
      categoryId: "cat-tutor",
      coopId: "coop-nagara",
      lat: 13.0358,
      lng: 77.5970, // Hebbal
      rating: 4.8,
      jobs: 61,
    },
    {
      userId: "user-w5",
      name: "Mohan Das",
      email: "mohan@worker.in",
      categoryId: "cat-eldercare",
      coopId: "coop-nagara",
      lat: 13.0195,
      lng: 77.5913, // Yeshwantpur
      rating: 4.6,
      jobs: 44,
    },
    {
      userId: "user-w6",
      name: "Anitha Shetty",
      email: "anitha@worker.in",
      categoryId: "cat-electrician",
      coopId: "coop-nagara",
      lat: 12.9898,
      lng: 77.5951, // Malleshwaram
      rating: 4.4,
      jobs: 22,
    },
  ];

  const workerHash = await bcrypt.hash("worker1234", 12);
  for (const w of workerDefs) {
    await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
        id: w.userId,
        name: w.name,
        email: w.email,
        passwordHash: workerHash,
        role: Role.WORKER,
      },
    });

    await prisma.worker.upsert({
      where: { userId: w.userId },
      update: {},
      create: {
        id: `worker-${w.userId}`,
        userId: w.userId,
        cooperativeId: w.coopId,
        serviceCategoryId: w.categoryId,
        isVerified: true,
        isAvailable: true,
        latitude: w.lat,
        longitude: w.lng,
        ratingAvg: w.rating,
        totalJobs: w.jobs,
      },
    });
  }
  console.log("✅ Workers seeded");

  // ─── Demo Customer ────────────────────────────────────────────────────────
  const custHash = await bcrypt.hash("customer123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "demo@customer.in" },
    update: {},
    create: {
      id: "user-customer1",
      name: "Meera Joshi",
      email: "demo@customer.in",
      passwordHash: custHash,
      role: Role.CUSTOMER,
      phone: "9876543210",
    },
  });
  console.log("✅ Demo customer seeded");

  // ─── Past Completed Bookings ──────────────────────────────────────────────
  const bookingDefs = [
    { workerId: "worker-user-w1", amount: 500, daysAgo: 2, address: "12/A, 5th Cross, Koramangala, Bengaluru" },
    { workerId: "worker-user-w2", amount: 800, daysAgo: 4, address: "34, HSR Sector 6, Bengaluru" },
    { workerId: "worker-user-w3", amount: 400, daysAgo: 5, address: "BTM Layout, Stage 2, Bengaluru" },
    { workerId: "worker-user-w4", amount: 600, daysAgo: 6, address: "Hebbal Kempapura, Bengaluru" },
    { workerId: "worker-user-w5", amount: 1000, daysAgo: 7, address: "Yeshwantpur, Bengaluru" },
    { workerId: "worker-user-w1", amount: 550, daysAgo: 8, address: "Indiranagar, 100 Ft Road, Bengaluru" },
    { workerId: "worker-user-w2", amount: 750, daysAgo: 10, address: "Whitefield Main Road, Bengaluru" },
    { workerId: "worker-user-w3", amount: 350, daysAgo: 12, address: "JP Nagar Phase 3, Bengaluru" },
    { workerId: "worker-user-w6", amount: 480, daysAgo: 14, address: "Malleshwaram 8th Cross, Bengaluru" },
    { workerId: "worker-user-w4", amount: 700, daysAgo: 15, address: "Ulsoor, Bengaluru" },
  ];

  const coopCommission: Record<string, number> = {
    "coop-janaseva": 10,
    "coop-nagara": 8,
  };

  for (let i = 0; i < bookingDefs.length; i++) {
    const b = bookingDefs[i];
    const bookingId = `booking-seed-${i + 1}`;
    const paymentId = `payment-seed-${i + 1}`;
    const reviewId = `review-seed-${i + 1}`;

    // find the worker to get cooperative commission
    const workerRec = await prisma.worker.findUnique({
      where: { id: b.workerId },
      include: { cooperative: true },
    });
    const commPct = workerRec ? coopCommission[workerRec.cooperativeId] ?? 10 : 10;
    const commissionAmt = b.amount * (commPct / 100);
    const payoutAmt = b.amount - commissionAmt;

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() - b.daysAgo);

    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        customerId: "user-customer1",
        workerId: b.workerId,
        status: BookingStatus.COMPLETED,
        scheduledAt,
        address: b.address,
        amount: b.amount,
        commissionAmt,
        payoutAmt,
      },
    });

    await prisma.payment.upsert({
      where: { id: paymentId },
      update: {},
      create: {
        id: paymentId,
        bookingId,
        mockReference: `MOCK-SEED-${i + 1}`,
        status: PaymentStatus.SUCCESS,
      },
    });

    const ratings = [5, 4, 5, 4, 5, 4, 5, 3, 4, 5];
    await prisma.review.upsert({
      where: { id: reviewId },
      update: {},
      create: {
        id: reviewId,
        bookingId,
        authorId: "user-customer1",
        rating: ratings[i],
        comment: i % 2 === 0 ? "Excellent work, very professional!" : "Good service, on time.",
      },
    });
  }
  console.log("✅ 10 past completed bookings with payments and reviews seeded");

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Demo credentials:");
  console.log("  Super Admin : superadmin@sahyoggig.in / superadmin123");
  console.log("  Coop Admin 1: admin@janaseva.coop    / admin1234");
  console.log("  Coop Admin 2: admin@nagara.coop      / admin1234");
  console.log("  Worker      : arun@worker.in         / worker1234  (all workers same password)");
  console.log("  Customer    : demo@customer.in       / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
