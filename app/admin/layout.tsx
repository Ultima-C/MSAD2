"use client";

// Imports
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, ChevronRight, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/admin_dashboard/sidebar";

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  "/admin": { title: "Activity", breadcrumb: "Live Feed & Overview" },
  "/admin/workspaces": { title: "Workspaces", breadcrumb: "Tenant Management" },
  "/admin/global-usage": {
    title: "Onboarding Insights",
    breadcrumb: "Platform Metrics",
  },
};

// Header
function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const page = pageTitles[pathname] || { title: "Dashboard", breadcrumb: "" };

  const [mounted, setMounted] = useState(false);
  const [adminName, setAdminName] = useState("Loading...");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    setMounted(true);

    const fetchAdminData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("super_admins")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        if (data) {
          setAdminName(data.full_name || "Super Admin");
          setAdminEmail(data.email);
        } else {
          setAdminName("Super Admin");
          setAdminEmail(user.email || "");
        }
      }
    };

    fetchAdminData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-red-600 dark:text-red-500">
          Super Admin
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {page.title}
        </span>
        {page.breadcrumb && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            <span className="text-slate-500 dark:text-slate-400">
              {page.breadcrumb}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
        >
          {mounted ? (
            theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800 outline-none group transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {adminName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[120px]">
                  {adminEmail || "Super Admin"}
                </p>
              </div>
              <Avatar className="w-8 h-8 border-2 border-blue-100 dark:border-blue-900">
                <AvatarFallback className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold transition-colors">
                  {adminName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 dark:text-red-500 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/50 focus:text-red-700 dark:focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Layout
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={`transition-all duration-300 ease-in-out ${collapsed ? "ml-[68px]" : "ml-[240px]"}`}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
