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
import { ReleaseCategory } from "@prisma/client";
import type { listReleases } from "./actions";
import { createRelease, updateRelease, deleteRelease, toggleReleasePublished } from "./actions";

type Release = Awaited<ReturnType<typeof listReleases>>[number];

const formSchema = z.object({
  version: z.string().min(1, "Versie is verplicht"),
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  category: z.nativeEnum(ReleaseCategory, { required_error: "Categorie is verplicht" }),
  isPublished: z.boolean().default(false),
  releaseDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const categoryLabels: Record<ReleaseCategory, string> = {
  BUTTONS: "Buttons",
  COLORS: "Kleuren",
  FUNCTIONS: "Functies",
  MOBILE_COMPATIBILITY: "Mobiele compatibiliteit",
  GENERAL: "Algemeen",
};

const categoryVariants: Record<ReleaseCategory, "primary" | "info" | "success" | "warning" | "muted"> = {
  BUTTONS: "primary",
  COLORS: "info",
  FUNCTIONS: "info",
  MOBILE_COMPATIBILITY: "success",
  GENERAL: "warning",
};

export function ReleasesClient({ releases }: { releases: Release[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<null | string>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      version: "",
      title: "",
      description: "",
      category: ReleaseCategory.GENERAL,
      isPublished: false,
      releaseDate: "",
    },
  });

  const sortedReleases = useMemo(() => [...releases].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [releases]);

  const resetForm = () => {
    form.reset({
      version: "",
      title: "",
      description: "",
      category: ReleaseCategory.GENERAL,
      isPublished: false,
      releaseDate: "",
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
    setOpen("form");
  };

  const openEdit = (release: Release) => {
    setMode("edit");
    setEditingId(release.id);
    form.reset({
      version: release.version,
      title: release.title,
      description: release.description,
      category: release.category,
      isPublished: release.isPublished,
      releaseDate: release.releaseDate ? new Date(release.releaseDate).toISOString().split('T')[0] : "",
    });
    setOpen("form");
  };

  const submitForm = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createRelease(values);
          if (!result.success) {
            toast.error(result.message ?? "Aanmaken mislukt.");
            return;
          }
          toast.success("Release aangemaakt.");
        } else if (editingId) {
          const result = await updateRelease(editingId, values);
          if (!result.success) {
            toast.error(result.message ?? "Bijwerken mislukt.");
            return;
          }
          toast.success("Release bijgewerkt.");
        }
        resetForm();
        setOpen(null);
        router.refresh();
      } catch (error) {
        console.error("Release opslaan mislukt", error);
        toast.error("Opslaan mislukt.");
      }
    });
  });

  const togglePublished = (release: Release) => {
    startTransition(async () => {
      await toggleReleasePublished(release.id, !release.isPublished);
      toast.success(release.isPublished ? "Release verborgen." : "Release gepubliceerd.");
      router.refresh();
    });
  };

  const handleDelete = (release: Release) => {
    startTransition(async () => {
      const result = await deleteRelease(release.id);
      if (!result.success) {
        toast.error(result.message ?? "Verwijderen mislukt.");
        return;
      }
      toast.success("Release verwijderd.");
      router.refresh();
    });
  };

  const submitLabel = isPending ? "Opslaan..." : mode === "create" ? "Aanmaken" : "Opslaan";

  return (
    <>
      <Card className="rounded-2xl border-2 shadow-lg">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Release Updates</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Beheer platform updates en releases</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="info" className="font-bold">{sortedReleases.length} releases</Badge>
            <Button type="button" onClick={openCreate}>
              Nieuwe release
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedReleases.map((release) => (
              <div key={release.id} className="rounded-xl border-2 border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="muted" className="font-bold">
                        v{release.version}
                      </Badge>
                      <Badge variant={categoryVariants[release.category]} className="font-semibold">
                        {categoryLabels[release.category]}
                      </Badge>
                      <Badge variant={release.isPublished ? "success" : "muted"} className="font-semibold">
                        {release.isPublished ? "Gepubliceerd" : "Concept"}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{release.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{release.description}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Aangemaakt: {new Date(release.createdAt).toLocaleDateString('nl-NL')}</span>
                      {release.releaseDate && (
                        <span>Released: {new Date(release.releaseDate).toLocaleDateString('nl-NL')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap md:flex-col">
                    <Button type="button" variant="secondary" onClick={() => openEdit(release)} className="text-xs">
                      Bewerken
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => togglePublished(release)} className="text-xs">
                      {release.isPublished ? "Verbergen" : "Publiceren"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => handleDelete(release)} className="text-xs">
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {sortedReleases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nog geen releases aangemaakt.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {open === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-card border-2 border-border p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {mode === "create" ? "Nieuwe release" : "Release bewerken"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vul de release informatie in
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(null)}>
                Sluiten
              </Button>
            </div>

            <form onSubmit={submitForm} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Versie</label>
                  <input
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                    placeholder="1.0.0"
                    {...form.register("version")}
                  />
                  {form.formState.errors.version && (
                    <p className="text-xs text-destructive font-medium">{form.formState.errors.version.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Categorie</label>
                  <select
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                    {...form.register("category")}
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {form.formState.errors.category && (
                    <p className="text-xs text-destructive font-medium">{form.formState.errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Titel</label>
                <input
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  placeholder="Verbeterde button styling"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Beschrijving</label>
                <textarea
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors min-h-[120px]"
                  placeholder="Beschrijf de wijzigingen in deze release..."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Release datum (optioneel)</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                    {...form.register("releaseDate")}
                  />
                  {form.formState.errors.releaseDate && (
                    <p className="text-xs text-destructive font-medium">{form.formState.errors.releaseDate.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <div className="flex items-center gap-2 h-[42px]">
                    <input
                      type="checkbox"
                      id="isPublished"
                      className="h-4 w-4 rounded border-2 border-border"
                      {...form.register("isPublished")}
                    />
                    <label htmlFor="isPublished" className="text-sm text-muted-foreground">
                      Direct publiceren
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => setOpen(null)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isPending}>
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
