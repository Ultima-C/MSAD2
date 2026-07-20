"use client";

// Imports
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast, Toaster } from "sonner";

// Registration Content
function RegisterCandidateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgData, setOrgData] = useState({
    name: "Organization",
    primaryColor: "#0F766E",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!inviteCode) {
      router.push("/register");
      return;
    }

    fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode }),
    })
      .then((res) => res.json())
      .then((data) => {
        setOrgData(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Invalid Code", {
          description: "Session expired or invalid.",
        });
        router.push("/register");
      });
  }, [inviteCode, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Error", { description: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, inviteCode }),
      });

      const data = await res.json();

      console.log("DEBUG [Frontend]: Full API Response:", data);
      console.log("DEBUG [Frontend]: Evaluated Status:", data.status);

      if (!res.ok) throw new Error(data.error);

      toast.success("Account Created!", {
        description: "Redirecting...",
      });

      if (String(data.status).trim().toLowerCase() === "hired") {
        console.log(
          "DEBUG [Frontend]: Status matches 'hired'. Redirecting to /clientdashboard",
        );
        window.location.href = "/clientdashboard";
      } else {
        console.log(
          "DEBUG [Frontend]: Status does not match 'hired'. Redirecting to portal.",
        );
        window.location.href = `/portal/${data.token}`;
      }
    } catch (err: any) {
      toast.error("Registration Failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      <Card
        className="w-full max-w-md shadow-xl border-t-4"
        style={{ borderTopColor: orgData.primaryColor }}
      >
        <CardHeader>
          <CardTitle>Complete Registration</CardTitle>
          <CardDescription>
            Join {orgData.name} by providing your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                required
                placeholder="Full Name"
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="Email"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Password"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Confirm Password"
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={isSubmitting}
              style={{ backgroundColor: orgData.primaryColor }}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <>
                  Complete & Access Portal{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Fallback Loader
function RegisterCandidateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8" />
    </div>
  );
}

// Component
export default function RegisterCandidatePage() {
  return (
    <Suspense fallback={<RegisterCandidateFallback />}>
      <RegisterCandidateContent />
    </Suspense>
  );
}
