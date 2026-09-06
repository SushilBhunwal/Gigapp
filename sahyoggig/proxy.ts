import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // 1. Not logged in — redirect to login
  if (!req.auth) {
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/worker") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Helper to determine the correct base route for a role
  const getCorrectRoute = (r: string | undefined) => {
    if (r === "COOP_ADMIN" || r === "SUPER_ADMIN") return "/admin";
    if (r === "WORKER") return "/worker";
    return "/dashboard"; // CUSTOMER
  };

  // 2. Role-based access guards (redirect wrong role to their own dashboard)
  if (pathname.startsWith("/admin") && role !== "COOP_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(getCorrectRoute(role), req.url));
  }

  if (pathname.startsWith("/worker") && role !== "WORKER") {
    return NextResponse.redirect(new URL(getCorrectRoute(role), req.url));
  }

  if (pathname.startsWith("/dashboard") && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL(getCorrectRoute(role), req.url));
  }

  // 3. Logged-in users hitting auth pages → redirect to their dashboard
  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
    return NextResponse.redirect(new URL(getCorrectRoute(role), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
