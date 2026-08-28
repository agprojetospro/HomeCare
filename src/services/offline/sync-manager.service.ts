import {
  SyncQueueItem,
  SyncQueueItemSchema,
  resolveConflictLastWriteWins,
} from "@/domain/offline/sync-queue.schema";

export type SyncListener = (isOnline: boolean, pendingCount: number) => void;

export class SyncManagerService {
  private queue: SyncQueueItem[] = [];
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: Set<SyncListener> = new Set();
  private isFlushing: boolean = false;

  constructor() {
    this.loadQueueFromStorage();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
    }
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public setNetworkStatus(online: boolean) {
    this.handleNetworkChange(online);
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter((item) => item.status === "PENDING" || item.status === "FAILED").length;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline, this.getPendingCount());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const count = this.getPendingCount();
    this.listeners.forEach((l) => l(this.isOnline, count));
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.flushQueue();
    }
  }

  public enqueueMutation(data: {
    idempotencyKey: string;
    mutationType: SyncQueueItem["mutationType"];
    entityTable: string;
    entityId?: string | null;
    patientId: string;
    payload: Record<string, any>;
  }): SyncQueueItem {
    // Deduplicação: Se já existir na fila com a mesma idempotencyKey, retorna o existente
    const existing = this.queue.find((item) => item.idempotencyKey === data.idempotencyKey);
    if (existing) {
      return existing;
    }

    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: data.idempotencyKey,
      mutationType: data.mutationType,
      entityTable: data.entityTable,
      entityId: data.entityId,
      patientId: data.patientId,
      payload: data.payload,
      clientTimestamp: new Date(),
      status: "PENDING",
      retryCount: 0,
    };

    const validated = SyncQueueItemSchema.parse(newItem);
    this.queue.push(validated);
    this.saveQueueToStorage();
    this.notify();

    if (this.isOnline) {
      this.flushQueue();
    }

    return validated;
  }

  public async flushQueue(): Promise<{
    syncedCount: number;
    failedCount: number;
    resolvedConflicts: number;
  }> {
    if (this.isFlushing) return { syncedCount: 0, failedCount: 0, resolvedConflicts: 0 };
    this.isFlushing = true;

    let syncedCount = 0;
    let failedCount = 0;
    let resolvedConflicts = 0;

    const pendingItems = this.queue.filter(
      (item) => item.status === "PENDING" || item.status === "FAILED"
    );

    for (const item of pendingItems) {
      item.status = "SYNCING";
      try {
        // Simulação / Execução de mutação remota com sucesso idempotente
        await new Promise((resolve) => setTimeout(resolve, 50));
        item.status = "SYNCED";
        item.syncedAt = new Date();
        item.lastError = null;
        syncedCount++;
      } catch (err: any) {
        item.retryCount += 1;
        item.lastError = err?.message || "Erro de rede durante sincronização";
        item.status = "FAILED";
        failedCount++;
      }
    }

    this.saveQueueToStorage();
    this.isFlushing = false;
    this.notify();

    return { syncedCount, failedCount, resolvedConflicts };
  }

  public clearSyncedItems() {
    this.queue = this.queue.filter((item) => item.status !== "SYNCED");
    this.saveQueueToStorage();
    this.notify();
  }

  private saveQueueToStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("homecare_sync_queue_v1", JSON.stringify(this.queue));
      } catch (e) {
        console.warn("Could not save sync queue to localStorage", e);
      }
    }
  }

  private loadQueueFromStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem("homecare_sync_queue_v1");
        if (raw) {
          this.queue = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Could not load sync queue from localStorage", e);
      }
    }
  }
}

export const syncManager = new SyncManagerService();
