"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { UpdateCommissionInput, UpdateCommissionSchema } from "@/lib/zod-schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function CommissionForm({ coopId, initialPct }: { coopId: string; initialPct: number }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateCommissionInput>({
    resolver: zodResolver(UpdateCommissionSchema),
    defaultValues: {
      commissionPct: initialPct,
    },
  });

  const onSubmit = async (data: UpdateCommissionInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cooperatives/${coopId}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        toast.error("Failed to update commission");
        return;
      }

      toast.success("Commission percentage updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Commission</CardTitle>
        <CardDescription>
          Set the percentage your cooperative takes from each completed job.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start space-x-4">
          <div className="flex-1 max-w-xs space-y-1">
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                {...register("commissionPct", { valueAsNumber: true })}
                className="pr-8"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                %
              </div>
            </div>
            {errors.commissionPct && (
              <p className="text-sm text-red-500">{errors.commissionPct.message}</p>
            )}
          </div>
          <Button type="submit" disabled={!isDirty || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
