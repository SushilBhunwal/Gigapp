import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// A simple delay function to simulate gateway latency
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can make payments" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // 1. Fetch the booking and include the worker's cooperative to get commissionPct
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        worker: {
          include: {
            cooperative: true,
          }
        },
        payment: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.payment?.status === "SUCCESS") {
      return NextResponse.json({ error: "Booking is already paid" }, { status: 400 });
    }

    // 2. Simulate external gateway latency (~1.5s)
    await delay(1500);

    // 3. Compute commissionAmt and payoutAmt server-side
    const commissionPct = booking.worker.cooperative.commissionPct;
    const amount = booking.amount;
    const commissionAmt = (amount * commissionPct) / 100;
    const payoutAmt = amount - commissionAmt;

    // Generate a fake reference string
    const mockReference = `MOCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 4. Create the Payment record (Payment model only has mockReference and status)
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        mockReference,
        status: "SUCCESS",
      }
    });

    // 5. Also ensure the Booking record has the computed amounts
    await prisma.booking.update({
      where: { id: bookingId },
      data: { commissionAmt, payoutAmt }
    });

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        amount,
        commissionAmt,
        payoutAmt,
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
