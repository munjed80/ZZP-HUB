"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@prisma/client";
import {
  inviteAccountant,
  listCompanyMembers,
  revokeAccountantAccess,
  getPendingInvites,
  cancelInvite,
} from "@/app/actions/accountant-access-actions";
import { toast } from "sonner";
import { UserPlus, UserX, Mail, Clock, Copy, X } from "lucide-react";

type CompanyMember = {
  id: string;
  userId: string;
  email: string;
  naam: string | null;
  role: UserRole;
  createdAt: Date;
};

type PendingInvite = {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
};

export function AccountantAccessContent() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.ACCOUNTANT_VIEW);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await inviteAccountant(email, role);

    if (result.success) {
      toast.success(result.message);
      setEmail("");
      setInviteUrl(result.inviteUrl || null);
      loadData();
    } else {
      toast.error(result.message);
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

  function copyInviteUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Uitnodigingslink gekopieerd!");
  }

  const getRoleLabel = (r: UserRole): string => {
    switch (r) {
      case UserRole.ACCOUNTANT_VIEW:
        return "Accountant (Alleen lezen)";
      case UserRole.ACCOUNTANT_EDIT:
        return "Accountant (Bewerken)";
      case UserRole.STAFF:
        return "Medewerker";
      default:
        return r;
    }
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
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={UserRole.ACCOUNTANT_VIEW}>
                Accountant (Alleen lezen + Export)
              </option>
              <option value={UserRole.ACCOUNTANT_EDIT}>
                Accountant (Bewerken + Export + BTW)
              </option>
              <option value={UserRole.STAFF}>Medewerker (Bewerken)</option>
            </select>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {role === UserRole.ACCOUNTANT_VIEW &&
                "Alleen lezen en exporteren van gegevens"}
              {role === UserRole.ACCOUNTANT_EDIT &&
                "Bewerken, exporteren en BTW-acties uitvoeren"}
              {role === UserRole.STAFF &&
                "Facturen, relaties en uitgaven bewerken"}
            </p>
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
              Deze link is 7 dagen geldig
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
                      {invite.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getRoleLabel(invite.role)} • Verloopt op{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  className="ml-3 p-2 rounded-lg text-muted-foreground hover:bg-background hover:text-destructive transition-colors"
                  title="Annuleren"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
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
                      {member.email} • {getRoleLabel(member.role)}
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
