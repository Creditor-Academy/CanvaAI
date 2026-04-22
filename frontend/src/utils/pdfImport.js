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
    'https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
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
    const items = textContent.items;
    if (items.length === 0) continue;

    // Detect average height to find headings
    const heights = items.map(it => it.height || (it.transform ? Math.abs(it.transform[0]) : 0)).filter(h => h > 0);
    const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : 10;
    
    // Sort by y descending, then x ascending
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) < 5) return a.transform[4] - b.transform[4];
      return yDiff;
    });

    let currentY = items[0].transform[5];
    let currentLineItems = [];
    const pageHtmlSegments = [];

    const processLine = (lineItems) => {
      if (lineItems.length === 0) return;
      const text = lineItems.map(it => it.str).join(' ').trim();
      if (!text) return;

      const maxH = Math.max(...lineItems.map(it => it.height || (it.transform ? Math.abs(it.transform[0]) : 0)));
      
      // Heuristic for headings based on height
      if (maxH > avgHeight * 1.5) {
        pageHtmlSegments.push(`<h1 style="margin-top: 20px;">${escapeHtml(text)}</h1>`);
      } else if (maxH > avgHeight * 1.25) {
        pageHtmlSegments.push(`<h2 style="margin-top: 16px;">${escapeHtml(text)}</h2>`);
      } else if (maxH > avgHeight * 1.1) {
        pageHtmlSegments.push(`<h3 style="margin-top: 12px;">${escapeHtml(text)}</h3>`);
      } else {
        pageHtmlSegments.push(`<p>${escapeHtml(text)}</p>`);
      }
    };

    for (const item of items) {
      if (Math.abs(item.transform[5] - currentY) > 5) {
        processLine(currentLineItems);
        currentLineItems = [];
        currentY = item.transform[5];
      }
      currentLineItems.push(item);
    }
    processLine(currentLineItems);

    if (pageHtmlSegments.length > 0) {
      html += `<div class="pdf-page-content" style="margin-bottom: 40px; padding: 20px; border-bottom: 1px solid #f1f5f9;">
        ${pageHtmlSegments.join('')}
      </div>`;
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
