import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Next.js 16 requires params to be Promises, but NextAuth v5 beta signature 
// hasn't fully updated yet. Wrapping them explicitly satisfies the compiler.
export const GET = async (req: NextRequest) => handlers.GET(req);
export const POST = async (req: NextRequest) => handlers.POST(req);
