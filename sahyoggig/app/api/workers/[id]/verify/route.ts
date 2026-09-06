import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VerifyWorkerSchema } from "@/lib/zod-schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "COOP_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Ensure worker belongs to this admin's cooperative
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: { cooperative: true }
    });

    if (!worker || worker.cooperative.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = VerifyWorkerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await prisma.worker.update({
      where: { id },
      data: { isVerified: parsed.data.isVerified },
    });

    return NextResponse.json({ success: true, isVerified: parsed.data.isVerified });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
