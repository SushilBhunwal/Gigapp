"use client";

import dynamic from "next/dynamic";

// Dynamically import the Leaflet map with SSR disabled.
// This must be inside a "use client" file in Next.js 16 to avoid Turbopack errors.
const WorkerMap = dynamic(() => import("./WorkerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
      <p className="text-gray-500 animate-pulse">Loading map...</p>
    </div>
  ),
});

export function ClientMapWrapper({ categoryId }: { categoryId: string }) {
  return <WorkerMap categoryId={categoryId} />;
}
