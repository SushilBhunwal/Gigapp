import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Clock, IndianRupee, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaymentSection } from "@/components/booking/PaymentSection";
import { ReviewSection } from "@/components/booking/ReviewSection";

function getStatusBadge(status: string) {
  switch (status) {
    case "REQUESTED": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Requested</Badge>;
    case "ACCEPTED": return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Accepted</Badge>;
    case "IN_PROGRESS": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    case "COMPLETED": return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

import { RealtimeSubscriber } from "@/components/RealtimeSubscriber";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER") redirect("/login");

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      worker: {
        include: {
          user: { select: { name: true, phone: true } },
          cooperative: { select: { name: true } },
          serviceCategory: { select: { name: true } }
        }
      },
      payment: true,
      review: true,
    }
  });

  if (!booking || booking.customerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <RealtimeSubscriber bookingId={booking.id} />
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Booking #{booking.id.slice(-6).toUpperCase()}</CardTitle>
            {getStatusBadge(booking.status)}
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Worker Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-100/50 rounded-lg border">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{booking.worker.user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {booking.worker.serviceCategory.name} • {booking.worker.cooperative.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> Scheduled for
                </p>
                <p className="font-medium">{format(new Date(booking.scheduledAt), "PPP 'at' p")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <IndianRupee className="w-4 h-4 mr-2" /> Amount
                </p>
                <p className="font-medium">₹{booking.amount}</p>
              </div>
              <div className="space-y-1 md:col-span-2 mt-2">
                <p className="text-sm text-muted-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Service Address
                </p>
                <p className="font-medium">{booking.address}</p>
              </div>
            </div>

            <PaymentSection 
              bookingId={booking.id} 
              status={booking.status} 
              payment={booking.payment} 
            />

            <ReviewSection 
              bookingId={booking.id}
              status={booking.status}
              paymentStatus={booking.payment?.status}
              review={booking.review}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
