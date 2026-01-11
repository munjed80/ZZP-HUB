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
      className="space-y-6 sm:space-y-8 pb-[calc(88px+env(safe-area-inset-bottom))]"
    >
      <TabsList className="flex-wrap gap-2 border border-emerald-200/60 dark:border-emerald-700/40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-1.5 shadow-[0_4px_24px_-8px_rgba(16,185,129,0.15)] rounded-2xl">
        <TabsTrigger
          value="profiel"
          className="rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_24px_-8px_rgba(16,185,129,0.5)] hover:bg-slate-50 dark:hover:bg-slate-700 data-[state=active]:scale-[1.02]"
        >
          Account &amp; voorkeuren
        </TabsTrigger>
        <TabsTrigger
          value="beveiliging"
          className="rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_24px_-8px_rgba(16,185,129,0.5)] hover:bg-slate-50 dark:hover:bg-slate-700 data-[state=active]:scale-[1.02]"
        >
          Beveiliging
        </TabsTrigger>
        <TabsTrigger
          value="email"
          className="rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_24px_-8px_rgba(16,185,129,0.5)] hover:bg-slate-50 dark:hover:bg-slate-700 data-[state=active]:scale-[1.02]"
        >
          E-mail
        </TabsTrigger>
        <TabsTrigger
          value="backup"
          className="rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_24px_-8px_rgba(16,185,129,0.5)] hover:bg-slate-50 dark:hover:bg-slate-700 data-[state=active]:scale-[1.02]"
        >
          Data &amp; Backup
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profiel">
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
              <CardHeader className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" aria-hidden="true" />
                  <CardTitle className="text-xl">Profiel &amp; identiteit</CardTitle>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Persoonlijke informatie en bedrijfsidentiteit met directe preview.
                </p>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  {/* Avatar Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-6 rounded-full bg-emerald-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Profielfoto</p>
                    </div>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center p-5 rounded-xl bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/60 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="relative group">
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          {avatarPreview ? (
                            <Image
                              src={avatarPreview}
                              alt="Profielfoto"
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized={avatarPreview.startsWith("data:")}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Geen foto
                            </div>
                          )}
                        </div>
                        {/* Upload indicator */}
                        {avatarUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                            <RefreshCw className="h-6 w-6 animate-spin text-white" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full sm:w-auto shadow-sm hover:shadow-md"
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
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          PNG of JPG, max 3MB. Wordt direct zichtbaar in header en menu.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal & Company Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-6 rounded-full bg-teal-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Persoonlijke gegevens</p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Naam (persoonlijk)</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          placeholder="Jouw naam"
                          required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Weergegeven in header en documenten.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bedrijfsnaam</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                          value={profileCompany}
                          onChange={(event) => setProfileCompany(event.target.value)}
                          placeholder="Naam van je bedrijf"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Wordt gebruikt als afzender in facturen/offertes.</p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Login e-mail (alleen-lezen)</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
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
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Wijzigingen worden direct toegepast op dashboard en menu.
                    </p>
                    <Button type="submit" disabled={isProfilePending} className="w-full sm:w-auto shadow-md hover:shadow-lg">
                      {isProfilePending ? "Opslaan..." : "Profiel opslaan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
              <CardHeader className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-2.5">
                  <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <CardTitle className="text-xl">Voorkeuren</CardTitle>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Taal en thema worden automatisch opgeslagen in uw instellingen.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Language Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-emerald-500" aria-hidden="true" />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Taal</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant={language === "nl" ? "primary" : "secondary"}
                      className={cn(
                        "px-6 py-2.5 shadow-sm",
                        language === "nl" && "shadow-[0_6px_24px_-8px_rgba(16,185,129,0.4)]"
                      )}
                      onClick={() => setLanguage("nl")}
                    >
                      Nederlands
                    </Button>
                    <Button
                      type="button"
                      variant={language === "en" ? "primary" : "secondary"}
                      className={cn(
                        "px-6 py-2.5 shadow-sm",
                        language === "en" && "shadow-[0_6px_24px_-8px_rgba(16,185,129,0.4)]"
                      )}
                      onClick={() => setLanguage("en")}
                    >
                      English
                    </Button>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-teal-500" aria-hidden="true" />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Thema</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300 hover:scale-[1.02]",
                        themePreference === "light"
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 shadow-[0_6px_24px_-8px_rgba(16,185,129,0.4)]"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "rounded-xl p-3 transition-all duration-300",
                        themePreference === "light"
                          ? "bg-emerald-100 dark:bg-emerald-900/60 shadow-md"
                          : "bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950"
                      )}>
                        <Sun
                          className={cn(
                            "h-6 w-6 transition-colors duration-300",
                            themePreference === "light" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                          )}
                          aria-hidden
                        />
                      </div>
                      <div className="text-center">
                        <span className={cn(
                          "text-sm font-bold transition-colors duration-300",
                          themePreference === "light" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"
                        )}>
                          Licht
                        </span>
                        {themePreference === "light" && (
                          <div className="mt-2 h-1.5 w-1.5 mx-auto rounded-full bg-emerald-600" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300 hover:scale-[1.02]",
                        themePreference === "dark"
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 shadow-[0_6px_24px_-8px_rgba(16,185,129,0.4)]"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "rounded-xl p-3 transition-all duration-300",
                        themePreference === "dark"
                          ? "bg-emerald-100 dark:bg-emerald-900/60 shadow-md"
                          : "bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950"
                      )}>
                        <Moon
                          className={cn(
                            "h-6 w-6 transition-colors duration-300",
                            themePreference === "dark" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                          )}
                          aria-hidden
                        />
                      </div>
                      <div className="text-center">
                        <span className={cn(
                          "text-sm font-bold transition-colors duration-300",
                          themePreference === "dark" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"
                        )}>
                          Donker
                        </span>
                        {themePreference === "dark" && (
                          <div className="mt-2 h-1.5 w-1.5 mx-auto rounded-full bg-emerald-600" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300 hover:scale-[1.02]",
                        themePreference === "system"
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 shadow-[0_6px_24px_-8px_rgba(16,185,129,0.4)]"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "rounded-xl p-3 transition-all duration-300",
                        themePreference === "system"
                          ? "bg-emerald-100 dark:bg-emerald-900/60 shadow-md"
                          : "bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950"
                      )}>
                        <Monitor
                          className={cn(
                            "h-6 w-6 transition-colors duration-300",
                            themePreference === "system" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                          )}
                          aria-hidden
                        />
                      </div>
                      <div className="text-center">
                        <span className={cn(
                          "text-sm font-bold transition-colors duration-300",
                          themePreference === "system" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"
                        )}>
                          Systeem
                        </span>
                        {themePreference === "system" && (
                          <div className="mt-2 h-1.5 w-1.5 mx-auto rounded-full bg-emerald-600" />
                        )}
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Kies uw voorkeur of gebruik systeeminstellingen voor automatische aanpassing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <SettingsForm initialProfile={initialProfile} />
          </div>

          <div className="space-y-6">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-900 dark:via-emerald-950/20 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-700/40 shadow-[0_12px_48px_-16px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_64px_-20px_rgba(16,185,129,0.45)] transition-all duration-500">
              {/* Decorative gradient orbs */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
              <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-tr from-teal-400/15 via-emerald-400/10 to-transparent blur-2xl" aria-hidden="true" />
              
              <CardHeader className="relative flex flex-col gap-4 border-b border-emerald-100/60 dark:border-emerald-800/40 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" aria-hidden="true" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                        Abonnement
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-2xl sm:text-3xl text-slate-900 dark:text-white">{abonnement.type}</CardTitle>
                      <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_16px_-6px_rgba(16,185,129,0.6)]">
                        Premium
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{abonnement.type} lidmaatschap</p>
                  </div>
                  <Badge
                    variant={abonnement.status.toLowerCase() === "actief" ? "success" : "muted"}
                    className="shadow-[0_6px_24px_-10px_rgba(16,185,129,0.7)]"
                  >
                    {abonnement.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent">
                      {priceLabel}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">/maand</span>
                  </div>
                  <div className="rounded-xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-emerald-100 dark:border-emerald-900/40 p-4 shadow-sm">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                      Inclusief premium templates, BTW-hulp, prioriteitssupport en onbeperkte facturen.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/30 px-4 py-3.5 shadow-sm">
                    <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">Status</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">Volledige toegang tot alle functies</p>
                  </div>
                </div>
                
                <div className="grid gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setSubscriptionModal("manage")}
                    className="w-full shadow-[0_8px_32px_-12px_rgba(16,185,129,0.6)] hover:shadow-[0_12px_40px_-14px_rgba(16,185,129,0.7)]"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Abonnement wijzigen
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full shadow-sm hover:shadow-md"
                    onClick={() => setSubscriptionModal("payment")}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Betaalmethode aanpassen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full border border-rose-200 dark:border-rose-800/60 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
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
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 p-3 shadow-sm">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-xl">Beveiliging</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Wijzig uw wachtwoord voor accountbeveiliging
                </p>
              </div>
            </div>
            <Badge variant="info" className="shadow-sm">Accountbeveiliging</Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Huidig wachtwoord</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                    value={passwords.current}
                    onChange={(event) => setPasswords((prev) => ({ ...prev, current: event.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nieuw wachtwoord</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                    value={passwords.next}
                    onChange={(event) => setPasswords((prev) => ({ ...prev, next: event.target.value }))}
                    placeholder="Nieuw wachtwoord"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bevestig wachtwoord</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                    value={passwords.confirm}
                    onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
                    placeholder="Herhaal wachtwoord"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" disabled={isPasswordPending} className="shadow-md hover:shadow-lg">
                  <Lock className="h-4 w-4" aria-hidden />
                  {isPasswordPending ? "Wijzigen..." : "Wachtwoord wijzigen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 p-3 shadow-sm">
                <ShieldCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-xl">E-mailinstellingen</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Configureer afzendernaam en antwoordadres
                </p>
              </div>
            </div>
            <Badge variant="info" className="shadow-sm">Versturen</Badge>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 p-5 shadow-sm">
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 min-w-[140px]">Login e-mail:</span>
                  <span>alleen voor inloggen en beveiliging (niet wijzigbaar hier).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 min-w-[140px]">Afzendernaam:</span>
                  <span>wat klanten zien in hun inbox (bijv. je bedrijfsnaam).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 min-w-[140px]">Reply-to:</span>
                  <span>antwoorden op facturen komen hier binnen.</span>
                </p>
              </div>
            </div>
            
            <form onSubmit={handleEmailSettingsSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Afzendernaam (zichtbaar in inbox)
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                    placeholder="Naam die ontvangers zien"
                    value={emailSettings.emailSenderName}
                    onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailSenderName: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gebruik je handelsnaam of merk. Dit is onafhankelijk van je login e-mail.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Reply-to (antwoordadres)
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                    placeholder="antwoord@example.com"
                    value={emailSettings.emailReplyTo}
                    onChange={(event) => setEmailSettings((prev) => ({ ...prev, emailReplyTo: event.target.value }))}
                    type="email"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Antwoorden op factuur-e-mails worden naar dit adres gestuurd, niet naar je login e-mail.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" disabled={isEmailPending} className="shadow-md hover:shadow-lg">
                  {isEmailPending ? "Opslaan..." : "E-mailinstellingen opslaan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 p-3 shadow-sm">
                <Database className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-xl">Data &amp; Backup</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Exporteer uw gegevens voor archivering of migratie
                </p>
              </div>
            </div>
            <Badge variant="muted" className="shadow-sm">JSON export</Badge>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 p-5 shadow-sm">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Download al uw gegevens (facturen, relaties, uitgaven) als JSON-backup. 
                Perfect voor veilige archivering of migratie naar andere systemen.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/60 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Volledige gegevensexport</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Inclusief alle facturen, klanten, uitgaven en bedrijfsgegevens
                </p>
              </div>
              <Button 
                type="button" 
                onClick={handleBackupDownload} 
                disabled={isBackupPending}
                className="w-full sm:w-auto shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4" aria-hidden />
                {isBackupPending ? "Bezig met export..." : "Download backup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
