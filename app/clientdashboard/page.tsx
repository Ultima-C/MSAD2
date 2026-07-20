"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ClientDashboardRedirector() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirect() {
      console.log("🔄 Initializing dashboard redirect...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn("⚠️ No user found, redirecting to login.");
        router.replace("/auth/login");
        return;
      }

      // Find client record and token
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientError || !client) {
        console.error("❌ Client record not found:", clientError);
        setError("Could not find your client profile. Please contact support.");
        return;
      }

      const { data: tokenRecord, error: tokenError } = await supabase
        .from("candidate_access_tokens")
        .select("token")
        .eq("candidate_id", client.id)
        .maybeSingle();

      if (tokenError || !tokenRecord) {
        console.error("❌ Portal token not found:", tokenError);
        setError(
          "Your dashboard access has not been initialized. Please contact your manager.",
        );
        return;
      }

      console.log("✅ Token found, redirecting to unique dashboard...");
      router.replace(`/clientdashboard/${tokenRecord.token}`);
    }

    redirect();
  }, [supabase, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-xl font-bold text-destructive mb-2">
          Access Error
        </h1>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => router.replace("/auth/login")}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse text-muted-foreground">
          Synchronizing your secure dashboard...
        </p>
      </div>
    </div>
  );
}
