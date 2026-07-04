import fs from 'fs';
import os from 'os';
import path from 'path';

export const DEFAULT_MINERU_MAX_PAGES_PER_FILE = 200;

export function buildPdfPageRanges(totalPages, maxPages = DEFAULT_MINERU_MAX_PAGES_PER_FILE) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error(`Invalid PDF page count: ${totalPages}`);
  }
  if (!Number.isInteger(maxPages) || maxPages < 1) {
    throw new Error(`Invalid PDF split page limit: ${maxPages}`);
  }

  const ranges = [];
  for (let startPage = 1; startPage <= totalPages; startPage += maxPages) {
    const endPage = Math.min(startPage + maxPages - 1, totalPages);
    ranges.push({
      partIndex: ranges.length + 1,
      startPage,
      endPage,
      pageCount: endPage - startPage + 1
    });
  }
  return ranges;
}

export function buildSplitPdfFileName(fileName, range) {
  const extension = path.extname(fileName) || '.pdf';
  const stem = path.basename(fileName, extension);
  const paddedPartIndex = String(range.partIndex).padStart(3, '0');
  return `${stem}.part-${paddedPartIndex}.pages-${range.startPage}-${range.endPage}${extension}`;
}

export function mergeMarkdownParts(markdownParts) {
  return markdownParts
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join('\n\n');
}

export async function createPdfProcessingParts(
  filePath,
  { fileName = path.basename(filePath), totalPages, maxPages = DEFAULT_MINERU_MAX_PAGES_PER_FILE, tempRoot = os.tmpdir() } = {}
) {
  const ranges = buildPdfPageRanges(totalPages, maxPages);
  if (ranges.length === 1) {
    return {
      didSplit: false,
      parts: [
        {
          ...ranges[0],
          fileName,
          filePath,
          isOriginal: true
        }
      ],
      cleanup: async () => {}
    };
  }

  const tempDir = await fs.promises.mkdtemp(path.join(tempRoot, 'easy-dataset-mineru-pdf-'));
  const { PDFDocument } = await import('pdf-lib');
  const sourceBytes = await fs.promises.readFile(filePath);
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const sourcePageCount = sourcePdf.getPageCount();

  if (sourcePageCount !== totalPages) {
    throw new Error(`PDF page count changed while splitting: expected ${totalPages}, got ${sourcePageCount}`);
  }

  const parts = [];
  for (const range of ranges) {
    const targetPdf = await PDFDocument.create();
    const pageIndices = Array.from({ length: range.pageCount }, (_, index) => range.startPage - 1 + index);
    const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach(page => targetPdf.addPage(page));

    const partFileName = buildSplitPdfFileName(fileName, range);
    const partFilePath = path.join(tempDir, partFileName);
    const targetBytes = await targetPdf.save();
    await fs.promises.writeFile(partFilePath, targetBytes);

    parts.push({
      ...range,
      fileName: partFileName,
      filePath: partFilePath,
      isOriginal: false
    });
  }

  return {
    didSplit: true,
    tempDir,
    parts,
    cleanup: async () => {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  };
}
