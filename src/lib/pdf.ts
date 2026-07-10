// pdf.ts — extrae texto plano de un PDF en el navegador (sin backend, sin instalar nada extra).
// pdfjs (~1MB) se carga con import() dinámico, solo cuando el usuario realmente sube un PDF.
export async function extractPdfText(file: File): Promise<string> {
  const [pdfjsLib, { default: pdfjsWorker }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;
  const buf = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 40); // límite razonable para no mandar libros enteros al prompt
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: any) => it.str).join(" "));
  }
  return parts.join("\n\n").replace(/\s+\n/g, "\n").trim();
}
