/**
 * Cron Jobs Configuration
 * Scheduled tasks for AI insights and automated processing
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ==========================================
// AI INSIGHTS CRON JOBS
// ==========================================

// Monthly insight generation - runs on the 1st of each month at 2:00 AM UTC
crons.monthly(
    "generateMonthlyInsights",
    { day: 1, hourUTC: 2, minuteUTC: 0 },
    internal.ai_insights.generateMonthlyInsightsInternal
);

// Anomaly detection - runs daily at 6:00 AM UTC
crons.daily(
    "detectAnomalies",
    { hourUTC: 6, minuteUTC: 0 },
    internal.ai_insights.generateAnomalyAlertsInternal
);

// ==========================================
// BILL PAY CRON JOBS
// ==========================================

// Process bill subscriptions - runs daily at 9:00 AM UTC
crons.daily(
    "processBillSubscriptions",
    { hourUTC: 9, minuteUTC: 0 },
    internal.scheduled.processBillSubscriptions
);

export default crons;

