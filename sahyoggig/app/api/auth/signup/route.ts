import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignupSchema } from "@/lib/zod-schemas";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate input with Zod
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role, cooperativeId, serviceCategoryId } = parsed.data;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user (and worker profile if role is WORKER)
    if (role === "WORKER") {
      if (!cooperativeId || !serviceCategoryId) {
        return NextResponse.json(
          { error: "Workers must select a Cooperative and a Service Category" },
          { status: 400 }
        );
      }

      await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: "WORKER",
          workerProfile: {
            create: {
              cooperativeId,
              serviceCategoryId,
              isVerified: false, // Explicitly false as per spec
              isAvailable: false,
            }
          }
        }
      });
    } else {
      // CUSTOMER signup
      await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: "CUSTOMER",
        }
      });
    }

    return NextResponse.json({ success: true, message: "Account created successfully" }, { status: 201 });
    
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
