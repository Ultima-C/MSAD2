"use client";

import React from "react";
import { usePortalData } from "@/lib/hooks/use-portal";
import HeroSection from "@/components/portal/hero-section";
import ActionItemCard from "@/components/portal/action-item-card";
import CompleteButton from "@/components/portal/complete-button";
import ActivityFeed from "@/components/portal/activity-feed";
import DocumentVaultStatus from "@/components/portal/document-vault";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PostHireDashboard } from "@/components/client/PostHireDashboard";
import { HiredBanner } from "@/components/client/HiredBanner";

export default function TokenizedClientDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(params);
  const { items, loading, client, postHireData, refresh } =
    usePortalData(token);

  // --- Handlers: Onboarding ---
  const handleUpload = async (taskId: string, file: File) => {
    const supabase = createClient();
    try {
      const targetItem = items.find((i) => i.id === taskId);
      if (!targetItem || !client?.id) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const payload = {
        status: "submitted",
        response_data: {
          file_path: uploadData.path,
          file_name: file.name,
        },
        updated_at: new Date().toISOString(),
      };

      const { data: existingTask } = await supabase
        .from("client_tasks")
        .select("id")
        .eq("client_id", client.id)
        .eq("step_order", targetItem.step_order)
        .maybeSingle();

      if (existingTask?.id) {
        await supabase
          .from("client_tasks")
          .update(payload)
          .eq("id", existingTask.id);
      } else {
        await supabase.from("client_tasks").insert({
          ...payload,
          client_id: client.id,
          title: targetItem.title,
          step_order: targetItem.step_order,
        });
      }
      refresh();
    } catch (error) {
      console.error("Error during upload chain:", error);
    }
  };

  // --- Onboarding Logic ---
  const allComplete =
    items.length > 0 &&
    items.every(
      (item) => item.status === "completed" || item.status === "accepted",
    );

  const rawProgress =
    items.length > 0
      ? (items.filter(
          (i) => i.status === "completed" || i.status === "accepted",
        ).length /
          items.length) *
        100
      : 0;
  const progress = Math.round(rawProgress * 100) / 100;

  // --- Render ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          This dashboard link is invalid or has expired.
        </p>
      </div>
    );
  }

  // --- VIEW: Post-Hire ---
  if (client.status === "hired") {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        {!client.welcomed_at && (
          <HiredBanner
            clientId={client.id}
            headline={postHireData?.hub?.welcome_headline}
            message={postHireData?.hub?.welcome_message}
          />
        )}
        {postHireData ? (
          <PostHireDashboard
            clientId={client.id}
            milestones={postHireData.milestones}
            hub={postHireData.hub}
            tasks={postHireData.tasks}
            hiredAt={client.hired_at}
          />
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p>Loading your post-hire dashboard...</p>
          </div>
        )}
      </main>
    );
  }

  // --- VIEW: Onboarding (Portal) ---
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-7 space-y-8">
          <HeroSection progress={progress} />

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item, index) => (
                <ActionItemCard
                  key={item.id}
                  item={item as any}
                  index={index}
                  allTasks={items}
                  trackMode={client?.workflow_tracks?.mode || "parallel"}
                  onUpload={handleUpload}
                />
              ))
            ) : (
              <div className="bg-card border rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">
                  No active tasks found. Your manager will update your portal
                  soon.
                </p>
              </div>
            )}
          </div>

          <CompleteButton allComplete={allComplete} />
        </div>

        {/* Right Column: Feed & Status */}
        <div className="lg:col-span-5 space-y-6">
          <DocumentVaultStatus />
          <ActivityFeed />
        </div>
      </div>
    </main>
  );
}
