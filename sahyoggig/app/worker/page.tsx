export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkerDashboardClient } from "@/components/worker/WorkerDashboardClient";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { RealtimeSubscriber } from "@/components/RealtimeSubscriber";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function WorkerDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "WORKER") redirect("/login");

  // Fetch the worker profile
  const worker = await prisma.worker.findUnique({
    where: { userId: session.user.id },
  });

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500">Error: Worker profile not found.</p>
        <LogoutButton />
      </div>
    );
  }

  // Fetch incoming and active bookings
  const bookings = await prisma.booking.findMany({
    where: { 
      workerId: worker.id,
      status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] }
    },
    include: {
      customer: { select: { name: true } }
    },
    orderBy: { scheduledAt: "asc" }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Realtime listener for this worker's bookings */}
      <RealtimeSubscriber workerId={worker.id} />
      
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Worker Dashboard</h1>
            <p className="text-muted-foreground">Manage your availability and jobs.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/worker/earnings">
              <Button variant="outline">View Earnings</Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        <WorkerDashboardClient 
          workerId={worker.id}
          initialAvailability={worker.isAvailable}
          bookings={bookings}
        />
      </div>
    </div>
  );
}

