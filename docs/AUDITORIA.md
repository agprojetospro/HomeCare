# Arquitetura de Auditoria & Segurança de Documentos — HomeCare

## 1. Separação Estrita: `clinical_events` $\neq$ `audit_logs`

O sistema mantém duas trilhas com objetivos completamente diferentes:

```text
┌────────────────────────────────────────────────────────┐
│                   CLINICAL_EVENTS                      │
│  - Propósito: Timeline clínica do paciente no PEP      │
│  - Conteúdo: Sinais vitais, evoluções, exames, dietas  │
│  - Visibilidade: Equipe assistencial e familiares      │
│  - Exemplo: "08:00 - PA 120x80 aferida por Enf. Ana"   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     AUDIT_LOGS                         │
│  - Propósito: Segurança da informação, LGPD e compliance│
│  - Conteúdo: Acessos ao PEP, logins, mutações, bloqueios│
│  - Visibilidade: Auditores e Administradores de Segurança│
│  - Exemplo: "08:01 - user_123 visualizou PEP #pat_456" │
└────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura da Tabela `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id),
  profile_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES professionals(id),
  action VARCHAR(80) NOT NULL, -- PEP_VIEW, CLINICAL_RECORD_FINALIZE, LOGIN, ACCESS_DENIED
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  patient_id UUID REFERENCES patients(id),
  care_episode_id UUID REFERENCES care_episodes(id),
  old_data JSONB,
  new_data JSONB,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Auditoria de Acesso a Dados Sensíveis

Toda operação de leitura sensível no PEP dispara registro de auditoria:
- `PEP_VIEW` $\rightarrow$ Abertura do prontuário do paciente.
- `PRESCRIPTION_VIEW` $\rightarrow$ Leitura de prescrição ativa.
- `EXAM_RESULT_VIEW` $\rightarrow$ Visualização ou download de laudo de exame.
- `SECURITY_ACCESS_DENIED` $\rightarrow$ Tentativa de acesso bloqueada por falta de vínculo ou escopo (IDOR attempt).

---

## 4. Política de Storage Privado para Documentos Clínicos

> [!IMPORTANT]
> **Privacidade Absoluta**: Nenhum documento, laudo, termo de consentimento ou receita médica pode ser armazenado em bucket público.

- **Bucket Privado**: `homecare-clinical-docs` com RLS em nível de objeto.
- **Assinatura de URLs**: O acesso a arquivos é realizado exclusivamente através de **Signed URLs com validade curta (máximo 15 minutos)**.
- **Validação Prévia**: Antes de emitir a URL assinada, a Edge Function / RPC valida se o usuário autenticado possui `can_access_patient(patient_id)`.
- **Prevenção de Vazamento em Logs**: É estritamente proibido imprimir (`console.log`) objetos completos de prontuário, documentos ou tokens em logs do servidor.

