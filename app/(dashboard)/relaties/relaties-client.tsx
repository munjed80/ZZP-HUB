"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Pencil, Plus, Receipt, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientSchema, type ClientFormValues } from "./schema";
import { createClient, deleteClient, updateClient, type getClients } from "./actions";
import { ActionSheet } from "@/components/ui/action-sheet";
import { ExportButton } from "@/components/ui/export-button";

type ClientList = Awaited<ReturnType<typeof getClients>>;

export function RelatiesClient({ clients }: { clients: ClientList }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingClient, setEditingClient] = useState<ClientList[number] | null>(null);

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

  useEffect(() => {
    if (editingClient) {
      form.reset({
        name: editingClient.name,
        email: editingClient.email,
        address: editingClient.address,
        postalCode: editingClient.postalCode,
        city: editingClient.city,
        kvkNumber: editingClient.kvkNumber ?? "",
        btwId: editingClient.btwId ?? "",
      });
    }
  }, [editingClient, form]);

  const resetForm = () => {
    form.reset({
      name: "",
      email: "",
      address: "",
      postalCode: "",
      city: "",
      kvkNumber: "",
      btwId: "",
    });
    setEditingClient(null);
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editingClient) {
          await updateClient(editingClient.id, values);
          toast.success("Relatie bijgewerkt!");
        } else {
          await createClient(values);
          toast.success("Relatie succesvol opgeslagen!");
        }
        resetForm();
        setOpen(false);
        router.refresh();
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
      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle>Klanten</CardTitle>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Zoek op naam of stad"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Badge variant="success">{sortedClients.length} relaties</Badge>
            <ExportButton resource="clients" searchQuery={searchTerm} />
            <Button
              type="button"
              onClick={() => {
                resetForm();
                setEditingClient(null);
                setOpen(true);
              }}
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
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted px-6 py-10 text-center">
              <p className="text-lg font-semibold text-foreground">
                {sortedClients.length === 0 ? "Nog geen relaties" : "Geen resultaten gevonden"}
              </p>
              <p className="text-sm text-muted-foreground">
                {sortedClients.length === 0
                  ? "Voeg je eerste relatie toe om sneller facturen en offertes op te stellen."
                  : "Pas je zoekopdracht aan op naam of stad."}
              </p>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditingClient(null);
                  setOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Nieuwe relatie
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Bedrijfsnaam</th>
                      <th className="px-3 py-2">Contactpersoon</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Telefoon</th>
                      <th className="px-3 py-2">Stad</th>
                      <th className="px-3 py-2 text-right">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-muted/50">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-foreground">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.address}</div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">—</td>
                        <td className="px-3 py-3 text-muted-foreground">{client.email}</td>
                        <td className="px-3 py-3 text-muted-foreground">—</td>
                        <td className="px-3 py-3 text-muted-foreground">{client.city}</td>
                        <td className="px-3 py-3 text-right">
                          <ActionSheet
                            iconOnly
                            title="Relatie acties"
                            description={client.name}
                            ariaLabel={`Acties voor ${client.name}`}
                            actions={[
                              {
                                label: "Bewerk relatie",
                                icon: <Pencil className="h-5 w-5" />,
                                onClick: () => {
                                  setEditingClient(client);
                                  setOpen(true);
                                },
                              },
                              {
                                label: "Nieuwe factuur",
                                icon: <Receipt className="h-5 w-5" />,
                                onClick: () => {
                                  router.push(`/facturen/nieuw?clientId=${client.id}`);
                                },
                              },
                              {
                                label: "Nieuwe offerte",
                                icon: <FileText className="h-5 w-5" />,
                                onClick: () => {
                                  router.push(`/offertes/nieuw?clientId=${client.id}`);
                                },
                              },
                              {
                                label: "Verwijder relatie",
                                icon: <Trash2 className="h-5 w-5" />,
                                variant: "danger",
                                onClick: () => handleDelete(client.id),
                                disabled: isPending,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="rounded-lg border border-border bg-muted p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{client.address}</p>
                      </div>
                      <ActionSheet
                        iconOnly
                        title="Relatie acties"
                        description={client.name}
                        ariaLabel={`Acties voor ${client.name}`}
                        actions={[
                          {
                            label: "Bewerk relatie",
                            icon: <Pencil className="h-5 w-5" />,
                            onClick: () => {
                              setEditingClient(client);
                              setOpen(true);
                            },
                          },
                          {
                            label: "Nieuwe factuur",
                            icon: <Receipt className="h-5 w-5" />,
                            onClick: () => {
                              router.push(`/facturen/nieuw?clientId=${client.id}`);
                            },
                          },
                          {
                            label: "Nieuwe offerte",
                            icon: <FileText className="h-5 w-5" />,
                            onClick: () => {
                              router.push(`/offertes/nieuw?clientId=${client.id}`);
                            },
                          },
                          {
                            label: "Verwijder relatie",
                            icon: <Trash2 className="h-5 w-5" />,
                            variant: "danger",
                            onClick: () => handleDelete(client.id),
                            disabled: isPending,
                          },
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Email:</span>
                        <span className="text-xs text-foreground">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Stad:</span>
                        <span className="text-xs text-foreground">{client.city}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {open && (
        <div id="nieuwe-relatie-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-border bg-muted/30">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingClient ? "Relatie bewerken" : "Nieuwe relatie"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Vul de klantgegevens in. Naam en e-mail zijn verplicht.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 p-0 rounded-full shrink-0"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                aria-label="Sluiten"
              >
                <span className="text-lg">×</span>
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              {/* Company Name - Full width */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Bedrijfsnaam <span className="text-destructive">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Studio Delta BV"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email and KVK - Two columns */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    E-mail <span className="text-destructive">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="contact@bedrijf.nl"
                    type="email"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">KVK-nummer</label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="12345678"
                    {...form.register("kvkNumber")}
                  />
                </div>
              </div>

              {/* BTW-ID - Full width */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">BTW-nummer</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="NL123456789B01"
                  {...form.register("btwId")}
                />
              </div>

              {/* Address section */}
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adresgegevens</p>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Straat en huisnummer</label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Keizersgracht 12"
                    {...form.register("address")}
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Postcode</label>
                    <input
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="1015 CX"
                      {...form.register("postalCode")}
                    />
                    {form.formState.errors.postalCode && (
                      <p className="text-xs text-destructive">{form.formState.errors.postalCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Stad</label>
                    <input
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Amsterdam"
                      {...form.register("city")}
                    />
                    {form.formState.errors.city && (
                      <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={isPending} className="px-6">
                  {isPending ? "Opslaan..." : editingClient ? "Wijzigingen opslaan" : "Relatie toevoegen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
