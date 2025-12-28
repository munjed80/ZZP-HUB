import type { ReactNode } from "react";
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
