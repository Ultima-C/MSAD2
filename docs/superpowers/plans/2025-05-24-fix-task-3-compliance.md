# Fix Spec Compliance Review for Task 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address unused imports, handle `action_required` status, and prevent blank screen for `pending_approval` in the candidate portal.

**Architecture:** Update the existing `CandidatePortalPage` component to handle additional portal and task statuses, utilizing previously unused icons to improve visual feedback.

**Tech Stack:** Next.js (App Router), React, Lucide React, Tailwind CSS, Shadcn UI (Badge, Card).

---

### Task 1: Handle `action_required` status in Task Grid

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Update `fetchPortalData` stub to include `action_required` status for testing.**
- [ ] **Step 2: Update the task grid rendering to handle `action_required` icon.**
- [ ] **Step 3: Update the task grid rendering to handle `action_required` badge variant.**
- [ ] **Step 4: Update the task grid rendering to handle `action_required` background/border styles.**

### Task 2: Implement `pending_approval` placeholder view

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Add a conditional return for `portalState.status === 'pending_approval'`.**
- [ ] **Step 2: Use `ShieldCheck` and `Lock` icons in the placeholder view.**
- [ ] **Step 3: Add the "Thank you, your submission is being reviewed" message.**

### Task 3: Cleanup and Verification

**Files:**
- Modify: `app/portal/[token]/page.tsx`

- [ ] **Step 1: Verify all imports are used (specifically `AlertCircle`, `ShieldCheck`, `Lock`).**
- [ ] **Step 2: Commit the changes.**
