"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { SignupInput, SignupSchema } from "@/lib/zod-schemas";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type SignupFormProps = {
  cooperatives: { id: string; name: string }[];
  categories: { id: string; name: string }[];
};

export function SignupForm({ cooperatives, categories }: SignupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"CUSTOMER" | "WORKER">("CUSTOMER");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      role: "CUSTOMER",
    },
  });

  const onTabChange = (val: string) => {
    const newRole = val as "CUSTOMER" | "WORKER";
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Signup failed");
        return;
      }

      toast.success("Account created successfully! Logging you in...");
      
      // Auto-login after successful signup
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!result?.error) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Join the SahyogGig community today</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="CUSTOMER" onValueChange={onTabChange} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="CUSTOMER">Customer</TabsTrigger>
            <TabsTrigger value="WORKER">Worker</TabsTrigger>
          </TabsList>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="9876543210" {...register("phone")} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Worker Specific Fields */}
            {role === "WORKER" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cooperative">Select your Cooperative</Label>
                  <Select onValueChange={(val: string | null) => { if (val) setValue("cooperativeId", val) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cooperative..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperatives.map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cooperativeId && <p className="text-sm text-red-500">{errors.cooperativeId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Select your Service</Label>
                  <Select onValueChange={(val: string | null) => { if (val) setValue("serviceCategoryId", val) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="What service do you provide?" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceCategoryId && <p className="text-sm text-red-500">{errors.serviceCategoryId.message}</p>}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign up"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  );
}
