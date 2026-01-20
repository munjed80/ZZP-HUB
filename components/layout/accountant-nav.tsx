"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, FileText, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const accountantNavItems = [
  { href: "/accountant-portal", label: "Portal", icon: Briefcase },
  { href: "/accountant-portal/dossier", label: "Dossiers", icon: FileText },
];

export function AccountantNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      const response = await fetch("/api/accountant/logout", {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Succesvol uitgelogd");
        // Redirect to accountant login page
        router.push("/login?type=accountant");
      } else {
        toast.error(data.message || "Fout bij uitloggen");
        setLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Fout bij uitloggen");
      setLoggingOut(false);
    }
  }

  return (
    <nav className="border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 overflow-x-auto px-4 py-2">
        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {accountantNavItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  active ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Uitloggen"
          >
            {loggingOut ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
