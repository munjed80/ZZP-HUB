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

// Light-mode only Input Field Component
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
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className={cn(
          "w-full px-4 py-3 rounded-lg border text-gray-900",
          error ? "border-rose-300 focus:ring-rose-500" : "border-gray-300 focus:ring-teal-500",
          "focus:ring-2 focus:border-transparent",
          "transition-all duration-200",
          "text-base",
          props.className
        )}
      />
      {error && (
        <p className="text-sm text-rose-600">{error}</p>
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
          <label className="block text-sm font-medium text-gray-700">
            Betaaltermijn
          </label>
          <select
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
            {...form.register("paymentTerms", { valueAsNumber: true })}
          >
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option} dagen
              </option>
            ))}
          </select>
          {form.formState.errors.paymentTerms && (
            <p className="text-sm text-rose-600">{form.formState.errors.paymentTerms.message}</p>
          )}
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bedrijfslogo
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
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
            <div className="mt-3 flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={56}
                height={56}
                className="h-14 w-14 rounded-lg border border-gray-200 object-contain bg-white p-1"
              />
              <p className="text-sm text-gray-600">Logo preview</p>
            </div>
          )}
        </div>
      </div>

      {/* KOR Toggle */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                  field.value ? "bg-teal-500" : "bg-gray-300"
                )}></div>
                <div className={cn(
                  "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                  field.value && "translate-x-6"
                )}></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">KOR-regeling toepassen</p>
                <p className="text-sm text-gray-600 mt-1">
                  Nieuwe factuurregels staan standaard op 0% BTW (KOR)
                </p>
              </div>
            </label>
          )}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-base rounded-lg transition-colors"
        >
          {isPending ? "Opslaan..." : "Bedrijfsprofiel opslaan"}
        </Button>
      </div>
    </form>
  );
}
