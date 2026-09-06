import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.cooperative.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding Demo Data...");

  // A basic bcrypt hash for "password123"
  const passwordHash = "$2a$12$Y/B1v2qQk/Fk9zZ7hW0u.e6x/Uj1hG6m8pT7rD6lHq1zY9vK2kP.W";

  // 1. Create Base Users
  const customer = await prisma.user.create({
    data: { id: "customer-1", name: "Demo Customer", email: "demo@customer.in", role: "CUSTOMER", passwordHash }
  });
  const admin = await prisma.user.create({
    data: { id: "admin-1", name: "Coop Admin", email: "admin@coop1.in", role: "COOP_ADMIN", passwordHash }
  });

  // 2. Create Cooperative
  const coop = await prisma.cooperative.create({
    data: { id: "coop-1", name: "Bengaluru Sahyog Coop", adminId: admin.id, commissionPct: 10, region: "Bengaluru" }
  });

  // 3. Create Categories
  const catElectrician = await prisma.serviceCategory.create({
    data: { id: "cat-electrician", name: "Electrician", icon: "Zap" }
  });
  const catPlumber = await prisma.serviceCategory.create({
    data: { id: "cat-plumber", name: "Plumber", icon: "Wrench" }
  });
  const catCleaner = await prisma.serviceCategory.create({
    data: { id: "cat-cleaner", name: "Cleaner", icon: "Sparkles" }
  });

  // 4. Create 5 Workers (Verified, Available, specific lat/lngs in Bengaluru)
  const workersData = [
    { name: "Arun E.", email: "arun@worker.in", catId: catElectrician.id, lat: 12.9716, lng: 77.5946 },
    { name: "Priya P.", email: "priya@worker.in", catId: catPlumber.id, lat: 12.9720, lng: 77.5950 },
    { name: "Rahul C.", email: "rahul@worker.in", catId: catCleaner.id, lat: 12.9710, lng: 77.5930 },
    { name: "Suresh E.", email: "suresh@worker.in", catId: catElectrician.id, lat: 12.9730, lng: 77.5960 },
    { name: "Kavya P.", email: "kavya@worker.in", catId: catPlumber.id, lat: 12.9700, lng: 77.5920 },
  ];

  const workers = [];
  for (let i = 0; i < workersData.length; i++) {
    const w = workersData[i];
    const user = await prisma.user.create({
      data: { id: `worker-user-${i}`, name: w.name, email: w.email, role: "WORKER", passwordHash }
    });
    const worker = await prisma.worker.create({
      data: {
        id: `worker-${i}`,
        user: { connect: { id: user.id } },
        cooperative: { connect: { id: coop.id } },
        serviceCategory: { connect: { id: w.catId } },
        isVerified: true,
        isAvailable: true,
        latitude: w.lat,
        longitude: w.lng,
      }
    });
    workers.push(worker);
  }

  // 5. Create 10+ Completed Bookings spread over the last 7 days to make charts interesting
  const now = new Date();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const pastBookings = [
    { daysAgo: 6, workerIdx: 0, rating: 5, amount: 300 },
    { daysAgo: 5, workerIdx: 1, rating: 4, amount: 250 },
    { daysAgo: 5, workerIdx: 2, rating: 5, amount: 500 },
    { daysAgo: 4, workerIdx: 0, rating: 3, amount: 300 },
    { daysAgo: 3, workerIdx: 3, rating: 5, amount: 300 },
    { daysAgo: 3, workerIdx: 4, rating: 4, amount: 250 },
    { daysAgo: 2, workerIdx: 1, rating: 5, amount: 250 },
    { daysAgo: 2, workerIdx: 2, rating: 5, amount: 500 },
    { daysAgo: 1, workerIdx: 0, rating: 4, amount: 300 },
    { daysAgo: 1, workerIdx: 3, rating: 5, amount: 300 },
    { daysAgo: 0, workerIdx: 4, rating: 5, amount: 250 }, // today
  ];

  for (let i = 0; i < pastBookings.length; i++) {
    const pb = pastBookings[i];
    const date = new Date(now.getTime() - (pb.daysAgo * MS_PER_DAY));
    const worker = workers[pb.workerIdx];
    const commissionAmt = pb.amount * (coop.commissionPct / 100);
    const payoutAmt = pb.amount - commissionAmt;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        workerId: worker.id,
        status: "COMPLETED",
        address: "123 MG Road, Bengaluru",
        amount: pb.amount,
        commissionAmt,
        payoutAmt,
        scheduledAt: date,
        createdAt: date,
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        mockReference: `MOCK-${booking.id.substring(0, 8).toUpperCase()}`,
        status: "SUCCESS",
        createdAt: date,
      }
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: customer.id,
        rating: pb.rating,
        comment: pb.rating === 5 ? "Excellent service!" : "Good, but could be better.",
        createdAt: date,
      }
    });

    // Update worker totals
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        totalJobs: { increment: 1 }
      }
    });
  }

  // Recalculate average ratings for all workers
  for (const w of workers) {
    const allReviews = await prisma.review.findMany({
      where: { booking: { workerId: w.id } },
      select: { rating: true },
    });
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.worker.update({
        where: { id: w.id },
        data: { ratingAvg: avg }
      });
    }
  }

  // 6. Create 1-2 In-flight bookings for the live demo
  // One REQUESTED (for the worker to accept live)
  await prisma.booking.create({
    data: {
      customerId: customer.id,
      workerId: workers[0].id, // Arun E.
      status: "REQUESTED",
      address: "456 Brigade Road, Bengaluru",
      amount: 300,
      commissionAmt: 30,
      payoutAmt: 270,
      scheduledAt: new Date(now.getTime() + MS_PER_DAY), // tomorrow
    }
  });

  // One ACCEPTED (for the worker to start/complete live)
  await prisma.booking.create({
    data: {
      customerId: customer.id,
      workerId: workers[1].id, // Priya P.
      status: "ACCEPTED",
      address: "789 Indiranagar, Bengaluru",
      amount: 250,
      commissionAmt: 25,
      payoutAmt: 225,
      scheduledAt: new Date(now.getTime() + (2 * MS_PER_DAY)), // in 2 days
    }
  });

  console.log("Demo seed complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
