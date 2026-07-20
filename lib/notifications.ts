import { createClient } from "@/lib/supabase/client";

export type NotificationType = 
  | 'portal_link_sent' 
  | 'task_completed' 
  | 'onboarding_complete' 
  | 'reminder_sent' 
  | 'document_accepted' 
  | 'document_requested' 
  | 'step_unlocked';

export async function sendNotification({
  clientId,
  tenantId,
  type,
  message,
}: {
  clientId: string;
  tenantId: string;
  type: NotificationType;
  message: string;
}) {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .insert({
      client_id: clientId,
      tenant_id: tenantId,
      type: type,
      message: message,
      sent_at: new Date().toISOString(),
      is_read: false,
    });

  if (error) {
    console.error("Failed to send notification:", error);
    return { success: false, error };
  }

  return { success: true };
}
