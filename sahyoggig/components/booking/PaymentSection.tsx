"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type PaymentProps = {
  bookingId: string;
  status: string;
  payment: { status: string; mockReference: string | null } | null;
};

export function PaymentSection({ bookingId, status, payment }: PaymentProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Already paid?
  if (payment?.status === "SUCCESS") {
    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center text-green-700 font-semibold text-lg">
          <CheckCircle2 className="w-6 h-6 mr-2" />
          Payment Successful
        </div>
        <p className="text-green-600 text-sm">Reference: {payment.reference}</p>
      </div>
    );
  }

  // Only show Pay Now if the job is COMPLETED and not paid
  if (status !== "COMPLETED") {
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        toast.error(json.error || "Payment failed");
        setIsProcessing(false);
      } else {
        toast.success("Payment processed successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Network error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold text-lg mb-2">Job Complete!</h3>
      <p className="text-muted-foreground text-sm mb-4">
        The worker has completed the job. Please proceed with the payment.
      </p>
      <Button 
        onClick={handlePayment} 
        disabled={isProcessing} 
        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-medium"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing payment...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </div>
  );
}
