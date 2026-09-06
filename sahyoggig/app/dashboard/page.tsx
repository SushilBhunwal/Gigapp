export const dynamic = "force-dynamic";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Droplet, BookOpen, Sparkles, Heart, ClipboardList } from "lucide-react";

// Map some common seeded categories to icons
const getIcon = (name: string) => {
  if (name.includes("Electrician")) return <Wrench className="w-8 h-8 text-blue-500 mb-2" />;
  if (name.includes("Plumber")) return <Droplet className="w-8 h-8 text-cyan-500 mb-2" />;
  if (name.includes("Tutor")) return <BookOpen className="w-8 h-8 text-indigo-500 mb-2" />;
  if (name.includes("Cleaner")) return <Sparkles className="w-8 h-8 text-yellow-500 mb-2" />;
  if (name.includes("Elder Care")) return <Heart className="w-8 h-8 text-red-500 mb-2" />;
  return <Wrench className="w-8 h-8 text-gray-500 mb-2" />;
};

export default async function CustomerDashboard() {
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER") redirect("/login");

  // Fetch categories directly since this is a server component
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">SahyogGig</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {session.user?.name}</span>
          <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ClipboardList className="w-4 h-4" />
            My Bookings
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">What do you need help with?</h1>
          <p className="text-muted-foreground mt-2">Select a service to find verified professionals near you.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/dashboard/book/${cat.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  {getIcon(cat.name)}
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

