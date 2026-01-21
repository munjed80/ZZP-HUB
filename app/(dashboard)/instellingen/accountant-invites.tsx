"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Invite = {
  id: string;
  email: string;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusBadge(status: Invite["status"]) {
  if (status === "ACTIVE") {
    return <Badge variant="success">ACCEPTED</Badge>;
  }
  return <Badge variant="warning">PENDING</Badge>;
}

export function AccountantInvites({ invites }: { invites: Invite[] }) {
  const hasItems = invites.length > 0;

  const sorted = useMemo(
    () => invites.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [invites],
  );

  if (!hasItems) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Nog geen uitnodigingen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Stuur een nieuwe uitnodiging vanuit je beheeromgeving om accountants toegang te geven.
        </p>
        <div className="mt-3 flex justify-center">
          <Button type="button" variant="secondary">
            Accountant uitnodigen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Email</span>
        <span>Status</span>
        <span>Aangemaakt</span>
        <span>Permissies</span>
      </div>
      <div className="space-y-2">
        {sorted.map((invite) => (
          <div
            key={invite.id}
            className="grid grid-cols-4 gap-3 items-center rounded-lg border border-border bg-card px-4 py-3 text-sm"
          >
            <div className="font-medium text-foreground">{invite.email}</div>
            <div>{statusBadge(invite.status)}</div>
            <div className="text-muted-foreground">{formatDate(invite.createdAt)}</div>
            <div className="text-muted-foreground">Dashboard toegang</div>
          </div>
        ))}
      </div>
    </div>
  );
}
