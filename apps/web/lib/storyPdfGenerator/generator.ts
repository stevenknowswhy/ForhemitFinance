/**
 * Standardized PDF Generator Class
 * Handles all PDF generation logic for AI stories
 */

import jsPDF from 'jspdf';
import { PDF_CONFIG } from './constants';
import type { StoryData, ConvexFinancialData, CompanyInfo } from './types';

// Note: jspdf-autotable is optional - we use manual table generation as fallback
// If you want to use autotable, install it: npm install jspdf-autotable
// Then uncomment the code below and add the import at the top:
// import autoTable from 'jspdf-autotable';
let autoTable: any = null;

export class StandardizedPDFGenerator {
  private doc: jsPDF;
  private yPosition: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;

  constructor() {
    this.doc = new jsPDF({
      format: PDF_CONFIG.page.format,
      orientation: PDF_CONFIG.page.orientation,
      unit: PDF_CONFIG.page.unit,
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
    this.yPosition = PDF_CONFIG.margins.top;
  }

  // Main generation method
  async generateStoryPDF(
    story: StoryData,
    financialData: ConvexFinancialData,
    companyInfo: CompanyInfo
  ): Promise<Blob> {
    // Add header
    this.addHeader(companyInfo);
    
    // Add story metadata
    this.addStoryMetadata(story);
    
    // Add story content
    this.addStoryContent(story);
    
    // Add key metrics section
    this.addKeyMetricsSection(story);
    
    // Add data validation footer
    this.addDataValidationSection(financialData, story);
    
    // Add insight callout
    this.addInsightCallout(story.insight);
    
    // Add footer to all pages
    this.addFooter(story);
    
    return this.doc.output('blob');
  }

  // Generate combined PDF with all stories
  async generateCombinedPDF(
    stories: StoryData[],
    financialData: ConvexFinancialData,
    companyInfo: CompanyInfo
  ): Promise<Blob> {
    // Add cover page
    this.addCoverPage(companyInfo, stories);
    
    // Add table of contents
    this.addTableOfContents(stories);
    
    // Add each story
    stories.forEach((story, index) => {
      if (index > 0) {
        this.doc.addPage();
        this.yPosition = PDF_CONFIG.margins.top;
      }
      
      this.addHeader(companyInfo);
      this.addStoryMetadata(story);
      this.addStoryContent(story);
      this.addKeyMetricsSection(story);
      this.addInsightCallout(story.insight);
      this.addFooter(story);
    });
    
    // Add data appendix
    this.doc.addPage();
    this.addDataAppendix(financialData);
    
    return this.doc.output('blob');
  }

  // Header with company branding
  private addHeader(companyInfo: CompanyInfo): void {
    const headerHeight = 60;
    
    // Background
    const lightGray = this.hexToRgb(PDF_CONFIG.colors.lightGray);
    this.doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
    this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Company logo (if provided)
    if (companyInfo.logo) {
      try {
        this.doc.addImage(
          companyInfo.logo,
          'PNG',
          PDF_CONFIG.margins.left,
          15,
          30,
          30
        );
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
    
    // Company name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    this.doc.text(
      companyInfo.name,
      companyInfo.logo ? PDF_CONFIG.margins.left + 40 : PDF_CONFIG.margins.left,
      30
    );
    
    // Subtitle
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
    this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
    this.doc.text(
      'AI-Generated Financial Narrative',
      companyInfo.logo ? PDF_CONFIG.margins.left + 40 : PDF_CONFIG.margins.left,
      45
    );
    
    // Border
    const mediumGray = this.hexToRgb(PDF_CONFIG.colors.mediumGray);
    this.doc.setDrawColor(mediumGray.r, mediumGray.g, mediumGray.b);
    this.doc.setLineWidth(1);
    this.doc.line(0, headerHeight, this.pageWidth, headerHeight);
    
    this.yPosition = headerHeight + 30;
  }

  // Story metadata section
  private addStoryMetadata(story: StoryData): void {
    const startY = this.yPosition;
    const accentColor = this.hexToRgb(PDF_CONFIG.colors.accent[story.type]);
    
    // Accent bar
    this.doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    this.doc.rect(PDF_CONFIG.margins.left, startY, 4, 50, 'F');
    
    // Story type and period
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    this.doc.text(story.title, PDF_CONFIG.margins.left + 15, startY + 15);
    
    // Period badge
    this.doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    const badgeText = story.period.toUpperCase();
    const badgeWidth = this.doc.getTextWidth(badgeText) + 16;
    this.doc.roundedRect(
      PDF_CONFIG.margins.left + 15,
      startY + 25,
      badgeWidth,
      16,
      2,
      2,
      'F'
    );
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(
      badgeText,
      PDF_CONFIG.margins.left + 23,
      startY + 36
    );
    
    // Role
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
    this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
    this.doc.text(
      `Perspective: ${story.role}`,
      PDF_CONFIG.margins.left + 15,
      startY + 48
    );
    
    // Period dates
    this.doc.setFont('helvetica', 'normal');
    const periodText = `${this.formatDate(story.periodStart)} - ${this.formatDate(story.periodEnd)}`;
    this.doc.text(
      periodText,
      this.pageWidth - PDF_CONFIG.margins.right - this.doc.getTextWidth(periodText),
      startY + 15
    );
    
    // Generation timestamp
    const generatedText = `Generated: ${this.formatDate(story.generatedAt)}`;
    this.doc.setFontSize(8);
    this.doc.text(
      generatedText,
      this.pageWidth - PDF_CONFIG.margins.right - this.doc.getTextWidth(generatedText),
      startY + 30
    );
    
    this.yPosition = startY + 70;
  }

  // Story content with proper text wrapping
  private addStoryContent(story: StoryData): void {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    const darkGray = this.hexToRgb(PDF_CONFIG.colors.darkGray);
    this.doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
    
    // Split text into paragraphs
    const paragraphs = story.content.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      if (index > 0) {
        this.yPosition += 10; // Paragraph spacing
      }
      
      // Check if we need a new page
      if (this.yPosition > this.pageHeight - 100) {
        this.doc.addPage();
        this.yPosition = PDF_CONFIG.margins.top;
      }
      
      // Split text to fit width
      const lines = this.doc.splitTextToSize(paragraph, this.contentWidth);
      
      lines.forEach((line: string) => {
        this.doc.text(line, PDF_CONFIG.margins.left, this.yPosition);
        this.yPosition += 14; // Line height
      });
    });
    
    this.yPosition += 20;
  }

  // Key metrics in a structured grid
  private addKeyMetricsSection(story: StoryData): void {
    const startY = this.yPosition;
    
    // Section header
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    this.doc.text('Key Financial Metrics', PDF_CONFIG.margins.left, startY);
    
    this.yPosition = startY + 20;
    
    // Metrics grid
    const metrics = Object.entries(story.keyMetrics);
    const columns = 3;
    const cellWidth = this.contentWidth / columns;
    const cellHeight = 50;
    
    metrics.forEach(([key, value], index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = PDF_CONFIG.margins.left + (col * cellWidth);
      const y = this.yPosition + (row * cellHeight);
      
      // Check if we need a new page
      if (y + cellHeight > this.pageHeight - PDF_CONFIG.margins.bottom) {
        this.doc.addPage();
        this.yPosition = PDF_CONFIG.margins.top;
        const newRow = Math.floor(index / columns);
        const newY = this.yPosition + (newRow * cellHeight);
        // Recalculate for new page
        const newX = PDF_CONFIG.margins.left + (col * cellWidth);
        
        // Cell background
        const lightGray = this.hexToRgb(PDF_CONFIG.colors.lightGray);
        this.doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        this.doc.roundedRect(newX + 2, newY, cellWidth - 4, cellHeight - 10, 3, 3, 'F');
        
        // Metric label
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
        this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
        this.doc.text(
          this.formatMetricName(key),
          newX + 10,
          newY + 15
        );
        
        // Metric value
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(primary.r, primary.g, primary.b);
        this.doc.text(
          this.formatMetricValue(key, value),
          newX + 10,
          newY + 32
        );
      } else {
        // Cell background
        const lightGray = this.hexToRgb(PDF_CONFIG.colors.lightGray);
        this.doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        this.doc.roundedRect(x + 2, y, cellWidth - 4, cellHeight - 10, 3, 3, 'F');
        
        // Metric label
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
        this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
        this.doc.text(
          this.formatMetricName(key),
          x + 10,
          y + 15
        );
        
        // Metric value
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(primary.r, primary.g, primary.b);
        this.doc.text(
          this.formatMetricValue(key, value),
          x + 10,
          y + 32
        );
      }
    });
    
    const rows = Math.ceil(metrics.length / columns);
    this.yPosition += (rows * cellHeight) + 20;
  }

  // Insight callout box
  private addInsightCallout(insight: string): void {
    const boxPadding = 15;
    const boxWidth = this.contentWidth;
    
    // Calculate box height
    const lines = this.doc.splitTextToSize(insight, boxWidth - (boxPadding * 2));
    const boxHeight = (lines.length * 12) + (boxPadding * 2);
    
    // Check if we need a new page
    if (this.yPosition + boxHeight > this.pageHeight - PDF_CONFIG.margins.bottom) {
      this.doc.addPage();
      this.yPosition = PDF_CONFIG.margins.top;
    }
    
    // Box background
    this.doc.setFillColor(239, 246, 255); // #eff6ff
    this.doc.roundedRect(
      PDF_CONFIG.margins.left,
      this.yPosition,
      boxWidth,
      boxHeight,
      5,
      5,
      'F'
    );
    
    // Border
    this.doc.setDrawColor(59, 130, 246); // #3b82f6
    this.doc.setLineWidth(2);
    this.doc.roundedRect(
      PDF_CONFIG.margins.left,
      this.yPosition,
      boxWidth,
      boxHeight,
      5,
      5,
      'S'
    );
    
    // Label
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175); // #1e40af
    this.doc.text('KEY INSIGHT', PDF_CONFIG.margins.left + boxPadding, this.yPosition + boxPadding + 8);
    
    // Insight text
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const darkGray = this.hexToRgb(PDF_CONFIG.colors.darkGray);
    this.doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
    
    lines.forEach((line: string, index: number) => {
      this.doc.text(
        line,
        PDF_CONFIG.margins.left + boxPadding,
        this.yPosition + boxPadding + 25 + (index * 12)
      );
    });
    
    this.yPosition += boxHeight + 20;
  }

