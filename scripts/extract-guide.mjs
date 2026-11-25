import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const directory = join(tmpdir(), "wj-guide-extraction");
mkdirSync(directory, { recursive: true });
const pdf = await getDocument({
  data: new Uint8Array(
    readFileSync(new URL("../docs/WJ-Student-Guide.pdf", import.meta.url)),
  ),
}).promise;
const pages = [];
async function extractPage(pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.5 });
  const target = pdf.canvasFactory.create(viewport.width, viewport.height);
  await page.render({ canvasContext: target.context, viewport }).promise;
  const image = join(directory, `page-${pageNumber}.png`);
  writeFileSync(image, target.canvas.toBuffer("image/png"));
  const result = spawnSync(
    process.env.TESSERACT_PATH || "tesseract",
    [image, "stdout", "--psm", "3"],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || "Tesseract OCR failed");
  pages.push({ page: pageNumber, text: result.stdout.trim() });
  pdf.canvasFactory.destroy(target);
  console.log(`Extracted page ${pageNumber}/${pdf.numPages}`);
  if (pageNumber < pdf.numPages) await extractPage(pageNumber + 1);
}
await extractPage(1);
const output = join(directory, "guide-ocr.json");
writeFileSync(output, JSON.stringify(pages, null, 2));
console.log(`OCR output: ${output}`);
