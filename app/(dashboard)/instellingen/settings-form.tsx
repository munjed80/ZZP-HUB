"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanySettings } from "./actions";
import { companySettingsSchema, type CompanySettingsInput } from "./schema";

type CompanyProfileData = {
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
    }),
    [initialProfile]
  );

  const form = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (values: CompanySettingsInput) => {
    startTransition(async () => {
      try {
        const saved = await updateCompanySettings(values);
        toast.success("Instellingen opgeslagen");
        form.reset({
          ...values,
          paymentTerms: saved.paymentTerms ? Number(saved.paymentTerms) : values.paymentTerms,
          logoUrl: saved.logoUrl ?? "",
        });
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
