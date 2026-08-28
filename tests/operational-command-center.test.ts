import { describe, it, expect } from "vitest";
import { store } from "../src/services/store.service";
import { OperationalDashboardMetricsSchema } from "../src/domain/dashboard/operational-metrics.schema";

describe("MÓDULO CONSOLIDAÇÃO & CENTRAL OPERACIONAL (ONDA 6)", () => {
  it("deve agregar métricas da Central Operacional com schema válido", () => {
    store.initClient();
    const metrics = store.getOperationalDashboardMetrics();

    const parsed = OperationalDashboardMetricsSchema.safeParse(metrics);
    expect(parsed.success).toBe(true);

    expect(metrics.totalPatients).toBeGreaterThan(0);
    expect(metrics.visitsTodayTotal).toBeGreaterThanOrEqual(0);
    expect(metrics.familySatisfactionRating).toBeGreaterThanOrEqual(1);
    expect(metrics.familySatisfactionRating).toBeLessThanOrEqual(5);
  });

  it("deve permitir filtro das métricas por unidade assistencial", () => {
    store.initClient();
    const metricsIlheus = store.getOperationalDashboardMetrics("unit_ilheus");
    const metricsItabuna = store.getOperationalDashboardMetrics("unit_itabuna");

    expect(metricsIlheus).toBeDefined();
    expect(metricsItabuna).toBeDefined();
    expect(metricsIlheus.totalPatients).toBeGreaterThanOrEqual(1);
  });
});
