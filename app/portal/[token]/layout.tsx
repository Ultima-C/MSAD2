"use client"; // Needs to be client component to use provider
import { PortalProvider } from "@/components/portal/portal-provider";
import { usePortalData } from "@/lib/hooks/use-portal";
import { useParams } from "next/navigation";
import Navbar from "@/components/portal/navbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useParams() as { token: string };
  console.log("THE TOKEN IN THE URL IS:", token);
  const portalData = usePortalData(token);

  return (
    <PortalProvider value={portalData}>
      <div className="min-h-screen bg-background">
        <Navbar />
        {children}
      </div>
    </PortalProvider>
  );
}
