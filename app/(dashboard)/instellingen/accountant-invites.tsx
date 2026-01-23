"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Mail, RefreshCw } from "lucide-react";
import { linkAccountantToCompany, resendAccountantInvite, getAccountantInviteLink } from "./actions";

type Invite = {
  id: string;
  email: string;
  status: "PENDING" | "ACTIVE";
  canRead: boolean;
  canEdit: boolean;
  canExport: boolean;
  canBTW: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusBadge(status: Invite["status"]) {
  if (status === "ACTIVE") {
    return <Badge variant="success">ACTIEF</Badge>;
  }
  return <Badge variant="warning">PENDING</Badge>;
}

function PermissionBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        enabled
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
      }`}
    >
      {label}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-9 h-5 rounded-full transition-all duration-200 ${
            checked ? "bg-primary" : "bg-muted"
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full transition-all duration-200 ${
            checked && "translate-x-4"
          }`}
        ></div>
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
    </label>
  );
}

function InviteActions({ invite, onAction }: { invite: Invite; onAction: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleResend = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await resendAccountantInvite(invite.id);
        if (result.emailSent) {
          toast.success("Uitnodiging opnieuw verzonden");
        } else if (result.inviteUrl) {
          // Email failed but we have the link
          await navigator.clipboard.writeText(result.inviteUrl);
          toast.warning("E-mail verzenden mislukt. Link gekopieerd naar klembord.", {
            description: result.emailError,
          });
        } else {
          toast.error(`E-mail verzenden mislukt: ${result.emailError}`);
        }
        onAction();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kon uitnodiging niet opnieuw verzenden";
        toast.error(message);
      }
    });
  }, [invite.id, onAction]);

  const handleCopyLink = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getAccountantInviteLink(invite.id);
        if (result.inviteUrl) {
          await navigator.clipboard.writeText(result.inviteUrl);
          toast.success("Uitnodigingslink gekopieerd naar klembord");
        }
        onAction();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kon link niet ophalen";
        toast.error(message);
      }
    });
  }, [invite.id, onAction]);

  if (invite.status !== "PENDING") {
    return null;
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        className="min-h-[36px] px-2 py-1"
        onClick={handleResend}
        disabled={isPending}
        title="Uitnodiging opnieuw versturen"
      >
        {isPending ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="min-h-[36px] px-2 py-1"
        onClick={handleCopyLink}
        disabled={isPending}
        title="Kopieer uitnodigingslink"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AccountantInvites({ invites }: { invites: Invite[] }) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState({
    canRead: true,
    canEdit: false,
    canExport: false,
    canBTW: false,
  });
  const [, forceUpdate] = useState(0);

  const hasItems = invites.length > 0;

  const sorted = useMemo(
    () =>
      invites.slice().sort((a, b) => {
        const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
        const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt;
        return dateB.getTime() - dateA.getTime();
      }),
    [invites]
  );

  const handleAddAccountant = () => {
    if (!email.trim()) {
      toast.error("Vul een e-mailadres in");
      return;
    }

    startTransition(async () => {
      try {
        const result = await linkAccountantToCompany({
          accountantEmail: email.trim(),
          ...permissions,
        });
        
        if (result.emailSent) {
          toast.success("Uitnodiging verstuurd per e-mail. De accountant moet de uitnodiging accepteren.");
        } else if (result.inviteUrl) {
          // Email failed, show warning and copy link
          await navigator.clipboard.writeText(result.inviteUrl);
          toast.warning("E-mail verzenden mislukt. Uitnodigingslink gekopieerd naar klembord.", {
            description: result.emailError ? `Fout: ${result.emailError}` : "Deel de link handmatig met de accountant.",
            duration: 8000,
          });
        } else {
          toast.success("Uitnodiging aangemaakt. Controleer de logs voor email status.");
        }
        
        setEmail("");
        setPermissions({
          canRead: true,
          canEdit: false,
          canExport: false,
          canBTW: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kon accountant niet koppelen";
        toast.error(message);
      }
    });
  };

  const handleInviteAction = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Add Accountant Form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Accountant toevoegen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              E-mailadres accountant
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="accountant@example.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Permissies</label>
            <div className="flex flex-wrap gap-4">
              <Toggle
                checked={permissions.canRead}
                onChange={(checked) => setPermissions((prev) => ({ ...prev, canRead: checked }))}
                label="Lezen"
              />
              <Toggle
                checked={permissions.canEdit}
                onChange={(checked) => setPermissions((prev) => ({ ...prev, canEdit: checked }))}
                label="Bewerken"
              />
              <Toggle
                checked={permissions.canExport}
                onChange={(checked) => setPermissions((prev) => ({ ...prev, canExport: checked }))}
                label="Exporteren"
              />
              <Toggle
                checked={permissions.canBTW}
                onChange={(checked) => setPermissions((prev) => ({ ...prev, canBTW: checked }))}
                label="BTW"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleAddAccountant} disabled={isPending}>
              {isPending ? "Toevoegen..." : "Toevoegen"}
            </Button>
          </div>
        </div>
      </div>

      {/* Linked Accountants List */}
      {!hasItems ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Nog geen accountants gekoppeld</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gebruik het formulier hierboven om een accountant toegang te geven tot uw bedrijfsgegevens.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Gekoppelde accountants</h3>
          <div className="grid grid-cols-5 gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4">
            <span>Email</span>
            <span>Status</span>
            <span>Aangemaakt</span>
            <span>Permissies</span>
            <span>Acties</span>
          </div>
          <div className="space-y-2">
            {sorted.map((invite) => (
              <div
                key={invite.id}
                className="grid grid-cols-5 gap-3 items-center rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div className="font-medium text-foreground truncate">{invite.email}</div>
                <div>{statusBadge(invite.status)}</div>
                <div className="text-muted-foreground">{formatDate(invite.createdAt)}</div>
                <div className="flex flex-wrap gap-1">
                  <PermissionBadge label="Lezen" enabled={invite.canRead} />
                  <PermissionBadge label="Bewerken" enabled={invite.canEdit} />
                  <PermissionBadge label="Export" enabled={invite.canExport} />
                  <PermissionBadge label="BTW" enabled={invite.canBTW} />
                </div>
                <div>
                  <InviteActions invite={invite} onAction={handleInviteAction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
