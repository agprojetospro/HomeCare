import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  evaluateGeofence,
  isValidVisitTransition,
  VisitSchema,
  VisitCheckinSchema,
} from "../src/domain/visit/visit.schema";

describe("MÓDULO DE VISITAS, CHECK-IN & GEOFENCING (ONDA 2)", () => {
  // Coordenadas de referência em Ilhéus - BA
  const patientLocation = { latitude: -14.7935, longitude: -39.0465 };

  describe("[1] Motor Geodésico de Haversine", () => {
    it("deve retornar 0 metros para o mesmo ponto geográfico", () => {
      const distance = calculateHaversineDistance(patientLocation, patientLocation);
      expect(distance).toBe(0);
    });

    it("deve calcular corretamente a distância em metros para deslocamento próximo (~40m)", () => {
      // Variação de ~0.00036 graus de latitude em Ilhéus equivale a ~40 metros
      const nearbyLocation = { latitude: -14.79386, longitude: -39.0465 };
      const distance = calculateHaversineDistance(patientLocation, nearbyLocation);
      expect(distance).toBeGreaterThan(35);
      expect(distance).toBeLessThan(45);
    });

    it("deve calcular com precisão a distância para ~380m fora do domicílio", () => {
      const outsideLocation = { latitude: -14.7970, longitude: -39.0465 };
      const distance = calculateHaversineDistance(patientLocation, outsideLocation);
      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(420);
    });
  });

  describe("[2] Avaliador de Cerca Virtual (Geofencing 100m)", () => {
    it("deve aprovar check-in dentro do raio de 100m (INSIDE_GEOFENCE) sem requerer justificativa", () => {
      const profAtPatientHome = { latitude: -14.7936, longitude: -39.0466, accuracy: 8 };
      const result = evaluateGeofence(profAtPatientHome, patientLocation, 100);

      expect(result.geofenceResult).toBe("INSIDE_GEOFENCE");
      expect(result.isWithinRadius).toBe(true);
      expect(result.requiresOverride).toBe(false);
      expect(result.distanceMetros).toBeLessThan(100);
    });

    it("deve sinalizar OUTSIDE_GEOFENCE e exigir justificativa quando profissional está fora dos 100m", () => {
      const profFarAway = { latitude: -14.7970, longitude: -39.0465, accuracy: 10 };
      const result = evaluateGeofence(profFarAway, patientLocation, 100);

      expect(result.geofenceResult).toBe("OUTSIDE_GEOFENCE");
      expect(result.isWithinRadius).toBe(false);
      expect(result.requiresOverride).toBe(true);
      expect(result.distanceMetros).toBeGreaterThan(100);
    });

    it("deve detectar imprecisão do sensor GPS (LOW_ACCURACY > 150m) para evitar falsos-positivos", () => {
      const profBadSensor = { latitude: -14.7935, longitude: -39.0465, accuracy: 180 };
      const result = evaluateGeofence(profBadSensor, patientLocation, 100);

      expect(result.geofenceResult).toBe("LOW_ACCURACY");
      expect(result.isWithinRadius).toBe(true);
      expect(result.requiresOverride).toBe(false);
    });

    it("deve tratar ausência de coordenadas do profissional como LOCATION_UNAVAILABLE com override", () => {
      const result = evaluateGeofence(null, patientLocation, 100);

      expect(result.geofenceResult).toBe("LOCATION_UNAVAILABLE");
      expect(result.isWithinRadius).toBe(false);
      expect(result.requiresOverride).toBe(true);
    });
  });

  describe("[3] Máquina de Estados da Visita Assistencial", () => {
    it("deve permitir transição válida SCHEDULED -> EN_ROUTE -> CHECKED_IN -> COMPLETED", () => {
      expect(isValidVisitTransition("SCHEDULED", "EN_ROUTE")).toBe(true);
      expect(isValidVisitTransition("EN_ROUTE", "CHECKED_IN")).toBe(true);
      expect(isValidVisitTransition("CHECKED_IN", "IN_PROGRESS")).toBe(true);
      expect(isValidVisitTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
    });

    it("deve bloquear transições inválidas (ex: COMPLETED -> IN_PROGRESS ou SCHEDULED -> COMPLETED)", () => {
      expect(isValidVisitTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
      expect(isValidVisitTransition("COMPLETED", "CHECKED_IN")).toBe(false);
      expect(isValidVisitTransition("SCHEDULED", "COMPLETED")).toBe(false);
    });
  });

  describe("[4] Validação Estrutural de Schemas Zod", () => {
    it("deve validar visita com dados consistentes e horário final posterior ao inicial", () => {
      const start = new Date("2026-08-28T08:00:00Z");
      const end = new Date("2026-08-28T10:00:00Z");

      const validVisit = {
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        patientId: "pat_antonio",
        careEpisodeId: "ep_antonio",
        professionalId: "prof_mariana",
        scheduledStart: start,
        scheduledEnd: end,
        status: "SCHEDULED" as const,
        procedureSummary: "Aspiração traqueal e curativo",
      };

      const result = VisitSchema.safeParse(validVisit);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar visita cujo horário final seja anterior ou igual ao inicial", () => {
      const start = new Date("2026-08-28T10:00:00Z");
      const end = new Date("2026-08-28T08:00:00Z");

      const invalidVisit = {
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        patientId: "pat_antonio",
        careEpisodeId: "ep_antonio",
        professionalId: "prof_mariana",
        scheduledStart: start,
        scheduledEnd: end,
      };

      const result = VisitSchema.safeParse(invalidVisit);
      expect(result.success).toBe(false);
    });

    it("deve validar registro de check-in com metadados de auditoria beira-leito", () => {
      const checkinData = {
        visitId: "vis_1",
        professionalId: "prof_mariana",
        patientId: "pat_antonio",
        checkInAt: new Date(),
        checkInLatitude: -14.7935,
        checkInLongitude: -39.0465,
        checkInAccuracy: 10,
        distanceFromCareLocation: 5,
        geofenceResult: "INSIDE_GEOFENCE" as const,
      };

      const result = VisitCheckinSchema.safeParse(checkinData);
      expect(result.success).toBe(true);
    });
  });
});

