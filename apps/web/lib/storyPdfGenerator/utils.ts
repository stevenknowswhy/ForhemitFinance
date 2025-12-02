/**
 * Utility functions for PDF generation
 */

import { StandardizedPDFGenerator } from './generator';
import type { StoryData, ConvexFinancialData, CompanyInfo } from './types';

/**
 * Generate and download PDF for a single or combined story
 */
export async function generateAndDownloadPDF(
  storyType: 'single' | 'combined',
  stories: StoryData | StoryData[],
  financialData: ConvexFinancialData,
  companyInfo: CompanyInfo
) {
  const generator = new StandardizedPDFGenerator();
  
  let blob: Blob;
  let filename: string;
  
  if (storyType === 'single' && !Array.isArray(stories)) {
    blob = await generator.generateStoryPDF(stories, financialData, companyInfo);
    filename = `${stories.type}-story-${stories.period}-${Date.now()}.pdf`;
  } else if (storyType === 'combined' && Array.isArray(stories)) {
    blob = await generator.generateCombinedPDF(stories, financialData, companyInfo);
    filename = `all-stories-${Date.now()}.pdf`;
  } else {
    throw new Error('Invalid story type or data');
  }
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
}

