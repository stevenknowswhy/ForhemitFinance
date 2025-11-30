/**
 * PDF Generation Utility
 * Uses html2pdf.js to generate PDFs from HTML elements
 * 
 * Security: All user inputs are sanitized to prevent XSS and path traversal attacks
 */

import html2pdf from "html2pdf.js";

export interface PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number; useCORS: boolean };
  jsPDF?: { unit: string; format: string; orientation: string };
}

const defaultOptions: PdfOptions = {
  margin: [10, 10, 10, 10],
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
};

/**
 * Sanitize filename to prevent path traversal and XSS attacks
 * @param filename - Raw filename input
 * @returns Sanitized filename safe for file system
 */
function sanitizeFilename(filename: string): string {
  // Remove any path separators and dangerous characters
  return filename
    .replace(/[\/\\?%*:|"<>]/g, "-") // Replace dangerous characters with dash
    .replace(/\.\./g, "") // Remove path traversal attempts
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\.+$/, "") // Remove trailing dots
    .substring(0, 255) // Limit length to prevent filesystem issues
    .trim() || "report"; // Fallback to "report" if empty
}

/**
 * Sanitize text content to prevent XSS
 * @param text - Raw text input
 * @returns Sanitized text safe for display
 */
function sanitizeText(text: string): string {
  // Remove any HTML tags and dangerous characters
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 500) // Limit length
    .trim();
}

/**
 * Generate PDF from HTML element
 * @param element - HTML element to convert to PDF
 * @param filename - Name of the PDF file (without .pdf extension)
 * @param options - Optional PDF generation options
 */
export async function generatePDF(
  element: HTMLElement,
  filename: string,
  options?: Partial<PdfOptions>
): Promise<void> {
  // Validate inputs
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error("Invalid element provided for PDF generation");
  }

  if (!filename || typeof filename !== "string") {
    throw new Error("Invalid filename provided for PDF generation");
  }

  // Sanitize filename to prevent path traversal
  const sanitizedFilename = sanitizeFilename(filename);

  const opt = {
    ...defaultOptions,
    ...options,
    filename: `${sanitizedFilename}.pdf`,
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Generate PDF with custom options for reports
 * @param element - HTML element to convert to PDF
 * @param filename - Name of the PDF file
 * @param reportTitle - Title of the report for header
 * @param dateRange - Optional date range string
 */
export async function generateReportPDF(
  element: HTMLElement,
  filename: string,
  reportTitle?: string,
  dateRange?: string
): Promise<void> {
  // Validate inputs
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error("Invalid element provided for PDF generation");
  }

  if (!filename || typeof filename !== "string") {
    throw new Error("Invalid filename provided for PDF generation");
  }

  // Sanitize filename to prevent path traversal
  const sanitizedFilename = sanitizeFilename(filename);

  // Clone the element to avoid modifying the original
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Add report header if provided (sanitize all text inputs)
  if (reportTitle || dateRange) {
    const header = document.createElement("div");
    header.className = "report-header print-only";
    header.style.cssText = `
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    `;
    
    if (reportTitle) {
      const title = document.createElement("h1");
      // Use textContent (not innerHTML) to prevent XSS - already sanitized
      title.textContent = sanitizeText(reportTitle);
      title.style.cssText = "margin: 0; font-size: 24px; font-weight: bold;";
      header.appendChild(title);
    }
    
    if (dateRange) {
      const date = document.createElement("p");
      // Use textContent (not innerHTML) to prevent XSS - already sanitized
      date.textContent = sanitizeText(dateRange);
      date.style.cssText = "margin: 5px 0 0 0; font-size: 14px; color: #666;";
      header.appendChild(date);
    }
    
    clonedElement.insertBefore(header, clonedElement.firstChild);
  }

  const opt: PdfOptions = {
    ...defaultOptions,
    filename: `${sanitizedFilename}.pdf`,
    margin: [15, 15, 15, 15],
  };

  try {
    await html2pdf().set(opt).from(clonedElement).save();
  } catch (error) {
    console.error("Error generating report PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

