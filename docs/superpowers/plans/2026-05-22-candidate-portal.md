# Candidate Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a complete, production-ready Candidate Portal page component with isolated async logic stubs, dynamic theme injection, and two primary views (Interactive Checklist and Locked Room).

**Architecture:** The component uses a strictly decoupled data layer via TypeScript interfaces and async stubs. It uses Next.js 14 App Router features, shadcn/ui components, and Tailwind CSS for styling. Dynamic branding is applied via CSS variables.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Sonner.

---

### Task 1: Setup Interfaces and Async Service Stubs

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Define TypeScript interfaces at the top of the file**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Paperclip, 
  ShieldCheck, 
  Lock 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface TenantBranding {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: 'pending' | 'submitted' | 'action_required';
  label: string;
  fileUrl?: string;
  updatedAt?: string;
}

interface PortalData {
  inviteCode: string;
  status: 'to_be_hired' | 'pending_approval';
  tenant: TenantBranding;
  tasks: TaskItem[];
}
```

- [ ] **Step 2: Implement isolated async logic stubs**

```typescript
// --- Isolated Async Logic Stubs ---

async function fetchPortalData(token: string): Promise<PortalData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    inviteCode: token,
    status: 'to_be_hired',
    tenant: {
      id: "tenant-123",
      name: "Acme Corp",
      logoUrl: "/placeholder-logo.svg",
      primaryColor: "#2563eb",
    },
    tasks: [
      { id: "1", title: "Identity Verification", status: "pending", label: "Government ID" },
      { id: "2", title: "Employment Contract", status: "pending", label: "Signed PDF" },
      { id: "3", title: "Background Check Authorization", status: "pending", label: "Consent Form" },
    ],
  };
}

async function uploadDocumentToServer(taskId: string, file: File): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `https://storage.supabase.co/v1/obj/public/documents/${taskId}/${file.name}`;
}

async function submitPacketToHR(token: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/portal/[token]/page.tsx
git commit -m "feat(portal): setup interfaces and service stubs"
```

---

### Task 2: Implement Dynamic Theme Injection and Data Fetching

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Add state hooks and data fetching logic**

```typescript
export default function CandidatePortalPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [portalState, setPortalState] = useState<PortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const data = await fetchPortalData(token);
        setPortalState(data);
      } catch (error) {
        toast.error("Failed to load portal data");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [token]);

  // Dynamic Theme Injection
  useEffect(() => {
    if (portalState?.tenant.primaryColor) {
      const color = portalState.tenant.primaryColor;
      document.documentElement.style.setProperty("--primary", color);
      // Optional: set hover and ring colors based on primary
      document.documentElement.style.setProperty("--primary-foreground", "#ffffff");
      
      return () => {
        document.documentElement.style.removeProperty("--primary");
        document.documentElement.style.removeProperty("--primary-foreground");
      };
    }
  }, [portalState?.tenant.primaryColor]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portalState) return null;

  // ... rest of component
}
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(portal): add dynamic theme injection and data fetching"
```

---

### Task 3: Build VIEW 1: Interactive Onboarding Checklist

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Implement the Checklist View component inside the page**

```typescript
  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      toast.promise(uploadDocumentToServer(taskId, file), {
        loading: 'Uploading document...',
        success: (url) => {
          setPortalState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.map(t => 
                t.id === taskId ? { ...t, status: 'submitted', fileUrl: url, updatedAt: new Date().toISOString() } : t
              )
            };
          });
          return 'Document submitted successfully';
        },
        error: 'Upload failed',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    try {
      const success = await submitPacketToHR(token);
      if (success) {
        setPortalState(prev => prev ? { ...prev, status: 'pending_approval' } : null);
        toast.success("Onboarding requirements submitted!");
      }
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTasksSubmitted = portalState.tasks.every(t => t.status === 'submitted');
  const completedCount = portalState.tasks.filter(t => t.status === 'submitted').length;
  const progress = (completedCount / portalState.tasks.length) * 100;

  if (portalState.status === 'to_be_hired') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-4">
              {portalState.tenant.logoUrl && (
                <img src={portalState.tenant.logoUrl} alt={portalState.tenant.name} className="h-10 w-auto" />
              )}
              <div className="h-8 w-px bg-slate-200 mx-2" />
              <h1 className="text-xl font-semibold text-slate-900">
                Welcome to {portalState.tenant.name}'s Onboarding Workspace
              </h1>
            </div>
          </header>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-lg font-medium">Onboarding Progress</h2>
                  <p className="text-sm text-slate-500">{completedCount} of {portalState.tasks.length} tasks completed</p>
                </div>
                <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Task Grid */}
          <div className="grid gap-4">
            {portalState.tasks.map((task) => (
              <Card key={task.id} className={cn(
                "transition-all duration-200",
                task.status === 'submitted' ? "bg-slate-50 border-slate-200" : "hover:border-primary/50"
              )}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      task.status === 'submitted' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {task.status === 'submitted' ? <CheckCircle2 className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{task.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={task.status === 'submitted' ? "success" : "secondary"}>
                      {task.status === 'submitted' ? "Submitted" : "Pending"}
                    </Badge>
                    
                    {task.status !== 'submitted' ? (
                      <div className="relative">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(task.id, e.target.files[0])}
                        />
                        <Button size="sm" variant="outline" className="gap-2">
                          <UploadCloud className="w-4 h-4" />
                          Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {task.updatedAt ? `Uploaded ${new Date(task.updatedAt).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Submit */}
          <div className="flex justify-center pt-8">
            <Button 
              size="lg" 
              className="px-12 py-6 text-lg font-semibold shadow-lg shadow-primary/20"
              disabled={!allTasksSubmitted || isSubmitting}
              onClick={handleSubmitAll}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Onboarding Requirements"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(portal): implement interactive checklist view"
```

---

### Task 4: Build VIEW 2: The Waiting Room Lock-Screen

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Implement the Locked Room view**

```typescript
  if (portalState.status === 'pending_approval') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full border-2 border-primary/10 shadow-xl overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Application Packets Locked & Staged</h2>
              <p className="text-slate-500 leading-relaxed">
                Your onboarding files have been securely transmitted to HR. While under verification, 
                your profile inputs are locked to preserve historical record integrity.
              </p>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-slate-400 italic flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                You will be automatically updated as your company administrator finalizes your active workspace deployment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(portal): implement locked room view"
```

---

### Task 5: Final Verification and Component Polishing

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Review full component for any missing types or missing icons**
- [ ] **Step 2: Ensure all dynamic theme property cleanups are present**
- [ ] **Step 3: Verify "Submit" button disabled logic (must require all tasks 'submitted')**
- [ ] **Step 4: Final Commit**

```bash
git commit -am "feat(portal): final polish and verification"
```
