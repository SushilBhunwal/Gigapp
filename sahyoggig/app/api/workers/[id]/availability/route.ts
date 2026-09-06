import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ToggleAvailabilitySchema } from "@/lib/zod-schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "WORKER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker || worker.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const parsed = ToggleAvailabilitySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const updated = await prisma.worker.update({
      where: { id },
      data: { isAvailable: parsed.data.isAvailable },
    });

    return NextResponse.json({ success: true, isAvailable: updated.isAvailable });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
