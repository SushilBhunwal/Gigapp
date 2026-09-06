import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateReviewSchema } from "@/lib/zod-schemas";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can leave reviews" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
    }

    const { bookingId, rating, comment } = parsed.data;

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "COMPLETED" || booking.payment?.status !== "SUCCESS") {
      return NextResponse.json({ error: "Booking must be completed and paid to leave a review" }, { status: 400 });
    }

    if (booking.review) {
      return NextResponse.json({ error: "A review already exists for this booking" }, { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId: session.user.id,
        rating,
        comment,
      },
    });

    // Recalculate average rating for the worker
    const allReviews = await prisma.review.findMany({
      where: { booking: { workerId: booking.workerId } },
      select: { rating: true },
    });

    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = allReviews.length > 0 ? sum / allReviews.length : 0;

    await prisma.worker.update({
      where: { id: booking.workerId },
      data: { ratingAvg: avg },
    });

    return NextResponse.json({ success: true, review });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
