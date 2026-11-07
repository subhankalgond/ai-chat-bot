import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ParsedFileResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  isImage: boolean;
  base64Data?: string;
  mimeType?: string;
}

export async function parseFileBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFileResult> {
  const isImage = mimeType.startsWith('image/');
  const lowerName = fileName.toLowerCase();

  // 1. If Image: convert to base64 Data URL for multimodal AI consumption
  if (isImage) {
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return {
      fileName,
      fileType: mimeType,
      fileSize: buffer.length,
      extractedText: `[Image: ${fileName} attached for visual analysis]`,
      isImage: true,
      base64Data,
      mimeType,
    };
  }

  // 2. If Plain Text or Markdown or JSON
  if (
    mimeType.includes('text') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.py') ||
    lowerName.endsWith('.js') ||
    lowerName.endsWith('.ts')
  ) {
    const text = buffer.toString('utf-8');
    return {
      fileName,
      fileType: mimeType || 'text/plain',
      fileSize: buffer.length,
      extractedText: text,
      isImage: false,
      mimeType,
    };
  }

  // 3. If CSV or Excel (XLSX, XLS)
  if (
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('csv')
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let allSheetsText = '';

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        allSheetsText += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`;
      });

      return {
        fileName,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: buffer.length,
        extractedText: allSheetsText.trim(),
        isImage: false,
        mimeType,
      };
    } catch (e: any) {
      console.error('Error parsing spreadsheet:', e);
      return {
        fileName,
        fileType: mimeType,
        fileSize: buffer.length,
        extractedText: `[Could not parse spreadsheet ${fileName}: ${e.message}]`,
        isImage: false,
      };
    }
  }

  // 4. If DOCX Word Document
  if (lowerName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        fileName,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: buffer.length,
        extractedText: result.value,
        isImage: false,
        mimeType,
      };
    } catch (e: any) {
      console.error('Error parsing docx:', e);
      return {
        fileName,
        fileType: mimeType,
        fileSize: buffer.length,
        extractedText: `[Could not parse docx ${fileName}: ${e.message}]`,
        isImage: false,
      };
    }
  }

  // 5. If PDF
  if (lowerName.endsWith('.pdf') || mimeType.includes('pdf')) {
    try {
      // Dynamic import to handle pdf-parse safely
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return {
        fileName,
        fileType: 'application/pdf',
        fileSize: buffer.length,
        extractedText: data.text || `[PDF document ${fileName} with ${data.numpages || 1} pages]`,
        isImage: false,
        mimeType,
      };
    } catch (e: any) {
      console.warn('pdf-parse fallback warning:', e);
      // Fallback text extraction
      const textCandidate = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return {
        fileName,
        fileType: 'application/pdf',
        fileSize: buffer.length,
        extractedText: textCandidate.length > 100
          ? textCandidate.slice(0, 4000)
          : `[Attached PDF Document: ${fileName} (${buffer.length} bytes)]`,
        isImage: false,
        mimeType,
      };
    }
  }

  // Default fallback for other binary/unknown files
  return {
    fileName,
    fileType: mimeType || 'application/octet-stream',
    fileSize: buffer.length,
    extractedText: `[File attached: ${fileName} (${buffer.length} bytes)]`,
    isImage: false,
    mimeType,
  };
}
