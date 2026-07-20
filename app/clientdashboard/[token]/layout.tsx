"use client";

import { PortalProvider } from "@/components/portal/portal-provider";
import { usePortalData } from "@/lib/hooks/use-portal";
import { useParams } from "next/navigation";
import Navbar from "@/components/portal/navbar";
import React, { useEffect, useState } from "react";
import { generateThemeVariables } from "@/lib/utils";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useParams() as { token: string };
  const portalData = usePortalData(token);
  const [styles, setStyles] = useState<any>({});

  useEffect(() => {
    if (portalData.company?.brand_color) {
      const themeVars = generateThemeVariables(portalData.company.brand_color);
      setStyles(themeVars);
    }
  }, [portalData.company?.brand_color]);

  return (
    <PortalProvider value={portalData}>
      <div
        className="min-h-screen bg-background flex flex-col transition-colors duration-500"
        style={styles}
      >
        <Navbar />
        <div className="flex-1">{children}</div>
      </div>
    </PortalProvider>
  );
}
