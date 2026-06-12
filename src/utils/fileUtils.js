// PDF text extraction using pdf.js loaded from CDN
let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { pdfjsLib = window.pdfjsLib; resolve(pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function extractTextFromPDF(base64Data) {
  try {
    const lib = await loadPdfJs();
    // Convert base64 to Uint8Array
    const binaryStr = atob(base64Data.split(',')[1] || base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const pdf = await lib.getDocument({ data: bytes }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20); // cap at 20 pages for API limits

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += `\n[Page ${i}]\n${pageText}`;
    }
    return fullText.trim();
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error('Could not extract text from PDF. The file may be scanned/image-based.');
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getFileIcon(type) {
  if (!type) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('image')) return '🖼️';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
  return '📄';
}

export function getFileType(mimeType) {
  if (!mimeType) return 'document';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('audio')) return 'audio';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slides';
  return 'document';
}
