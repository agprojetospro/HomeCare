import { z } from "zod";

// ============================================================================
// DOMÍNIO DE SINCRONIZAÇÃO OFFLINE-FIRST & RESILIÊNCIA (ONDA 5)
// ============================================================================

export const SyncStatusEnum = z.enum([
  "PENDING",
  "SYNCING",
  "SYNCED",
  "FAILED",
  "CONFLICT_RESOLVED",
]);
export type SyncStatus = z.infer<typeof SyncStatusEnum>;

export const MutationTypeEnum = z.enum([
  "CREATE_VITAL_SIGNS",
  "RECORD_CHECK_IN",
  "RECORD_CHECK_OUT",
  "CREATE_EVOLUTION",
  "RECORD_MED_ADMIN",
  "RECORD_WOUND_EVAL",
  "RECORD_INVENTORY_MOVEMENT",
  "SUBMIT_FAMILY_FEEDBACK",
]);
export type MutationType = z.infer<typeof MutationTypeEnum>;

export const SyncQueueItemSchema = z.object({
  id: z.string(),
  idempotencyKey: z.string().min(10, "Chave de idempotência única é obrigatória"),
  mutationType: MutationTypeEnum,
  entityTable: z.string().min(1),
  entityId: z.string().optional().nullable(),
  patientId: z.string().min(1),
  payload: z.record(z.any()),
  clientTimestamp: z.date().default(() => new Date()),
  status: SyncStatusEnum.default("PENDING"),
  retryCount: z.number().int().min(0).default(0),
  syncedAt: z.date().optional().nullable(),
  lastError: z.string().optional().nullable(),
  conflictResolution: z.string().optional().nullable(),
});
export type SyncQueueItem = z.infer<typeof SyncQueueItemSchema>;

/**
 * Resolução determinística de concorrência com estratégia Last-Write-Wins (LWW).
 * Compara o timestamp do cliente com o carimbo do servidor e gera log auditável.
 */
export function resolveConflictLastWriteWins(
  clientMutation: SyncQueueItem,
  serverRecord: { updatedAt: Date; [key: string]: any }
): {
  winner: "CLIENT" | "SERVER";
  resolvedData: any;
  resolutionNote: string;
} {
  const clientTime = new Date(clientMutation.clientTimestamp).getTime();
  const serverTime = new Date(serverRecord.updatedAt).getTime();

  if (clientTime >= serverTime) {
    return {
      winner: "CLIENT",
      resolvedData: { ...serverRecord, ...clientMutation.payload, updatedAt: clientMutation.clientTimestamp },
      resolutionNote: `Conflito resolvido via LWW: Mutação offline mais recente (${new Date(clientTime).toISOString()} >= ${new Date(serverTime).toISOString()}).`,
    };
  } else {
    return {
      winner: "SERVER",
      resolvedData: serverRecord,
      resolutionNote: `Conflito resolvido via LWW: Estado do servidor preservado (mais recente: ${new Date(serverTime).toISOString()} > ${new Date(clientTime).toISOString()}).`,
    };
  }
}
