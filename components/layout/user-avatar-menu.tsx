"use client";

import Image from "next/image";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AvatarContext } from "@/components/layout/dashboard-client-shell";

type UserAvatarMenuProps = {
  userName: string;
  userInitials: string;
  avatarUrl?: string | null;
};

export function UserAvatarMenu({ userName, userInitials, avatarUrl }: UserAvatarMenuProps) {
  const router = useRouter();
  const avatarFromContext = useContext(AvatarContext);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const resolvedAvatar = avatarFromContext ?? avatarUrl ?? null;

  return (
    <DropdownMenu
      trigger={
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {resolvedAvatar ? (
            <>
              <Image
                src={resolvedAvatar}
                alt="Profielfoto"
                fill
                sizes="44px"
                className="rounded-xl object-cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoad={() => setIsImageLoading(false)}
                unoptimized={resolvedAvatar.startsWith("data:")}
              />
              {isImageLoading && (
                <div className="absolute inset-0 animate-pulse rounded-xl bg-muted/50 backdrop-blur-sm" aria-hidden />
              )}
            </>
          ) : (
            <span>{userInitials}</span>
          )}
        </div>
      }
      align="right"
    >
      <div className="border-b border-slate-200 px-4 py-3">
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
      <DropdownMenuItem
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-50 font-semibold"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Uitloggen
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
