import { z } from "zod";

export const OperationalDashboardMetricsSchema = z.object({
  totalPatients: z.number().int().min(0),
  activeEpisodes: z.number().int().min(0),
  news2CriticalCount: z.number().int().min(0),
  news2MediumCount: z.number().int().min(0),
  news2StableCount: z.number().int().min(0),
  visitsTodayTotal: z.number().int().min(0),
  visitsCompleted: z.number().int().min(0),
  visitsInProgress: z.number().int().min(0),
  visitsScheduled: z.number().int().min(0),
  criticalSuppliesCount: z.number().int().min(0),
  criticalOxygenCount: z.number().int().min(0),
  activeWoundsCount: z.number().int().min(0),
  familySatisfactionRating: z.number().min(0).max(5),
  totalFamilyFeedbacks: z.number().int().min(0),
  offlineSyncPendingCount: z.number().int().min(0),
});
export type OperationalDashboardMetrics = z.infer<typeof OperationalDashboardMetricsSchema>;
