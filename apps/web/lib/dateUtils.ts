/**
 * Date and Time Utilities
 * Formats dates and times using user's timezone preference
 */

/**
 * Format date in "Month Day, Year" format (e.g., "November 29, 2024")
 */
export function formatDate(date: Date | number, timezone?: string): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format time in 12-hour AM/PM format (e.g., "3:45 PM")
 */
export function formatTime(date: Date | number, timezone?: string): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date and time together: "Month Day, Year at H:MM AM/PM"
 * (e.g., "November 29, 2024 at 3:45 PM")
 */
export function formatDateTime(date: Date | number, timezone?: string): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  const dateStr = formatDate(dateObj, timezone);
  const timeStr = formatTime(dateObj, timezone);
  
  return `${dateStr} at ${timeStr}`;
}

/**
 * Format date range: "Month Day, Year to Month Day, Year"
 * (e.g., "November 1, 2024 to November 29, 2024")
 */
export function formatDateRange(
  startDate: Date | number,
  endDate: Date | number,
  timezone?: string
): string {
  const startStr = formatDate(startDate, timezone);
  const endStr = formatDate(endDate, timezone);
  
  return `${startStr} to ${endStr}`;
}

/**
 * Get current date and time in user's timezone
 */
export function getCurrentDateTime(timezone?: string): {
  date: string;
  time: string;
  dateTime: string;
  timestamp: number;
} {
  const now = new Date();
  
  return {
    date: formatDate(now, timezone),
    time: formatTime(now, timezone),
    dateTime: formatDateTime(now, timezone),
    timestamp: now.getTime(),
  };
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC
 * This prevents timezone shifts when displaying dates
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the date at local midnight
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at local midnight (not UTC)
  return new Date(year, month - 1, day);
}

/**
 * Format a date string (YYYY-MM-DD) or timestamp to a localized date string
 * Handles timezone issues by parsing date strings as local dates
 * 
 * @param dateInput - Either a date string (YYYY-MM-DD) or a timestamp number
 * @returns Formatted date string in user's locale
 */
export function formatTransactionDate(dateInput: string | number): string {
  if (typeof dateInput === 'number') {
    // It's a timestamp, use it directly
    return new Date(dateInput).toLocaleDateString();
  }
  
  // It's a date string, parse it as local date to avoid timezone shifts
  const localDate = parseLocalDate(dateInput);
  return localDate.toLocaleDateString();
}

