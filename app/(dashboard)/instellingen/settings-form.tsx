"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanySettings } from "./actions";
import { companySettingsSchema, type CompanySettingsInput } from "./schema";

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
    <Card className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" aria-hidden="true" />
          <CardTitle className="text-xl">Bedrijfsprofiel</CardTitle>
        </div>
        <Badge variant="info" className="shadow-sm mt-2">Auto-fill facturen</Badge>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-2">
          Deze gegevens worden automatisch ingevuld bij het aanmaken van facturen en offertes.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { name: "companyName", label: "Bedrijfsnaam", placeholder: "Naam van je bedrijf" },
              { name: "address", label: "Adres", placeholder: "Straat en huisnummer" },
              { name: "postalCode", label: "Postcode", placeholder: "1234 AB" },
              { name: "city", label: "Plaats", placeholder: "Amsterdam" },
              { name: "kvkNumber", label: "KVK-nummer", placeholder: "12345678" },
              { name: "btwNumber", label: "BTW-nummer", placeholder: "NL123456789B01" },
              { name: "iban", label: "IBAN", placeholder: "NL00BANK0123456789" },
              { name: "bankName", label: "Banknaam", placeholder: "Naam van de bank" },
              { name: "logoUrl", label: "Logo URL (optioneel)", placeholder: "https://..." },
            ].map((veld) => (
              <div key={veld.name} className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">{veld.label}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                  placeholder={veld.placeholder}
                  {...form.register(veld.name as keyof CompanySettingsInput)}
                />
                {form.formState.errors[veld.name as keyof CompanySettingsInput] && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {form.formState.errors[veld.name as keyof CompanySettingsInput]?.message as string}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Betaaltermijn (dagen)</label>
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-300 dark:focus:border-emerald-600"
                {...form.register("paymentTerms", { valueAsNumber: true })}
              >
                {paymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} dagen
                  </option>
                ))}
              </select>
              {form.formState.errors.paymentTerms && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{form.formState.errors.paymentTerms.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bedrijfslogo upload</label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900 transition-all"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result?.toString() ?? "";
                    form.setValue("logoUrl", result);
                    setLogoPreview(result);
                    toast.success("Logo toegevoegd voor opslag");
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {logoPreview ? (
                <div className="mt-3 flex items-center gap-4 p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/60 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 object-contain bg-white dark:bg-slate-900 p-1 shadow-sm"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Voorbeeld van het opgeslagen logo.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload een logo (PNG/JPG). Wordt bewaard als data-URL.</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">KOR-regeling toepassen</label>
              <div className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/60 dark:to-slate-800/40 px-4 py-4">
                <Controller
                  name="korEnabled"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded-lg border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                      aria-label="Schakel KOR-regeling in"
                    />
                  )}
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">0% BTW standaard</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Wanneer ingeschakeld, staan nieuwe factuurregels standaard op 0% BTW (KOR).
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upload Algemene Voorwaarden (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled
                className="w-full cursor-not-allowed rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-medium"
                placeholder="Upload je voorwaarden"
                aria-disabled
                title="Placeholder - upload wordt binnenkort ondersteund"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Placeholder veld voor het uploaden van PDF-voorwaarden.</p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={isPending} className="min-w-[160px] justify-center shadow-md hover:shadow-lg">
              {isPending ? "Opslaan..." : "Bedrijfsprofiel opslaan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
