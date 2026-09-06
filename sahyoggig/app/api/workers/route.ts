import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const workers = await prisma.worker.findMany({
      where: {
        serviceCategoryId: categoryId || undefined,
        isVerified: true,
        isAvailable: true,
      },
      include: {
        user: { select: { name: true, phone: true } },
        cooperative: { select: { name: true } },
      },
    });

    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
