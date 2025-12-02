/**
 * PDF Layout Constants
 */

export const PDF_CONFIG = {
  page: {
    format: 'letter' as const,
    orientation: 'portrait' as const,
    unit: 'pt' as const,
  },
  margins: {
    top: 50,
    right: 40,
    bottom: 50,
    left: 40,
  },
  colors: {
    primary: '#1a202c',
    secondary: '#4a5568',
    accent: {
      company: '#0066cc',
      banker: '#059669',
      investor: '#7c3aed',
    },
    lightGray: '#f7fafc',
    mediumGray: '#e2e8f0',
    darkGray: '#2d3748',
  },
  fonts: {
    heading: { size: 20, weight: 'bold' },
    subheading: { size: 14, weight: 'bold' },
    body: { size: 10, weight: 'normal' },
    caption: { size: 8, weight: 'normal' },
  },
};

