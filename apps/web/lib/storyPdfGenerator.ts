/**
 * Standardized PDF Generation System for AI Stories
 * This ensures consistent layout, formatting, and data accuracy
 * 
 * This file re-exports all PDF generation functionality from organized modules.
 * The actual implementation is split across:
 * - storyPdfGenerator/types.ts - Type definitions
 * - storyPdfGenerator/constants.ts - PDF configuration constants
 * - storyPdfGenerator/generator.ts - PDFGenerator class
 * - storyPdfGenerator/utils.ts - Utility functions
 */

// Re-export types
export type {
  StoryData,
  ConvexFinancialData,
  CompanyInfo,
} from './storyPdfGenerator/types';

// Re-export constants
export { PDF_CONFIG } from './storyPdfGenerator/constants';

// Re-export class
export { StandardizedPDFGenerator } from './storyPdfGenerator/generator';

// Re-export utilities
export { generateAndDownloadPDF } from './storyPdfGenerator/utils';
