import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  AlignmentType, ImageRun, BorderStyle, WidthType, PageBreak, ShadingType,
  LevelFormat, ExternalHyperlink, Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, UnderlineType,
} from 'docx';
import { toast } from 'sonner';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';

// ─── Unit constants ────────────────────────────────────────────────────────────
const PT_TO_MM   = 0.352778;   // 1 pt  → mm
const PX_TO_MM   = 0.264583;   // 1 px  → mm (96 dpi)
const PX_TO_EMU  = 9144;       // 1 px  → EMU (914400 EMU per inch, 96 dpi)
const DXA_PER_IN = 1440;       // DXA units per inch
const A4_W_MM    = 210;
const A4_H_MM    = 297;
const MARGIN_MM  = 25.4;       // 1 inch

export class DocumentExporter {

  // ============================================================
  // GOOGLE DOCS PAGINATION (v4.0)
  // ============================================================

  /**
   * Calculate pagination using Google Docs exact algorithm (DOM-based measurement).
   * This uses the new PaginationEngine v4.0 with preferred usable height of ~810px (48 lines).
   *
   * @param {object} editor - TipTap editor instance
   * @param {object} options - Pagination options
   * @param {object} options.margins - Custom margins { top, right, bottom, left } in px
   * @param {boolean} options.debugMode - Enable debug logging
   * @returns {{ totalPages: number, pages: Array<{ index: number, blocks: number }> }}
   */
  static calculatePagination(editor, options = {}) {
    if (!editor || !editor.state?.doc) {
      return { totalPages: 1, pages: [] };
    }

    try {
      const { margins = {}, debugMode = false } = options;
      
      // Flatten document into block nodes
      const blocks = flattenDocument(editor.state.doc);
      
      if (blocks.length === 0) {
        return { totalPages: 1, pages: [{ index: 0, blocks: 0 }] };
      }

      // Create pagination engine with Google Docs config (uses ~810px preferred height)
      const engine = new PaginationEngine({
        useGoogleDocsConfig: true, // Enable Google Docs mode (~810px)
        debugMode,
        perfLogEnabled: debugMode,
      });

      // Paginate blocks into pages
      const pages = engine.paginate(blocks);

      if (debugMode) {
        console.log('[DocumentExporter] Pagination complete:', {
          totalBlocks: blocks.length,
          totalPages: pages.length,
          googleDocsMode: engine.useGoogleDocsConfig,
          usableHeight: engine.usableHeight,
        });
      }

      // Convert to format expected by PageContainer
      const formattedPages = pages.map((page, index) => ({
        index,
        blocks: page.blocks.length,
        height: page.height,
        startIndex: page.startIndex,
        endIndex: page.endIndex,
      }));

      return {
        totalPages: pages.length,
        pages: formattedPages,
      };
    } catch (error) {
      console.error('[DocumentExporter] Pagination error:', error);
      // Fallback: single page
      return { totalPages: 1, pages: [{ index: 0, blocks: 1 }] };
    }
  }

  // ============================================================
  // PDF EXPORT
  // ============================================================

