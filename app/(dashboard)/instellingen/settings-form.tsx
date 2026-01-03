"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
    <Card className="md:col-span-2 bg-white">
      <CardHeader>
        <CardTitle>Bedrijfsprofiel</CardTitle>
        <Badge variant="info">Auto-fill facturen</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
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
              <div key={veld.name} className="space-y-1">
                <label className="text-sm font-medium text-slate-800">{veld.label}</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={veld.placeholder}
                  {...form.register(veld.name as keyof CompanySettingsInput)}
                />
                {form.formState.errors[veld.name as keyof CompanySettingsInput] && (
                  <p className="text-xs text-amber-700">
                    {form.formState.errors[veld.name as keyof CompanySettingsInput]?.message as string}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Betaaltermijn (dagen)</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("paymentTerms", { valueAsNumber: true })}
              >
                {paymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} dagen
                  </option>
                ))}
              </select>
              {form.formState.errors.paymentTerms && (
                <p className="text-xs text-amber-700">{form.formState.errors.paymentTerms.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Bedrijfslogo upload</label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                <div className="mt-2 flex items-center gap-3">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md border border-slate-200 object-contain"
                  />
                  <p className="text-xs text-slate-600">Voorbeeld van het opgeslagen logo.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Upload een logo (PNG/JPG). Wordt bewaard als data-URL.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">KOR-regeling toepassen</label>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <Controller
                  name="korEnabled"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      aria-label="Schakel KOR-regeling in"
                    />
                  )}
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">0% BTW standaard</p>
                  <p className="text-xs text-slate-600">
                    Wanneer ingeschakeld, staan nieuwe factuurregels standaard op 0% BTW (KOR).
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-800">Upload Algemene Voorwaarden (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500"
                placeholder="Upload je voorwaarden"
                aria-disabled
                title="Placeholder - upload wordt binnenkort ondersteund"
              />
              <p className="text-xs text-slate-500">Placeholder veld voor het uploaden van PDF-voorwaarden.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
