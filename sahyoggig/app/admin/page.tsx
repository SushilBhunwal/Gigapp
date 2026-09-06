import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, IndianRupee, Star } from "lucide-react";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { CommissionForm } from "@/components/admin/CommissionForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { format, subDays } from "date-fns";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 1. Fetch the cooperative owned by this admin
  const coop = await prisma.cooperative.findUnique({
    where: { adminId: session.user.id },
  });

  if (!coop) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: No cooperative associated with your account.
        <div className="mt-4"><LogoutButton /></div>
      </div>
    );
  }

  // 2. Fetch workers & calculate stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [workers, completedBookings] = await Promise.all([
    prisma.worker.findMany({
      where: { cooperativeId: coop.id },
      include: { 
        user: { select: { name: true } }, 
        serviceCategory: { select: { name: true } } 
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.booking.findMany({
      where: {
        worker: { cooperativeId: coop.id },
        status: "COMPLETED",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { id: true, amount: true, createdAt: true },
    }),
  ]);

  // Derived Analytics
  const activeWorkers = workers.filter((w) => w.isVerified).length;
  const verifiedWorkersForRating = workers.filter((w) => w.isVerified && w.ratingAvg > 0);
  
  const avgRating = verifiedWorkersForRating.length > 0
    ? verifiedWorkersForRating.reduce((acc, w) => acc + w.ratingAvg, 0) / verifiedWorkersForRating.length
    : 0;

  const totalJobsThisWeek = completedBookings.length;
  const totalRevenueThisWeek = completedBookings.reduce((sum, b) => sum + b.amount, 0);

  // Generate chart data for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "MMM dd");
    const dayBookings = completedBookings.filter(b => format(b.createdAt, "MMM dd") === dateStr);
    
    return {
      date: dateStr,
      jobs: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + b.amount, 0),
    };
  });

  // Format workers for the client component table
  const formattedWorkers = workers.map((w) => ({
    id: w.id,
    name: w.user.name,
    serviceCategory: w.serviceCategory.name,
    isVerified: w.isVerified,
    isAvailable: w.isAvailable,
    ratingAvg: w.ratingAvg,
    totalJobs: w.totalJobs,
  }));

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{coop.name}</h1>
          <p className="text-muted-foreground">Manage your cooperative's workers and platform settings.</p>
        </div>
        <LogoutButton />
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workers</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers} / {workers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs (Last 7 Days)</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobsThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Last 7 Days)</CardTitle>
            <IndianRupee className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenueThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Worker Rating</CardTitle>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WorkerTable workers={formattedWorkers} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <CommissionForm 
            cooperativeId={coop.id} 
            initialCommission={coop.commissionPct} 
          />
        </div>
      </div>
    </div>
  );
}
