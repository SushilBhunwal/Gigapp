import { SignupForm } from "@/components/auth/SignupForm";
import { prisma } from "@/lib/prisma";

export default async function SignupPage() {
  // Fetch dropdown data for workers on the server
  const [cooperatives, categories] = await Promise.all([
    prisma.cooperative.findMany({ select: { id: true, name: true } }),
    prisma.serviceCategory.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <SignupForm cooperatives={cooperatives} categories={categories} />
    </div>
  );
}
