import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  if (role === "COOP_ADMIN" || role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (role === "WORKER") {
    redirect("/worker");
  }
  redirect("/dashboard");
}
