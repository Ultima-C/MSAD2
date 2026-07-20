"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ClientSetupPage() {
  const router = useRouter();

  // State to track if code is verified
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    magicCode: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Replace this with your actual API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsLoading(false);
    setIsVerified(true);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/clients/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magicCode: formData.magicCode,
          fullName: formData.fullName,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Account setup complete!");
      router.push("/onboarding");
    } catch (err: any) {
      toast.error("Setup failed", { description: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-slate-200">
          <div className="h-1.5 w-full bg-primary" />

          {!isVerified ? (
            /* Step 1: Code Input */
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold">Enter Code</CardTitle>
                <CardDescription>
                  Enter the magic code to start your setup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="magicCode" className="text-xs">
                      Magic Code
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="magicCode"
                        placeholder="Enter code"
                        className="pl-9 h-9"
                        required
                        value={formData.magicCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            magicCode: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <>
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            /* Step 2: Information Input */
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold">
                  Complete Setup
                </CardTitle>
                <CardDescription>
                  Secure your workspace account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFinalize} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        className="pl-9 h-9"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pl-9 h-9 pr-9"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        className="pl-9 h-9"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Complete Account"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
