import { createWorker } from 'tesseract.js';

// Runs OCR on an image buffer and extracts the RRN using the same
// pattern priority as the mobile on-device OCR (Flutter side):
//   1. "Reference ID 1: <code>" (LDB Bank's secondary/QR reference)
//   2. A bare "FQR..." token
//   3. Plain "Reference ID: <code>"
export async function extractRrnFromImage(buffer: Buffer): Promise<{ text: string; rrn: string | null }> {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    const text = data.text;
    return { text, rrn: extractRrn(text) };
  } finally {
    await worker.terminate();
  }
}

function extractRrn(ocrText: string): string | null {
  const refId1 = /Reference\s*ID\s*1\s*[:.]?\s*([A-Za-z0-9]+)/i.exec(ocrText);
  if (refId1) return refId1[1];

  const fqrToken = /\bFQR[A-Za-z0-9]+\b/.exec(ocrText);
  if (fqrToken) return fqrToken[0];

  const refId = /Reference\s*ID\s*[:.]?\s*([A-Za-z0-9]+)/i.exec(ocrText);
  if (refId) return refId[1];

  return null;
}
