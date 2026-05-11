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
    
    // Sort by y descending (larger y is higher up in standard PDF coordinates), then x ascending
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) < 5) return a.transform[4] - b.transform[4];
      return yDiff;
    });

    let currentY = items[0].transform[5];
    let currentLineItems = [];
    const lines = [];

    // Group items into lines
    for (const item of items) {
      if (Math.abs(item.transform[5] - currentY) > 5) {
        if (currentLineItems.length > 0) {
          lines.push({ y: currentY, items: currentLineItems });
        }
        currentLineItems = [];
        currentY = item.transform[5];
      }
      currentLineItems.push(item);
    }
    if (currentLineItems.length > 0) {
      lines.push({ y: currentY, items: currentLineItems });
    }

    // Group lines into paragraphs based on vertical spacing
    const paragraphs = [];
    let currentParagraph = [];

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      const prevLine = j > 0 ? lines[j - 1] : null;

      let isNewParagraph = false;
      if (prevLine) {
        const vDist = prevLine.y - line.y;
        // If distance is larger than ~1.5 times the line height, it's a new paragraph
        if (vDist > avgHeight * 1.5) {
          isNewParagraph = true;
        }
      }

      if (isNewParagraph && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = [line];
      } else {
        currentParagraph.push(line);
      }
    }
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    const pageHtmlSegments = [];

    // Process each paragraph
    for (const paraLines of paragraphs) {
      let paraText = '';
      let maxH = 0;

      for (const line of paraLines) {
        let lineText = '';
        for (let k = 0; k < line.items.length; k++) {
          const item = line.items[k];
          lineText += item.str;
          
          const h = item.height || (item.transform ? Math.abs(item.transform[0]) : 0);
          if (h > maxH) maxH = h;

          // Add space if next item is far horizontally
          if (k < line.items.length - 1) {
            const nextItem = line.items[k + 1];
            const itemWidth = item.width || (item.str.length * h * 0.5);
            const space = nextItem.transform[4] - (item.transform[4] + itemWidth);
            if (space > h * 0.2) {
              lineText += ' ';
            }
          }
        }
        paraText += (paraText.length > 0 && !paraText.endsWith(' ') ? ' ' : '') + lineText.trim();
      }

      paraText = paraText.replace(/\s+/g, ' ').trim();
      if (!paraText) continue;

      // Heuristic for headings based on height
      if (maxH > avgHeight * 1.5) {
        pageHtmlSegments.push(`<h1 style="margin-top: 20px;">${escapeHtml(paraText)}</h1>`);
      } else if (maxH > avgHeight * 1.25) {
        pageHtmlSegments.push(`<h2 style="margin-top: 16px;">${escapeHtml(paraText)}</h2>`);
      } else if (maxH > avgHeight * 1.1) {
        pageHtmlSegments.push(`<h3 style="margin-top: 12px;">${escapeHtml(paraText)}</h3>`);
      } else {
        pageHtmlSegments.push(`<p>${escapeHtml(paraText)}</p>`);
      }
    }

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