  static async exportToPDF(editor, options = {}) {
    const {
      filename           = 'document.pdf',
      title              = 'Document',
      author             = 'Athena Editor',
      includePageNumbers = false,   // off by default — no page stamps on clean export
      includeHeader      = false,   // off by default — no title/date line at top
      includeFooter      = false,   // off by default — no branding line at bottom
      includeDocTitle    = false,   // off by default — don't re-print doc title in body
      margin             = { top: MARGIN_MM, right: MARGIN_MM, bottom: MARGIN_MM, left: MARGIN_MM },
      theme              = 'light',
      compress           = true,
      // Optional custom font embedding. Each entry: { name, style, url }
      // style: 'normal' | 'bold' | 'italic' | 'bolditalic'
      // url: absolute URL or relative path to a .ttf / .otf file
      // Example: fonts: [
      //   { name: 'Inter', style: 'normal',     url: '/fonts/Inter-Regular.ttf'    },
      //   { name: 'Inter', style: 'bold',        url: '/fonts/Inter-Bold.ttf'       },
      //   { name: 'Inter', style: 'italic',      url: '/fonts/Inter-Italic.ttf'     },
      //   { name: 'Inter', style: 'bolditalic',  url: '/fonts/Inter-BoldItalic.ttf' },
      // ]
      fonts = [],
    } = options;

    const toastId = toast.loading('Preparing PDF…');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit:        'mm',
        format:      [A4_W_MM, A4_H_MM],
        compress,
        putOnlyUsedFonts: true,
      });

      pdf.setProperties({
        title,
        author,
        creator:      'Athena Editor',
        producer:     'Athena AI',
        creationDate: new Date(),
      });

      // ── Embed custom fonts ─────────────────────────────────────────────────
      // Each registered font becomes the body/heading font instead of Helvetica.
      // Falls back silently to Helvetica if no fonts are provided or any fail.
      const embeddedFontName = await DocumentExporter._embedFonts(pdf, fonts);

      const content = this.extractStructuredContent(editor);

      // Resolve the exact font name jsPDF recognises for the built-in font.
      // jsPDF registers Helvetica as 'helvetica' (lowercase) but some builds
      // use 'Helvetica'. Test which name works to prevent the double-glyph bug
      // that occurs when an unrecognised font name is passed to setFont().
      let resolvedFont = embeddedFontName;
      if (resolvedFont === 'helvetica') {
        try {
          pdf.setFont('helvetica', 'normal');
          resolvedFont = 'helvetica';
        } catch (_) {
          try {
            pdf.setFont('Helvetica', 'normal');
            resolvedFont = 'Helvetica';
          } catch (_2) {
            resolvedFont = 'helvetica'; // last resort — let jsPDF handle it
          }
        }
      }

      await this._generatePDFPages(pdf, content, {
        title, author, includePageNumbers, includeHeader, includeFooter,
        includeDocTitle, margin, theme, fontName: resolvedFont,
      });

      pdf.save(filename);
      toast.success(`PDF exported — ${pdf.getNumberOfPages()} page${pdf.getNumberOfPages() > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('[PDF export]', err);
      toast.error('PDF export failed: ' + err.message);
    } finally {
      toast.dismiss(toastId);
    }
  }

  static async _generatePDFPages(pdf, content, options) {
    const {
      title, includePageNumbers, includeHeader, includeFooter,
      includeDocTitle = false,
      margin, theme,
      fontName = 'helvetica',   // embedded custom font name, or 'helvetica' fallback
    } = options;

    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const textW  = pageW - margin.left - margin.right;

    // Reserve space for header/footer bands.
    // Header: 12 mm total (text at margin.top+5, rule at margin.top+9, content starts at margin.top+12)
    // Footer: 12 mm total (rule at pageH-margin.bottom-12, text at pageH-margin.bottom-7)
    const headerH  = includeHeader  ? 12 : 0;
    const footerH  = (includeFooter || includePageNumbers) ? 12 : 0;
    const contentTop    = margin.top + headerH;
    const contentBottom = pageH - margin.bottom - footerH;

    // Colour themes
    const THEMES = {
      light: {
        bg:      [255, 255, 255],
        text:    [17,  24,  39 ],
        heading: [17,  24,  39 ],
        muted:   [107, 114, 128],
        quote:   [100, 116, 139],
        codeBg:  [248, 250, 252],
        border:  [226, 232, 240],
        link:    [37,  99,  235],
        accent:  [79,  70,  229],
      },
      dark: {
        bg:      [17,  24,  39 ],
        text:    [243, 244, 246],
        heading: [249, 250, 251],
        muted:   [156, 163, 175],
        quote:   [156, 163, 175],
        codeBg:  [31,  41,  55 ],
        border:  [55,  65,  81 ],
        link:    [96,  165, 250],
        accent:  [129, 140, 248],
      },
    };
    const C = THEMES[theme] || THEMES.light;

    // ── Helpers ──────────────────────────────────────────────────────────────
    let currentY = contentTop;

    const lh = (ptSize, factor = 1.4) => ptSize * PT_TO_MM * factor;

    const newPage = () => {
      pdf.addPage();
      currentY = contentTop;
      if (includeHeader) _drawHeader(pdf.getNumberOfPages());
    };

    const fits = (h) => currentY + h <= contentBottom;

    const ensureFits = (h) => {
      if (!fits(h)) newPage();
    };

    // Multi-line text renderer that handles page breaks mid-block
    const writeLines = (lines, x, fontSize, fontStyle, colour, lineSpacing, align = 'left') => {
      pdf.setFont(fontName, fontStyle);
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...colour);
      const lineH = lh(fontSize, lineSpacing);
      for (const line of lines) {
        if (!fits(lineH)) newPage();
        pdf.text(line, x, currentY, { align, maxWidth: textW });
        currentY += lineH;
      }
    };

    const _drawHeader = (pageNum) => {
      if (!includeHeader) return;
      // Header band: text at margin.top+5, separator rule at margin.top+9
      // contentTop is margin.top+12, so content always starts BELOW the rule
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.muted);
      pdf.text(title, margin.left, margin.top + 5);
      pdf.text(new Date().toLocaleDateString(), pageW - margin.right, margin.top + 5, { align: 'right' });
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.2);
      pdf.line(margin.left, margin.top + 9, pageW - margin.right, margin.top + 9);
    };

    // ── First page header ────────────────────────────────────────────────────
    _drawHeader(1);

    // ── Document title (only when explicitly requested) ─────────────────────
    if (includeDocTitle && title && title !== 'Untitled Document') {
      const sz = 20;
      pdf.setFont(fontName, 'bold');
      pdf.setFontSize(sz);
      pdf.setTextColor(...C.accent);
      const titleLines = pdf.splitTextToSize(title, textW);
      for (const line of titleLines) {
        if (!fits(lh(sz, 1.3))) newPage();
        pdf.text(line, margin.left, currentY);
        currentY += lh(sz, 1.3);
      }
      // Accent underline
      pdf.setDrawColor(...C.accent);
      pdf.setLineWidth(0.5);
      pdf.line(margin.left, currentY, margin.left + 40, currentY);
      currentY += 4;
    }

    // ── Pre-fetch all images concurrently (avoids sequential blocking) ────────
    // Resolves all image data URLs in parallel before the render pass, so the
    // main thread doesn't stall waiting for each image one-by-one.
    const imageSections = content.filter(s => s.type === 'image' && s.src);
    const svgSections   = content.filter(s => s.type === 'svgBlock' && s.svg);
    const imageCache    = new Map();

    await Promise.all([
      ...imageSections.map(async (s) => {
        if (!imageCache.has(s.src)) {
          imageCache.set(s.src, await DocumentExporter._loadImageAsDataUrl(s.src));
        }
      }),
      ...svgSections.map(async (s) => {
        const key   = 'svg:' + s.svg.slice(0, 40);
        const avW   = Math.min(textW, (s.width  || 400) * PX_TO_MM);
        const avH   = s.height ? s.height * PX_TO_MM : avW * 0.6;
        const png   = await DocumentExporter._svgToPng(s.svg, avW, avH).catch(() => null);
        if (png) imageCache.set(key, png);
      }),
    ]);

    // ── Yield to browser between heavy sections ───────────────────────────────
    // Calls scheduler.yield() (Chrome 115+) or falls back to a 0ms setTimeout
    // so the browser can repaint and stay responsive during long exports.
    const yieldToBrowser = () => {
      if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function') {
        return scheduler.yield();
      }
      return new Promise(r => setTimeout(r, 0));
    };
    let sectionCount = 0;

    // ── Process sections ─────────────────────────────────────────────────────
    for (let secIdx = 0; secIdx < content.length; secIdx++) {
      const sec = content[secIdx];
      // Yield every 20 sections to keep the UI responsive
      if (++sectionCount % 20 === 0) await yieldToBrowser();
      try {
        switch (sec.type) {

          // ── Heading — widow/orphan aware ─────────────────────────────────
          case 'heading': {
            const sizes  = [18, 15, 13, 12, 11, 11];
            const sz     = sizes[Math.min(sec.level - 1, 5)];
            const spacer = lh(sz, 0.6);
            const lines  = pdf.splitTextToSize(sec.text || '', textW);
            const hHead  = lines.length * lh(sz, 1.35) + spacer + 3;

            // Widow/orphan: if the very next block is a paragraph, reserve space
            // for at least 2 lines of it too — never leave a heading stranded
            // alone at the bottom of a page.
            const nextSec = content[secIdx + 1];
            const orphanGuardH = (() => {
              if (nextSec?.type === 'paragraph' && (nextSec.text || nextSec.runs?.length)) {
                const bodyLH = lh(10.5, nextSec.style?.lineHeight || 1.5);
                return bodyLH * 2; // reserve 2 body lines
              }
              return 0;
            })();
            if (!fits(hHead + orphanGuardH)) newPage();

            currentY += spacer * 0.5;
            pdf.setFont(fontName, 'bold');
            pdf.setFontSize(sz);
            pdf.setTextColor(...C.heading);
            pdf.text(lines, margin.left, currentY, { maxWidth: textW });
            currentY += lines.length * lh(sz, 1.35);
            // Subtle bottom border for h1 / h2
            if (sec.level <= 2) {
              pdf.setDrawColor(...C.border);
              pdf.setLineWidth(0.2);
              pdf.line(margin.left, currentY + 1, pageW - margin.right, currentY + 1);
              currentY += 2;
            }
            currentY += spacer * 0.3;
            break;
          }

          // ── Paragraph — true per-run styled fragments ────────────────────────
          case 'paragraph': {
            const sz    = 10.5;
            const lineH = lh(sz, sec.style?.lineHeight || 1.5);
            const align = sec.style?.align || 'left';

            // Helper: measure a single word in a given font style
            const measureRun = (text, style) => {
              pdf.setFont(fontName, style);
              pdf.setFontSize(sz);
              return pdf.getTextWidth(text);
            };

            if (sec.runs && sec.runs.length > 0) {
              // ── Styled-fragment line layout ─────────────────────────────
              // Build a word-wrapped sequence of "positioned spans" so each
              // word keeps its own bold/italic/colour/underline/link style.
              const words = []; // { text, bold, italic, link, colour, w }
              for (const run of sec.runs) {
                if (run.hardBreak) { words.push({ hardBreak: true }); continue; }
                const style  = (run.bold && run.italic) ? 'bolditalic'
                             : run.bold   ? 'bold'
                             : run.italic ? 'italic'
                             : 'normal';
                const colour = run.link      ? C.link
                             : C.text;
                // Split run text into word tokens, preserving trailing spaces
                const tokens = run.text.match(/\S+|\s+/g) || []; // Safari-safe (no lookbehind)
                for (const tok of tokens) {
                  if (!tok) continue;
                  words.push({ text: tok, style, colour, link: run.link || null,
                                underline: run.underline || false,
                                w: measureRun(tok, style) });
                }
              }

              // Word-wrap words into lines
              const spaceW = measureRun(' ', 'normal');
              const lines  = []; // each line = array of word objects
              let   line   = [];
              let   lineW  = 0;

              const pushLine = () => { if (line.length) lines.push(line); line = []; lineW = 0; };

              for (const word of words) {
                if (word.hardBreak) { pushLine(); continue; }
                const needed = lineW === 0 ? word.w : lineW + word.w;
                if (needed > textW && line.length > 0) {
                  pushLine();
                }
                line.push(word);
                lineW += word.w;
              }
              pushLine();

              // Render lines
              for (const wLine of lines) {
                if (!fits(lineH)) newPage();
                let xCursor = align === 'right'  ? pageW - margin.right - wLine.reduce((a, w) => a + w.w, 0)
                            : align === 'center' ? margin.left + (textW - wLine.reduce((a, w) => a + w.w, 0)) / 2
                            : margin.left;

                for (const word of wLine) {
                  pdf.setFont(fontName, word.style);
                  pdf.setFontSize(sz);
                  pdf.setTextColor(...word.colour);
                  pdf.text(word.text, xCursor, currentY);

                  // Underline rendering
                  if (word.underline || word.link) {
                    const uy = currentY + 0.5;
                    pdf.setDrawColor(...word.colour);
                    pdf.setLineWidth(0.2);
                    pdf.line(xCursor, uy, xCursor + word.w, uy);
                  }

                  // Clickable link annotation
                  if (word.link) {
                    const lineHeightPt = sz * PT_TO_MM;
                    pdf.link(xCursor, currentY - lineHeightPt, word.w, lineHeightPt * 1.2,
                             { url: word.link });
                  }
                  xCursor += word.w;
                }
                currentY += lineH;
              }
            } else if (sec.text?.trim()) {
              const lines = pdf.splitTextToSize(sec.text, textW);
              const fontStyle = sec.style?.bold && sec.style?.italic ? 'bolditalic'
                              : sec.style?.bold   ? 'bold'
                              : sec.style?.italic ? 'italic'
                              : 'normal';
              const xBase = align === 'center' ? pageW / 2
                          : align === 'right'  ? pageW - margin.right
                          : margin.left;
              pdf.setFont(fontName, fontStyle);
              pdf.setFontSize(sz);
              pdf.setTextColor(...C.text);
              for (const line of lines) {
                if (!fits(lineH)) newPage();
                pdf.text(line, xBase, currentY, { align, maxWidth: textW });
                currentY += lineH;
              }
            } else {
              currentY += lineH * 0.5; // empty paragraph spacing
            }
            currentY += lh(sz, 0.3);
            break;
          }

          // ── Blockquote ──────────────────────────────────────────────────────
          case 'blockquote': {
            const sz     = 10.5;
            const indent = 7;
            const textX  = margin.left + indent + 3;
            const maxW   = textW - indent - 3;
            const lineH  = lh(sz, 1.5);
            const lines  = pdf.splitTextToSize(sec.text || '', maxW);
            const total  = lines.length * lineH + 4;
            ensureFits(total);
            // Left coloured bar
            pdf.setFillColor(...C.accent);
            pdf.rect(margin.left + indent, currentY - 1, 1.2, total, 'F');
            // Light background
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin.left + indent + 1.5, currentY - 1, maxW + 2, total, 'F');
            pdf.setFont(fontName, 'italic');
            pdf.setFontSize(sz);
            pdf.setTextColor(...C.quote);
            pdf.text(lines, textX, currentY + 1, { maxWidth: maxW, lineHeightFactor: 1.5 });
            currentY += total + 2;
            break;
          }

          // ── Code block ─────────────────────────────────────────────────────
          case 'code': {
            const sz    = 9;
            const lineH = lh(sz, 1.4);
            const lines = (sec.text || '').split('\n');
            const total = lines.length * lineH + 6;
            ensureFits(Math.min(total, contentBottom - contentTop - 10));
            // Background
            pdf.setFillColor(...C.codeBg);
            pdf.setDrawColor(...C.border);
            pdf.setLineWidth(0.2);
            const boxH = Math.min(total, contentBottom - currentY - 2);
            pdf.roundedRect(margin.left, currentY - 1.5, textW, boxH + 2, 1, 1, 'FD');
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(sz);
            pdf.setTextColor(...C.text);
            currentY += 3;
            for (const line of lines) {
              if (!fits(lineH)) newPage();
              pdf.text(line, margin.left + 3, currentY, { maxWidth: textW - 6 });
              currentY += lineH;
            }
            currentY += 4;
            break;
          }

          // ── Horizontal rule ────────────────────────────────────────────────
          case 'horizontalRule': {
            ensureFits(6);
            currentY += 2;
            pdf.setDrawColor(...C.border);
            pdf.setLineWidth(0.4);
            pdf.line(margin.left, currentY, pageW - margin.right, currentY);
            currentY += 4;
            break;
          }

          // ── Image ──────────────────────────────────────────────────────────
          case 'image': {
            const availW = textW;
            let   imgW   = Math.min(availW, (sec.width  || 400) * PX_TO_MM);
            let   imgH   = sec.height ? sec.height * PX_TO_MM : imgW * 0.6;
            // Maintain aspect ratio if scaled
            if (imgW > availW) {
              imgH = imgH * (availW / imgW);
              imgW = availW;
            }
            // Scale down if doesn't fit on a fresh page
            const maxImgH = contentBottom - contentTop - 4;
            if (imgH > maxImgH) {
              imgW = imgW * (maxImgH / imgH);
              imgH = maxImgH;
            }
            if (!fits(imgH + 4)) newPage();
            const x = sec.align === 'center' ? margin.left + (availW - imgW) / 2
                    : sec.align === 'right'  ? pageW - margin.right - imgW
                    : margin.left;
            try {
              // Use pre-fetched cache — avoids re-fetching on every render pass
              const dataUrl  = imageCache.get(sec.src)
                             ?? await DocumentExporter._loadImageAsDataUrl(sec.src);
              const isBroken = !dataUrl || dataUrl === DocumentExporter._brokenImageDataUrl();

              if (isBroken) {
                // Render a grey placeholder box with "Image unavailable" text
                pdf.setFillColor(240, 240, 240);
                pdf.setDrawColor(...C.border);
                pdf.setLineWidth(0.3);
                pdf.rect(x, currentY, imgW, Math.min(imgH, 30), 'FD');
                pdf.setFont(fontName, 'italic');
                pdf.setFontSize(8);
                pdf.setTextColor(...C.muted);
                pdf.text('⚠ Image unavailable', x + imgW / 2, currentY + Math.min(imgH, 30) / 2, { align: 'center' });
                currentY += Math.min(imgH, 30) + 2;
              } else {
                const fmt = dataUrl.includes('image/png')  ? 'PNG'
                          : dataUrl.includes('image/webp') ? 'WEBP'
                          : 'JPEG';
                pdf.addImage(dataUrl, fmt, x, currentY, imgW, imgH, undefined, 'FAST');
                currentY += imgH + 2;
              }
              // Caption / alt text (shown even for broken images if alt text exists)
              if (sec.alt && sec.alt !== 'AI Generated Image') {
                if (!fits(4)) newPage();
                pdf.setFont(fontName, 'italic');
                pdf.setFontSize(8);
                pdf.setTextColor(...C.muted);
                pdf.text(sec.alt, pageW / 2, currentY + 1, { align: 'center' });
                currentY += 4;
              }
            } catch (imgErr) {
              console.warn('[PDF image render error]', sec.src, imgErr);
              // Silently skip truly unrenderable images
            }
            currentY += 2;
            break;
          }

          // ── Table ──────────────────────────────────────────────────────────
          case 'table': {
            const rows    = sec.rows || [];
            if (!rows.length) break;
            const cols    = Math.max(...rows.map(r => r.length));
            const colW    = textW / cols;
            const sz      = 9.5;
            const cellPad = 2;
            const lineH   = lh(sz, 1.35);

            pdf.setFont(fontName, 'normal');
            pdf.setFontSize(sz);

            for (let r = 0; r < rows.length; r++) {
              const cells    = rows[r];
              const isHeader = r === 0;
              const cellData = cells.map((text, ci) => ({
                text,
                lines: pdf.splitTextToSize(String(text || ''), colW - cellPad * 2),
              }));
              const maxLines = Math.max(...cellData.map(cd => cd.lines.length), 1);
              const rowH     = maxLines * lineH + cellPad * 2;

              if (!fits(rowH)) newPage();

              let cx = margin.left;
              for (let c = 0; c < cols; c++) {
                const cd = cellData[c] || { lines: [''] };
                // Cell background
                if (isHeader) {
                  pdf.setFillColor(241, 245, 249);
                  pdf.rect(cx, currentY, colW, rowH, 'F');
                }
                // Cell border
                pdf.setDrawColor(...C.border);
                pdf.setLineWidth(0.2);
                pdf.rect(cx, currentY, colW, rowH, 'S');
                // Text
                pdf.setFont(fontName, isHeader ? 'bold' : 'normal');
                pdf.setFontSize(sz);
                pdf.setTextColor(...C.text);
                const ty = currentY + cellPad + lineH * 0.8;
                for (let li = 0; li < cd.lines.length; li++) {
                  pdf.text(cd.lines[li], cx + cellPad, ty + li * lineH, {
                    maxWidth: colW - cellPad * 2,
                  });
                }
                cx += colW;
              }
              currentY += rowH;
            }
            currentY += 4;
            break;
          }

          // ── Ordered / Bullet list ──────────────────────────────────────────
          case 'list': {
            const sz    = 10.5;
            const lineH = lh(sz, 1.45);
            pdf.setFont(fontName, 'normal');
            pdf.setFontSize(sz);
            pdf.setTextColor(...C.text);

            for (const item of sec.items) {
              const indentPx  = margin.left + item.level * 6;
              const bulletX   = indentPx;
              const textX2    = indentPx + 5;
              const maxW2     = pageW - margin.right - textX2;
              const bullet    = sec.ordered ? `${item.index}.` : '•';
              const lines     = pdf.splitTextToSize(item.text || '', maxW2);
              const itemH     = lines.length * lineH;

              if (!fits(itemH)) newPage();

              // Bullet / number
              pdf.setFont(fontName, sec.ordered ? 'normal' : 'bold');
              pdf.text(bullet, bulletX, currentY);
              // Item text
              pdf.setFont(fontName, 'normal');
              for (let li = 0; li < lines.length; li++) {
                pdf.text(lines[li], textX2, currentY + li * lineH, { maxWidth: maxW2 });
              }
              currentY += itemH + lineH * 0.1;
            }
            currentY += lh(sz, 0.3);
            break;
          }

          // ── SVG / vector graphic ─────────────────────────────────────────
          // Rasterises inline SVG or <img src="*.svg"> at 2× resolution so
          // it lands crisp and pixel-perfect inside the PDF.
          case 'svgBlock': {
            const svgSource = sec.svg || '';  // raw SVG markup or data-URI
            const availW    = textW;
            let   imgW      = Math.min(availW, (sec.width  || 400) * PX_TO_MM);
            let   imgH      = sec.height ? sec.height * PX_TO_MM : imgW * 0.6;
            const maxImgH   = contentBottom - contentTop - 4;
            if (imgH > maxImgH) { imgW *= maxImgH / imgH; imgH = maxImgH; }
            if (!fits(imgH + 4)) newPage();

            const xPos = sec.align === 'center' ? margin.left + (availW - imgW) / 2
                       : sec.align === 'right'  ? pageW - margin.right - imgW
                       : margin.left;
            try {
              const svgCacheKey = 'svg:' + svgSource.slice(0, 40);
              const pngDataUrl  = imageCache.get(svgCacheKey)
                                ?? await DocumentExporter._svgToPng(svgSource, imgW, imgH);
              if (pngDataUrl) {
                pdf.addImage(pngDataUrl, 'PNG', xPos, currentY, imgW, imgH, undefined, 'FAST');
                currentY += imgH + 2;
              }
            } catch (svgErr) {
              console.warn('[PDF SVG render error]', svgErr);
              // Fallback: grey placeholder
              pdf.setFillColor(240, 240, 240);
              pdf.setDrawColor(...C.border);
              pdf.rect(xPos, currentY, imgW, Math.min(imgH, 20), 'FD');
              pdf.setFont(fontName, 'italic');
              pdf.setFontSize(8);
              pdf.setTextColor(...C.muted);
              pdf.text('⚠ SVG unavailable', xPos + imgW / 2, currentY + 6, { align: 'center' });
              currentY += Math.min(imgH, 20) + 2;
            }
            currentY += 2;
            break;
          }

          // ── Page break ────────────────────────────────────────────────────
          case 'pageBreak': {
            newPage();
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.warn('[PDF section error]', sec.type, err);
      }
    }

    // ── Add header / footer / page numbers to ALL pages ──────────────────────
    const total = pdf.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      pdf.setPage(p);

      if (includeHeader) {
        _drawHeader(p);
      }

      if (includeFooter || includePageNumbers) {
        // Footer band: rule at pageH-margin.bottom-12, text at pageH-margin.bottom-7
        // contentBottom is pageH-margin.bottom-12, so content always ends ABOVE the rule
        const ruleY = pageH - margin.bottom - 12;
        const textY = pageH - margin.bottom - 7;
        pdf.setDrawColor(...C.border);
        pdf.setLineWidth(0.2);
        pdf.line(margin.left, ruleY, pageW - margin.right, ruleY);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...C.muted);
        if (includeFooter) {
          pdf.text('Generated by Athena Editor', margin.left, textY);
        }
        if (includePageNumbers) {
          pdf.text(`${p} / ${total}`, pageW - margin.right, textY, { align: 'right' });
        }
      }
    }
  }

  // ============================================================
  // DOCX EXPORT
  // ============================================================

  static async exportToDOCX(editor, options = {}) {
    const {
      filename = 'document.docx',
      title    = 'Document',
      author   = 'Athena Editor',
      subject  = '',
      keywords = '',
    } = options;

    const toastId = toast.loading('Preparing DOCX…');

    try {
      const content = this.extractStructuredContent(editor);

      // A4 margins in DXA (1440 DXA = 1 inch)
      const marginDXA = Math.round(DXA_PER_IN * 1); // 1 inch

      const doc = new Document({
        creator:     author,
        title,
        subject,
        keywords,
        description: 'Created with Athena Editor',

        // ── Document-wide styles ───────────────────────────────────────────
        styles: {
          default: {
            document: {
              run:       { font: 'Calibri', size: 22 },           // 11pt
              paragraph: { spacing: { line: 276, lineRule: 'auto' } }, // 1.15 line height
            },
          },
          paragraphStyles: [
            {
              id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run:       { size: 36, bold: true, font: 'Calibri', color: '1E3A5F' },
              paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
            },
            {
              id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run:       { size: 28, bold: true, font: 'Calibri', color: '2E4F7A' },
              paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 },
            },
            {
              id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run:       { size: 24, bold: true, font: 'Calibri', color: '1A5276' },
              paragraph: { spacing: { before: 240, after: 80  }, outlineLevel: 2 },
            },
            {
              id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run:       { size: 22, bold: true, italic: true, font: 'Calibri', color: '1A5276' },
              paragraph: { spacing: { before: 200, after: 60  }, outlineLevel: 3 },
            },
            {
              id: 'BlockQuote', name: 'Block Quote', basedOn: 'Normal', next: 'Normal',
              run:       { size: 22, italic: true, color: '64748B', font: 'Calibri' },
              paragraph: {
                spacing:      { before: 100, after: 100, line: 300 },
                indent:       { left: 720 },
                border:       { left: { style: BorderStyle.THICK, size: 8, color: '6366F1', space: 6 } },
              },
            },
          ],
        },

        // ── Bullet / numbered list numbering ──────────────────────────────
        numbering: {
          config: [
            {
              reference: 'athena-bullets',
              levels: [
                { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 720,  hanging: 360 } } } },
                { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
                { level: 2, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
              ],
            },
            {
              reference: 'athena-numbers',
              levels: [
                { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 720,  hanging: 360 } } } },
                { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
                { level: 2, format: LevelFormat.LOWER_ROMAN, text: '%3.', alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
              ],
            },
          ],
        },

        sections: [{
          properties: {
            page: {
              size:   { width: 11906, height: 16838 },      // A4 in DXA
              margin: { top: marginDXA, right: marginDXA, bottom: marginDXA, left: marginDXA },
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: title, font: 'Calibri', size: 16, color: '64748B' }),
                  ],
                  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' } },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Generated by Athena Editor  |  ', font: 'Calibri', size: 16, color: '94A3B8' }),
                    new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '64748B' }),
                    new TextRun({ text: ' of ',                   font: 'Calibri', size: 16, color: '64748B' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '64748B' }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' } },
                }),
              ],
            }),
          },
          children: await this._buildDOCXChildren(content, { title }),
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
      toast.success('DOCX exported successfully');
    } catch (err) {
      console.error('[DOCX export]', err);
      toast.error('DOCX export failed: ' + err.message);
    } finally {
      toast.dismiss(toastId);
    }
  }

  static async _buildDOCXChildren(content, options) {
    const { title } = options;
    const children  = [];

    // Table content width: A4 with 1" margins = 11906 - 2880 = 9026 DXA
    const tableW = 9026;

    // ── Title ────────────────────────────────────────────────────────────────
    if (title && title !== 'Untitled Document') {
      children.push(new Paragraph({
        heading:   HeadingLevel.HEADING_1,
        children:  [new TextRun({ text: title, bold: true, font: 'Calibri', size: 48, color: '1E3A5F' })],
        spacing:   { after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '6366F1', space: 2 } },
      }));
    }

    for (const sec of content) {
      switch (sec.type) {

        // ── Heading ──────────────────────────────────────────────────────────
        case 'heading': {
          const level  = Math.min(sec.level || 1, 6);
          const hlMap  = [
            HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6,
          ];
          children.push(new Paragraph({
            heading:  hlMap[level - 1],
            children: this._runsFromSection(sec),
          }));
          break;
        }

        // ── Paragraph ────────────────────────────────────────────────────────
        case 'paragraph': {
          const alignment = this._docxAlign(sec.style?.align);
          const runs      = sec.runs?.length
            ? this._runsFromSection(sec)
            : [new TextRun({ text: sec.text || '', font: 'Calibri', size: 22 })];

          children.push(new Paragraph({
            children:  runs,
            alignment,
            spacing:   { after: 120 },
          }));
          break;
        }

        // ── Blockquote ───────────────────────────────────────────────────────
        case 'blockquote': {
          children.push(new Paragraph({
            style:    'BlockQuote',
            children: [new TextRun({ text: sec.text || '', font: 'Calibri', size: 22 })],
          }));
          break;
        }

        // ── Code block ───────────────────────────────────────────────────────
        case 'code': {
          const codeLines = (sec.text || '').split('\n');
          for (const line of codeLines) {
            children.push(new Paragraph({
              children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: '1E293B' })],
              spacing:  { before: 0, after: 0, line: 240 },
              shading:  { fill: 'F8FAFC', type: ShadingType.CLEAR },
              border: {
                top:    { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left:   { style: BorderStyle.THICK, size: 4, color: '6366F1' },
                right:  { style: BorderStyle.NONE },
              },
              indent: { left: 360 },
            }));
          }
          // Spacer after block
          children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 100 } }));
          break;
        }

        // ── Horizontal rule ──────────────────────────────────────────────────
        case 'horizontalRule': {
          children.push(new Paragraph({
            children: [new TextRun('')],
            border:   { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
            spacing:  { before: 120, after: 120 },
          }));
          break;
        }

        // ── List ─────────────────────────────────────────────────────────────
        case 'list': {
          for (const item of sec.items) {
            const level = Math.min(item.level || 0, 2);
            const ref   = sec.ordered ? 'athena-numbers' : 'athena-bullets';
            children.push(new Paragraph({
              numbering: { reference: ref, level },
              children:  [new TextRun({ text: item.text || '', font: 'Calibri', size: 22 })],
              spacing:   { after: 60 },
            }));
          }
          // Spacer
          children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
          break;
        }

        // ── Table ────────────────────────────────────────────────────────────
        case 'table': {
          const rows = sec.rows || [];
          if (!rows.length) break;
          const cols    = Math.max(...rows.map(r => r.length));
          const colW    = Math.floor(tableW / cols);
          const colWidths = Array(cols).fill(colW);
          const border  = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
          const borders = { top: border, bottom: border, left: border, right: border };

          const tblRows = rows.map((cells, ri) => {
            const isHeader = ri === 0;
            return new TableRow({
              tableHeader: isHeader,
              children: Array.from({ length: cols }, (_, ci) => {
                const text = String(cells[ci] ?? '');
                return new TableCell({
                  borders,
                  width:   { size: colW, type: WidthType.DXA },
                  shading: isHeader
                    ? { fill: 'EFF6FF', type: ShadingType.CLEAR }
                    : { fill: 'FFFFFF', type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({
                    children: [new TextRun({
                      text,
                      bold:  isHeader,
                      font:  'Calibri',
                      size:  20,
                      color: isHeader ? '1E3A5F' : '334155',
                    })],
                  })],
                });
              }),
            });
          });

          children.push(new Table({
            width:        { size: tableW, type: WidthType.DXA },
            columnWidths: colWidths,
            rows:         tblRows,
          }));
          children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }));
          break;
        }

        // ── Image ────────────────────────────────────────────────────────────
        case 'image': {
          try {
            const dataUrl = await DocumentExporter._loadImageAsDataUrl(sec.src);
            if (!dataUrl) break;

            const base64  = dataUrl.split(',')[1];
            const isJpeg  = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg');
            const imgW    = Math.min(sec.width  || 400, 600); // cap at 600px
            const imgH    = sec.height ? Math.round(sec.height * (imgW / (sec.width || imgW))) : Math.round(imgW * 0.6);

            const alignment = sec.align === 'center' ? AlignmentType.CENTER
                            : sec.align === 'right'  ? AlignmentType.RIGHT
                            : AlignmentType.LEFT;

            children.push(new Paragraph({
              alignment,
              spacing: { before: 100, after: 100 },
              children: [new ImageRun({
                data:           Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
                transformation: { width: imgW, height: imgH },
                type:           isJpeg ? 'jpg' : 'png',
              })],
            }));

            // Alt text / caption
            if (sec.alt && sec.alt !== 'AI Generated Image') {
              children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children:  [new TextRun({ text: sec.alt, font: 'Calibri', size: 18, italics: true, color: '64748B' })],
                spacing:   { after: 120 },
              }));
            }
          } catch (_) { /* skip failed images */ }
          break;
        }

        // ── Page break ───────────────────────────────────────────────────────
        case 'pageBreak': {
          children.push(new Paragraph({
            children: [new PageBreak()],
          }));
          break;
        }

        default:
          break;
      }
    }

    return children;
  }

  // ── Run builder for DOCX inline formatting ───────────────────────────────
  static _runsFromSection(sec) {
    if (!sec.runs?.length) {
      return [new TextRun({ text: sec.text || '', font: 'Calibri', size: 22 })];
    }
    return sec.runs.map(r => {
      const runOpts = {
        text:          r.text,
        font:          'Calibri',
        size:          22,
        bold:          r.bold     || false,
        italics:       r.italic   || false,
        underline:     r.underline ? { type: UnderlineType.SINGLE } : undefined,
        strike:        r.strike   || false,
        color:         r.code     ? '1E293B' : undefined,
        shading:       r.code     ? { fill: 'F1F5F9', type: ShadingType.CLEAR } : undefined,
        font:          r.code     ? { name: 'Courier New' } : 'Calibri',
        size:          r.code     ? 20 : 22,
      };
      if (r.link) {
        return new ExternalHyperlink({
          link:     r.link,
          children: [new TextRun({ ...runOpts, style: 'Hyperlink', color: '2563EB' })],
        });
      }
      return new TextRun(runOpts);
    });
  }

  static _docxAlign(align) {
    switch (align) {
      case 'center':  return AlignmentType.CENTER;
      case 'right':   return AlignmentType.RIGHT;
      case 'justify': return AlignmentType.JUSTIFIED;
      default:        return AlignmentType.LEFT;
    }
  }

  // ============================================================
  // HTML EXPORT
  // ============================================================

  static async exportToHTML(editor, options = {}) {
    const {
      filename    = 'document.html',
      title       = 'Document',
      author      = 'Athena Editor',
      includeCSS  = true,
    } = options;

    const html = editor?.getHTML?.() || '';
    const safe = DOMPurify.sanitize(html || '<p></p>');

    const css = includeCSS ? `
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --font-sans: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --font-mono: 'Fira Code', 'Cascadia Code', Consolas, monospace;
      --text:    #111827;
      --muted:   #6B7280;
      --border:  #E5E7EB;
      --bg-code: #F9FAFB;
      --accent:  #4F46E5;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --text:    #F9FAFB;
        --muted:   #9CA3AF;
        --border:  #374151;
        --bg-code: #1F2937;
        --accent:  #818CF8;
        background-color: #111827;
      }
    }
    html { font-size: 16px; }
    body {
      font-family: var(--font-sans);
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem;
      color: var(--text);
      line-height: 1.65;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.25;
      margin: 2rem 0 0.75rem;
      color: var(--text);
    }
    h1 { font-size: 2rem;   border-bottom: 2px solid var(--accent); padding-bottom: .4rem; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: .3rem; }
    h3 { font-size: 1.25rem; }
    h4 { font-size: 1.1rem; }
    h5, h6 { font-size: 1rem; }
    p  { margin: 0.75rem 0; }
    a  { color: var(--accent); text-underline-offset: 2px; }
    strong { font-weight: 700; }
    em     { font-style: italic; }
    u  { text-decoration: underline; text-underline-offset: 2px; }
    s  { text-decoration: line-through; }
    blockquote {
      border-left: 4px solid var(--accent);
      margin: 1.5rem 0;
      padding: .75rem 1.25rem;
      background: color-mix(in srgb, var(--accent) 6%, transparent);
      border-radius: 0 6px 6px 0;
      color: var(--muted);
      font-style: italic;
    }
    pre {
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.1rem 1.25rem;
      overflow-x: auto;
      margin: 1.25rem 0;
    }
    code {
      font-family: var(--font-mono);
      font-size: .875em;
      background: var(--bg-code);
      padding: .15em .35em;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    pre code { background: none; border: none; padding: 0; font-size: .9rem; }
    img { max-width: 100%; height: auto; display: block; border-radius: 6px; margin: 1rem 0; }
    table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; border-radius: 8px; overflow: hidden; }
    th, td { border: 1px solid var(--border); padding: .6rem .9rem; text-align: left; font-size: .9rem; }
    th { background: #EFF6FF; font-weight: 700; color: #1E3A5F; }
    tr:nth-child(even) td { background: #F8FAFC; }
    ul, ol { padding-left: 1.75rem; margin: .75rem 0; }
    li { margin: .3rem 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    @media print {
      body { max-width: none; padding: 1cm; font-size: 11pt; }
      h1, h2, h3 { page-break-after: avoid; }
      pre, blockquote, table { page-break-inside: avoid; }
      @page { size: A4; margin: 1cm; }
    }` : '';

    const now     = new Date();
    const isoDate = now.toISOString();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author"  content="${this._esc(author)}" />
  <meta name="date"    content="${isoDate}" />
  <meta name="generator" content="Athena Editor" />
  <meta name="description" content="${this._esc(title)}" />
  <title>${this._esc(title)}</title>
  ${includeCSS ? `<style>${css}</style>` : ''}
</head>
<body>
  <header style="margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--border,#E5E7EB)">
    <p style="font-size:.8rem;color:var(--muted,#6B7280);margin:0">${this._esc(author)} · ${dateStr}</p>
  </header>
  <main>${safe}</main>
  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid var(--border,#E5E7EB);font-size:.75rem;color:var(--muted,#6B7280)">
    Generated by Athena Editor · ${dateStr}
  </footer>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    saveAs(blob, filename);
    toast.success('HTML exported successfully');
  }

  // ============================================================
  // MARKDOWN EXPORT
  // ============================================================

  static exportToMarkdown(editor, options = {}) {
    const {
      filename      = 'document.md',
      title         = 'Document',
      includeFrontmatter = true,
    } = options;

    const json = editor?.getJSON?.();
    if (!json) { toast.error('No content to export'); return; }

    const lines = [];

    // YAML front-matter
    if (includeFrontmatter) {
      lines.push('---');
      lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
      lines.push(`date: ${new Date().toISOString().split('T')[0]}`);
      lines.push(`generator: Athena Editor`);
      lines.push('---', '');
    }

    const nodes = json.content || [];
    this._nodesToMarkdown(nodes, lines, 0);

    const md   = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, filename);
    toast.success('Markdown exported successfully');
  }

  static _nodesToMarkdown(nodes, lines, depth) {
    for (const node of nodes) {
      switch (node.type) {
        case 'heading': {
          const level = node.attrs?.level || 1;
          const text  = this._inlineToMarkdown(node.content || []);
          lines.push('', '#'.repeat(level) + ' ' + text, '');
          break;
        }
        case 'paragraph': {
          const text = this._inlineToMarkdown(node.content || []);
          if (text.trim()) lines.push(text, '');
          else             lines.push('');
          break;
        }
        case 'blockquote': {
          const inner = [];
          this._nodesToMarkdown(node.content || [], inner, depth);
          const quoted = inner.map(l => '> ' + l).join('\n');
          lines.push(quoted, '');
          break;
        }
        case 'codeBlock': {
          const lang = node.attrs?.language || '';
          const code = this._extractPlainText(node);
          lines.push('```' + lang, code, '```', '');
          break;
        }
        case 'bulletList': {
          for (const item of node.content || []) {
            const text = this._extractPlainText(item);
            const indent = '  '.repeat(depth);
            lines.push(`${indent}- ${text}`);
            // Nested lists
            const nested = (item.content || []).filter(c =>
              c.type === 'bulletList' || c.type === 'orderedList');
            for (const n of nested) this._nodesToMarkdown([n], lines, depth + 1);
          }
          lines.push('');
          break;
        }
        case 'orderedList': {
          let i = node.attrs?.start || 1;
          for (const item of node.content || []) {
            const text   = this._extractPlainText(item);
            const indent = '  '.repeat(depth);
            lines.push(`${indent}${i++}. ${text}`);
            const nested = (item.content || []).filter(c =>
              c.type === 'bulletList' || c.type === 'orderedList');
            for (const n of nested) this._nodesToMarkdown([n], lines, depth + 1);
          }
          lines.push('');
          break;
        }
        case 'table': {
          const rows = this._extractTableRowsFromNode(node);
          if (!rows.length) break;
          const cols = Math.max(...rows.map(r => r.length));
          // Header row
          lines.push('| ' + (rows[0] || []).join(' | ') + ' |');
          lines.push('| ' + Array(cols).fill('---').join(' | ') + ' |');
          // Data rows
          for (let ri = 1; ri < rows.length; ri++) {
            lines.push('| ' + rows[ri].join(' | ') + ' |');
          }
          lines.push('');
          break;
        }
        case 'image':
        case 'resizableImage': {
          const src = node.attrs?.src || '';
          const alt = node.attrs?.alt || 'Image';
          lines.push(`![${alt}](${src})`, '');
          break;
        }
        case 'horizontalRule': {
          lines.push('', '---', '');
          break;
        }
        case 'hardBreak': {
          lines.push('  ');   // MD hard break
          break;
        }
        default: {
          if (node.content) this._nodesToMarkdown(node.content, lines, depth);
          break;
        }
      }
    }
  }

  static _inlineToMarkdown(nodes) {
    return nodes.map(n => {
      if (n.type === 'hardBreak') return '  \n';
      if (n.type === 'image' || n.type === 'resizableImage') {
        return `![${n.attrs?.alt || ''}](${n.attrs?.src || ''})`;
      }
      let text = n.text || '';
      if (!text) text = this._inlineToMarkdown(n.content || []);
      const marks = n.marks || [];
      for (const m of marks) {
        switch (m.type) {
          case 'bold':      text = `**${text}**`; break;
          case 'italic':    text = `*${text}*`;   break;
          case 'strike':    text = `~~${text}~~`; break;
          case 'code':      text = `\`${text}\``; break;
          case 'underline': text = `<u>${text}</u>`; break;
          case 'link':      text = `[${text}](${m.attrs?.href || ''})`; break;
        }
      }
      return text;
    }).join('');
  }

  static _extractPlainText(node) {
    if (!node) return '';
    if (node.text) return node.text;
    return (node.content || []).map(n => this._extractPlainText(n)).join('');
  }

  static _extractTableRowsFromNode(tableNode) {
    const rows = [];
    for (const row of tableNode.content || []) {
      if (row.type !== 'tableRow') continue;
      rows.push((row.content || []).map(cell => {
        const t = this._extractPlainText(cell).replace(/\|/g, '\\|');
        return t.trim() || ' ';
      }));
    }
    return rows;
  }

  // ============================================================
  // PLAIN TEXT EXPORT
  // ============================================================

  static exportToPlainText(editor, options = {}) {
    const { filename = 'document.txt', title = 'Document' } = options;
    const json = editor?.getJSON?.();
    if (!json) { toast.error('No content to export'); return; }

    const lines = [];
    lines.push(title.toUpperCase(), '='.repeat(Math.min(title.length, 72)), '');

    this._nodesToPlainText(json.content || [], lines, 0);

    const txt  = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
    toast.success('Plain text exported successfully');
  }

  static _nodesToPlainText(nodes, lines, depth) {
    for (const node of nodes) {
      switch (node.type) {
        case 'heading': {
          const text = this._extractPlainText(node);
          lines.push('', text, '-'.repeat(Math.min(text.length, 72)), '');
          break;
        }
        case 'paragraph': {
          lines.push(this._extractPlainText(node) || '');
          break;
        }
        case 'blockquote': {
          const inner = [];
          this._nodesToPlainText(node.content || [], inner, depth);
          lines.push(...inner.map(l => '    | ' + l), '');
          break;
        }
        case 'codeBlock': {
          lines.push('    ' + this._extractPlainText(node).split('\n').join('\n    '), '');
          break;
        }
        case 'bulletList': {
          for (const item of node.content || []) {
            const indent = '  '.repeat(depth);
            lines.push(`${indent}• ${this._extractPlainText(item)}`);
            const nested = (item.content || []).filter(c =>
              c.type === 'bulletList' || c.type === 'orderedList');
            for (const n of nested) this._nodesToPlainText([n], lines, depth + 1);
          }
          lines.push('');
          break;
        }
        case 'orderedList': {
          let i = node.attrs?.start || 1;
          for (const item of node.content || []) {
            const indent = '  '.repeat(depth);
            lines.push(`${indent}${i++}. ${this._extractPlainText(item)}`);
            const nested = (item.content || []).filter(c =>
              c.type === 'bulletList' || c.type === 'orderedList');
            for (const n of nested) this._nodesToPlainText([n], lines, depth + 1);
          }
          lines.push('');
          break;
        }
        case 'table': {
          const rows = this._extractTableRowsFromNode(node);
          for (const row of rows) lines.push(row.join('\t'));
          lines.push('');
          break;
        }
        case 'horizontalRule': {
          lines.push('', '─'.repeat(72), '');
          break;
        }
        default: {
          if (node.content) this._nodesToPlainText(node.content, lines, depth);
          break;
        }
      }
    }
  }

  // ============================================================
  // JSON EXPORT
  // ============================================================

  static async exportToJSON(editor, options = {}) {
    const {
      filename   = 'document.json',
      title      = 'Document',
      author     = 'Athena Editor',
      pretty     = true,
    } = options;

    const toastId = toast.loading('Preparing JSON…');
    try {
      if (!editor) throw new Error('Editor not available');

      const json     = editor.getJSON?.() || {};
      const wordCount = editor.storage?.characterCount?.words?.() ??
                        this._countWords(editor.getText?.() || '');
      const charCount = editor.storage?.characterCount?.characters?.() ??
                        (editor.getText?.() || '').length;

      const output = {
        version:       '2.0',   // Bump on breaking schema changes
        schemaVersion: json.version ?? 1,
        metadata: {
          title,
          author,
          createdAt:   new Date().toISOString(),
          generator:   'Athena Editor',
          generatorVersion: '2.0',
          wordCount,
          charCount,
          nodeCount:   (json.content || []).length,
          exportedAt:  new Date().toISOString(),
        },
        content: json,
      };

      const blob = new Blob(
        [JSON.stringify(output, null, pretty ? 2 : 0)],
        { type: 'application/json;charset=utf-8' }
      );
      saveAs(blob, filename);
      toast.success('JSON exported successfully');
    } catch (err) {
      console.error('[JSON export]', err);
      toast.error('JSON export failed: ' + err.message);
    } finally {
      toast.dismiss(toastId);
    }
  }

  // ============================================================
  // EPUB EXPORT  (EPUB 3 compliant)
  // ============================================================

  static async exportToEPUB(editor, options = {}) {
    const {
      filename    = 'document.epub',
      title       = 'Document',
      author      = 'Athena Editor',
      language    = 'en',
      subject     = '',
      description = '',
      coverImage  = null,   // base64 data URL or null — e.g. options.coverImage = 'data:image/jpeg;base64,...'
    } = options;

    const toastId = toast.loading('Preparing EPUB…');
    try {
      const html     = editor?.getHTML?.() || '';
      const safe     = DOMPurify.sanitize(html || '<p></p>');
      const uid      = (typeof crypto?.randomUUID === 'function')
                         ? crypto.randomUUID()
                         : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const dateStr  = new Date().toISOString().split('T')[0];
      const zip      = new JSZip();

      // ── mimetype (uncompressed, MUST be first) ─────────────────────────────
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

      // ── META-INF/container.xml ─────────────────────────────────────────────
      zip.folder('META-INF').file('container.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf"
              media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

      const oebps = zip.folder('OEBPS');

      // ── OEBPS/content.opf (EPUB3 package) ────────────────────────────────
      oebps.file('content.opf',
`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         unique-identifier="book-id"
         version="3.0">
  <metadata>
    <dc:identifier id="book-id">urn:uuid:${uid}</dc:identifier>
    <dc:title>${this._esc(title)}</dc:title>
    <dc:creator>${this._esc(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:publisher>Athena Editor</dc:publisher>
    <dc:date>${dateStr}</dc:date>
    ${subject     ? `<dc:subject>${this._esc(subject)}</dc:subject>` : ''}
    ${description ? `<dc:description>${this._esc(description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav"     href="nav.xhtml"     media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="css"     href="styles.css"    media-type="text/css"/>
    ${coverImageManifest}
  </manifest>
  <spine>
    <itemref idref="nav"     linear="no"/>
    ${coverSpineItem}
    <itemref idref="content"/>
  </spine>
</package>`);

      // nav.xhtml is written later in the cover/TOC block with real heading IDs
      // (placeholder — will be overwritten by the heading-aware version below)
      oebps.file('nav.xhtml', '<!-- placeholder -->');

      // content.xhtml written later with heading-ID injection (see TOC block)
      oebps.file('content.xhtml', '<!-- placeholder -->');

      // ── OEBPS/styles.css ──────────────────────────────────────────────────
      oebps.file('styles.css',
`/* Athena Editor EPUB Stylesheet */
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1em;
  line-height: 1.65;
  margin: 1em 1.5em;
  color: #1F2937;
  background: #FFFFFF;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  margin: 0 0 1em;
  padding-bottom: .4em;
  border-bottom: 2px solid #4F46E5;
  color: #111827;
}
h1 { font-size: 1.6em; margin: 1.5em 0 .5em; color: #111827; }
h2 { font-size: 1.35em; margin: 1.3em 0 .4em; color: #1F2937; }
h3 { font-size: 1.15em; margin: 1.1em 0 .35em; }
h4, h5, h6 { font-size: 1em;   margin: 1em 0 .3em; }
p  { margin: 0 0 .8em; text-indent: 1.2em; }
p:first-child, h1 + p, h2 + p, h3 + p { text-indent: 0; }
a  { color: #4F46E5; text-decoration: underline; }
strong { font-weight: bold; }
em     { font-style: italic; }
blockquote {
  border-left: 4px solid #4F46E5;
  margin: 1em 0;
  padding: .5em 1em;
  color: #4B5563;
  font-style: italic;
}
pre {
  font-family: 'Courier New', monospace;
  font-size: .875em;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: .75em 1em;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 1em 0;
}
code {
  font-family: 'Courier New', monospace;
  font-size: .875em;
  background: #F3F4F6;
  padding: .1em .3em;
  border-radius: 3px;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: .9em;
}
th, td {
  border: 1px solid #D1D5DB;
  padding: .4em .7em;
  text-align: left;
}
th { background: #EFF6FF; font-weight: bold; }
ul, ol { margin: .75em 0; padding-left: 1.8em; }
li { margin: .25em 0; }
hr { border: none; border-top: 1px solid #E5E7EB; margin: 2em 0; }
nav#toc ol { list-style: none; padding: 0; }
nav#toc li { margin: .4em 0; }
nav#toc a  { color: #4F46E5; }`);

      // ── Cover image (optional) ──────────────────────────────────────────
      let coverImageManifest = '';
      let coverSpineItem = '';
      if (coverImage) {
        try {
          const isJpeg  = coverImage.includes('image/jpeg') || coverImage.includes('image/jpg');
          const ext     = isJpeg ? 'jpg' : 'png';
          const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
          const base64   = coverImage.split(',')[1];
          const bytes    = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          oebps.folder('images').file(`cover.${ext}`, bytes);

          coverImageManifest = `<item id="cover-image" href="images/cover.${ext}" media-type="${mimeType}" properties="cover-image"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
          coverSpineItem = `<itemref idref="cover" linear="no"/>`;

          oebps.file('cover.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${language}">
<head><meta charset="utf-8"/><title>Cover</title>
<style>body{margin:0;padding:0} img{width:100%;height:auto;display:block}</style></head>
<body><img src="images/cover.${ext}" alt="Cover"/></body>
</html>`);
        } catch (coverErr) {
          console.warn('[EPUB cover image error]', coverErr);
          coverImageManifest = '';
          coverSpineItem = '';
        }
      }

      // Resolve manifest template placeholders
      const updateFile = async (path, content) => {
        const f = oebps.file(path);
        if (f) {
          const current = await f.async('text');
          oebps.file(path, current
            .replace('${coverImageManifest}', coverImageManifest)
            .replace('${coverSpineItem}', coverSpineItem));
        }
      };
      await updateFile('content.opf', null);

      // ── Richer TOC: extract headings from content ────────────────────────
      const headingItems = [];
      const json = editor?.getJSON?.() || {};
      let hIdx = 0;
      for (const node of json.content || []) {
        if (node.type === 'heading') {
          const text  = DocumentExporter._extractPlainText(node);
          const level = node.attrs?.level || 1;
          const id    = `h${++hIdx}`;
          headingItems.push({ text, level, id });
        }
      }

      // Rebuild nav.xhtml with real headings
      const buildNavOl = (items, currentLevel = 1) => {
        let html = '<ol>';
        let i = 0;
        while (i < items.length) {
          const item = items[i];
          html += `<li><a href="content.xhtml#${item.id}">${DocumentExporter._esc(item.text)}</a>`;
          // Check if next items are deeper level
          const nested = [];
          i++;
          while (i < items.length && items[i].level > currentLevel) {
            nested.push(items[i++]);
          }
          if (nested.length) html += buildNavOl(nested, currentLevel + 1);
          html += '</li>';
        }
        html += '</ol>';
        return html;
      };

      const tocNav = headingItems.length > 0 ? buildNavOl(headingItems) :
        `<ol><li><a href="content.xhtml">${DocumentExporter._esc(title)}</a></li></ol>`;

      oebps.file('nav.xhtml',
`<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}" lang="${language}">
<head>
  <meta charset="utf-8"/>
  <title>${DocumentExporter._esc(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    ${tocNav}
  </nav>
</body>
</html>`);

      // Inject heading IDs into content.xhtml so TOC links work
      let contentBody = safe;
      if (headingItems.length) {
        let iH = 0;
        contentBody = safe.replace(/<(h[1-6])([^>]*)>/gi, (m, tag, attrs) => {
          if (iH < headingItems.length) {
            return `<${tag}${attrs} id="${headingItems[iH++].id}">`;
          }
          return m;
        });
      }
      oebps.file('content.xhtml',
`<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${language}" lang="${language}">
<head>
  <meta charset="utf-8"/>
  <title>${DocumentExporter._esc(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section epub:type="chapter" xmlns:epub="http://www.idpf.org/2007/ops">
    <h1 class="title">${DocumentExporter._esc(title)}</h1>
    ${contentBody}
  </section>
</body>
</html>`);

      const blob = await zip.generateAsync({
        type:        'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      saveAs(blob, filename);
      toast.success('EPUB exported successfully 📚');
    } catch (err) {
      console.error('[EPUB export]', err);
      toast.error('EPUB export failed: ' + err.message);
    } finally {
      toast.dismiss(toastId);
    }
  }

  // ============================================================
  // PRINT
  // ============================================================

  static async printDocument(editor, options = {}) {
    const { title = 'Document' } = options;
    const toastId = toast.loading('Opening print preview…');
    try {
      const html = editor?.getHTML?.() || '';
      const safe = DOMPurify.sanitize(html || '<p></p>');

      const styles = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 11pt; }
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #111827;
          line-height: 1.6;
          background: #fff;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm 25mm;
          background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { font-weight: bold; margin: 1.2em 0 .4em; page-break-after: avoid; }
        h1 { font-size: 1.8em; border-bottom: 2px solid #4F46E5; padding-bottom: .3em; }
        h2 { font-size: 1.4em; }
        h3 { font-size: 1.15em; }
        p  { margin: .5em 0; orphans: 3; widows: 3; }
        blockquote {
          border-left: 4px solid #4F46E5;
          padding: .4em .8em;
          margin: .8em 0;
          color: #4B5563;
          font-style: italic;
        }
        pre {
          font-family: Consolas, monospace;
          font-size: .85em;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 4px;
          padding: .75em 1em;
          white-space: pre-wrap;
          page-break-inside: avoid;
        }
        code { font-family: Consolas, monospace; font-size: .85em; background: #F3F4F6; padding: .1em .25em; border-radius: 3px; }
        img  { max-width: 100%; height: auto; display: block; margin: .75em 0; }
        table { border-collapse: collapse; width: 100%; margin: .75em 0; page-break-inside: avoid; }
        th, td { border: 1px solid #D1D5DB; padding: .4em .7em; font-size: .9em; }
        th { background: #EFF6FF; font-weight: bold; }
        ul, ol { padding-left: 1.5em; margin: .5em 0; }
        li { margin: .2em 0; }
        hr { border: none; border-top: 1px solid #E5E7EB; margin: 1.5em 0; }
        a  { color: #4F46E5; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body  { background: white; }
          .page { padding: 15mm 20mm; box-shadow: none; }
          h1, h2, h3 { page-break-after: avoid; }
          pre, blockquote { page-break-inside: avoid; }
        }`;

      const docHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._esc(title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="page">${safe}</div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); window.close(); }, 400);
    });
  <\/script>
</body>
</html>`;

      const printWindow = window.open('', '_blank', 'noopener,width=900,height=700');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(docHTML);
        printWindow.document.close();
      } else {
        // Popup blocked — iframe fallback
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(iframe);
        const iDoc = iframe.contentWindow?.document;
        if (!iDoc) { document.body.removeChild(iframe); throw new Error('Print frame unavailable'); }
        iDoc.open();
        iDoc.write(docHTML);
        iDoc.close();
        iframe.onload = () => {
          setTimeout(() => {
            try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch (_) {}
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 400);
        };
      }
      toast.success('Print preview opened');
    } catch (err) {
      console.error('[Print error]', err);
      toast.error('Failed to print document');
    } finally {
      toast.dismiss(toastId);
    }
  }

  // ============================================================
  // CONTENT EXTRACTION  (ProseMirror JSON → structured sections)
  // ============================================================

  static extractStructuredContent(editor) {
    if (!editor) return [];
    const json     = editor.getJSON?.() || {};
    const sections = [];
    if (json.content) this._processNodes(json.content, sections, 0);
    return sections;
  }

  static _processNodes(nodes, sections, depth) {
    for (const node of nodes) {
      switch (node.type) {

        case 'pageBreak':
          sections.push({ type: 'pageBreak' });
          break;

        case 'horizontalRule':
          sections.push({ type: 'horizontalRule' });
          break;

        case 'heading':
          sections.push({
            type:  'heading',
            level: node.attrs?.level || 1,
            text:  this._extractPlainText(node),
            runs:  this._extractRuns(node),
            style: this._extractBlockStyle(node),
          });
          break;

        case 'paragraph': {
          // Check if paragraph contains only an image
          const imgChild = node.content?.find(c =>
            c.type === 'image' || c.type === 'resizableImage');
          if (imgChild && node.content.length === 1) {
            sections.push({
              type:   'image',
              src:    imgChild.attrs?.src    || '',
              alt:    imgChild.attrs?.alt    || imgChild.attrs?.title || '',
              width:  imgChild.attrs?.width  || 400,
              height: imgChild.attrs?.height || 300,
              align:  imgChild.attrs?.align  || 'left',
            });
            break;
          }
          // Mixed paragraph — extract runs and flush images
          this._processMixedParagraph(node, sections);
          break;
        }

        case 'blockquote':
          sections.push({
            type:  'blockquote',
            text:  this._extractPlainText(node),
            style: this._extractBlockStyle(node),
          });
          break;

        case 'codeBlock':
          sections.push({
            type:     'code',
            text:     this._extractPlainText(node),
            language: node.attrs?.language || '',
          });
          break;

        case 'bulletList':
        case 'orderedList': {
          const items = [];
          this._processListItems(node.content || [], items, depth, node.type === 'orderedList');
          sections.push({
            type:    'list',
            ordered: node.type === 'orderedList',
            items,
            style:   this._extractBlockStyle(node),
          });
          break;
        }

        case 'table':
          sections.push({
            type: 'table',
            rows: this._extractTableRowsFromNode(node),
          });
          break;

        case 'image':
        case 'resizableImage':
          sections.push({
            type:   'image',
            src:    node.attrs?.src    || '',
            alt:    node.attrs?.alt    || node.attrs?.title || '',
            width:  node.attrs?.width  || 400,
            height: node.attrs?.height || 300,
            align:  node.attrs?.align  || 'left',
          });
          break;

        // SVG diagrams / vector graphics embedded directly in the document
        case 'svgBlock':
        case 'diagram': {
          const rawSvg = node.attrs?.svg || node.attrs?.src || node.textContent || '';
          if (rawSvg) {
            sections.push({
              type:   'svgBlock',
              svg:    rawSvg,
              width:  node.attrs?.width  || 400,
              height: node.attrs?.height || 300,
              align:  node.attrs?.align  || 'left',
            });
          }
          break;
        }

        default:
          if (node.content) this._processNodes(node.content, sections, depth);
          break;
      }
    }
  }

  static _processMixedParagraph(node, sections) {
    const children = node.content || [];

    // Fast path: no images — common case for normal paragraphs.
    // Previously this called flushText() which guarded on textBuf.trim(),
    // but textBuf was NEVER written to, so every paragraph was silently
    // dropped → empty PDF. Fixed: push directly.
    const hasImage = children.some(c => c.type === 'image' || c.type === 'resizableImage');

    if (!hasImage) {
      sections.push({
        type:  'paragraph',
        text:  this._extractPlainText(node),
        runs:  this._extractRuns(node),
        style: this._extractBlockStyle(node),
      });
      return;
    }

    // Mixed path: walk children, accumulate text nodes, flush on each image.
    let pending = [];

    const flushPending = () => {
      if (!pending.length) return;
      const fakeNode = { ...node, content: pending };
      const t    = this._extractPlainText(fakeNode);
      const runs = this._extractRuns(fakeNode);
      if (t.trim() || runs.some(r => r.text?.trim())) {
        sections.push({
          type: 'paragraph', text: t, runs,
          style: this._extractBlockStyle(node),
        });
      }
      pending = [];
    };

    for (const child of children) {
      if (child.type === 'image' || child.type === 'resizableImage') {
        flushPending();
        sections.push({
          type: 'image',
          src:    child.attrs?.src    || '',
          alt:    child.attrs?.alt    || child.attrs?.title || '',
          width:  child.attrs?.width  || 400,
          height: child.attrs?.height || 300,
          align:  child.attrs?.align  || 'left',
        });
      } else {
        pending.push(child);
      }
    }
    flushPending();
  }

  static _extractRuns(node) {
    const runs = [];
    for (const child of node.content || []) {
      if (!child.text && child.type !== 'hardBreak') continue;
      if (child.type === 'hardBreak') { runs.push({ text: '\n', hardBreak: true }); continue; }
      const run = { text: child.text || '' };
      for (const mark of child.marks || []) {
        switch (mark.type) {
          case 'bold':      run.bold      = true; break;
          case 'italic':    run.italic    = true; break;
          case 'underline': run.underline = true; break;
          case 'strike':    run.strike    = true; break;
          case 'code':      run.code      = true; break;
          case 'link':      run.link      = mark.attrs?.href || ''; break;
          case 'textStyle':
            if (mark.attrs?.color)    run.color    = mark.attrs.color;
            if (mark.attrs?.fontSize) run.fontSize = mark.attrs.fontSize;
            break;
          case 'highlight': run.highlight = mark.attrs?.color || '#FBBF24'; break;
        }
      }
      runs.push(run);
    }
    return runs;
  }

  static _processListItems(nodes, items, depth, ordered, indexRef = { v: 1 }) {
    for (const node of nodes) {
      if (node.type !== 'listItem') continue;
      const textNode = (node.content || []).find(c => c.type === 'paragraph') || node;
      const text     = this._extractPlainText(textNode);
      if (text.trim()) {
        items.push({ text, level: depth, index: ordered ? indexRef.v++ : null });
      }
      // Recurse into nested lists
      for (const child of node.content || []) {
        if (child.type === 'bulletList') {
          this._processListItems(child.content || [], items, depth + 1, false, { v: 1 });
        } else if (child.type === 'orderedList') {
          this._processListItems(child.content || [], items, depth + 1, true, { v: 1 });
        }
      }
    }
  }

  static _extractBlockStyle(node) {
    const style    = {};
    const PX_TO_MM = 0.264583;

    if (node?.attrs?.lineHeight) {
      const lf = parseFloat(node.attrs.lineHeight);
      if (!isNaN(lf) && lf > 0.5 && lf < 5) style.lineHeight = lf;
    }
    if (node?.attrs?.textAlign) {
      style.align = node.attrs.textAlign;
    }
    if (typeof node?.attrs?.style === 'string') {
      const mt = /margin-top:\s*([\d.]+)px/i.exec(node.attrs.style);
      const mb = /margin-bottom:\s*([\d.]+)px/i.exec(node.attrs.style);
      if (mt) style.marginBeforeMM = parseFloat(mt[1]) * PX_TO_MM;
      if (mb) style.marginAfterMM  = parseFloat(mb[1]) * PX_TO_MM;
    }

    // Collect bold/italic from child marks (for legacy support)
    for (const child of node?.content || []) {
      for (const mark of child?.marks || []) {
        if (mark.type === 'bold')   style.bold   = true;
        if (mark.type === 'italic') style.italic = true;
      }
    }
    return style;
  }

  // ============================================================
  // SHARED UTILITIES
  // ============================================================

  // ─── SVG → PNG rasteriser ───────────────────────────────────────────────
  // Draws an SVG string onto an off-screen canvas at 2× scale and returns a
  // PNG data URL. Works entirely in the browser — no server round-trip needed.
  // Falls back gracefully if the environment doesn't support Canvas or Blob URLs.
  static _svgToPng(svgSource, targetWidthMM, targetHeightMM, scale = 2) {
    return new Promise((resolve, reject) => {
      if (!svgSource) { resolve(null); return; }

      // Convert mm → px at 96 dpi, then apply scale factor for sharpness
      const MM_TO_PX  = 96 / 25.4;
      const canvasW   = Math.round(targetWidthMM  * MM_TO_PX * scale);
      const canvasH   = Math.round(targetHeightMM * MM_TO_PX * scale);

      // Ensure the SVG has explicit width/height so the img element sizes it
      let svg = svgSource.trim();
      if (!svg.startsWith('<svg')) {
        // May be a data-URI — decode it
        if (svg.startsWith('data:image/svg')) {
          const comma = svg.indexOf(',');
          svg = decodeURIComponent(svg.slice(comma + 1));
        } else {
          resolve(null); return;
        }
      }
      // Inject width/height attributes so the browser renders it at the right size
      svg = svg.replace(/<svg([^>]*)>/, (m, attrs) => {
        const noW = attrs.replace(/\bwidth="[^"]*"/g, '').replace(/\bheight="[^"]*"/g, '');
        return `<svg${noW} width="${canvasW}" height="${canvasH}">`;
      });

      const blob  = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url   = URL.createObjectURL(blob);
      const img   = new Image();
      img.width   = canvasW;
      img.height  = canvasH;

      const cleanup = () => URL.revokeObjectURL(url);

      img.onload = () => {
        try {
          const canvas    = document.createElement('canvas');
          canvas.width    = canvasW;
          canvas.height   = canvasH;
          const ctx       = canvas.getContext('2d');
          if (!ctx) { cleanup(); resolve(null); return; }
          ctx.drawImage(img, 0, 0, canvasW, canvasH);
          cleanup();
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
      img.onerror = (e) => { cleanup(); reject(new Error('SVG image load failed')); };
      img.src = url;
    });
  }

  // ─── Font embedding via jsPDF addFileToVFS / addFont ──────────────────────
  // Fetches each TTF/OTF from the provided URL and registers it with jsPDF.
  // Returns the name of the first successfully loaded font family, so the
  // renderer can use it instead of 'helvetica'. Falls back to 'helvetica'
  // if no fonts are provided or all fail.
  static async _embedFonts(pdf, fontDefs = []) {
    if (!fontDefs || fontDefs.length === 0) return 'helvetica';

    let loadedFontName = null;

    for (const { name, style = 'normal', url } of fontDefs) {
      if (!url || !name) continue;
      try {
        // Fetch the font file and convert to base64
        const ctrl    = new AbortController();
        const timer   = setTimeout(() => ctrl.abort(), 10000);
        const res     = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) {
          console.warn(`[Font embed] Failed to fetch ${url}: HTTP ${res.status}`);
          continue;
        }
        const buffer  = await res.arrayBuffer();
        const bytes   = new Uint8Array(buffer);
        // Convert to binary string for jsPDF
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64  = btoa(binary);

        // jsPDF VFS filename must end in .ttf / .otf
        const ext     = url.split('.').pop().toLowerCase() || 'ttf';
        const vfsName = `${name}-${style}.${ext}`;

        // jsPDF style keys: 'normal' → '', 'bold' → 'Bold',
        //   'italic' → 'Italic', 'bolditalic' → 'BoldItalic'
        const jsPDFStyle = style === 'bolditalic' ? 'BoldItalic'
                         : style === 'bold'       ? 'Bold'
                         : style === 'italic'     ? 'Italic'
                         : 'Normal';

        pdf.addFileToVFS(vfsName, base64);
        pdf.addFont(vfsName, name, jsPDFStyle);

        if (!loadedFontName) loadedFontName = name;
        console.info(`[Font embed] Registered ${name} (${style})`);
      } catch (err) {
        console.warn(`[Font embed] Could not load ${name} ${style} from ${url}:`, err.message);
      }
    }

    return loadedFontName ?? 'helvetica';
  }

  // ── Image loading: 8-second timeout + broken-image placeholder ────────────
  static async _loadImageAsDataUrl(src, timeoutMs = 8000) {
    if (!src)               return DocumentExporter._brokenImageDataUrl();
    if (src.startsWith('data:')) return src;

    // Abort controller for timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(src, {
        mode:   'cors',
        cache:  'force-cache',
        signal: controller.signal,
      });
      if (!res.ok) return DocumentExporter._brokenImageDataUrl();
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader   = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[Image load failed]', src, err.message);
      return DocumentExporter._brokenImageDataUrl();
    } finally {
      clearTimeout(timer);
    }
  }

  // 1×1 grey PNG as a "broken image" sentinel — rendered as a tiny grey box
  static _brokenImageDataUrl() {
    // 60×40 light-grey PNG generated inline (avoids any network call)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAKCAYAAABrGwT5AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIElEQVQoz2NgYGD4z0ABYBw1mHowMDAwMIwaDQMAAHkABgEA5DQAAAAASUVORK5CYII=';
  }

  static _esc(str) {
    return String(str || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  static _countWords(text) {
    return (text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  // ============================================================
  // WEB WORKER SUPPORT
  // ============================================================

  // Whether the current environment supports the Worker API.
  // PDF/DOCX/EPUB cannot run in a Worker without a separate bundled file
  // (they depend on DOM APIs: canvas, FileReader, jsPDF, docx-js).
  // Markdown, plain-text, and JSON exports are Worker-safe.
  static get canUseWorker() {
    return typeof Worker !== 'undefined';
  }

  // Returns the source code string for a standalone Athena export Web Worker.
  // Usage in a build system:
  //   const blob   = new Blob([DocumentExporter.createWorkerScript()], { type: 'text/javascript' });
  //   const worker = new Worker(URL.createObjectURL(blob));
  //   worker.postMessage({ type: 'exportMarkdown', json, options });
  //   worker.onmessage = (e) => saveAs(new Blob([e.data.result]), 'document.md');
  //
  // Supported worker message types: 'exportMarkdown', 'exportPlainText', 'exportJSON'
  static createWorkerScript() {
    return `
// ── Athena Export Worker ─────────────────────────────────────────────────────
// Handles text-only exports (Markdown, Plain Text, JSON) off the main thread.
// PDF / DOCX / EPUB must remain on the main thread (DOM API dependency).

self.onmessage = async (e) => {
  const { id, type, json, options = {} } = e.data;
  try {
    let result;
    switch (type) {
      case 'exportMarkdown':  result = workerMarkdown(json, options);  break;
      case 'exportPlainText': result = workerPlainText(json, options); break;
      case 'exportJSON':      result = workerJSON(json, options);      break;
      default: throw new Error('Unknown export type: ' + type);
    }
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message });
  }
};

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function plainText(node) {
  if (node.text) return node.text;
  return (node.content||[]).map(plainText).join('');
}

function workerMarkdown(json, opts) {
  const { title = 'Document', includeFrontmatter = true } = opts;
  const lines = [];
  if (includeFrontmatter) {
    lines.push('---', 'title: "' + title.replace(/"/g,'\\"') + '"',
               'date: ' + new Date().toISOString().split('T')[0],
               'generator: Athena Editor', '---', '');
  }
  nodesToMd(json.content || [], lines, 0);
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim() + '\n';
}

function nodesToMd(nodes, lines, depth) {
  for (const n of nodes) {
    switch (n.type) {
      case 'heading':   lines.push('', '#'.repeat(n.attrs?.level||1) + ' ' + plainText(n), ''); break;
      case 'paragraph': { const t = inlineMd(n.content||[]); if (t.trim()) lines.push(t,''); else lines.push(''); break; }
      case 'blockquote': { const i=[]; nodesToMd(n.content||[],i,depth); lines.push(...i.map(l=>'> '+l),''); break; }
      case 'codeBlock': lines.push('\`\`\`'+(n.attrs?.language||''), plainText(n), '\`\`\`',''); break;
      case 'bulletList': for (const it of n.content||[]) { lines.push('  '.repeat(depth)+'- '+plainText(it)); } lines.push(''); break;
      case 'orderedList': { let i=n.attrs?.start||1; for (const it of n.content||[]) { lines.push('  '.repeat(depth)+i+++'. '+plainText(it)); } lines.push(''); break; }
      case 'table': { const rows=tableRows(n); if (rows.length){const c=Math.max(...rows.map(r=>r.length)); lines.push('| '+rows[0].join(' | ')+' |','| '+Array(c).fill('---').join(' | ')+' |'); for(let r=1;r<rows.length;r++)lines.push('| '+rows[r].join(' | ')+' |'); lines.push(''); } break; }
      case 'image': case 'resizableImage': lines.push('!['+( n.attrs?.alt||'')+']('+(n.attrs?.src||'')+')', ''); break;
      case 'horizontalRule': lines.push('','---',''); break;
      default: if (n.content) nodesToMd(n.content,lines,depth); break;
    }
  }
}

function inlineMd(nodes) {
  return nodes.map(n => {
    if (n.type==='hardBreak') return '  \n';
    let t = n.text || (n.content ? inlineMd(n.content) : '');
    for (const m of n.marks||[]) {
      switch(m.type){case 'bold':t='**'+t+'**';break;case 'italic':t='*'+t+'*';break;case 'strike':t='~~'+t+'~~';break;case 'code':t='\`'+t+'\`';break;case 'link':t='['+t+']('+m.attrs?.href+')';break;}
    }
    return t;
  }).join('');
}

function tableRows(node) {
  return (node.content||[]).filter(r=>r.type==='tableRow').map(r =>
    (r.content||[]).map(c => plainText(c).replace(/\|/g,'\\|').trim() || ' ')
  );
}

function workerPlainText(json, opts) {
  const { title = 'Document' } = opts;
  const lines = [title.toUpperCase(), '='.repeat(Math.min(title.length,72)), ''];
  nodesPlain(json.content||[], lines, 0);
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

function nodesPlain(nodes, lines, d) {
  for (const n of nodes) {
    switch(n.type) {
      case 'heading': { const t=plainText(n); lines.push('',t,'-'.repeat(Math.min(t.length,72)),''); break; }
      case 'paragraph': lines.push(plainText(n)||''); break;
      case 'blockquote': { const i=[]; nodesPlain(n.content||[],i,d); lines.push(...i.map(l=>'    | '+l),''); break; }
      case 'codeBlock': lines.push('    '+plainText(n).split('\n').join('\n    '),''); break;
      case 'bulletList': for(const it of n.content||[]) lines.push('  '.repeat(d)+'\u2022 '+plainText(it)); lines.push(''); break;
      case 'orderedList': { let i=1; for(const it of n.content||[]) lines.push('  '.repeat(d)+i+++'. '+plainText(it)); lines.push(''); break; }
      case 'horizontalRule': lines.push('','\u2500'.repeat(72),''); break;
      default: if(n.content) nodesPlain(n.content,lines,d); break;
    }
  }
}

function workerJSON(json, opts) {
  const { title='Document', author='Athena Editor' } = opts;
  const plain = (n) => { if(n.text) return n.text; return (n.content||[]).map(plain).join(''); };
  const all   = (nodes) => nodes.map(plain).join(' ');
  const wc    = all(json.content||[]).trim().split(/\s+/).filter(Boolean).length;
  const out   = { version:'2.0', schemaVersion: json.version??1,
    metadata:{ title, author, exportedAt: new Date().toISOString(),
               generator:'Athena Editor', generatorVersion:'2.0',
               wordCount:wc, nodeCount:(json.content||[]).length },
    content: json };
  return JSON.stringify(out, null, 2);
}
`.trim();
  }
}