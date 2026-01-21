"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@prisma/client";
import {
  inviteAccountant,
  listCompanyMembers,
  revokeAccountantAccess,
  getPendingInvites,
  cancelInvite,
  resendOTPCode,
} from "@/app/actions/accountant-access-actions";
import { toast } from "sonner";
import { UserPlus, UserX, Mail, Clock, Copy, X, RefreshCw } from "lucide-react";

type CompanyMember = {
  id: string;
  userId: string;
  email: string;
  naam: string | null;
  role: UserRole;
  createdAt: Date;
  permissions?: string | null;
};

type PendingInvite = {
  id: string;
  invitedEmail: string;
  permissions?: string | null;
  expiresAt: Date;
  createdAt: Date;
};

export function AccountantAccessContent() {
  const [email, setEmail] = useState("");
  const [canRead] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [canBTW, setCanBTW] = useState(false);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");

  const loadData = async () => {
    const [membersResult, invitesResult] = await Promise.all([
      listCompanyMembers(),
      getPendingInvites(),
    ]);

    if (membersResult.success) {
      setMembers(membersResult.members || []);
    }

    if (invitesResult.success) {
      setPendingInvites(invitesResult.invites || []);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateEmail = (value: string) => {
    const trimmed = value?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed) {
      return { valid: false, message: "E-mail is verplicht." };
    }
    if (!emailRegex.test(trimmed)) {
      return { valid: false, message: "Ongeldig e-mailadres." };
    }
    return { valid: true, email: trimmed };
  };

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    console.log("INVITE_SUBMIT_ATTEMPT", { emailLength: email?.length || 0 });

    const validation = validateEmail(email);
    if (!validation.valid) {
      console.log("INVITE_SUBMIT_BLOCKED_FRONTEND", { reason: "INVALID_EMAIL" });
      setEmailError(validation.message || "Ongeldig e-mailadres");
      return;
    }

    setEmailError("");
    setLoading(true);

    const permissions = fullAccess
      ? { canRead: true, canEdit: true, canExport: true, canBTW: true }
      : { canRead, canEdit, canExport, canBTW };

    console.log("INVITE_PAYLOAD_DEBUG", {
      email: validation.email,
      permissions,
      fullAccess,
    });

    const result = await inviteAccountant(validation.email as string, permissions);

    if (result.success) {
      toast.success(result.message);
      setEmail(""); // Clear email only on success
      setInviteUrl(result.inviteUrl || null);
      loadData();
    } else {
      const backendEmailError =
        result.error === "EMAIL_REQUIRED" || result.error === "EMAIL_MISSING_OR_INVALID";
      if (backendEmailError) {
        const message =
          result.error === "EMAIL_REQUIRED" ? "E-mail is verplicht" : "Ongeldig e-mailadres";
        setEmailError(message);
        toast.error(message);
      } else {
        // Keep email in the input after failure for easy correction
        toast.error(
          result.message || "Er is een fout opgetreden bij het versturen van de uitnodiging."
        );
      }
    }

    setLoading(false);
  }

  async function handleRevoke(memberId: string) {
    if (!confirm("Weet u zeker dat u de toegang wilt intrekken?")) {
      return;
    }

    const result = await revokeAccountantAccess(memberId);

    if (result.success) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.message);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    const result = await cancelInvite(inviteId);

    if (result.success) {
      toast.success(result.message);
      setInviteUrl(null);
      loadData();
    } else {
      toast.error(result.message);
    }
  }

  async function handleResendOTP(inviteId: string) {
    setResendingId(inviteId);
    const result = await resendOTPCode(inviteId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setResendingId(null);
  }

  function copyInviteUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Uitnodigingslink gekopieerd!");
  }

  const parsePermissions = (raw?: string | null) => {
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        canRead: parsed.canRead !== false,
        canEdit: Boolean(parsed.canEdit),
        canExport: Boolean(parsed.canExport),
        canBTW: Boolean(parsed.canBTW),
      };
    } catch {
      return { canRead: true, canEdit: false, canExport: false, canBTW: false };
    }
  };

  const getPermissionLabel = (raw?: string | null) => {
    const perms = parsePermissions(raw);
    const parts = [];
    parts.push(perms.canEdit ? "Bewerken" : "Lezen");
    if (perms.canExport) parts.push("Export");
    if (perms.canBTW) parts.push("BTW");
    return parts.join(" • ");
  };

  const getBadgeColor = (raw?: string | null) => {
    const perms = parsePermissions(raw);
    if (perms.canBTW || perms.canEdit) {
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    }
    if (perms.canExport) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Invite Form */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Accountant uitnodigen
        </h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              E-mailadres
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="accountant@voorbeeld.nl"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {emailError && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <input type="checkbox" checked={canRead} disabled className="w-4 h-4" />
              <div>
                <span className="text-sm font-medium text-foreground">Lezen</span>
                <p className="text-xs text-muted-foreground">Altijd vereist</p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2">
              <input
                type="checkbox"
                checked={fullAccess}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setFullAccess(enabled);
                  if (enabled) {
                    setCanEdit(true);
                    setCanExport(true);
                    setCanBTW(true);
                  }
                }}
                className="w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Volledige toegang (alle rechten)</span>
                <p className="text-xs text-muted-foreground">Activeert alle permissies</p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <input
                type="checkbox"
                checked={fullAccess ? true : canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
                className="w-4 h-4"
                disabled={fullAccess}
              />
              <div>
                <span className="text-sm font-medium text-foreground">Bewerken</span>
                <p className="text-xs text-muted-foreground">Facturen, relaties, uitgaven</p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <input
                type="checkbox"
                checked={fullAccess ? true : canExport}
                onChange={(e) => setCanExport(e.target.checked)}
                className="w-4 h-4"
                disabled={fullAccess}
              />
              <div>
                <span className="text-sm font-medium text-foreground">Exporteren</span>
                <p className="text-xs text-muted-foreground">CSV/PDF downloads</p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <input
                type="checkbox"
                checked={fullAccess ? true : canBTW}
                onChange={(e) => setCanBTW(e.target.checked)}
                className="w-4 h-4"
                disabled={fullAccess}
              />
              <div>
                <span className="text-sm font-medium text-foreground">BTW-acties</span>
                <p className="text-xs text-muted-foreground">Aangifte & controle</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Uitnodigen..." : "Uitnodiging versturen"}
          </button>
        </form>

        {/* Show invite URL if generated */}
        {inviteUrl && (
          <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              Uitnodigingslink (deel deze met de accountant):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background px-3 py-2 rounded border border-border text-foreground break-all">
                {inviteUrl}
              </code>
              <button
                onClick={() => copyInviteUrl(inviteUrl)}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Kopiëren"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              De verificatiecode is per e-mail verstuurd en is 10 minuten geldig. De link zelf is 7 dagen geldig.
            </p>
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Openstaande uitnodigingen ({pendingInvites.length})
          </h2>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {invite.invitedEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getPermissionLabel(invite.permissions)} • Verloopt op{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => handleResendOTP(invite.id)}
                    disabled={resendingId === invite.id}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                    title="Nieuwe code versturen"
                  >
                    <RefreshCw className={`h-4 w-4 ${resendingId === invite.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-background hover:text-destructive transition-colors"
                    title="Annuleren"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <p className="mt-4 text-xs text-muted-foreground">
            💡 Tip: Klik op de vernieuw-knop om een nieuwe verificatiecode te versturen als de vorige is verlopen.
          </p>
        </div>
      )}

      {/* Active Members */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-green-500" />
          Toegang verleend ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nog geen accountants toegevoegd
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {member.naam?.[0]?.toUpperCase() ||
                        member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {member.naam || member.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email} • {getPermissionLabel(member.permissions)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(member.id)}
                  className="ml-3 p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Toegang intrekken"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
