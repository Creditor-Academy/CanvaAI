import * as pdfjsLib from 'pdfjs-dist';

// In Vite, import worker as URL and assign
// Fallback to CDN if bundler cannot resolve the worker URL
let workerAssigned = false;
try {
  import('pdfjs-dist/build/pdf.worker.min.mjs?url').then((mod) => {
    if (mod && mod.default && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = mod.default;
      workerAssigned = true;
    }
  }).catch(() => {});
} catch (_) { void 0 }

if (!workerAssigned && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js';
}

const escapeHtml = (unsafe) =>
  String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export async function extractPdfTextToHtml(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let html = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((it) => it.str).filter(Boolean);
    const text = strings.join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      html += `<p>${escapeHtml(text)}</p>`;
    }
    if (i < pdf.numPages) {
      html += '<div data-type="page-break"></div>';
    }
  }
  if (!html) {
    html = '<p>(No extractable text found in PDF)</p>';
  }
  return html;
}

export async function rasterizePdfPagesToImages(file, scale = 1.5) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');
    images.push(dataUrl);
  }
  return images;
}
