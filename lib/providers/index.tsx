"use client";

import { SWRConfig } from "swr";
import { AuthProvider } from "./auth-provider";
import { TenantProvider } from "./tenant-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }}
    >
      <AuthProvider>
        <TenantProvider>{children}</TenantProvider>
      </AuthProvider>
    </SWRConfig>
  );
}

export { useAuth } from "./auth-provider";
export { useTenant } from "./tenant-provider";
