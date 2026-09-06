"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const Heatmap = dynamic(() => import("./AdminHeatmap"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[480px] rounded-xl" />
});

export function ClientHeatmapWrapper({ bookings, workers }: { bookings: any[], workers: any[] }) {
  return <Heatmap bookings={bookings} workers={workers} />;
}
