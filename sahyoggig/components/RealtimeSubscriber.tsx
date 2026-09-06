"use client";

import { useBookingRealtime } from "@/hooks/useBookingRealtime";

export function RealtimeSubscriber({ bookingId, workerId }: { bookingId?: string; workerId?: string }) {
  useBookingRealtime({ bookingId, workerId });
  return null;
}
