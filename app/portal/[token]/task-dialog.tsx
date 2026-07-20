"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { ClientTask, Tenant } from "@/lib/types/database";
import { mutate } from "swr";

interface TaskDialogProps {
  task: ClientTask | null;
  tenant: Tenant;
  token: string;
  onClose: () => void;
}

export function TaskDialog({ task, tenant, token, onClose }: TaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  if (!task) return null;

  const supabase = createClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let submissionData = { ...formData };

      // Upload file to Supabase Storage
      if (file && task.step_type === "file_upload") {
        const fileExt = file.name.split(".").pop();
        const fileName = `${task.id}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        submissionData = {
          ...submissionData,
          file_path: uploadData.path,
          file_name: file.name,
        };
      }

      // Update Database
      const { error } = await supabase
        .from("client_tasks")
        .update({
          status: "complete",
          response_data: submissionData,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      mutate(`portal-${token}`);
      onClose();
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Render content block
  const renderTaskContent = () => {
    switch (task.step_type) {
      case "form":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Enter your response here..."
                value={formData.response || ""}
                onChange={(e) =>
                  setFormData({ ...formData, response: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        );

      case "file_upload":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8 text-muted-foreground"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case "signature_upload":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Digital Signature</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
                <p className="text-sm text-muted-foreground mb-4">
                  Sign below to confirm your agreement
                </p>
                <div className="h-32 border rounded bg-white flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    Signature pad placeholder
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureName">Full Legal Name</Label>
              <Input
                id="signatureName"
                placeholder="Type your full name"
                value={formData.signatureName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, signatureName: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Payment processing will be configured by {tenant.name}.
            </p>
          </div>
        );

      case "scheduling":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, preferredDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={formData.preferredTime || ""}
                onChange={(e) =>
                  setFormData({ ...formData, preferredTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any preferences or constraints..."
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Enter your response here..."
                value={formData.response || ""}
                onChange={(e) =>
                  setFormData({ ...formData, response: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        );
    }
  };

  const isComplete = task.status === "complete" || task.status === "verified";
  const isLocked = task.status === "locked";

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
          {task.description && (
            <DialogDescription>{task.description}</DialogDescription>
          )}
        </DialogHeader>

        {isComplete ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              This task has been completed.
            </p>
          </div>
        ) : isLocked ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-muted-foreground"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              Complete previous tasks to unlock this one.
            </p>
          </div>
        ) : (
          <>
            {renderTaskContent()}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
