"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type UserAvatarMenuProps = {
  userName: string;
  userInitials: string;
};

export function UserAvatarMenu({ userName, userInitials }: UserAvatarMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu
      trigger={
        <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-teal-600 text-xs md:text-sm font-semibold text-white border border-teal-700 shadow-sm hover:bg-teal-700 transition-colors cursor-pointer">
          {userInitials}
        </div>
      }
      align="right"
    >
      <div className="px-4 py-3 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-900">{userName}</p>
        <p className="text-xs text-slate-500">Beheer je account</p>
      </div>
      <DropdownMenuItem onClick={() => router.push("/instellingen")}>
        <Settings className="h-4 w-4" aria-hidden />
        Instellingen
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push("/instellingen?tab=beveiliging")}>
        <User className="h-4 w-4" aria-hidden />
        Profiel
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} danger>
        <LogOut className="h-4 w-4" aria-hidden />
        Uitloggen
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
