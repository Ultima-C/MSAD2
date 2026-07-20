"use client";

// Imports
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { TeamRole } from "@/lib/types/database";

// Types
interface RefreshOptions {
  isNewWorkspace?: boolean;
}

interface TenantContextType {
  tenant: any | null;
  currentTenant: any | null; // Alias for tenant
  tenants: any[];
  currentRole: TeamRole | null;
  role: TeamRole | null; // Alias for currentRole
  isLoading: boolean;
  stats: any | null;
  isImpersonating: boolean;
  impersonatedBy: string | null;
  setCurrentTenant: (tenant: any) => void;
  refreshTenants: (options?: RefreshOptions) => Promise<void>;
  refreshTenant: () => Promise<void>; // Added for settings components
  createTenant: (
    data: any,
  ) => Promise<{ data: any | null; error: string | null }>;
  updateTenant: (id: string, data: any) => Promise<{ error: string | null }>;
  startImpersonation: (tenantId: string, adminEmail: string) => void;
  stopImpersonation: () => void;
  can: (permission: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Provider
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<any | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();
  const supabase = createClient();

  const can = useCallback(
    (permission: string): boolean => {
      // For now, super admin can do everything
      if (isSuperAdmin) return true;
      // If no tenant or role, can't do much
      if (!tenant || !tenant.role) return false;

      // Basic mapping - this should be expanded based on your actual RBAC needs
      const role = tenant.role as TeamRole;

      if (role === "owner" || role === "admin") return true;

      // Add more specific checks here if needed
      return false;
    },
    [isSuperAdmin, tenant],
  );

  // Fetch logic
  const fetchTenants = useCallback(async (): Promise<any[]> => {
    if (!user) {
      setTenants([]);
      setTenant(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select(`role, company:companies (*)`)
      .eq("user_id", user.id);

    if (memberError) {
      console.error("Supabase Company Error:", memberError.message);
      setIsLoading(false);
      return [];
    }

    const tenantsWithRoles = (memberData || [])
      .filter((item: any) => item.company)
      .map((item: any) => ({
        ...item.company,
        role: item.role as TeamRole,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    setTenants(tenantsWithRoles);

    // Set default tenant if none selected
    setTenant((prev: any | null) => {
      if (tenantsWithRoles.length === 0) return null;
      const found = tenantsWithRoles.find((t) => t.id === prev?.id);
      return found || tenantsWithRoles[0];
    });

    setIsLoading(false);
    return tenantsWithRoles;
  }, [user, supabase]);

  const fetchStats = useCallback(async () => {
    if (!tenant) {
      setStats(null);
      return;
    }

    // UPDATED: Real stats logic from the clients table
    const { data: clientData } = await supabase
      .from("clients")
      .select("status, hired_at, created_at")
      .eq("company_id", tenant.id);

    if (!clientData) return;

    const total = clientData.length;
    const hired = clientData.filter((c) => c.status === "hired").length;
    const pending = clientData.filter((c) => c.status === "pending").length;

    setStats({
      totalClients: total,
      activeClients: pending,
      completedClients: hired,
      completionRate: total > 0 ? Math.round((hired / total) * 100) : 0,
    });
  }, [tenant, supabase]);

  // Effects
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Actions
  const refreshTenants = async (options: RefreshOptions = {}) => {
    if (options.isNewWorkspace) await new Promise((r) => setTimeout(r, 500));
    await fetchTenants();
  };

  const refreshTenant = async () => {
    await fetchTenants();
    await fetchStats();
  };

  const createTenant = async (data: any) => {
    if (!user) return { data: null, error: "Not authenticated" };
    const { data: newCompany, error } = await supabase
      .from("companies")
      .insert({ ...data, owner_id: user.id })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    await fetchTenants();
    return { data: newCompany, error: null };
  };

  const updateTenant = async (id: string, data: any) => {
    const { error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchTenants();
    return { error: null };
  };

  const startImpersonation = async (tenantId: string, adminEmail: string) => {
    if (!isSuperAdmin) return;
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (data) {
      setTenant({ ...data, role: "owner" as TeamRole });
      setIsImpersonating(true);
      setImpersonatedBy(adminEmail);
    }
  };

  const stopImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedBy(null);
    fetchTenants();
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        currentTenant: tenant,
        tenants,
        currentRole: (tenant?.role as TeamRole) || null,
        role: (tenant?.role as TeamRole) || null,
        isLoading,
        stats,
        isImpersonating,
        impersonatedBy,
        setCurrentTenant: setTenant,
        refreshTenants,
        refreshTenant,
        createTenant,
        updateTenant,
        startImpersonation,
        stopImpersonation,
        can,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// Hook
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
