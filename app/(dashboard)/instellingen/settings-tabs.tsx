"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Lock, ShieldCheck, Database, CreditCard, RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { changePassword, downloadBackup, saveProfileAvatar, saveProfileBasics, updateEmailSettings } from "./actions";
import { SettingsForm, type CompanyProfileData } from "./settings-form";

const DEFAULT_TAB = "profiel";
const VALID_TABS = ["profiel", "beveiliging", "email", "backup"] as const;
const LOCAL_PROFILE_KEY = "zzp-hub-account-profile";
const LANGUAGE_KEY = "zzp-hub-language";
const THEME_KEY = "zzp-hub-theme";
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

function buildProfileSeed(
  initialProfile: CompanyProfileData,
  user: { name?: string | null; email: string } | null
): {
  name: string;
  companyName: string;
  avatar: string | null;
  language: "nl" | "en";
  theme: "light" | "dark" | "system";
} {
  const base = {
    name: user?.name ?? "",
    companyName: initialProfile?.companyName ?? "",
    avatar: initialProfile?.logoUrl ?? null,
    language: "nl" as const,
    theme: "system" as const,
  };
  if (typeof window === "undefined") return base;

  try {
    const cachedProfile = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const parsed = cachedProfile
      ? (JSON.parse(cachedProfile) as {
          name?: string;
          companyName?: string;
          email?: string;
          avatar?: string | null;
        })
      : null;

    return {
      name: parsed?.name ?? base.name,
      companyName: parsed?.companyName ?? base.companyName,
      avatar: parsed?.avatar ?? base.avatar,
      language: storedLanguage === "en" ? "en" : "nl",
      theme: storedTheme === "dark" || storedTheme === "light" ? (storedTheme as "light" | "dark") : "system",
    };
  } catch (error) {
    console.error("Kon voorkeuren niet laden", error);
    return base;
  }
}

type SettingsTabsProps = {
  initialProfile: CompanyProfileData;
  abonnement: {
    type: string;
    prijs: string;
    status: string;
  };
  user: { name?: string | null; email: string } | null;
};

