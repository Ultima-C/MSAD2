"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  UserPlus,
  ArrowRight,
  Loader2,
  Building,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

type RegistrationView = "selection" | "candidate";

export default function RegisterPage() {
  const router = useRouter();
  const [view, setView] = useState<RegistrationView>("selection");

  // Candidate Form State
  const [inviteCode, setInviteCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [organization, setOrganization] = useState<{
    name: string;
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCode = useCallback(async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) return;

    setIsValidatingCode(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsCodeVerified(false);
        setOrganization(null);
        toast.error("Invalid Code", {
          description: "We couldn't find an organization with that code.",
        });
      } else {
        setIsCodeVerified(true);
        // Pre-fill email from the API response
        setFormData((prev) => ({ ...prev, email: data.email }));
        setOrganization({
          name: data.name,
          primaryColor: data.primaryColor,
          secondaryColor: data.primaryColor,
        });
        toast.success("Code Verified", {
          description: `Connected to ${data.name}`,
        });
      }
    } catch (err) {
      toast.error("Error", { description: "Connection failed." });
    } finally {
      setIsValidatingCode(false);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          inviteCode: inviteCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Account Created!");
      router.push(`/portal/${data.token}`);
    } catch (err: any) {
      toast.error("Registration failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <AnimatePresence mode="wait">
        {view === "selection" ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full"
          >
            <Card
              className="group cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 border-slate-200"
              onClick={() => router.push("/register/tenant")}
            >
              <CardHeader className="space-y-4 pb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Building2 className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">
                    Register as Company
                  </CardTitle>
                  <CardDescription className="text-base">
                    Create a new workspace for your organization.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="group cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 border-slate-200"
              onClick={() => setView("candidate")}
            >
              <CardHeader className="space-y-4 pb-8">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                  <UserPlus className="h-6 w-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">
                    Register as Candidate
                  </CardTitle>
                  <CardDescription className="text-base">
                    Joined via an invite? Verify your code.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="candidate"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
            style={
              {
                "--primary-color":
                  organization?.primaryColor || "var(--primary)",
                "--secondary-color":
                  organization?.secondaryColor || "var(--secondary)",
              } as React.CSSProperties
            }
          >
            <Card className="shadow-2xl border-slate-200 overflow-hidden">
              <div className="h-1.5 w-full bg-slate-100">
                <motion.div
                  animate={{ width: isCodeVerified ? "100%" : "25%" }}
                  className="h-full bg-[var(--primary-color)] transition-all duration-700"
                />
              </div>

              <CardHeader className="space-y-1">
                <button
                  onClick={() => {
                    setView("selection");
                    setIsCodeVerified(false);
                    setInviteCode("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  ← Back
                </button>
                <CardTitle className="text-2xl pt-2">
                  {isCodeVerified
                    ? "Complete Registration"
                    : "Candidate Verification"}
                </CardTitle>
                <CardDescription>
                  {isCodeVerified
                    ? "Set up your account details."
                    : "Verify your organization to continue."}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {!isCodeVerified ? (
                    <motion.div
                      key="code-input"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <Label htmlFor="invite-code">
                        Organization Invite Code
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="invite-code"
                          placeholder="XXXX-XXXX"
                          value={inviteCode}
                          onChange={(e) =>
                            setInviteCode(e.target.value.toUpperCase())
                          }
                          className="pl-10 h-12 font-mono uppercase tracking-widest"
                        />
                      </div>
                      <Button
                        className="w-full h-12"
                        onClick={() => validateCode(inviteCode)}
                        disabled={isValidatingCode || inviteCode.length < 4}
                      >
                        {isValidatingCode ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "Verify Code"
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="registration-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <Alert className="bg-[var(--primary-color)]/10 border-[var(--primary-color)]/20 text-[var(--primary-color)]">
                        <Building className="h-4 w-4" />
                        <AlertDescription className="font-medium">
                          Organization:{" "}
                          <span className="font-bold">
                            {organization?.name}
                          </span>
                        </AlertDescription>
                      </Alert>

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            placeholder="John Doe"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fullName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-slate-50 cursor-not-allowed text-slate-500"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 relative">
                            <Label>Password</Label>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  password: e.target.value,
                                })
                              }
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-8 text-slate-500 hover:text-slate-700"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="space-y-2 relative">
                            <Label>Confirm</Label>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-8 text-slate-500 hover:text-slate-700"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Complete Registration"
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
