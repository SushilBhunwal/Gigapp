"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Worker = {
  id: string;
  name: string;
  serviceCategory: string;
  isVerified: boolean;
  isAvailable: boolean;
  ratingAvg: number;
  totalJobs: number;
};

export function WorkerTable({ initialWorkers }: { initialWorkers: Worker[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleVerify = async (workerId: string, currentStatus: boolean) => {
    setLoadingId(workerId);
    try {
      const res = await fetch(`/api/workers/${workerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (!res.ok) {
        toast.error("Failed to update verification status");
        return;
      }

      toast.success(`Worker ${!currentStatus ? "verified" : "rejected"} successfully`);
      router.refresh(); // Refresh the server component to get new data
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker Name</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead className="text-right">Jobs</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialWorkers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                No workers found. Add some to get started!
              </TableCell>
            </TableRow>
          ) : (
            initialWorkers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{worker.serviceCategory}</Badge>
                </TableCell>
                <TableCell>
                  {worker.isVerified ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {worker.isAvailable ? (
                    <span className="text-green-600 font-medium text-sm">Online</span>
                  ) : (
                    <span className="text-gray-400 font-medium text-sm">Offline</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{worker.ratingAvg > 0 ? worker.ratingAvg.toFixed(1) : "New"}</span>
                  </div>
                </TableCell>
                <TableCell>{worker.totalJobs}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={worker.isVerified ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleVerify(worker.id, worker.isVerified)}
                    disabled={loadingId === worker.id}
                  >
                    {loadingId === worker.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : worker.isVerified ? (
                      "Reject"
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
