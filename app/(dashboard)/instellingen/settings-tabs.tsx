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
import { DEFAULT_SUBSCRIPTION_PRICE, LOCAL_PROFILE_STORAGE_KEY } from "@/lib/constants";
import { changePassword, downloadBackup, saveProfileAvatar, saveProfileBasics, updateEmailSettings } from "./actions";
import { SettingsForm, type CompanyProfileData } from "./settings-form";

const DEFAULT_TAB = "profiel";
const VALID_TABS = ["profiel", "beveiliging", "email", "backup"] as const;
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
    const cachedProfile = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const priceLabel = abonnement.prijs ?? DEFAULT_SUBSCRIPTION_PRICE;
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
    window.localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(payload));
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
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? "";
      if (!result) {
        setAvatarUploading(false);
        return;
      }
      setAvatarPreview(result);
      persistProfileLocally(result);
      window.dispatchEvent(new CustomEvent("zzp-hub-avatar-updated", { detail: result }));
      startProfileTransition(async () => {
        try {
          await saveProfileAvatar(result);
          toast.success("Profielfoto opgeslagen.");
        } catch (error) {
          console.error(error);
          toast.message("Avatar saved locally; server storage will follow soon.");
        } finally {
          setAvatarUploading(false);
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
                <CardTitle>Profiel &amp; identiteit</CardTitle>
                <p className="text-sm text-slate-600">Scheiding tussen avatar, persoonlijke info en bedrijfsnaam.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Avatar</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                          disabled={avatarUploading}
                          aria-label={avatarUploading ? "Bezig met uploaden van je profielfoto" : "Upload nieuwe profielfoto"}
                          aria-busy={avatarUploading}
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden />
                          {avatarUploading ? "Bezig met uploaden..." : "Upload nieuwe foto"}
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={avatarInputRef}
                          onChange={handleAvatarUpload}
                        />
                        <p className="text-xs text-slate-500">PNG of JPG, direct zichtbaar in header en menu.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-sm font-medium text-slate-800">Naam (persoonlijk)</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        placeholder="Jouw naam"
                        required
                      />
                      <p className="text-xs text-slate-500">Weergegeven in header en documenten.</p>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-sm font-medium text-slate-800">Bedrijfsnaam</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={profileCompany}
                        onChange={(event) => setProfileCompany(event.target.value)}
                        placeholder="Naam van je bedrijf"
                      />
                      <p className="text-xs text-slate-500">Wordt gebruikt als afzender in facturen/offertes.</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-800">Login e-mail (alleen-lezen)</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        value={profileEmail}
                        readOnly
                        aria-readonly
                        placeholder="E-mailadres gekoppeld aan je account"
                      />
                      <p className="text-xs text-slate-500">
                        Dit is je inlog e-mailadres. Aanpassen gebeurt via support; factuur-afzender stel je apart in.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <p className="text-xs text-slate-500">Wijzigingen worden direct toegepast op dashboard en menu.</p>
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
                  <span className="text-3xl font-bold text-slate-900">{priceLabel}</span>
                  <span className="text-sm text-slate-600">• {abonnement.type}</span>
                </div>
                <p className="text-sm text-slate-700">
                  Inclusief premium templates, BTW-hulp en prioriteitssupport. Maandelijks opzegbaar.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={() => setSubscriptionModal("manage")}>
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Abonnement wijzigen
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setSubscriptionModal("payment")}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Betaalmethode aanpassen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => setSubscriptionModal("cancel")}
                  >
                    Abonnement annuleren
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
          title="Abonnement beheren"
          description="Kies wat je wilt doen. Alles blijft €4,99/maand totdat je bevestigt."
        >
          <div className="space-y-4 text-sm text-slate-700">
            {subscriptionModal === "manage" && (
              <>
                <p>Plan wijzigen wordt binnen de app verwerkt. Kies je nieuwe bundel en we bevestigen per e-mail.</p>
                <ul className="list-disc space-y-1 pl-5 text-slate-600">
                  <li>Wijzigingen worden binnen 24 uur actief.</li>
                  <li>Huidige tarief: €4,99/maand, maandelijks opzegbaar.</li>
                </ul>
              </>
            )}
            {subscriptionModal === "payment" && (
              <>
                <p>Je kunt je betaalmethode bijwerken zonder onderbreking van je account.</p>
                <p className="text-xs text-slate-500">Veilige verwerking via je factuurinstellingen.</p>
              </>
            )}
            {subscriptionModal === "cancel" && (
              <>
                <p className="font-semibold text-rose-700">Annuleren</p>
                <p>Bevestig dat je wilt opzeggen. Je behoudt toegang tot het einde van je huidige periode.</p>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSubscriptionModal(null)}>
                Sluiten
              </Button>
              {subscriptionModal && (
                <Button type="button" onClick={() => setSubscriptionModal(null)}>
                  Bevestigen
                </Button>
              )}
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
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-700">
              <p><span className="font-semibold">Login e-mail:</span> alleen voor inloggen en beveiliging (niet wijzigbaar hier).</p>
              <p className="mt-1"><span className="font-semibold">Afzendernaam:</span> wat klanten zien in hun inbox (bijv. je bedrijfsnaam).</p>
              <p className="mt-1"><span className="font-semibold">Reply-to:</span> antwoorden op facturen komen hier binnen.</p>
            </div>
            <form onSubmit={handleEmailSettingsSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Afzendernaam (zichtbaar in inbox)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Naam die ontvangers zien"
                  value={emailSettings.emailSenderName}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailSenderName: event.target.value }))}
                  required
                />
                <p className="text-xs text-slate-500">Gebruik je handelsnaam of merk. Dit is onafhankelijk van je login e-mail.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Reply-to (antwoordadres)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="antwoord@example.com"
                  value={emailSettings.emailReplyTo}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailReplyTo: event.target.value }))}
                  type="email"
                />
                <p className="text-xs text-slate-500">
                  Antwoorden op factuur-e-mails worden naar dit adres gestuurd, niet naar je login e-mail.
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
