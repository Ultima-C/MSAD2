# Design Spec: Candidate Portal Page

**Date:** 2026-05-22
**Status:** Approved
**Target Path:** `app/portal/[token]/page.tsx`

## 1. Overview
A production-ready, dynamic Candidate Portal built with Next.js 14 App Router. The portal provides a white-labeled onboarding experience for candidates, allowing them to upload documents and track their progress before final submission to HR.

## 2. Architecture

### 2.1 Data Models (TypeScript Interfaces)
```typescript
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

### 2.2 Isolated Service Layer (Async Stubs)
The following functions will be implemented as simulation stubs outside the component lifecycle:
- `fetchPortalData(token: string)`: Returns mock `PortalData`.
- `uploadDocumentToServer(taskId: string, file: File)`: Simulates upload and returns a mock public URL.
- `submitPacketToHR(token: string)`: Updates status to `pending_approval`.

### 2.3 Dynamic Theming
- **Mechanism:** `useEffect` hook watching `portalState.tenant.primaryColor`.
- **Implementation:** `document.documentElement.style.setProperty("--primary", color)`.
- **Cleanup:** Removes the property on unmount.

## 3. View Logic

### 3.1 VIEW 1: Interactive Onboarding Checklist (`to_be_hired`)
- **Header:** Tenant logo and "Welcome to [Company Name]'s Onboarding Workspace".
- **Progress:** Visual tracking bar (Tailwind) based on `submitted` tasks.
- **Task Grid:**
  - Cards for each `TaskItem`.
  - Live status badges (shadcn).
  - Interactive file upload via `<Paperclip />`.
  - Local state updates on successful "upload".
- **Global Action:** "Submit Onboarding Requirements" button, enabled only when all tasks are `submitted`.

### 3.2 VIEW 2: Waiting Room Lock-Screen (`pending_approval`)
- **Visuals:** Read-only summary card centered in viewport.
- **Iconography:** Large `<ShieldCheck />` or `<Lock />` using brand color.
- **Content:** "Application Packets Locked & Staged" with confirmation subtext.
- **Security:** All inputs and previous interactive elements are removed from DOM or strictly disabled.

## 4. Engineering Standards
- **Components:** shadcn/ui (`Button`, `Badge`, `Card`, `Input`).
- **Icons:** Lucide (`Loader2`, `CheckCircle2`, `AlertCircle`, `UploadCloud`, `Paperclip`).
- **Styles:** Tailwind CSS with dynamic theme variables.
- **Portability:** No direct Supabase/API imports within the UI logic.
