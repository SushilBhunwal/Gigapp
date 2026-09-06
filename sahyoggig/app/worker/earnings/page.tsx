import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, IndianRupee, MapPin, Calendar, TrendingUp, Percent } from "lucide-react";
import { format } from "date-fns";

export default async function WorkerEarningsPage() {
  const session = await auth();
  if (session?.user?.role !== "WORKER") redirect("/login");

  const worker = await prisma.worker.findUnique({
    where: { userId: session.user.id },
    include: { cooperative: true },
  });

  if (!worker) {
    redirect("/login");
  }

  // Calculate "this month"
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all completed bookings with payment info
  const completedBookings = await prisma.booking.findMany({
    where: { 
      workerId: worker.id,
      status: "COMPLETED",
    },
    include: {
      customer: { select: { name: true } },
      payment: true,
    },
    orderBy: { scheduledAt: "desc" }
  });

  // Calculate earnings for this month
  const thisMonthBookings = completedBookings.filter(b => b.scheduledAt >= startOfMonth);
  const totalAmountThisMonth = thisMonthBookings.reduce((sum, b) => sum + b.amount, 0);
  const totalCommissionThisMonth = thisMonthBookings.reduce((sum, b) => sum + b.commissionAmt, 0);
  const totalPayoutThisMonth = thisMonthBookings.reduce((sum, b) => sum + b.payoutAmt, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/worker">
            <Button variant="ghost" className="-ml-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <LogoutButton />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">View your completed jobs, commission breakdown, and net payouts.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" /> Total Booking Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                ₹{totalAmountThisMonth.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-blue-600/70 mt-1">This month&apos;s gross bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50/50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 flex items-center">
                <Percent className="w-4 h-4 mr-1" /> Commission Deducted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                ₹{totalCommissionThisMonth.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-orange-600/70 mt-1">{worker.cooperative.commissionPct}% cooperative commission</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> Net Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                ₹{totalPayoutThisMonth.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-green-600/70 mt-1">Your take-home this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Job History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Completed Jobs</h2>
          {completedBookings.length === 0 ? (
            <p className="text-muted-foreground bg-white p-6 rounded-lg border text-center">
              You haven&apos;t completed any jobs yet.
            </p>
          ) : (
            <div className="space-y-3">
              {completedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.customer.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(booking.scheduledAt), "PPP")}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.address}
                          </span>
                        </div>
                      </div>
                      {booking.payment?.status === "SUCCESS" ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium shrink-0">Paid</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium shrink-0">Payment Pending</span>
                      )}
                    </div>

                    {/* Payout breakdown */}
                    <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-4 text-center border">
                      <div>
                        <p className="text-xs text-muted-foreground">Booking Amount</p>
                        <p className="text-lg font-bold text-gray-900">₹{booking.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commission ({worker.cooperative.commissionPct}%)</p>
                        <p className="text-lg font-bold text-orange-600">-₹{booking.commissionAmt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Your Payout</p>
                        <p className="text-lg font-bold text-green-700">₹{booking.payoutAmt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
