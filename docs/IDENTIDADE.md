# Fundação de Identidade & Usuários — HomeCare

## 1. Princípio de Separação: Identidade $\neq$ Profissional

No sistema **HomeCare**, a identidade de acesso (`profiles`) e o registro profissional assistencial (`professionals`) são tratados como entidades distintas e desacopladas:

```text
PROVEDOR DE AUTENTICAÇÃO (auth.users)
          ↓
PERFIL DE USUÁRIO (profiles)
          ├── Usuários Não-Assistenciais (Faturista, Administrador, Estoquista, Atendimento)
          │
          └── Usuários Assistenciais (Médico, Enfermeiro, Técnico, Fisioterapeuta)
                    ↓ (profile_id opcional 1:1)
              CADASTRO PROFISSIONAL (professionals)
                    ├── Credenciais / Conselhos (professional_credentials)
                    ├── Especialidades (professional_specialties)
                    └── Áreas e Disponibilidade (professional_service_areas / availability)
```

---

## 2. Ciclo de Vida do Usuário (`profiles.status`)

Em vez de uma flag booleana (`is_active`), o usuário possui estados claros:

| Status | Descrição | Comportamento no Sistema |
| :--- | :--- | :--- |
| **`INVITED`** | Usuário convidado pela administração, aguardando ativação de senha | Acesso bloqueado até definição de credenciais |
| **`ACTIVE`** | Usuário regular ativo com acesso concedido de acordo com RBAC e Unidades | Acesso normal permitido |
| **`SUSPENDED`** | Usuário temporariamente suspenso (ex: afastamento, apuração ética) | Sessões revogadas imediatamente, login bloqueado |
| **`BLOCKED`** | Bloqueio de segurança (ex: múltiplas tentativas inválidas) | Bloqueado para login até intervenção do Admin |
| **`INACTIVE`** | Usuário desligado da organização | Acesso encerrado em definitivo, histórico preservado |

---

## 3. Modelo de Dados de Identidade

```sql
CREATE TYPE user_account_status AS ENUM (
  'INVITED', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'INACTIVE'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  status user_account_status NOT NULL DEFAULT 'INVITED',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Fluxo de Primeiro Acesso e Validação

No primeiro login, o sistema executa a validação de prontidão:
1. `profile` existe e está vinculado a uma organização válida?
2. Possui pelo menos uma `role` atribuída em `user_roles`?
3. Possui pelo menos uma unidade vinculada em `user_unit_assignments`?
4. Se a `role` for assistencial (Médico, Enfermagem, Fisio), possui vínculo ativo em `professionals` com credencial válida em `professional_credentials`?

Se alguma validação falhar, o sistema exibe o estado contextual: **"Conta aguardando configuração administrativa"** e bloqueia a navegação operacional.

