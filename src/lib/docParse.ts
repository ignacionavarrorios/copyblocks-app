// docParse.ts — extrae texto plano de documentos subidos (Excel/Word), para usarlos como
// fuente en el chat de configuración de Marca/Persona/Oferta. El PDF ya se resolvía en
// src/lib/pdf.ts — esto suma los dos formatos que faltaban.
// Import dinámico: xlsx/mammoth son libs pesadas que casi nadie usa en cada sesión — cargarlas
// solo cuando alguien sube un .xlsx/.docx evita inflar el bundle principal que baja todo el mundo.
export async function extractXlsxText(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet).trim();
    if (csv) parts.push(`[Hoja: ${sheetName}]\n${csv}`);
  }
  return parts.join("\n\n");
}

export async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return (value || "").trim();
}

export function isSpreadsheet(filename: string): boolean {
  return /\.xlsx?$/i.test(filename);
}
export function isWordDoc(filename: string): boolean {
  return /\.docx$/i.test(filename);
}
