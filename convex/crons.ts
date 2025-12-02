/**
 * Cron Jobs Configuration
 * Scheduled tasks for AI Stories auto-generation
 */

import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Monthly story generation - runs on the 1st of each month at 2:00 AM UTC
// TODO: Fix API path for internalAction - internal actions may not be in public API
// crons.monthly(
//   "generateMonthlyStories",
//   { day: 1, hourUTC: 2, minuteUTC: 0 },
//   api.scheduled.monthlyStoryGeneration
// );

// Quarterly story generation - runs on the 1st of each quarter (Jan, Apr, Jul, Oct) at 3:00 AM UTC  
// crons.monthly(
//   "generateQuarterlyStories",
//   { day: 1, hourUTC: 3, minuteUTC: 0 },
//   api.scheduled.quarterlyStoryGeneration
// );

// Annual story generation - runs on January 1st at 4:00 AM UTC
// crons.monthly(
//   "generateAnnualStories",
//   { day: 1, hourUTC: 4, minuteUTC: 0 },
//   api.scheduled.annualStoryGeneration
// );

export default crons;
