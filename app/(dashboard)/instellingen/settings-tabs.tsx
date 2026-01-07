"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Lock, ShieldCheck, Database, CreditCard, RefreshCw, Bell } from "lucide-react";
import { Sun, Moon, Monitor } from "lucide-react"; // Theme selector icons
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SUBSCRIPTION_PRICE, LOCAL_PROFILE_STORAGE_KEY } from "@/lib/constants";
import { changePassword, downloadBackup, saveProfileAvatar, saveProfileBasics, updateEmailSettings } from "./actions";
import { SettingsForm, type CompanyProfileData } from "./settings-form";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const DEFAULT_TAB = "profiel";
const VALID_TABS = ["profiel", "beveiliging", "email", "backup"] as const;
const LANGUAGE_KEY = "zzp-hub-language";
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

function buildProfileSeed(
  initialProfile: CompanyProfileData,
  user: { name?: string | null; email: string } | null
): {
  name: string;
  companyName: string;
  avatar: string | null;
  language: "nl" | "en";
} {
  const base = {
    name: user?.name ?? "",
    companyName: initialProfile?.companyName ?? "",
    avatar: initialProfile?.logoUrl ?? null,
    language: "nl" as const,
  };
  if (typeof window === "undefined") return base;

  try {
    const cachedProfile = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
    const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
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
  const { theme: themePreference, setTheme } = useTheme();
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
  const [subscriptionModal, setSubscriptionModal] = useState<null | "manage" | "cancel" | "payment">(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const priceLabel = abonnement.prijs ?? DEFAULT_SUBSCRIPTION_PRICE;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

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
    <Tabs
      defaultValue={DEFAULT_TAB}
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-6 pb-[calc(88px+env(safe-area-inset-bottom))]"
    >
      <TabsList className="flex-wrap gap-2 border border-border/80 bg-card/80 p-1 shadow-sm rounded-2xl">
        <TabsTrigger
          value="profiel"
          className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-accent/15 data-[state=active]:text-primary data-[state=active]:shadow-md"
        >
          Account &amp; voorkeuren
        </TabsTrigger>
        <TabsTrigger
          value="beveiliging"
          className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-accent/15 data-[state=active]:text-primary data-[state=active]:shadow-md"
        >
          Beveiliging
        </TabsTrigger>
        <TabsTrigger
          value="email"
          className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-accent/15 data-[state=active]:text-primary data-[state=active]:shadow-md"
        >
          E-mail
        </TabsTrigger>
        <TabsTrigger
          value="backup"
          className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-accent/15 data-[state=active]:text-primary data-[state=active]:shadow-md"
        >
          Data &amp; Backup
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profiel">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card className="bg-card border border-border/70 shadow-sm">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>Profiel &amp; identiteit</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">Scheiding tussen avatar, persoonlijke info en bedrijfsnaam.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Avatar</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG of JPG, direct zichtbaar in header en menu.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Naam (persoonlijk)</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        placeholder="Jouw naam"
                        required
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Weergegeven in header en documenten.</p>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Bedrijfsnaam</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                        value={profileCompany}
                        onChange={(event) => setProfileCompany(event.target.value)}
                        placeholder="Naam van je bedrijf"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Wordt gebruikt als afzender in facturen/offertes.</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Login e-mail (alleen-lezen)</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                        value={profileEmail}
                        readOnly
                        aria-readonly
                        placeholder="E-mailadres gekoppeld aan je account"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Dit is je inlog e-mailadres. Aanpassen gebeurt via support; factuur-afzender stel je apart in.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Wijzigingen worden direct toegepast op dashboard en menu.</p>
                    <Button type="submit" disabled={isProfilePending}>
                      {isProfilePending ? "Opslaan..." : "Profiel opslaan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border/70 shadow-sm">
              <CardHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden />
                  <CardTitle>Voorkeuren</CardTitle>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Taal en thema worden direct opgeslagen in je instellingen.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Taal</p>
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
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Thema</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                        themePreference === "light"
                          ? "border-teal-600 bg-teal-50 dark:bg-teal-950"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <Sun
                        className={cn(
                          "h-5 w-5",
                          themePreference === "light" ? "text-teal-600" : "text-slate-600 dark:text-slate-400"
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          themePreference === "light" ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        Licht
                      </span>
                      {themePreference === "light" && (
                        <div className="h-2 w-2 rounded-full bg-teal-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                        themePreference === "dark"
                          ? "border-teal-600 bg-teal-50 dark:bg-teal-950"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <Moon
                        className={cn(
                          "h-5 w-5",
                          themePreference === "dark" ? "text-teal-600" : "text-slate-600 dark:text-slate-400"
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          themePreference === "dark" ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        Donker
                      </span>
                      {themePreference === "dark" && (
                        <div className="h-2 w-2 rounded-full bg-teal-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                        themePreference === "system"
                          ? "border-teal-600 bg-teal-50 dark:bg-teal-950"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <Monitor
                        className={cn(
                          "h-5 w-5",
                          themePreference === "system" ? "text-teal-600" : "text-slate-600 dark:text-slate-400"
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          themePreference === "system" ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        Systeem
                      </span>
                      {themePreference === "system" && (
                        <div className="h-2 w-2 rounded-full bg-teal-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kies je voorkeur of gebruik systeeminstellingen voor automatische aanpassing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <SettingsForm initialProfile={initialProfile} />
          </div>

          <div className="space-y-4">
            <Card className="relative overflow-hidden bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-white/60 to-emerald-100/40 dark:from-emerald-900/30 dark:via-slate-900/60 dark:to-emerald-800/25"
                aria-hidden="true"
              />
              <CardHeader className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Abonnement</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">{abonnement.type}</CardTitle>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm dark:bg-emerald-900/60 dark:text-emerald-100">
                      Premium plan
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{abonnement.type} lidmaatschap</p>
                </div>
                <Badge
                  variant={abonnement.status.toLowerCase() === "actief" ? "success" : "muted"}
                  className="shadow-[0_10px_30px_-18px_rgba(16,185,129,0.85)]"
                >
                  {abonnement.status}
                </Badge>
              </CardHeader>
              <CardContent className="relative space-y-6 text-slate-700 dark:text-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{priceLabel}</span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{abonnement.type}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      Inclusief premium templates, BTW-hulp en prioriteitssupport. Maandelijks opzegbaar.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</p>
                    <p className="mt-1">Volledige toegang tot alle functies</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Button
                    type="button"
                    onClick={() => setSubscriptionModal("manage")}
                    className="w-full shadow-[0_18px_40px_-22px_rgba(16,185,129,0.85)]"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Abonnement wijzigen
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full border border-slate-800 bg-slate-900 text-white hover:-translate-y-[1px] hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    onClick={() => setSubscriptionModal("payment")}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Betaalmethode aanpassen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full border border-transparent font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
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
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            {subscriptionModal === "manage" && (
              <>
                <p>Plan wijzigen wordt binnen de app verwerkt. Kies je nieuwe bundel en we bevestigen per e-mail.</p>
                <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
                  <li>Wijzigingen worden binnen 24 uur actief.</li>
                  <li>Huidige tarief: €4,99/maand, maandelijks opzegbaar.</li>
                </ul>
              </>
            )}
            {subscriptionModal === "payment" && (
              <>
                <p>Je kunt je betaalmethode bijwerken zonder onderbreking van je account.</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Veilige verwerking via je factuurinstellingen.</p>
              </>
            )}
            {subscriptionModal === "cancel" && (
              <>
                <p className="font-semibold text-rose-700 dark:text-rose-400">Annuleren</p>
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
        <Card className="bg-card border border-border/70 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
              <CardTitle>Beveiliging</CardTitle>
            </div>
            <Badge variant="info">Accountbeveiliging</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Huidig wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                  value={passwords.current}
                  onChange={(event) => setPasswords((prev) => ({ ...prev, current: event.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Nieuw wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                  value={passwords.next}
                  onChange={(event) => setPasswords((prev) => ({ ...prev, next: event.target.value }))}
                  placeholder="Nieuw wachtwoord"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Bevestig wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
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
        <Card className="bg-card border border-border/70 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
              <CardTitle>E-mailinstellingen</CardTitle>
            </div>
            <Badge variant="info">Versturen</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Login e-mail:</span> alleen voor inloggen en beveiliging (niet wijzigbaar hier).</p>
              <p className="mt-1"><span className="font-semibold">Afzendernaam:</span> wat klanten zien in hun inbox (bijv. je bedrijfsnaam).</p>
              <p className="mt-1"><span className="font-semibold">Reply-to:</span> antwoorden op facturen komen hier binnen.</p>
            </div>
            <form onSubmit={handleEmailSettingsSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Afzendernaam (zichtbaar in inbox)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                  placeholder="Naam die ontvangers zien"
                  value={emailSettings.emailSenderName}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailSenderName: event.target.value }))}
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Gebruik je handelsnaam of merk. Dit is onafhankelijk van je login e-mail.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">Reply-to (antwoordadres)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600"
                  placeholder="antwoord@example.com"
                  value={emailSettings.emailReplyTo}
                  onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailReplyTo: event.target.value }))}
                  type="email"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
        <Card className="bg-card border border-border/70 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
              <CardTitle>Data &amp; Backup</CardTitle>
            </div>
            <Badge variant="muted">JSON export</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
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
