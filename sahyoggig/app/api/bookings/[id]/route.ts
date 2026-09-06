import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UpdateBookingStatusSchema } from "@/lib/zod-schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "WORKER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    
    // Ensure the worker making the request actually owns this booking
    const worker = await prisma.worker.findUnique({ where: { userId: session.user.id } });
    if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.workerId !== worker.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const parsed = UpdateBookingStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    // If marked as COMPLETED, we should increment the worker's total jobs
    if (parsed.data.status === "COMPLETED" && booking.status !== "COMPLETED") {
      await prisma.worker.update({
        where: { id: worker.id },
        data: { totalJobs: { increment: 1 } }
      });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
