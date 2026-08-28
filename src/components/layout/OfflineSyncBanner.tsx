"use client";

import { useEffect, useState } from "react";
import { syncManager } from "@/services/offline/sync-manager.service";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((online, count) => {
      setIsOnline(online);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await syncManager.flushQueue();
    setIsSyncing(false);
    if (result.syncedCount > 0) {
      setSyncSuccessMessage(true);
      setTimeout(() => setSyncSuccessMessage(false), 4000);
    }
  };

  if (isOnline && pendingCount === 0 && !syncSuccessMessage) {
    return null;
  }

  return (
    <div className="w-full z-40 transition-all duration-300">
      {!isOnline ? (
        <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <WifiOff className="h-4 w-4 animate-pulse shrink-0" />
            <span>
              <strong>Modo Offline Ativo:</strong> Sem conexão de rede. Todas as ações beira-leito estão sendo salvas localmente com segurança ({pendingCount} pendente{pendingCount !== 1 ? "s" : ""}).
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleManualSync}
            variant="secondary"
            className="h-7 text-xs bg-white text-amber-900 hover:bg-amber-50 font-bold shrink-0 ml-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            Verificar Conexão
          </Button>
        </div>
      ) : syncSuccessMessage ? (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Dados sincronizados com o servidor com sucesso!</span>
          </div>
        </div>
      ) : (
        <div className="bg-teal-700 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <CloudUpload className="h-4 w-4 animate-bounce shrink-0" />
            <span>Conexão restabelecida. Sincronizando {pendingCount} registro(s) pendente(s) com a nuvem...</span>
          </div>
          <Button
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            variant="secondary"
            className="h-7 text-xs bg-white text-teal-950 font-bold shrink-0 ml-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            Sincronizar Agora
          </Button>
        </div>
      )}
    </div>
  );
}
