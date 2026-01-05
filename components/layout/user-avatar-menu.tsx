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
        <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-teal-700/70 bg-teal-600 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 md:h-10 md:w-10">
          {resolvedAvatar ? (
            <>
              <Image
                src={resolvedAvatar}
                alt="Profielfoto"
                fill
                sizes="40px"
                className="object-cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoad={() => setIsImageLoading(false)}
                unoptimized={resolvedAvatar.startsWith("data:")}
              />
              {isImageLoading && (
                <div className="absolute inset-0 animate-pulse bg-teal-700/20 backdrop-blur-sm" aria-hidden />
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
      <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} danger>
        <LogOut className="h-4 w-4" aria-hidden />
        Uitloggen
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
