"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientSchema, type ClientFormValues } from "./schema";
import { createClient, deleteClient, type getClients } from "./actions";

type ClientList = Awaited<ReturnType<typeof getClients>>;

export function RelatiesClient({ clients }: { clients: ClientList }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      postalCode: "",
      city: "",
      kvkNumber: "",
      btwId: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createClient(values);
        form.reset();
        setOpen(false);
        router.refresh();
        toast.success("Relatie succesvol opgeslagen!");
      } catch (error) {
        console.error("Relatie opslaan mislukt", error);
        toast.error("Relatie opslaan mislukt. Probeer het opnieuw.");
      }
    });
  });

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteClient(id);
        router.refresh();
        toast.success("Relatie verwijderd.");
      } catch (error) {
        console.error("Relatie verwijderen mislukt", error);
        toast.error("Relatie verwijderen mislukt. Probeer het opnieuw.");
      }
    });
  };

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return sortedClients;
    const term = searchTerm.toLowerCase();
    return sortedClients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.city.toLowerCase().includes(term)
    );
  }, [searchTerm, sortedClients]);

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Klanten</CardTitle>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm"
                placeholder="Zoek op naam of stad"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Badge variant="success">{sortedClients.length} relaties</Badge>
            <Button
              type="button"
              onClick={() => setOpen(true)}
              className="px-3 py-1.5"
              aria-expanded={open}
              aria-controls="nieuwe-relatie-dialog"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nieuwe relatie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                {sortedClients.length === 0 ? "Nog geen relaties" : "Geen resultaten gevonden"}
              </p>
              <p className="text-sm text-slate-600">
                {sortedClients.length === 0
                  ? "Voeg je eerste relatie toe om sneller facturen en offertes op te stellen."
                  : "Pas je zoekopdracht aan op naam of stad."}
              </p>
              <Button type="button" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Nieuwe relatie
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Bedrijfsnaam</th>
                    <th className="px-3 py-2">Contactpersoon</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Telefoon</th>
                    <th className="px-3 py-2">Stad</th>
                    <th className="px-3 py-2 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.address}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">—</td>
                      <td className="px-3 py-3 text-slate-700">{client.email}</td>
                      <td className="px-3 py-3 text-slate-700">—</td>
                      <td className="px-3 py-3 text-slate-700">{client.city}</td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDelete(client.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-xs"
                          aria-label={`Verwijder ${client.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <div id="nieuwe-relatie-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Nieuwe relatie</h2>
                <p className="text-sm text-slate-600">Vul de klantgegevens in. Naam en e-mail zijn verplicht.</p>
              </div>
              <Button type="button" variant="ghost" className="px-3 py-2" onClick={() => setOpen(false)}>
                Sluiten
              </Button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-800">Bedrijfsnaam</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Studio Delta BV"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-amber-700">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">E-mail</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="info@bedrijf.nl"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">KVK</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="12345678"
                  {...form.register("kvkNumber")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">BTW-ID</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="NL123456789B01"
                  {...form.register("btwId")}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-800">Adres</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Keizersgracht 12"
                  {...form.register("address")}
                />
                {form.formState.errors.address && (
                  <p className="text-xs text-amber-700">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Postcode</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="1015 CX"
                  {...form.register("postalCode")}
                />
                {form.formState.errors.postalCode && (
                  <p className="text-xs text-amber-700">{form.formState.errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Stad</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Amsterdam"
                  {...form.register("city")}
                />
                {form.formState.errors.city && (
                  <p className="text-xs text-amber-700">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Opslaan..." : "Relatie opslaan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
