"use client";

// Imports
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/providers";
import { toast } from "sonner";

// Success Content
function SignUpSuccessContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { resendConfirmationEmail, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    const { error } = await resendConfirmationEmail(email);

    if (error) {
      toast.error("Failed to resend email", { description: error });
    } else {
      toast.success("Confirmation email resent!", {
        description: "Please check your inbox for the new confirmation link.",
      });
    }

    setIsLoading(false);
  };

  const handleSignIn = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    router.push(`/auth/login?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-primary-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-foreground">Onboardly</span>
      </div>

      <Card className="border-0 shadow-lg text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We&apos;ve sent a confirmation link to your email address. Please
            click the link to verify your account and get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Didn&apos;t receive the email?
            </p>
            <p>Check your spam folder or request a new confirmation link.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleSignIn} className="w-full">
              Back to Sign In
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Resending...
                </>
              ) : (
                "Resend confirmation email"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Fallback Loading
function SignUpSuccessFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

// Component
export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={<SignUpSuccessFallback />}>
      <SignUpSuccessContent />
    </Suspense>
  );
}
