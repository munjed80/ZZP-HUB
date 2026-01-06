import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { listReleases } from "./actions";
import { ReleasesClient } from "./releases-client";

export default async function ReleasesPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== UserRole.SUPERADMIN) {
    redirect("/");
  }

  const releases = await listReleases();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary via-accent to-success"></div>
          <h1 className="text-3xl font-bold text-foreground">Release Management</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Beheer platform updates en nieuwe features. Alleen zichtbaar voor SuperAdmins.
        </p>
      </div>

      <ReleasesClient releases={releases} />
    </div>
  );
}