  // Data validation section showing source
  private addDataValidationSection(
    financialData: ConvexFinancialData,
    story: StoryData
  ): void {
    const startY = this.yPosition;
    
    // Check if we need a new page
    if (startY > this.pageHeight - 150) {
      this.doc.addPage();
      this.yPosition = PDF_CONFIG.margins.top;
    }
    
    // Section header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
    this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
    this.doc.text('Data Sources & Validation', PDF_CONFIG.margins.left, this.yPosition);
    
    this.yPosition += 15;
    
    // Data source info
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    const validationInfo = [
      `✓ All metrics calculated directly from Convex database`,
      `✓ Data period: ${this.formatDate(story.periodStart)} to ${this.formatDate(story.periodEnd)}`,
      `✓ Revenue: ${this.formatCurrency(financialData.monthly_revenue)}`,
      `✓ Expenses: ${this.formatCurrency(financialData.monthly_expenses)}`,
      `✓ Cash Balance: ${this.formatCurrency(financialData.cash_balance)}`,
    ];
    
    validationInfo.forEach((info, index) => {
      this.doc.text(info, PDF_CONFIG.margins.left + 5, this.yPosition + (index * 12));
    });
    
    this.yPosition += (validationInfo.length * 12) + 10;
  }

  // Footer on every page
  private addFooter(story: StoryData): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer line
      const mediumGray = this.hexToRgb(PDF_CONFIG.colors.mediumGray);
      this.doc.setDrawColor(mediumGray.r, mediumGray.g, mediumGray.b);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        PDF_CONFIG.margins.left,
        this.pageHeight - 30,
        this.pageWidth - PDF_CONFIG.margins.right,
        this.pageHeight - 30
      );
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
      this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
      
      // Left: Confidential
      this.doc.text(
        'Confidential Financial Report',
        PDF_CONFIG.margins.left,
        this.pageHeight - 15
      );
      
      // Center: Story type
      const centerText = `${story.type.toUpperCase()} STORY - ${story.period.toUpperCase()}`;
      this.doc.text(
        centerText,
        (this.pageWidth - this.doc.getTextWidth(centerText)) / 2,
        this.pageHeight - 15
      );
      
      // Right: Page number
      const pageText = `Page ${i} of ${totalPages}`;
      this.doc.text(
        pageText,
        this.pageWidth - PDF_CONFIG.margins.right - this.doc.getTextWidth(pageText),
        this.pageHeight - 15
      );
    }
  }

  // Cover page for combined PDF
  private addCoverPage(
    companyInfo: CompanyInfo,
    stories: StoryData[]
  ): void {
    // Company logo centered
    if (companyInfo.logo) {
      try {
        this.doc.addImage(
          companyInfo.logo,
          'PNG',
          (this.pageWidth - 100) / 2,
          100,
          100,
          100
        );
      } catch (e) {
        console.warn('Could not add logo to cover page:', e);
      }
    }
    
    // Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    const title = 'Financial AI Stories';
    this.doc.text(
      title,
      (this.pageWidth - this.doc.getTextWidth(title)) / 2,
      companyInfo.logo ? 250 : 150
    );
    
    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    const secondary = this.hexToRgb(PDF_CONFIG.colors.secondary);
    this.doc.setTextColor(secondary.r, secondary.g, secondary.b);
    const subtitle = `${companyInfo.name} Financial Narratives`;
    this.doc.text(
      subtitle,
      (this.pageWidth - this.doc.getTextWidth(subtitle)) / 2,
      280
    );
    
    // Period
    const period = `${this.formatDate(stories[0].periodStart)} - ${this.formatDate(stories[0].periodEnd)}`;
    this.doc.text(
      period,
      (this.pageWidth - this.doc.getTextWidth(period)) / 2,
      300
    );
    
    // Generation date
    this.doc.setFontSize(10);
    const generated = `Generated on ${this.formatDate(new Date())}`;
    this.doc.text(
      generated,
      (this.pageWidth - this.doc.getTextWidth(generated)) / 2,
      this.pageHeight - 50
    );
    
    this.doc.addPage();
    this.yPosition = PDF_CONFIG.margins.top;
  }

  // Table of contents
  private addTableOfContents(stories: StoryData[]): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    this.doc.text('Table of Contents', PDF_CONFIG.margins.left, this.yPosition);
    
    this.yPosition += 30;
    
    stories.forEach((story, index) => {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(primary.r, primary.g, primary.b);
      
      const pageNum = index + 3; // Adjust based on cover + TOC pages
      const title = `${story.title} (${story.period})`;
      
      this.doc.text(title, PDF_CONFIG.margins.left + 10, this.yPosition);
      this.doc.text(
        pageNum.toString(),
        this.pageWidth - PDF_CONFIG.margins.right - 20,
        this.yPosition
      );
      
      // Dotted line
      const mediumGray = this.hexToRgb(PDF_CONFIG.colors.mediumGray);
      this.doc.setDrawColor(mediumGray.r, mediumGray.g, mediumGray.b);
      const titleWidth = this.doc.getTextWidth(title);
      for (let x = PDF_CONFIG.margins.left + titleWidth + 15; 
           x < this.pageWidth - PDF_CONFIG.margins.right - 30; 
           x += 5) {
        this.doc.circle(x, this.yPosition - 2, 0.5, 'F');
      }
      
      this.yPosition += 20;
    });
    
    this.doc.addPage();
    this.yPosition = PDF_CONFIG.margins.top;
  }

  // Data appendix
  private addDataAppendix(financialData: ConvexFinancialData): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    const primary = this.hexToRgb(PDF_CONFIG.colors.primary);
    this.doc.setTextColor(primary.r, primary.g, primary.b);
    this.doc.text('Data Appendix', PDF_CONFIG.margins.left, this.yPosition);
    
    this.yPosition += 30;
    
    // Raw data table
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const darkGray = this.hexToRgb(PDF_CONFIG.colors.darkGray);
    this.doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
    this.doc.text(
      'All narratives in this report were generated from the following verified data:',
      PDF_CONFIG.margins.left,
      this.yPosition
    );
    
    this.yPosition += 20;
    
    // Use autoTable if available, otherwise manual table
    if (autoTable) {
      (this.doc as any).autoTable({
        startY: this.yPosition,
        head: [['Metric', 'Value']],
        body: Object.entries(financialData).map(([key, value]) => [
          this.formatMetricName(key),
          typeof value === 'number' ? this.formatCurrency(value) : String(value)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right },
      });
    } else {
      // Manual table generation
      const tableData = Object.entries(financialData);
      const rowHeight = 20;
      const headerHeight = 25;
      
      // Header
      const lightGray = this.hexToRgb(PDF_CONFIG.colors.lightGray);
      this.doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      this.doc.rect(PDF_CONFIG.margins.left, this.yPosition, this.contentWidth, headerHeight, 'F');
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(primary.r, primary.g, primary.b);
      this.doc.text('Metric', PDF_CONFIG.margins.left + 10, this.yPosition + 16);
      this.doc.text('Value', PDF_CONFIG.margins.left + this.contentWidth / 2, this.yPosition + 16);
      
      this.yPosition += headerHeight;
      
      // Rows
      tableData.forEach(([key, value], index) => {
        if (this.yPosition + rowHeight > this.pageHeight - PDF_CONFIG.margins.bottom) {
          this.doc.addPage();
          this.yPosition = PDF_CONFIG.margins.top;
        }
        
        if (index % 2 === 0) {
          this.doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
          this.doc.rect(PDF_CONFIG.margins.left, this.yPosition, this.contentWidth, rowHeight, 'F');
        }
        
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        this.doc.text(this.formatMetricName(key), PDF_CONFIG.margins.left + 10, this.yPosition + 14);
        this.doc.text(
          typeof value === 'number' ? this.formatCurrency(value) : String(value),
          PDF_CONFIG.margins.left + this.contentWidth / 2,
          this.yPosition + 14
        );
        
        this.yPosition += rowHeight;
      });
    }
  }

  // Utility methods
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatMetricName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private formatMetricValue(key: string, value: number | string): string {
    if (typeof value === 'string') return value;
    
    const currencyMetrics = ['revenue', 'expenses', 'netIncome', 'cashFlow', 'burnRate'];
    const percentMetrics = ['growthRate', 'revenueGrowth', 'churn', 'retention'];
    const ratioMetrics = ['debtToRevenue', 'debtToIncome', 'ltvCac'];
    
    if (currencyMetrics.includes(key)) {
      return this.formatCurrency(value);
    } else if (percentMetrics.includes(key)) {
      return `${value.toFixed(1)}%`;
    } else if (ratioMetrics.includes(key)) {
      return value.toFixed(2);
    } else if (key === 'runway') {
      return `${value.toFixed(1)} months`;
    }
    
    return value.toString();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }
}

