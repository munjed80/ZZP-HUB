"use client";

import { signOut } from "next-auth/react";
import { User, HelpCircle, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type UserAvatarMenuProps = {
  userName: string;
  userInitials: string;
};

export function UserAvatarMenu({ userName, userInitials }: UserAvatarMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-800 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer">
          {userInitials}
        </div>
      }
      align="right"
    >
      <div className="px-4 py-3 border-b border-slate-200/70">
        <p className="text-sm font-semibold text-slate-900">{userName}</p>
        <p className="text-xs text-slate-500">Beheer je account</p>
      </div>
      <DropdownMenuItem onClick={() => window.location.href = "/instellingen"}>
        <User className="h-4 w-4" aria-hidden />
        Mijn Profiel
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.location.href = "/support"}>
        <HelpCircle className="h-4 w-4" aria-hidden />
        Hulp & Support
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} danger>
        <LogOut className="h-4 w-4" aria-hidden />
        Uitloggen
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
