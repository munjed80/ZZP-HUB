"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createDraftFromExtraction } from "../drafts/actions";
import { BtwTarief } from "@prisma/client";
import { z } from "zod";

// Schema for the draft form after extraction
const draftFormSchema = z.object({
  description: z.string().min(1, "Beschrijving is verplicht"),
  category: z.string().min(1, "Categorie is verplicht"),
  amountExcl: z.number().min(0, "Bedrag moet positief zijn"),
  vatRate: z.nativeEnum(BtwTarief),
  date: z.string(),
});

type DraftFormValues = z.infer<typeof draftFormSchema>;

const categories = ["Kantoorkosten", "Reiskosten", "Marketing", "Apparatuur", "Overig"];

const vatLabels: Record<BtwTarief, string> = {
  HOOG_21: "21%",
  LAAG_9: "9%",
  NUL_0: "0%",
  VRIJGESTELD: "Vrijgesteld",
  VERLEGD: "Verlegd",
};

type UploadStatus = "idle" | "uploading" | "extracted" | "error";

interface ExtractionData {
  totalAmount: number;
  vatAmount?: number;
  vatRate?: BtwTarief;
  date?: string;
  vendorName?: string;
  invoiceNumber?: string;
  currency?: string;
}

interface UploadResponse {
  success: boolean;
  asset: {
    id: string;
    filename: string;
    storageUrl?: string;
  };
  extraction: {
    id: string;
    status: string;
    data: ExtractionData;
    confidence: number;
    warnings: string[];
  };
  error?: string;
}

export function UploadClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionData | null>(null);
  const [assetId, setAssetId] = useState<string>("");
  const [storageUrl, setStorageUrl] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DraftFormValues>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: {
      description: "",
      category: "Kantoorkosten",
      amountExcl: 0,
      vatRate: BtwTarief.HOOG_21,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadStatus("uploading");
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload mislukt");
      }

      // Set extracted data
      setExtractedData(data.extraction.data);
      setAssetId(data.asset.id);
      setStorageUrl(data.asset.storageUrl || "");
      setWarnings(data.extraction.warnings || []);
      setUploadStatus("extracted");

      // Pre-fill form with extracted data
      if (data.extraction.data.vendorName) {
        setValue("description", data.extraction.data.vendorName);
      }
      setValue("amountExcl", data.extraction.data.totalAmount || 0);
      if (data.extraction.data.vatRate) {
        setValue("vatRate", data.extraction.data.vatRate);
      }
      if (data.extraction.data.date) {
        setValue("date", data.extraction.data.date);
      }

      toast.success("Bestand geüpload!");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      toast.error(error instanceof Error ? error.message : "Upload mislukt");
    }
  };

  const onSubmit = async (values: DraftFormValues) => {
    if (!extractedData || !assetId) {
      toast.error("Geen bestand geüpload");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDraftFromExtraction({
          extractedData: {
            totalAmount: values.amountExcl,
            vatRate: values.vatRate,
            date: values.date,
            vendorName: values.description,
          },
          assetId,
          storageUrl,
        });

        if (result.success) {
          toast.success("Concept opgeslagen! Ga naar Concepten om goed te keuren.");
          router.push("/drafts");
        }
      } catch (error) {
        console.error("Save error:", error);
        toast.error(error instanceof Error ? error.message : "Opslaan mislukt");
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Scan Ontvangstbewijs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload een foto of PDF van je ontvangstbewijs. Het systeem extraheert automatisch de gegevens.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          {uploadStatus === "idle" && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-16 h-16 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Klik om bestand te uploaden</p>
                    <p className="text-sm text-muted-foreground">
                      Of sleep een bestand hierheen
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG, WebP of PDF (max 10MB)
                    </p>
                  </div>
                  <Button type="button">
                    <Camera className="w-4 h-4 mr-2" />
                    Kies bestand
                  </Button>
                </div>
              </label>
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="border rounded-lg p-8 text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
              <p className="mt-4 font-medium">Bestand uploaden en extracteren...</p>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="border border-destructive rounded-lg p-6 bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Upload mislukt</p>
              </div>
              <Button onClick={() => setUploadStatus("idle")} variant="outline" className="mt-4">
                Probeer opnieuw
              </Button>
            </div>
          )}

          {uploadStatus === "extracted" && (
            <div className="space-y-6">
              {/* Success indicator */}
              <div className="border border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-medium">Bestand geüpload: {uploadedFile?.name}</p>
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="border border-yellow-500 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">Let op:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Beschrijving</label>
                  <input
                    {...register("description")}
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Leverancier / omschrijving"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Categorie</label>
                  <select {...register("category")} className="w-full px-3 py-2 border rounded-md">
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bedrag (excl. BTW)</label>
                    <input
                      {...register("amountExcl", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="0.00"
                    />
                    {errors.amountExcl && (
                      <p className="text-sm text-destructive mt-1">{errors.amountExcl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">BTW-tarief</label>
                    <select {...register("vatRate")} className="w-full px-3 py-2 border rounded-md">
                      {Object.entries(vatLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.vatRate && (
                      <p className="text-sm text-destructive mt-1">{errors.vatRate.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input
                    {...register("date")}
                    type="date"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Opslaan als concept
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUploadStatus("idle");
                      setUploadedFile(null);
                      setExtractedData(null);
                      setAssetId("");
                      setStorageUrl("");
                    }}
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Hoe werkt het?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>Upload een foto of PDF van je ontvangstbewijs</li>
            <li>Het systeem extraheert automatisch de gegevens (indien mogelijk)</li>
            <li>Controleer en pas de gegevens aan indien nodig</li>
            <li>Sla op als concept voor latere goedkeuring</li>
            <li>Ga naar de Concepten pagina om het goed te keuren</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
