"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useBookingRealtime(filter?: { bookingId?: string; workerId?: string }) {
  const router = useRouter();

  useEffect(() => {
    let filterString = undefined;
    if (filter?.bookingId) filterString = `id=eq.${filter.bookingId}`;
    else if (filter?.workerId) filterString = `workerId=eq.${filter.workerId}`;

    const channel = supabase
      .channel(`realtime:bookings:${filterString || 'all'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Booking",
          filter: filterString,
        },
        () => {
          // Soft-refresh the current route to fetch latest server data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, filter?.bookingId, filter?.workerId]);
}
