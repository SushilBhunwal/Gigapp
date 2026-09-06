export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientMapWrapper } from "@/components/map/ClientMapWrapper";

export default async function BookCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER") redirect("/login");

  const { categoryId } = await params;

  // Validate category exists
  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Book a {category.name}</h1>
            <p className="text-muted-foreground">Select a verified professional on the map to continue.</p>
          </div>
        </div>

        {/* Client-side map component wrapper */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <ClientMapWrapper categoryId={categoryId} />
        </div>
      </div>
    </div>
  );
}
