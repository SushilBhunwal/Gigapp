"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, MapPin, Clock, IndianRupee } from "lucide-react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: Date;
  address: string;
  amount: number;
  customer: {
    name: string;
  };
};

export function WorkerDashboardClient({
  workerId,
  initialAvailability,
  bookings,
}: {
  workerId: string;
  initialAvailability: boolean;
  bookings: Booking[];
}) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(initialAvailability);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const toggleAvailability = async (checked: boolean) => {
    setIsAvailable(checked);
    try {
      const res = await fetch(`/api/workers/${workerId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: checked }),
      });
      if (!res.ok) {
        setIsAvailable(!checked); // revert
        toast.error("Failed to update availability");
      } else {
        toast.success(checked ? "You are now online and visible on the map!" : "You are now offline.");
        router.refresh();
      }
    } catch (error) {
      setIsAvailable(!checked); // revert
      toast.error("Network error");
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    setLoadingAction(`${bookingId}-${status}`);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        toast.error("Failed to update booking");
      } else {
        toast.success(`Booking ${status.toLowerCase()} successfully`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoadingAction(null);
    }
  };

  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const upcoming = bookings.filter((b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS");

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your Status</h2>
            <p className="text-muted-foreground text-sm">
              Toggle this to appear or disappear from the customer map.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={toggleAvailability}
            />
            <Label htmlFor="availability" className="font-medium">
              {isAvailable ? "Available" : "Offline"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">New Requests</h2>
        {requested.length === 0 ? (
          <p className="text-muted-foreground bg-white p-6 rounded-lg border text-center">
            No new booking requests right now.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requested.map((booking) => (
              <Card key={booking.id} className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    {booking.customer.name}
                    <Badge className="bg-blue-500">New</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center text-muted-foreground"><Clock className="w-4 h-4 mr-2" /> {format(new Date(booking.scheduledAt), "PPP 'at' p")}</p>
                    <p className="flex items-center text-muted-foreground"><IndianRupee className="w-4 h-4 mr-2" /> ₹{booking.amount}</p>
                    <p className="flex items-start text-muted-foreground"><MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" /> {booking.address}</p>
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => updateBookingStatus(booking.id, "ACCEPTED")}
                      disabled={!!loadingAction}
                    >
                      {loadingAction === `${booking.id}-ACCEPTED` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                      disabled={!!loadingAction}
                    >
                      {loadingAction === `${booking.id}-CANCELLED` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Upcoming & Active Jobs</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground bg-white p-6 rounded-lg border text-center">
            You don't have any active jobs.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    {booking.customer.name}
                    {booking.status === "ACCEPTED" ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">Accepted</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center text-muted-foreground"><Clock className="w-4 h-4 mr-2" /> {format(new Date(booking.scheduledAt), "PPP 'at' p")}</p>
                    <p className="flex items-start text-muted-foreground"><MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" /> {booking.address}</p>
                  </div>
                  <div className="pt-2">
                    {booking.status === "ACCEPTED" ? (
                      <Button 
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" 
                        onClick={() => updateBookingStatus(booking.id, "IN_PROGRESS")}
                        disabled={!!loadingAction}
                      >
                        {loadingAction === `${booking.id}-IN_PROGRESS` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Job"}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                        disabled={!!loadingAction}
                      >
                        {loadingAction === `${booking.id}-COMPLETED` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Complete"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
