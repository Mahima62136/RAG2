import fs from 'node:fs/promises';
import path from 'node:path';
import { extractText } from 'unpdf';
import mammoth from 'mammoth';

// Function: Extract readable text from various file types.
// This supports PDF, DOCX, and plain TXT files, converting them into plain text for further processing.
export const extractTextFromFile = async (filePath) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  let text = '';

  try {
    // Determine the file type and use the appropriate extraction method.
    switch (fileExtension) {
      case '.pdf': {
        // For PDFs, read the file as a buffer and use the unpdf library to extract text.
        const pdfBuffer = await fs.readFile(filePath);
        const result = await extractText(new Uint8Array(pdfBuffer));

        let pdfText = result?.text;

        // Handle different possible formats from the PDF extraction library.
        // Sometimes it returns an array, sometimes a string, so we normalize it.
        if (Array.isArray(pdfText)) {
          text = pdfText.join(' ');
        } else if (typeof pdfText === 'string') {
          text = pdfText;
        } else if (pdfText) {
          text = String(pdfText);
        } else {
          throw new Error("PDF text extraction returned empty");
        }

        break;
      }

      case '.docx': {
        // For DOCX files, use the mammoth library to extract raw text from the document.
        const docxBuffer = await fs.readFile(filePath);
        const docxData = await mammoth.extractRawText({ buffer: docxBuffer });
        text = docxData.value || '';
        break;
      }

      case '.txt': {
        // For plain text files, just read the file directly as UTF-8.
        text = await fs.readFile(filePath, 'utf8');
        break;
      }

      default:
        // If the file type isn't supported, throw an error.
        throw new Error(`Unsupported file extension: ${fileExtension}`);
    }

    // Final safety check: Ensure the extracted text is a string.
    if (typeof text !== 'string') {
      text = String(text);
    }

    // Return the cleaned-up text, trimmed of extra whitespace.
    return text.trim();

  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};
