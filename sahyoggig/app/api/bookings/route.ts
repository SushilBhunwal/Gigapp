import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateBookingSchema } from "@/lib/zod-schemas";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can create bookings" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
    }

    const { workerId, scheduledAt, address, amount } = parsed.data;

    // Fetch the worker to get their cooperative's commission percentage
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { cooperative: true }
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const commissionPct = worker.cooperative.commissionPct;
    const commissionAmt = (amount * commissionPct) / 100;
    const payoutAmt = amount - commissionAmt;

    const booking = await prisma.booking.create({
      data: {
        workerId,
        customerId: session.user.id!,
        scheduledAt: new Date(scheduledAt),
        address,
        amount,
        commissionAmt,
        payoutAmt,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
