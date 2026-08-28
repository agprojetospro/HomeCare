import { describe, it, expect } from "vitest";
import {
  SyncQueueItemSchema,
  SyncQueueItem,
  resolveConflictLastWriteWins,
} from "../src/domain/offline/sync-queue.schema";

describe("MÓDULO OFFLINE-FIRST & FILA DE SINCRONIZAÇÃO IDEMPOTENTE (ONDA 5)", () => {
  describe("[1] Validação de Mutações & Chaves de Idempotência", () => {
    it("deve validar item de fila de sincronização com chave de idempotência única", () => {
      const item: SyncQueueItem = {
        id: "sync_1",
        idempotencyKey: "idem_vital_pat_antonio_123456",
        mutationType: "CREATE_VITAL_SIGNS",
        entityTable: "vital_signs",
        patientId: "pat_antonio",
        payload: {
          systolicBp: 120,
          diastolicBp: 80,
          heartRate: 72,
          oxygenSaturation: 98,
        },
        clientTimestamp: new Date(),
        status: "PENDING",
        retryCount: 0,
      };

      const parsed = SyncQueueItemSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    });

    it("deve rejeitar item sem chave de idempotência válida", () => {
      const invalidItem = {
        id: "sync_invalid",
        idempotencyKey: "curto",
        mutationType: "CREATE_VITAL_SIGNS",
        entityTable: "vital_signs",
        patientId: "pat_antonio",
        payload: {},
      };

      const parsed = SyncQueueItemSchema.safeParse(invalidItem);
      expect(parsed.success).toBe(false);
    });
  });

  describe("[2] Resolução Determinística de Conflitos (Last-Write-Wins)", () => {
    it("deve eleger a mutação do cliente quando o timestamp do cliente for mais recente", () => {
      const clientMutation: SyncQueueItem = {
        id: "sync_lww_1",
        idempotencyKey: "idem_wound_1234567890",
        mutationType: "RECORD_WOUND_EVAL",
        entityTable: "wound_evaluations",
        patientId: "pat_antonio",
        payload: { stage: "ESTAGIO_3", granulationPercent: 80 },
        clientTimestamp: new Date("2026-08-27T10:30:00Z"),
        status: "PENDING",
        retryCount: 0,
      };

      const serverRecord = {
        id: "wnd_1",
        stage: "ESTAGIO_3",
        granulationPercent: 65,
        updatedAt: new Date("2026-08-27T09:00:00Z"),
      };

      const resolution = resolveConflictLastWriteWins(clientMutation, serverRecord);
      expect(resolution.winner).toBe("CLIENT");
      expect(resolution.resolvedData.granulationPercent).toBe(80);
      expect(resolution.resolutionNote).toContain("Mutação offline mais recente");
    });

    it("deve preservar o estado do servidor quando o servidor possuir carimbo mais recente", () => {
      const clientMutation: SyncQueueItem = {
        id: "sync_lww_2",
        idempotencyKey: "idem_wound_old_123456",
        mutationType: "RECORD_WOUND_EVAL",
        entityTable: "wound_evaluations",
        patientId: "pat_antonio",
        payload: { stage: "ESTAGIO_3", granulationPercent: 50 },
        clientTimestamp: new Date("2026-08-27T08:00:00Z"),
        status: "PENDING",
        retryCount: 0,
      };

      const serverRecord = {
        id: "wnd_1",
        stage: "ESTAGIO_3",
        granulationPercent: 75,
        updatedAt: new Date("2026-08-27T11:00:00Z"),
      };

      const resolution = resolveConflictLastWriteWins(clientMutation, serverRecord);
      expect(resolution.winner).toBe("SERVER");
      expect(resolution.resolvedData.granulationPercent).toBe(75);
      expect(resolution.resolutionNote).toContain("Estado do servidor preservado");
    });
  });
});
