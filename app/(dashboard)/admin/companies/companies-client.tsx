"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { listCompanies } from "./actions";
import { createCompany, updateCompany, deleteCompany, setCompanySuspended } from "./actions";
import { ExportButton } from "@/components/ui/export-button";

type Company = Awaited<ReturnType<typeof listCompanies>>[number];

const formSchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
  naam: z.string().min(1, "Naam is verplicht"),
  password: z.string().min(6, "Minimaal 6 tekens").optional(),
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  address: z.string().min(1, "Adres is verplicht"),
  postalCode: z.string().min(1, "Postcode is verplicht"),
  city: z.string().min(1, "Plaats is verplicht"),
  kvkNumber: z.string().min(1, "KVK is verplicht"),
  btwNumber: z.string().min(1, "BTW nummer is verplicht"),
  iban: z.string().min(1, "IBAN is verplicht"),
  bankName: z.string().min(1, "Banknaam is verplicht"),
  paymentTerms: z.string().min(1, "Betalingstermijn is verplicht"),
});

type FormValues = z.infer<typeof formSchema>;

export function CompaniesClient({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<null | string>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      naam: "",
      password: "",
      companyName: "",
      address: "",
      postalCode: "",
      city: "",
      kvkNumber: "",
      btwNumber: "",
      iban: "",
      bankName: "",
      paymentTerms: "",
    },
  });

  const sortedCompanies = useMemo(() => [...companies].sort((a, b) => a.email.localeCompare(b.email)), [companies]);

  const resetForm = () => {
    form.reset({
      email: "",
      naam: "",
      password: "",
      companyName: "",
      address: "",
      postalCode: "",
      city: "",
      kvkNumber: "",
      btwNumber: "",
      iban: "",
      bankName: "",
      paymentTerms: "",
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
    setOpen("form");
  };

  const openEdit = (company: Company) => {
    setMode("edit");
    setEditingId(company.id);
    form.reset({
      email: company.email,
      naam: company.naam ?? "",
      password: "",
      companyName: company.companyProfile?.companyName ?? "",
      address: company.companyProfile?.address ?? "",
      postalCode: company.companyProfile?.postalCode ?? "",
      city: company.companyProfile?.city ?? "",
      kvkNumber: company.companyProfile?.kvkNumber ?? "",
      btwNumber: company.companyProfile?.btwNumber ?? "",
      iban: company.companyProfile?.iban ?? "",
      bankName: company.companyProfile?.bankName ?? "",
      paymentTerms: company.companyProfile?.paymentTerms ?? "",
    });
    setOpen("form");
  };

  const submitForm = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createCompany(values);
          if (!result.success) {
            toast.error(result.message ?? "Aanmaken mislukt.");
            return;
          }
          toast.success("Company account aangemaakt.");
        } else if (editingId) {
          const result = await updateCompany(editingId, values);
          if (!result.success) {
            toast.error(result.message ?? "Bijwerken mislukt.");
            return;
          }
          toast.success("Company details bijgewerkt.");
        }
        resetForm();
        setOpen(null);
        router.refresh();
      } catch (error) {
        console.error("Company opslaan mislukt", error);
        toast.error("Opslaan mislukt.");
      }
    });
  });

  const toggleSuspended = (company: Company) => {
    startTransition(async () => {
      await setCompanySuspended(company.id, !company.isSuspended);
      toast.success(company.isSuspended ? "Account geactiveerd." : "Account geblokkeerd.");
      router.refresh();
    });
  };

  const handleDelete = (company: Company) => {
    startTransition(async () => {
      const result = await deleteCompany(company.id);
      if (!result.success) {
        toast.error(result.message ?? "Verwijderen mislukt.");
        return;
      }
      toast.success("Account verwijderd.");
      router.refresh();
    });
  };

  const submitLabel = isPending ? "Opslaan..." : mode === "create" ? "Aanmaken" : "Opslaan";

  return (
    <>
      <Card className="rounded-2xl border-2 shadow-lg">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Companies</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Beheer company accounts</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Badge variant="info" className="font-bold">{sortedCompanies.length} accounts</Badge>
            <ExportButton resource="companies" />
            <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
              Nieuwe company
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="min-w-[640px] sm:min-w-0">
            <table className="w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Bedrijf</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">
                      {company.companyProfile?.companyName ?? company.naam ?? "Onbekend"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {company.companyProfile?.city ?? ""} {company.companyProfile?.postalCode ?? ""}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{company.email}</td>
                  <td className="px-3 py-3">
                    <Badge variant={company.role === "SUPERADMIN" ? "info" : "muted"}>{company.role}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={company.isSuspended ? "destructive" : "success"}>
                      {company.isSuspended ? "Geblokkeerd" : "Actief"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex gap-1 sm:gap-2 justify-end flex-wrap">
                      <Button type="button" variant="secondary" onClick={() => openEdit(company)} className="text-xs px-2 sm:px-3">
                        Bewerken
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => toggleSuspended(company)} className="text-xs px-2 sm:px-3">
                        {company.isSuspended ? "Deblokkeren" : "Blokkeren"}
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => handleDelete(company)} className="text-xs px-2 sm:px-3">
                        Verwijderen
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      {open === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-card border-2 border-border p-4 sm:p-6 shadow-2xl my-4 sm:my-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {mode === "create" ? "Nieuwe company" : "Company bewerken"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vul alle bedrijfsgegevens in. Wachtwoord is optioneel bij bewerken.
                </p>
              </div>
              <Button type="button" variant="ghost" className="px-3 py-2 self-end sm:self-auto" onClick={() => setOpen(null)}>
                Sluiten
              </Button>
            </div>

            <form onSubmit={submitForm} className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Bedrijfsnaam</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("companyName")}
                />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Contactnaam</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("naam")}
                />
                {form.formState.errors.naam && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.naam.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">E-mail</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Wachtwoord</label>
                <input
                  type="password"
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  placeholder={mode === "edit" ? "Laat leeg om ongewijzigd te laten" : ""}
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Adres</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("address")}
                />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.address.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Stad</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("city")}
                />
                {form.formState.errors.city && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Postcode</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("postalCode")}
                />
                {form.formState.errors.postalCode && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.postalCode.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">KVK</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("kvkNumber")}
                />
                {form.formState.errors.kvkNumber && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.kvkNumber.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">BTW nummer</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("btwNumber")}
                />
                {form.formState.errors.btwNumber && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.btwNumber.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">IBAN</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("iban")}
                />
                {form.formState.errors.iban && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.iban.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Bank</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("bankName")}
                />
                {form.formState.errors.bankName && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.bankName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Betalingstermijn</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  {...form.register("paymentTerms")}
                />
                {form.formState.errors.paymentTerms && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.paymentTerms.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 md:col-span-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(null)} className="w-full sm:w-auto">
                  Annuleren
                </Button>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
