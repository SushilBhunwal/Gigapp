"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CreateBookingInput, CreateBookingSchema } from "@/lib/zod-schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import * as z from "zod";

const LocalBookingSchema = z.object({
  workerId: z.string().min(1),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  amount: z.number().positive(),
});

type LocalBookingInput = z.infer<typeof LocalBookingSchema>;

export function BookingForm({ workerId, onClose }: { workerId: string; onClose: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocalBookingInput>({
    resolver: zodResolver(LocalBookingSchema),
    defaultValues: {
      workerId,
      amount: 300, // Hardcoded flat rate for Phase 3
    },
  });

  const onSubmit = async (data: LocalBookingInput) => {
    setIsLoading(true);
    try {
      // Ensure the datetime string is in strict ISO format for Zod's .datetime()
      const formattedData = {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create booking");
        return;
      }

      toast.success("Booking requested successfully!");
      onClose();
      // Redirect to the booking detail page
      router.push(`/dashboard/bookings/${json.booking.id}`);
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Get current local datetime for min attribute (e.g. "2026-09-06T12:00")
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Date & Time</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          min={minDateTime}
          {...register("scheduledAt")}
        />
        {errors.scheduledAt && (
          <p className="text-sm text-red-500">Please select a valid future date and time.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Service Address</Label>
        <Input
          id="address"
          placeholder="123 Main St, Apartment 4B"
          {...register("address")}
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Booking"}
      </Button>
    </form>
  );
}
