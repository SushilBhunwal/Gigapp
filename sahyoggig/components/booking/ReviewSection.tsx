"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const ReviewFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type ReviewFormInput = z.infer<typeof ReviewFormSchema>;

type ReviewProps = {
  bookingId: string;
  status: string;
  paymentStatus?: string;
  review: { rating: number; comment: string | null } | null;
};

export function ReviewSection({ bookingId, status, paymentStatus, review }: ReviewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormInput>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const rating = watch("rating");

  // Only show reviews if job is completed and paid
  if (status !== "COMPLETED" || paymentStatus !== "SUCCESS") {
    return null;
  }

  // If a review already exists, show it read-only
  if (review) {
    return (
      <div className="mt-6 border-t pt-6">
        <h3 className="font-semibold text-lg mb-4">Your Review</h3>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          {review.comment && <p className="text-gray-700 mt-2 text-sm">{review.comment}</p>}
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ReviewFormInput) => {
    if (data.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, ...data }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        toast.error(json.error || "Failed to submit review");
      } else {
        toast.success("Review submitted successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold text-lg mb-4">Leave a Review</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setValue("rating", star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  star <= (hoveredStar || rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          {errors.rating && <p className="text-red-500 text-sm mt-1">Please select a rating</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
          <Textarea 
            placeholder="How was the service?" 
            {...register("comment")} 
            className="resize-none"
            rows={3}
          />
          {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Review
        </Button>
      </form>
    </div>
  );
}
