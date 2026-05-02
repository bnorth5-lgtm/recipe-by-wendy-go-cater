"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { formatQuantity } from "@/store/cateringStore";
import Tesseract from "tesseract.js";
import { parseRecipeFromJsonLdWithLocalAi, parseRecipeWithLocalAi, type ParsedRecipeDraft } from "@/lib/localAi";
import { fetchJsonLdRecipeFromUrl } from "@/lib/recipeScrape";
import { renderPdfPageToBlob } from "@/lib/pdfOcr";
import { TierGate } from "@/components/TierGate";
import { useSubscription } from "@/hooks/useSubscription";

export type UniversalImporterResult = ParsedRecipeDraft;

type Props = {
  onParsed: (draft: UniversalImporterResult) => void;
};

type OcrAsset =
  | { kind: "image"; file: File }
  | { kind: "pdf"; file: File };

export function UniversalRecipeImporter({ onParsed }: Props) {
  const [tab, setTab] = useState<"paste" | "ocr" | "url">("paste");
  const { can, track } = useSubscription();

  // Magic Paste
  const [pasteText, setPasteText] = useState("");

  // OCR
  const [ocrAsset, setOcrAsset] = useState<OcrAsset | null>(null);

  // URL
  const [url, setUrl] = useState("");

  const [isWorking, setIsWorking] = useState(false);
  const [preview, setPreview] = useState<ParsedRecipeDraft | null>(null);

  const canRun = useMemo(() => {
    if (!can("price_scraping")) return false;
    if (tab === "paste") return Boolean(pasteText.trim());
    if (tab === "ocr") return Boolean(ocrAsset?.file);
    if (tab === "url") return Boolean(url.trim());
    return false;
  }, [tab, pasteText, ocrAsset, url, can]);

  const run = async () => {
    if (!can("price_scraping")) {
      toast.error("Recipe import requires a Professional or Enterprise subscription.");
      return;
    }
    setIsWorking(true);
    try {
      void track("price_scraping");
      if (tab === "paste") {
        const draft = await parseRecipeWithLocalAi({
          text: pasteText,
          meta: {
            sourceType: "paste",
            importMethod: "magic-paste",
            importedAt: new Date().toISOString(),
          },
        });
        setPreview(draft);
        onParsed(draft);
        toast.success("Imported from Magic Paste.");
        return;
      }

      if (tab === "ocr") {
        if (!ocrAsset) {
          toast.error("Choose an image or PDF first.");
          return;
        }

        let ocrText = "";
        if (ocrAsset.kind === "image") {
          const result = await Tesseract.recognize(ocrAsset.file, "eng");
          ocrText = result.data.text ?? "";
        } else {
          const blob = await renderPdfPageToBlob(ocrAsset.file, 1);
          const result = await Tesseract.recognize(blob, "eng");
          ocrText = result.data.text ?? "";
        }

        if (!ocrText.trim()) {
          toast.error("No readable text found. Try a clearer scan.");
          return;
        }

        const draft = await parseRecipeWithLocalAi({
          text: ocrText,
          meta: {
            sourceType: "ocr",
            importMethod: ocrAsset.kind === "pdf" ? "ocr-pdf" : "ocr-image",
            importedAt: new Date().toISOString(),
          },
        });
        setPreview(draft);
        onParsed(draft);
        toast.success("Imported from OCR.");
        return;
      }

      if (tab === "url") {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url.trim());
        } catch {
          toast.error("Enter a valid URL.");
          return;
        }

        const scraped = await fetchJsonLdRecipeFromUrl(parsedUrl.toString());
        const draft = await parseRecipeFromJsonLdWithLocalAi({
          json: scraped.recipe,
          meta: {
            sourceUrl: parsedUrl.toString(),
            sourceType: "url",
            sourceSite: scraped.sourceSite,
            sourceTitle: scraped.sourceTitle,
            sourceAuthor: scraped.sourceAuthor,
            importMethod: "url-jsonld",
            importedAt: new Date().toISOString(),
            sourceJson: scraped.recipe,
          },
        });
        setPreview(draft);
        onParsed(draft);
        toast.success("Imported from URL JSON recipe data.");
        return;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed. Try a different input.");
    } finally {
      setIsWorking(false);
    }
  };

  if (!can("price_scraping")) {
    return <TierGate feature="price_scraping" />;
  }

  return (
    <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 rounded-2xl border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Universal Importer</CardTitle>
            <CardDescription className="text-muted-foreground">
              OCR, URL JSON recipes, or Magic Paste — parsed locally and stored in SQLite.
            </CardDescription>
          </div>
          <Button onClick={run} disabled={!canRun || isWorking} className="h-11 px-5 text-base">
            {isWorking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Importing…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" /> Import
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste">Magic Paste</TabsTrigger>
            <TabsTrigger value="ocr">PDF / Image OCR</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4 space-y-2">
            <Label htmlFor="magicPaste">Paste text</Label>
            <Textarea
              id="magicPaste"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste ingredients + instructions (or any raw recipe text)."
              className="min-h-[220px] text-base leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Tip: include “Ingredients” and “Directions” headers if you have them.
            </p>
          </TabsContent>

          <TabsContent value="ocr" className="mt-4 space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="ocrFile">Choose a file</Label>
              <Input
                id="ocrFile"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setOcrAsset(null);
                    return;
                  }
                  if (f.type === "application/pdf") setOcrAsset({ kind: "pdf", file: f });
                  else if (f.type.startsWith("image/")) setOcrAsset({ kind: "image", file: f });
                  else {
                    setOcrAsset(null);
                    toast.error("Choose an image or a PDF.");
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                PDF OCR currently uses page 1 (fast). If you need multi-page OCR, paste the text or upload page images.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-2">
            <Label htmlFor="urlInput">Recipe URL</Label>
            <Input
              id="urlInput"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground">
              We only ingest the page’s JSON recipe data (JSON-LD). If the site blocks browser fetch (CORS), use Magic
              Paste.
            </p>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border bg-background/50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{preview?.name || "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{preview?.description || "—"}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Prep</p>
              <p className="mt-1 font-medium">{preview?.prepTime ? formatQuantity(preview.prepTime) : "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Cook</p>
              <p className="mt-1 font-medium">{preview?.cookTime ? formatQuantity(preview.cookTime) : "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Servings</p>
              <p className="mt-1 font-medium">{preview?.servings ? formatQuantity(preview.servings) : "—"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

