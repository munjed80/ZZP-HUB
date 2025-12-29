"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Download, Lock, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { changePassword, downloadBackup } from "./actions";
import { SettingsForm, type CompanyProfileData } from "./settings-form";

type SettingsTabsProps = {
  initialProfile: CompanyProfileData;
  abonnement: {
    type: string;
    prijs: string;
    status: string;
  };
};

export function SettingsTabs({ initialProfile, abonnement }: SettingsTabsProps) {
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isBackupPending, startBackupTransition] = useTransition();
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("Nieuwe wachtwoorden komen niet overeen.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
        toast.success("Wachtwoord gewijzigd (demo)");
        setPasswords({ current: "", next: "", confirm: "" });
      } catch (error) {
        console.error(error);
        toast.error("Kon wachtwoord niet wijzigen.");
      }
    });
  };

  const handleBackupDownload = () => {
    startBackupTransition(async () => {
      try {
        const data = await downloadBackup();
        const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = "zzp-hub-backup.json";
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Backup gedownload.");
      } catch (error) {
        console.error(error);
        toast.error("Download mislukt. Probeer opnieuw.");
      }
    });
  };

  return (
    <Tabs defaultValue="profiel" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profiel">Bedrijfsprofiel</TabsTrigger>
        <TabsTrigger value="beveiliging">Beveiliging</TabsTrigger>
        <TabsTrigger value="backup">Data & Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="profiel">
        <div className="grid gap-4 md:grid-cols-3">
          <SettingsForm initialProfile={initialProfile} />

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <Badge variant="success">{abonnement.type}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700">
                {abonnement.type} tarief: {abonnement.prijs} per maand. Opzegbaar per maand en gericht op groeiende freelancers.
              </p>
              <p className="text-sm font-semibold text-slate-900">Status: {abonnement.status}</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="beveiliging">
        <Card className="bg-white">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600" aria-hidden />
              <CardTitle>Beveiliging</CardTitle>
            </div>
            <Badge variant="info">Demo-auth</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800">Huidig wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={passwords.current}
                  onChange={(event) => setPasswords((prev) => ({ ...prev, current: event.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800">Nieuw wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={passwords.next}
                  onChange={(event) => setPasswords((prev) => ({ ...prev, next: event.target.value }))}
                  placeholder="Nieuw wachtwoord"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800">Bevestig wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
                  placeholder="Herhaal"
                  required
                />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="submit" disabled={isPasswordPending}>
                  <Lock className="mr-2 h-4 w-4" aria-hidden />
                  {isPasswordPending ? "Wijzigen..." : "Wachtwoord wijzigen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup">
        <Card className="bg-white">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-600" aria-hidden />
              <CardTitle>Data & Backup</CardTitle>
            </div>
            <Badge variant="muted">JSON export</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">
              Download al je gegevens (facturen, relaties, uitgaven) als JSON-backup. Veilig voor archief of migratie.
            </p>
            <Button type="button" onClick={handleBackupDownload} disabled={isBackupPending}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              {isBackupPending ? "Bezig met export..." : "Download backup"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
