"use client";

// Imports
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Components
const BrandingPanel = () => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-primary via-primary to-[var(--primary-hover)] text-primary-foreground flex flex-col p-10 lg:p-16">
    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    />

    <Link
      href="/"
      className="relative z-10 flex items-center gap-2 w-fit hover:opacity-80 transition-opacity cursor-pointer inline-flex"
    >
      <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/25 shadow-sm">
        <span className="text-white text-lg font-bold leading-none">O</span>
      </div>
      <span className="text-lg font-semibold tracking-tight">Onboardly</span>
    </Link>

    <div className="relative z-10 flex-1 flex flex-col justify-center space-y-6 w-full">
      <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] max-w-lg">
        Automate your corporate onboarding.
      </h2>
      <p className="text-lg text-white/80 max-w-md leading-relaxed">
        Streamline new-hire workflows, paperwork, and training in one beautiful
        workspace — so your team can focus on what matters.
      </p>
    </div>
  </div>
);

// Handlers
const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      if (
        error.includes("verify your email") ||
        error.includes("email confirmed")
      ) {
        toast.error("Email verification required", {
          description: "Please check your email for the confirmation link.",
        });
        window.location.href = `/auth/signup-success?email=${encodeURIComponent(formData.email)}`;
      } else {
        toast.error("Sign in failed", { description: error });
      }
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.getSession();

    const { data: clientRecords } = await supabase
      .from("clients")
      .select("id, status")
      .ilike("email", formData.email);

    if (clientRecords && clientRecords.length > 0) {
      toast.success("Welcome back!", {
        description: "Loading your dashboard...",
      });
      window.location.href = "/clientdashboard";
      return;
    }

    toast.success("Welcome back!", {
      description: "Redirecting to dashboard...",
    });
    window.location.href = "/tenantdashboard";
  };

  return (
    <div className="min-h-full w-full flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
      <div className="w-full max-w-sm py-4">
        <div className="mb-8">
          <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to Onboardly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              value={formData.email}
              onChange={handleChange}
              className="h-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                className="h-11 pr-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-11 font-medium text-[15px] bg-primary text-primary-foreground mt-4",
              "hover:bg-[var(--primary-hover)] hover:-translate-y-px hover:shadow-lg hover:shadow-primary/25",
              "active:translate-y-0 transition-all duration-200",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-[var(--primary-hover)] transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

// Layout
export default function LoginPage() {
  return (
    <main className="h-screen w-full bg-background overflow-hidden flex">
      <div className="w-full lg:w-1/2 h-full overflow-y-auto">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>

      <div className="hidden lg:block w-1/2 h-full">
        <BrandingPanel />
      </div>
    </main>
  );
}
