"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateCompanySettings } from "./actions";
import { companySettingsSchema, type CompanySettingsInput } from "./schema";
import { cn } from "@/lib/utils";

export type CompanyProfileData = {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  bankName: string;
  paymentTerms: string;
  logoUrl: string | null;
  korEnabled: boolean;
  emailSenderName?: string | null;
  emailReplyTo?: string | null;
} | null;

const paymentOptions = [14, 30];

// Input Field Component - supports dark mode
function InputField({ 
  label, 
  error,
  ...props 
}: { 
  label: string;
  error?: string;
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
          error ? "border-destructive focus:ring-destructive" : "focus:ring-primary",
          "focus:ring-2 focus:border-transparent",
          "transition-all duration-200",
          "text-base placeholder:text-muted-foreground",
          props.className
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function SettingsForm({ initialProfile }: { initialProfile: CompanyProfileData }) {
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<CompanySettingsInput>(
    () => ({
      companyName: initialProfile?.companyName ?? "",
      address: initialProfile?.address ?? "",
      postalCode: initialProfile?.postalCode ?? "",
      city: initialProfile?.city ?? "",
      kvkNumber: initialProfile?.kvkNumber ?? "",
      btwNumber: initialProfile?.btwNumber ?? "",
      iban: initialProfile?.iban ?? "",
      bankName: initialProfile?.bankName ?? "",
      paymentTerms: initialProfile?.paymentTerms ? Number(initialProfile.paymentTerms) : 14,
      logoUrl: initialProfile?.logoUrl ?? "",
      korEnabled: initialProfile?.korEnabled ?? false,
    }),
    [initialProfile]
  );

  const [logoPreview, setLogoPreview] = useState<string | null>(initialProfile?.logoUrl ?? null);

  const form = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues,
  });

  const onSubmit = (values: CompanySettingsInput) => {
    startTransition(async () => {
      try {
        const saved = await updateCompanySettings(values);
        toast.success("Instellingen succesvol opgeslagen");
        form.reset({
          ...values,
          paymentTerms: saved.paymentTerms ? Number(saved.paymentTerms) : values.paymentTerms,
          logoUrl: saved.logoUrl ?? "",
          korEnabled: saved.korEnabled ?? false,
        });
        setLogoPreview(saved.logoUrl ?? null);
      } catch (error) {
        console.error(error);
        toast.error("Opslaan mislukt. Probeer het opnieuw.");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Bedrijfsnaam"
          placeholder="Naam van je bedrijf"
          error={form.formState.errors.companyName?.message}
          {...form.register("companyName")}
        />
        <InputField
          label="Adres"
          placeholder="Straat en huisnummer"
          error={form.formState.errors.address?.message}
          {...form.register("address")}
        />
        <InputField
          label="Postcode"
          placeholder="1234 AB"
          error={form.formState.errors.postalCode?.message}
          {...form.register("postalCode")}
        />
        <InputField
          label="Plaats"
          placeholder="Amsterdam"
          error={form.formState.errors.city?.message}
          {...form.register("city")}
        />
        <InputField
          label="KVK-nummer"
          placeholder="12345678"
          error={form.formState.errors.kvkNumber?.message}
          {...form.register("kvkNumber")}
        />
        <InputField
          label="BTW-nummer"
          placeholder="NL123456789B01"
          error={form.formState.errors.btwNumber?.message}
          {...form.register("btwNumber")}
        />
        <InputField
          label="IBAN"
          placeholder="NL00BANK0123456789"
          error={form.formState.errors.iban?.message}
          {...form.register("iban")}
        />
        <InputField
          label="Banknaam"
          placeholder="Naam van de bank"
          error={form.formState.errors.bankName?.message}
          {...form.register("bankName")}
        />

        {/* Payment Terms Select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Betaaltermijn
          </label>
          <select
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
            {...form.register("paymentTerms", { valueAsNumber: true })}
          >
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option} dagen
              </option>
            ))}
          </select>
          {form.formState.errors.paymentTerms && (
            <p className="text-sm text-destructive">{form.formState.errors.paymentTerms.message}</p>
          )}
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Bedrijfslogo
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result?.toString() ?? "";
                form.setValue("logoUrl", result);
                setLogoPreview(result);
                toast.success("Logo toegevoegd");
              };
              reader.readAsDataURL(file);
            }}
          />
          {logoPreview && (
            <div className="mt-3 flex items-center gap-4 p-3 bg-muted border border-border rounded-lg">
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={56}
                height={56}
                className="h-14 w-14 rounded-lg border border-border object-contain bg-card p-1"
              />
              <p className="text-sm text-muted-foreground">Logo preview</p>
            </div>
          )}
        </div>
      </div>

      {/* KOR Toggle */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <Controller
          name="korEnabled"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-start gap-4 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={cn(
                  "w-12 h-6 rounded-full transition-all duration-300",
                  field.value ? "bg-primary" : "bg-muted"
                )}></div>
                <div className={cn(
                  "absolute left-1 top-1 w-4 h-4 bg-card rounded-full transition-all duration-300",
                  field.value && "translate-x-6"
                )}></div>
              </div>
              <div>
                <p className="font-medium text-foreground">KOR-regeling toepassen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nieuwe factuurregels staan standaard op 0% BTW (KOR)
                </p>
              </div>
            </label>
          )}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 text-base rounded-lg transition-colors"
        >
          {isPending ? "Opslaan..." : "Bedrijfsprofiel opslaan"}
        </Button>
      </div>
    </form>
  );
}
