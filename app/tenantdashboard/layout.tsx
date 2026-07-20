// Imports
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

// Layout Wrapper
export default function TenantDashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
