"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { 
  User, Building2, FileText, CreditCard, Bell, Shield, 
  Database, Download, Lock, RefreshCw, Check, Globe, Palette
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LOCAL_PROFILE_STORAGE_KEY } from "@/lib/constants";
import { changePassword, downloadBackup, saveProfileAvatar, saveProfileBasics, updateEmailSettings } from "./actions";
import { SettingsForm, type CompanyProfileData } from "./settings-form";
import { cn } from "@/lib/utils";

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

// Section Card Component - Supports dark mode
function SectionCard({ 
  icon: Icon, 
  title, 
  description, 
  children,
  className 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Input Field Component
function InputField({ 
  label, 
  ...props 
}: { 
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        className={cn(
          "w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground",
          "focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-all duration-200",
          "text-base placeholder:text-muted-foreground",
          props.className
        )}
      />
    </div>
  );
}

// Toggle Component
function Toggle({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={cn(
          "w-12 h-6 rounded-full transition-all duration-300",
          checked ? "bg-primary" : "bg-muted"
        )}></div>
        <div className={cn(
          "absolute left-1 top-1 w-4 h-4 bg-card rounded-full transition-all duration-300",
          checked && "translate-x-6"
        )}></div>
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </label>
  );
}

export function SettingsTabs({ initialProfile, abonnement, user }: SettingsTabsProps) {
  const profileSeed = buildProfileSeed(initialProfile, user);
  
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
  const [avatarUploading, setAvatarUploading] = useState(false);
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
    
    if (passwords.next.length < 8) {
      toast.error("Nieuw wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    
    if (passwords.next !== passwords.confirm) {
      toast.error("Nieuwe wachtwoorden komen niet overeen.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
        toast.success("Wachtwoord succesvol gewijzigd.");
        setPasswords({ current: "", next: "", confirm: "" });
      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Kon wachtwoord niet wijzigen.";
        toast.error(errorMessage);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-32">
      {/* Profile Section */}
      <SectionCard
        icon={User}
        title="Profiel"
        description="Persoonlijke informatie en profielfoto"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border">
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
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                  <RefreshCw className="h-6 w-6 animate-spin text-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-base"
              >
                {avatarUploading ? "Uploaden..." : "Upload foto"}
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
              />
              <p className="mt-2 text-sm text-muted-foreground">PNG of JPG, max 3MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Naam"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Jouw naam"
              required
            />
            <InputField
              label="Bedrijfsnaam"
              value={profileCompany}
              onChange={(e) => setProfileCompany(e.target.value)}
              placeholder="Naam van je bedrijf"
            />
          </div>

          <InputField
            label="E-mailadres"
            value={profileEmail}
            readOnly
            className="bg-muted cursor-not-allowed"
          />

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isProfilePending}
              className="px-8 py-3 text-base rounded-lg transition-colors"
            >
              {isProfilePending ? "Opslaan..." : "Profiel opslaan"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Company Section */}
      <SectionCard
        icon={Building2}
        title="Bedrijfsgegevens"
        description="Bedrijfsinformatie voor facturen en offertes"
      >
        <SettingsForm initialProfile={initialProfile} />
      </SectionCard>

      {/* Notifications Section */}
      <SectionCard
        icon={Bell}
        title="Notificaties"
        description="E-mailinstellingen voor facturen en communicatie"
      >
        <form onSubmit={handleEmailSettingsSubmit} className="space-y-6">
          <div className="p-4 bg-secondary/30 border border-secondary rounded-lg">
            <p className="text-sm text-foreground">
              Deze instellingen bepalen hoe je facturen en offertes worden verstuurd naar klanten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Afzendernaam"
              placeholder="Naam die ontvangers zien"
              value={emailSettings.emailSenderName}
              onChange={(e) => setEmailSettings((prev) => ({ ...prev, emailSenderName: e.target.value }))}
              required
            />
            <InputField
              label="Reply-to adres"
              type="email"
              placeholder="antwoord@example.com"
              value={emailSettings.emailReplyTo}
              onChange={(e) => setEmailSettings((prev) => ({ ...prev, emailReplyTo: e.target.value }))}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isEmailPending}
              className="px-8 py-3 text-base rounded-lg transition-colors"
            >
              {isEmailPending ? "Opslaan..." : "Instellingen opslaan"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Security Section */}
      <SectionCard
        icon={Shield}
        title="Beveiliging"
        description="Wachtwoord en accountbeveiliging"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Huidig wachtwoord"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))}
              placeholder="••••••••"
              required
            />
            <InputField
              label="Nieuw wachtwoord"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))}
              placeholder="Nieuw wachtwoord"
              required
            />
            <InputField
              label="Bevestig wachtwoord"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
              placeholder="Herhaal wachtwoord"
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isPasswordPending}
              className="px-8 py-3 text-base rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isPasswordPending ? "Wijzigen..." : "Wachtwoord wijzigen"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Integrations Section */}
      <SectionCard
        icon={Database}
        title="Integraties"
        description="Data export en backup beheer"
      >
        <div className="space-y-6">
          <div className="p-4 bg-muted border border-border rounded-lg">
            <p className="text-sm text-foreground">
              Download al uw gegevens (facturen, relaties, uitgaven) als JSON-backup voor archivering of migratie.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
            <div>
              <h3 className="font-medium text-foreground">Volledige backup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Inclusief alle facturen, klanten en uitgaven
              </p>
            </div>
            <Button
              type="button"
              onClick={handleBackupDownload}
              disabled={isBackupPending}
              className="px-6 py-2.5 text-base rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {isBackupPending ? "Exporteren..." : "Download"}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Payments/Subscription Section */}
      <SectionCard
        icon={CreditCard}
        title="Abonnement"
        description="Beheer uw abonnement en betalingen"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-primary/10 rounded-lg border border-primary/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{abonnement.type}</span>
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                  {abonnement.status}
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold text-primary">{abonnement.prijs}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Inclusief premium templates, BTW-hulp en prioriteitssupport
              </p>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 border border-secondary rounded-lg">
            <p className="text-sm text-foreground">
              Abonnementsbeheer is momenteel alleen beschikbaar via support. 
              Neem contact op voor wijzigingen aan uw abonnement.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Preferences Section - Language */}
      <SectionCard
        icon={Globe}
        title="Voorkeuren"
        description="Taal en interface instellingen"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Taal
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLanguage("nl")}
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all",
                  language === "nl"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <Check className={cn("w-5 h-5 mx-auto mb-1", language === "nl" ? "opacity-100" : "opacity-0")} />
                Nederlands
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all",
                  language === "en"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <Check className={cn("w-5 h-5 mx-auto mb-1", language === "en" ? "opacity-100" : "opacity-0")} />
                English
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Taalwijzigingen worden automatisch opgeslagen
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
