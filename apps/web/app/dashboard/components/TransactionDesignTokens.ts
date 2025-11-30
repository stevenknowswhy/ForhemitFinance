/**
 * Design Tokens for Transaction Module
 * Following the 8px grid system and design specifications
 */

export const transactionColors = {
  primary: "#0066FF", // Vibrant blue for Save
  success: "#00C853", // Green for AI-confirmed suggestions
  warning: "#FFC107", // Amber for "needs review"
  error: "#F44336", // Red for validation failures
} as const;

export const transactionTypography = {
  heading: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 600,
    fontSize: "18px",
  },
  body: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 400,
    fontSize: "16px",
  },
  input: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 400,
    fontSize: "18px", // Easy to scan
  },
  microcopy: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    opacity: 0.7,
  },
} as const;

export const transactionSpacing = {
  // 8px grid system
  xs: "4px",   // 0.5 * 8px
  sm: "8px",   // 1 * 8px
  md: "16px",  // 2 * 8px
  lg: "24px",  // 3 * 8px
  xl: "32px",  // 4 * 8px
} as const;

export const transactionAnimations = {
  modalEnter: "200ms ease-out",
  accordionExpand: "300ms ease-out",
  pulse: "1s ease-in-out",
} as const;

export const transactionSizes = {
  tapTarget: "44px", // Minimum tap target (iOS/Android standard)
  inputHeight: "44px",
  buttonHeight: "44px",
} as const;

