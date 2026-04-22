import mammoth from 'mammoth';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import { extractPdfTextToHtml } from './pdfImport';

export class DocumentImporter {
  /**
   * Main entry point for importing files
   * @param {File} file 
   * @returns {Promise<{html: string, json?: object, title: string}>}
   */
  static async importFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const title = file.name.replace(/\.[^/.]+$/, "");

    let html = '';
    let json = null;

    switch (extension) {
      case 'docx':
        html = await this.importDocx(file);
        break;
      case 'pdf':
        html = await this.importPdf(file);
        break;
      case 'md':
      case 'markdown':
        html = await this.importMarkdown(file);
        break;
      case 'html':
      case 'htm':
        html = await this.importHtml(file);
        break;
      case 'txt':
        html = await this.importPlainText(file);
        break;
      case 'json':
        const result = await this.importJson(file);
        if (typeof result === 'string') {
          html = result;
        } else {
          json = result;
        }
        break;
      case 'epub':
        html = await this.importEpub(file);
        break;
      default:
        throw new Error(`Unsupported file format: .${extension}`);
    }

    return {
      html: html ? DOMPurify.sanitize(html) : '',
      json,
      title
    };
  }


  static async importDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    // Mammoth maps DOCX styles to semantic HTML
    const options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
      ],
      // Conversion options for images
      convertImage: mammoth.images.imgElement((image) => {
        return image.read("base64").then((imageBuffer) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
          };
        });
      }),
    };
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    // Inject modern styling for tables and images so they are visible and professional
    const styledHtml = result.value
      .replace(/<table/g, '<table class="table-border-black" style="border-collapse: collapse; min-width: 100%; border: 1px solid #e2e8f0; margin: 16px 0;"')
      .replace(/<td/g, '<td style="border: 1px solid #e2e8f0; padding: 12px; min-width: 50px;"')
      .replace(/<th/g, '<th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold;"')
      .replace(/<img/g, '<img style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;"');

    return styledHtml;
  }


  static async importPdf(file) {
    // Current PDF extraction is text-based but layout-aware.
    // For "Exact Format", we could consider OCR or rasterization fallback,
    // but this layout-aware extraction is the best balance for editability.
    return await extractPdfTextToHtml(file);
  }


  static async importMarkdown(file) {
    const text = await file.text();
    return marked.parse(text);
  }

  static async importHtml(file) {
    return await file.text();
  }

  static async importPlainText(file) {
    const text = await file.text();
    return text.split('\n').map(line => `<p>${this.escapeHtml(line)}</p>`).join('');
  }

  static async importJson(file) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      // If it's TipTap JSON, return the object directly
      if (json && json.type === 'doc') {
        return json;
      }
      return `<pre>${this.escapeHtml(text)}</pre>`;
    } catch (e) {
      return `<pre>${this.escapeHtml(text)}</pre>`;
    }
  }


  static async importEpub(file) {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Get all images and convert to data URLs
    const imageFiles = Object.keys(zip.files).filter(name => 
      /\.(png|jpe?g|gif|svg|webp)$/i.test(name)
    );
    
    const imageUrlMap = {};
    for (const imageName of imageFiles) {
      const imgData = await zip.files[imageName].async('base64');
      const ext = imageName.split('.').pop().toLowerCase();
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      imageUrlMap[imageName] = `data:${mime};base64,${imgData}`;
    }

    // 2. Extract content files
    let combinedHtml = '';
    const contentFiles = Object.keys(zip.files).filter(name => 
      name.endsWith('.xhtml') || name.endsWith('.html') || name.endsWith('.htm')
    );
    
    contentFiles.sort();

    for (const name of contentFiles) {
      let content = await zip.files[name].async('text');
      
      // Update image sources to data URLs
      for (const [originalPath, dataUrl] of Object.entries(imageUrlMap)) {
        // Handle both absolute and relative paths in EPUB
        const fileName = originalPath.split('/').pop();
        const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        content = content.replace(new RegExp(`src="[^"]*${escapedFileName}"`, 'g'), `src="${dataUrl}"`);
      }

      // Extract body content
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        combinedHtml += bodyMatch[1];
      } else {
        combinedHtml += content;
      }
      combinedHtml += '<hr class="chapter-break" style="margin: 40px 0; border: 1px dashed #cbd5e1;"/>';
    }

    return combinedHtml || '<p>Unable to extract content from EPUB.</p>';
  }


  static escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
