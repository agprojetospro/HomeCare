import { z } from "zod";

// ============================================================================
// DOMÍNIO DE VISITAS, CHECK-IN / CHECK-OUT BEIRA-LEITO & GEOFENCING (ONDA 2)
// ============================================================================

export const VisitStatusEnum = z.enum([
  "SCHEDULED",
  "EN_ROUTE",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export type VisitStatus = z.infer<typeof VisitStatusEnum>;

export const GeofenceResultEnum = z.enum([
  "INSIDE_GEOFENCE",
  "OUTSIDE_GEOFENCE",
  "LOW_ACCURACY",
  "LOCATION_DENIED",
  "LOCATION_UNAVAILABLE",
]);

export type GeofenceResult = z.infer<typeof GeofenceResultEnum>;

// Schema da Visita Assistencial
export const VisitSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, "Organização é obrigatória"),
  unitId: z.string().min(1, "Unidade operacional é obrigatória"),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  careEpisodeId: z.string().min(1, "Episódio de cuidado é obrigatório"),
  professionalId: z.string().min(1, "Profissional de saúde é obrigatório"),
  shiftId: z.string().optional().nullable(),
  padVisitId: z.string().optional().nullable(),
  careLocationId: z.string().optional().nullable(),

  scheduledStart: z.date(),
  scheduledEnd: z.date(),
  actualStart: z.date().optional().nullable(),
  actualEnd: z.date().optional().nullable(),

  status: VisitStatusEnum.default("SCHEDULED"),
  procedureSummary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => data.scheduledEnd > data.scheduledStart, {
  message: "O horário de término previsto deve ser posterior ao horário de início.",
  path: ["scheduledEnd"],
});

export type Visit = z.infer<typeof VisitSchema>;

// Schema do Check-in / Check-out Beira-Leito
export const VisitCheckinSchema = z.object({
  id: z.string().optional(),
  visitId: z.string().min(1, "Visita é obrigatória"),
  professionalId: z.string().min(1, "Profissional é obrigatório"),
  patientId: z.string().min(1, "Paciente é obrigatório"),

  checkInAt: z.date(),
  checkInLatitude: z.number().nullable().optional(),
  checkInLongitude: z.number().nullable().optional(),
  checkInAccuracy: z.number().nullable().optional(),
  distanceFromCareLocation: z.number().nullable().optional(),
  geofenceResult: GeofenceResultEnum,

  overrideReason: z.string().optional().nullable(),
  overrideApprovedBy: z.string().optional().nullable(),
  overrideApprovedAt: z.date().optional().nullable(),

  checkOutAt: z.date().optional().nullable(),
  checkOutLatitude: z.number().nullable().optional(),
  checkOutLongitude: z.number().nullable().optional(),
  checkOutAccuracy: z.number().nullable().optional(),
  checkOutDistance: z.number().nullable().optional(),

  deviceMetadata: z.record(z.any()).optional().nullable(),
  createdAt: z.date().optional(),
});

export type VisitCheckin = z.infer<typeof VisitCheckinSchema>;

// ============================================================================
// MOTOR GEODÉSICO: HAVERSINE & AVALIAÇÃO DE CERCA VIRTUAL (GEOFENCING)
// ============================================================================

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula a distância geodésica entre duas coordenadas em metros (Fórmula de Haversine).
 */
export function calculateHaversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export interface GeofenceEvaluation {
  geofenceResult: GeofenceResult;
  distanceMetros: number | null;
  isWithinRadius: boolean;
  requiresOverride: boolean;
}

/**
 * Avalia se a localização do profissional está dentro do raio configurado do domicílio do paciente.
 * Raio padrão assistencial: 100 metros.
 * Limite de acurácia de GPS para alerta de imprecisão: > 150 metros.
 */
export function evaluateGeofence(
  professionalLocation: { latitude: number; longitude: number; accuracy?: number | null } | null | undefined,
  patientLocation: { latitude: number; longitude: number } | null | undefined,
  radiusMeters: number = 100
): GeofenceEvaluation {
  if (!professionalLocation || professionalLocation.latitude == null || professionalLocation.longitude == null) {
    return {
      geofenceResult: "LOCATION_UNAVAILABLE",
      distanceMetros: null,
      isWithinRadius: false,
      requiresOverride: true,
    };
  }

  if (!patientLocation || patientLocation.latitude == null || patientLocation.longitude == null) {
    return {
      geofenceResult: "INSIDE_GEOFENCE",
      distanceMetros: 0,
      isWithinRadius: true,
      requiresOverride: false,
    };
  }

  // Acurácia muito baixa do sensor do dispositivo
  if (professionalLocation.accuracy != null && professionalLocation.accuracy > 150) {
    const dist = calculateHaversineDistance(professionalLocation, patientLocation);
    return {
      geofenceResult: "LOW_ACCURACY",
      distanceMetros: dist,
      isWithinRadius: dist <= radiusMeters,
      requiresOverride: dist > radiusMeters,
    };
  }

  const distanceMetros = calculateHaversineDistance(professionalLocation, patientLocation);
  const isWithinRadius = distanceMetros <= radiusMeters;

  return {
    geofenceResult: isWithinRadius ? "INSIDE_GEOFENCE" : "OUTSIDE_GEOFENCE",
    distanceMetros,
    isWithinRadius,
    requiresOverride: !isWithinRadius,
  };
}

/**
 * Máquina de estados para visitas assistenciais
 */
export function isValidVisitTransition(current: VisitStatus, next: VisitStatus): boolean {
  const allowedTransitions: Record<VisitStatus, VisitStatus[]> = {
    SCHEDULED: ["EN_ROUTE", "CHECKED_IN", "CANCELLED", "NO_SHOW"],
    EN_ROUTE: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
    CHECKED_IN: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  return allowedTransitions[current]?.includes(next) ?? false;
}

