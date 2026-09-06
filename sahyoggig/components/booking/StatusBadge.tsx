"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  let badgeClass = "bg-gray-100 text-gray-800";
  let displayStatus = status;

  switch (status) {
    case "REQUESTED":
      badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      displayStatus = "Pending Confirmation";
      break;
    case "ACCEPTED":
      badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
      displayStatus = "Worker on the way";
      break;
    case "IN_PROGRESS":
      badgeClass = "bg-purple-100 text-purple-800 hover:bg-purple-100";
      displayStatus = "Job in Progress";
      break;
    case "COMPLETED":
      badgeClass = "bg-green-100 text-green-800 hover:bg-green-100";
      displayStatus = "Completed";
      break;
    case "CANCELLED":
      badgeClass = "bg-red-100 text-red-800 hover:bg-red-100";
      displayStatus = "Cancelled";
      break;
  }

  return (
    <motion.div
      key={status} // changing key forces exit/enter animation
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Badge className={`${badgeClass} text-sm px-3 py-1 font-medium`}>
        {displayStatus}
      </Badge>
    </motion.div>
  );
}