export function SettingsTabs({ initialProfile, abonnement, user }: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const initialTab = tabParam && VALID_TABS.includes(tabParam as (typeof VALID_TABS)[number]) ? tabParam : DEFAULT_TAB;
  const profileSeed = buildProfileSeed(initialProfile, user);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isBackupPending, startBackupTransition] = useTransition();
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [emailSettings, setEmailSettings] = useState({
    emailSenderName: initialProfile?.emailSenderName ?? initialProfile?.companyName ?? "",
    emailReplyTo: initialProfile?.emailReplyTo ?? "",
  });
  const [profileName, setProfileName] = useState(profileSeed.name);
  const [profileCompany, setProfileCompany] = useState(profileSeed.companyName);
  const [profileEmail] = useState(user?.email ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profileSeed.avatar);
  const [language, setLanguage] = useState<"nl" | "en">(profileSeed.language);
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">(profileSeed.theme);
  const [subscriptionModal, setSubscriptionModal] = useState<null | "manage" | "cancel" | "payment">(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_KEY, language);
    window.localStorage.setItem(THEME_KEY, themePreference);
  }, [language, themePreference]);

  const persistProfileLocally = (avatar: string | null, nameValue?: string, companyValue?: string) => {
    if (typeof window === "undefined") return;
    const payload = {
      name: nameValue ?? profileName,
      companyName: companyValue ?? profileCompany,
      email: profileEmail,
      avatar,
    };
    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(payload));
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Alleen afbeeldingen worden ondersteund.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Afbeelding is te groot. Max 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? "";
      if (!result) return;
      setAvatarPreview(result);
      persistProfileLocally(result);
      startProfileTransition(async () => {
        try {
          await saveProfileAvatar(result);
          toast.success("Profielfoto opgeslagen.");
        } catch (error) {
          console.error(error);
          toast.message("Afbeelding lokaal opgeslagen; serveropslag wordt binnenkort geactiveerd.");
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = profileName.trim();
    const trimmedCompany = profileCompany.trim();
    const trimmedEmail = profileEmail.trim();
    if (!trimmedEmail) {
      toast.error("Geen e-mailadres beschikbaar om op te slaan.");
      return;
    }
    startProfileTransition(async () => {
      try {
        await saveProfileBasics({
          name: trimmedName,
          companyName: trimmedCompany || undefined,
          email: trimmedEmail,
        });
        setProfileName(trimmedName);
        setProfileCompany(trimmedCompany);
        persistProfileLocally(avatarPreview, trimmedName, trimmedCompany);
        toast.success("Profiel opgeslagen.");
      } catch (error) {
        console.error(error);
        persistProfileLocally(avatarPreview, trimmedName, trimmedCompany);
        toast.error("Opslaan mislukt. Voorkeuren zijn lokaal bewaard.");
      }
    });
  };

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("Nieuwe wachtwoorden komen niet overeen.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
        toast.success("Wachtwoord gewijzigd.");
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

  const handleEmailSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startEmailTransition(async () => {
      try {
        const saved = await updateEmailSettings(emailSettings);
        setEmailSettings({
          emailSenderName: saved?.emailSenderName ?? emailSettings.emailSenderName,
          emailReplyTo: saved?.emailReplyTo ?? emailSettings.emailReplyTo,
        });
        toast.success("E-mailinstellingen opgeslagen.");
      } catch (error) {
        console.error(error);
        toast.error("Kon e-mailinstellingen niet opslaan.");
      }
    });
  };

  return (
    <Tabs defaultValue={DEFAULT_TAB} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="profiel">Account &amp; voorkeuren</TabsTrigger>
        <TabsTrigger value="beveiliging">Beveiliging</TabsTrigger>
        <TabsTrigger value="email">E-mail</TabsTrigger>
        <TabsTrigger value="backup">Data &amp; Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="profiel">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card className="bg-white">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>Profiel</CardTitle>
                <p className="text-sm text-slate-600">Pas je zichtbare gegevens en avatar aan.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Profielfoto"
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized={avatarPreview.startsWith("data:")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Geen foto
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-fit"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Upload nieuwe foto
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                      />
                      <p className="text-xs text-slate-500">PNG of JPG, wordt bewaard als veilige data-URL.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-800">Naam</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        placeholder="Jouw naam"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-800">Bedrijfsnaam</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={profileCompany}
                        onChange={(event) => setProfileCompany(event.target.value)}
                        placeholder="Naam van je bedrijf"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-800">E-mail</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        value={profileEmail}
                        readOnly
                        aria-readonly
                        placeholder="E-mailadres gekoppeld aan je account"
                      />
                      <p className="text-xs text-slate-500">E-mail is gekoppeld aan je login en is alleen-lezen.</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isProfilePending}>
                      {isProfilePending ? "Opslaan..." : "Profiel opslaan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-600" aria-hidden />
                  <CardTitle>Voorkeuren</CardTitle>
                </div>
                <p className="text-sm text-slate-600">Taal en thema worden direct opgeslagen in je instellingen.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Taal</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={language === "nl" ? "primary" : "secondary"}
                      onClick={() => setLanguage("nl")}
                    >
                      Nederlands
                    </Button>
                    <Button
                      type="button"
                      variant={language === "en" ? "primary" : "secondary"}
                      onClick={() => setLanguage("en")}
                    >
                      English
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Thema</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={themePreference === "light" ? "primary" : "secondary"}
                      onClick={() => setThemePreference("light")}
                    >
                      Licht
                    </Button>
                    <Button
                      type="button"
                      variant={themePreference === "dark" ? "primary" : "secondary"}
                      onClick={() => setThemePreference("dark")}
                    >
                      Donker
                    </Button>
                    <Button
                      type="button"
                      variant={themePreference === "system" ? "primary" : "secondary"}
                      onClick={() => setThemePreference("system")}
                    >
                      Systeem
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Voorkeuren worden opgeslagen voor toekomstige sessies, ook als thema&apos;s nog beperkt zijn.
                  </p>
                </div>
              </CardContent>
            </Card>

            <SettingsForm initialProfile={initialProfile} />
          </div>

          <div className="space-y-4">
            <Card className="bg-white">
              <CardHeader className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>Abonnement</CardTitle>
                  <p className="text-sm text-slate-600">{abonnement.type} lidmaatschap</p>
                </div>
                <Badge variant={abonnement.status.toLowerCase() === "actief" ? "success" : "muted"}>
                  {abonnement.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{abonnement.prijs}</span>
                  <span className="text-sm text-slate-600">• {abonnement.type}</span>
                </div>
                <p className="text-sm text-slate-700">
                  Moderne facturatie, premium templates en prioriteitssupport. Opzegbaar per maand.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={() => setSubscriptionModal("manage")}>
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Beheer abonnement
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setSubscriptionModal("payment")}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Wijzig betaalmethode
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => setSubscriptionModal("cancel")}
                  >
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Sheet
          open={Boolean(subscriptionModal)}
          onOpenChange={(open) => {
            if (!open) setSubscriptionModal(null);
          }}
          title="Abonnementsbeheer"
          description="Abonnementsbeheer wordt binnenkort beschikbaar."
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Abonnementsbeheer wordt binnenkort beschikbaar. Tot die tijd kun je via support of e-mail wijzigingen
              aanvragen zonder risico voor je abonnement.
            </p>
            <p className="text-xs text-slate-500">
              Beheer, annuleren en betaalmethode wijzigen worden binnenkort rechtstreeks in ZZP Hub beschikbaar.
            </p>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setSubscriptionModal(null)}>
                Sluiten
              </Button>
            </div>
          </div>
        </Sheet>
      </TabsContent>

      <TabsContent value="beveiliging">
        <Card className="bg-white">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600" aria-hidden />
              <CardTitle>Beveiliging</CardTitle>
            </div>
            <Badge variant="info">Accountbeveiliging</Badge>
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

      <TabsContent value="email">
        <Card className="bg-white">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600" aria-hidden />
              <CardTitle>E-mailinstellingen</CardTitle>
            </div>
            <Badge variant="info">Versturen</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSettingsSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Afzendernaam</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Naam die ontvangers zien"
                  value={emailSettings.emailSenderName}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailSenderName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Reply-to</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="antwoord@example.com"
                  value={emailSettings.emailReplyTo}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailReplyTo: event.target.value }))}
                  type="email"
                />
                <p className="text-xs text-slate-500">
                  Antwoorden op factuur-e-mails worden naar dit adres gestuurd.
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isEmailPending}>
                  {isEmailPending ? "Opslaan..." : "Opslaan"}
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
              <CardTitle>Data &amp; Backup</CardTitle>
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
