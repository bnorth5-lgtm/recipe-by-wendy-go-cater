import * as pdfjsLib from "pdfjs-dist";

// pdfjs worker: Vite will bundle this as an asset URL.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function renderPdfPageToBlob(input: File, pageNumber = 1): Promise<Blob> {
  const bytes = await input.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await doc.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2 }); // crisp OCR
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render PDF to image."))), "image/png");
  });
}

