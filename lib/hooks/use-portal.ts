// Imports
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionItemStatus } from "@/components/portal/action-item-card";

// Interfaces
interface Task {
  id: string;
  title: string;
  status: ActionItemStatus;
  step_order: number;
  subtitle: string;
  response_data?: any;
}

interface PortalState {
  items: Task[];
  notifications: any[];
  documents: any[];
  postHireData: {
    milestones: any[];
    hub: any | null;
    tasks: any[];
  } | null;
  client: any | null;
  company: any | null;
}

// Hook
export function usePortalData(token: string) {
  const [data, setData] = useState<PortalState>({
    items: [],
    notifications: [],
    documents: [],
    postHireData: null,
    client: null,
    company: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const supabase = createClient();

  const refresh = () => setRefreshTrigger((prev) => prev + 1);

  // Fetch functions
  useEffect(() => {
    async function fetchData() {
      if (!token) return;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        console.warn("DEBUG: Invalid UUID token provided:", token);
        setLoading(false);
        return;
      }

      console.log("DEBUG: Fetching portal data for token:", token);

      const { data: tokenData, error: tokenError } = await supabase
        .from("candidate_access_tokens")
        .select("candidate_id")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenData) {
        console.error("DEBUG: Token fetch error or not found:", tokenError);
        setLoading(false);
        return;
      }

      console.log("DEBUG: Found tokenData, candidate_id:", tokenData.candidate_id);

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select(`
          *, 
          companies (name, logo_url, brand_color)
        `)
        .eq("id", tokenData.candidate_id)
        .maybeSingle();

      if (clientError || !clientData) {
        console.error("DEBUG: Client fetch error or not found:", clientError);
        setLoading(false);
        return;
      }

      console.log("DEBUG: Found clientData, assigned_track_id:", clientData.assigned_track_id);

      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      const { data: documentsData } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientData.id)
        .order("uploaded_at", { ascending: false });

      let postHire = null;
      if (clientData.status === "hired") {
        const [milestones, hubConfig, hireTasks] = await Promise.all([
          supabase.from("hire_milestones").select("*").eq("client_id", clientData.id).order("target_day"),
          supabase.from("company_hub_config").select("*").eq("client_id", clientData.id).maybeSingle(),
          supabase.from("hire_tasks").select("*").eq("client_id", clientData.id).order("created_at"),
        ]);
        postHire = {
          milestones: milestones.data ?? [],
          hub: hubConfig.data ?? null,
          tasks: hireTasks.data ?? [],
        };
      }

      if (clientData.assigned_track_id) {
        const [stepsRes, tasksRes] = await Promise.all([
          supabase
            .from("workflow_steps")
            .select("*")
            .eq("track_id", clientData.assigned_track_id)
            .order("step_order", { ascending: true }),
          supabase
            .from("client_tasks")
            .select("*")
            .eq("client_id", clientData.id)
        ]);

        const steps = stepsRes.data || [];
        const clientTasks = tasksRes.data || [];

        console.log(`DEBUG: Found ${steps.length} steps and ${clientTasks.length} client tasks`);

        const mergedTasks: Task[] = steps.map((step: any) => {
          const existingTask = clientTasks.find(
            (t: any) => t.step_order === step.step_order || t.template_step_id === step.id
          );

          return {
            id: existingTask?.id || step.id,
            title: step.title,
            status: (existingTask?.status as ActionItemStatus) || "pending",
            step_order: step.step_order,
            subtitle: step.attachment_type || "Task",
            response_data: existingTask?.response_data || null,
          };
        });

        setData({
          items: mergedTasks,
          notifications: notificationsData || [],
          documents: documentsData || [],
          postHireData: postHire,
          client: clientData,
          company: clientData.companies,
        });
      } else {
        console.warn("DEBUG: No assigned_track_id found for client");
        setData({
          items: [],
          notifications: notificationsData || [],
          documents: documentsData || [],
          postHireData: postHire,
          client: clientData,
          company: clientData.companies,
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [token, supabase, refreshTrigger]);

  return { ...data, loading, refresh };
}