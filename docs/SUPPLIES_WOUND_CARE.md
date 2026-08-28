# Módulo de Gestão de Insumos, Oxigenoterapia & Curativos NPUAP (ONDA 3)

Este documento descreve as regras clínicas, logísticas e de governança para o controle de materiais hospitalares, monitoramento de oxigenoterapia beira-leito e protocolo de avaliação de feridas/lesões da plataforma **HomeCare**.

---

## 📦 1. Catálogo Mestre & Livro-Razão de Estoque (Ledger)

1. **Rastreabilidade e Lote**: Todo insumo ou medicamento administrado ou dispensado gera lançamento irreversível no `inventory_ledger`, associando `patient_id`, `professional_id`, `batch_number`, `expiration_date` e motivo clínico.
2. **Ponto de Ressuprimento Automático**: Cálculo de níveis de estoque de segurança (`minimum_stock` e `reorder_point`), gerando alertas visuais de ressuprimento.
3. **Tipos de Movimento Auditados**:
   - `ENTRADA`: Recebimento de insumos de fornecedores / base central.
   - `SAIDA_PACIENTE`: Dispensação e consumo direto no leito domiciliar.
   - `PERDA_AVARIA`: Baixa por quebra/dano com justificativa obrigatória.
   - `PERDA_VALIDADE`: Descarte de itens vencidos auditado em `audit_logs`.
   - `DEVOLUCAO`: Retorno de materiais não utilizados da residência.

---

## 🫁 2. Monitoramento de Oxigenoterapia & Autonomia Física

O cálculo de autonomia residual em cilindros de gás medicinal utiliza a lei dos gases ideais adaptada à prática clínica:

$$\text{Volume Utilizável (Litros)} = \text{Pressão Manométrica (bar)} \times K$$
$$\text{Autonomia (horas)} = \frac{\text{Volume Utilizável (Litros)}}{\text{Fluxo Prescrito (L/min)} \times 60}$$

### Constantes Volumétricas ($K$)
- **Cilindro E (10L / Transporte)**: $K = 1.0$ (ex: 150 bar $\to$ 150L).
- **Cilindro G (40L / Intermediário)**: $K = 4.0$ (ex: 150 bar $\to$ 600L).
- **Cilindro J (50L / Base Domiciliar)**: $K = 5.0$ (ex: 150 bar $\to$ 750L).

### Classificação de Status de Autonomia
- 🔴 **CRÍTICO**: Autonomia residual $< 2\text{h}$ ou pressão $< 20\text{ bar}$ (exige reposição emergencial).
- 🟡 **ATENÇÃO**: Autonomia residual $< 6\text{h}$ ou pressão $< 45\text{ bar}$ (programar rota de entrega).
- 🟢 **NORMAL**: Autonomia $\ge 6\text{h}$.

---

## 🩹 3. Protocolo de Curativos & Lesões por Pressão (NPUAP/EPUAP)

1. **Estadiamento Padronizado**:
   - `ESTAGIO_1`: Eritema não branqueável em pele intacta.
   - `ESTAGIO_2`: Perda de espessura parcial da pele com derme exposta.
   - `ESTAGIO_3`: Perda de espessura total da pele com exposição de tecido adiposo.
   - `ESTAGIO_4`: Perda total com exposição de osso, músculo ou tendão.
   - `NAO_CLASSIFICAVEL`: Leito coberto por esfacelo ou escara necrótica.
   - `LTP_TISSULAR_PROFUNDA`: Área localizada de cor púrpura ou castanho-escura persistente.
2. **Composição do Leito Tecidual**:
   - Granulação (%), Esfacelo (%), Necrose (%) e Epitelização (%) com validação matemática ($\sum \le 100\%$).
3. **Cálculo de Área e Trajetória de Cicatrização**:
   - Área: $\text{Comprimento (cm)} \times \text{Largura (cm)}$.
   - Avaliação comparativa entre consultas consecutivas:
     - `REGRESSAO_POSITIVA`: Redução $\ge 10\%$ da área.
     - `EXPANSAO_NEGATIVA`: Aumento $\ge 10\%$ da área (alerta de piora / reavaliação de conduta).
     - `ESTABILIDADE`: Variação entre $-10\%$ e $+10\%$.

---

## 🛡️ 4. Segurança, RLS & Banco de Dados

- **DDL SQL**: `supabase/migrations/20260827_supplies_oxygen_wound_care.sql`.
- **Tabelas**: `supplies_catalog`, `inventory_ledger`, `patient_oxygen_therapy`, `wound_evaluations`.
- **Políticas RLS**: Anti-IDOR para prontuários, exigindo vínculo assistencial ativo para visualização/evolução de lesões e oxigenoterapia.
