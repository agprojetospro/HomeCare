# Onda 5: Offline-First, PWA & Sincronização Idempotente

## 📋 Visão Geral

A **Onda 5** confere resiliência operacional crítica ao sistema HomeCare, garantindo que profissionais de saúde (médicos, enfermeiros e fisioterapeutas) continuem executando suas rotinas beira-leito (aferição de sinais vitais, curativos, administração de medicamentos, check-in e check-out) mesmo em locais sem conectividade 4G/Wi-Fi.

---

## ⚡ Princípios de Engenharia Offline

1. **Geração Determinística de Chaves de Idempotência**:
   - Cada ação realizada em modo offline gera uma `idempotencyKey` única (UUID v4) anexada à mutação.
   - Ao sincronizar com o backend Supabase, requisições repetidas ou duplicadas são deduplicadas sem efeitos colaterais.
2. **Resolução de Conflitos Last-Write-Wins (LWW)**:
   - Conflitos de edição simultânea são resolvidos comparando timestamps clínicos UTC precisos com geração de trilha de auditoria.
3. **Web App Manifest & Service Worker PWA**:
   - Configuração PWA (`/manifest.json` e `/sw.js`) permitindo instalação como aplicativo standalone em smartphones e tablets.
4. **Banner Global de Conectividade (`OfflineSyncBanner`)**:
   - Informa visualmente o estado da rede (`Modo Offline Ativo`, `Sincronizando X registros...`, `Dados sincronizados com sucesso`).

---

## 🧪 Certificação & Testes

- **Testes Unitários**: `tests/offline-sync-queue.test.ts` (4 testes de idempotência e LWW).
- **Testes E2E (Playwright)**: `tests/e2e-browser-flows.spec.ts` (Teste 9 validando banner offline e sincronização).
- **Quality Gate**: 118 testes Vitest aprovados com 100% de sucesso.
