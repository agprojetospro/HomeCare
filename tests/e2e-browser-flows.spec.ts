import { test, expect } from "@playwright/test";

test.describe("HomeCare E2E Browser Flows & Zero-Console-Error Validation", () => {
  test("1. Deve carregar a Dashboard sem erros de console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/");
    await expect(page.locator("text=Central Operacional HomeCare")).toBeVisible();
    await expect(page.locator("text=Visão geral da assistência domiciliar")).toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });

  test("2. Deve acessar o PEP do Seu Antônio com acesso total e sem bloqueio", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/pep/pat_antonio");
    await expect(page.locator("text=Antônio Carlos de Albuquerque")).toBeVisible();
    await expect(page.locator("text=Aferir Sinais")).toBeVisible();
    await expect(page.locator("text=Acesso Restrito ao Prontuário")).not.toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });

  test("3. Deve acessar o PEP da Dona Maria com vínculo ativo e permitir novas atribuições em /escalas", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Acessar o PEP da Maria Francisca (já vinculada)
    await page.goto("/pep/pat_maria");
    await expect(page.locator("text=Maria Francisca dos Santos")).toBeVisible();
    await expect(page.locator("text=Aferir Sinais")).toBeVisible();
    await expect(page.locator("text=Acesso Restrito ao Prontuário")).not.toBeVisible();

    // Acessar Escalas para criar novo vínculo
    await page.goto("/escalas");
    await expect(page.locator("text=Escalas, Plantões & Vínculos Assistenciais")).toBeVisible();

    // Abrir Modal de Vínculo
    await page.click("button:has-text('Vincular Paciente ↔ Profissional')");
    await expect(page.locator("text=Atribuição Assistencial (Vínculo)")).toBeVisible();

    // Selecionar João Batista e Dra. Roberta e Confirmar
    await page.selectOption("#asPat", "pat_joao");
    await page.selectOption("#asProf", "prof_roberta");
    await page.click("button:has-text('Confirmar Vínculo')");
    await expect(page.locator("text=Atribuição Assistencial (Vínculo)")).not.toBeVisible();

    // Acessar o PEP do Seu João
    await page.goto("/pep/pat_joao");
    await expect(page.locator("text=João Batista Ribeiro")).toBeVisible();
    await expect(page.locator("text=Aferir Sinais")).toBeVisible();
    await expect(page.locator("text=Acesso Restrito ao Prontuário")).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test("4. Deve navegar por todas as 15 telas principais sem falhas de renderização", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    const routes = [
      "/",
      "/pacientes",
      "/pacientes/pat_antonio",
      "/triagem",
      "/pad",
      "/escalas",
      "/insumos",
      "/pep",
      "/pep/pat_antonio",
      "/profissionais",
      "/unidades",
      "/faturamento",
      "/auditoria",
      "/alertas",
      "/perfil",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
    }

    expect(consoleErrors).toHaveLength(0);
  });

  test("5. Deve renderizar e operar com responsividade em Tablet (1024x768) e Mobile (390x844)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Viewport Tablet (iPad)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/pep/pat_antonio");
    await expect(page.locator("text=Antônio Carlos de Albuquerque")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    // Viewport Mobile (iPhone)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/alertas");
    await expect(page.locator("text=Central de Alertas & Beira-Leito")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test("6. Deve listar visitas assistenciais e executar fluxo de Check-in GPS beira-leito", async ({ page, context }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: -14.7935, longitude: -39.0465 });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/escalas");
    await expect(page.locator("text=Visitas de Campo & Check-in GPS")).toBeVisible();

    // Localizar botão de Check-in GPS e clicar
    const checkinBtn = page.getByRole("button", { name: "Check-in GPS" }).first();
    await expect(checkinBtn).toBeVisible();
    await checkinBtn.click();

    // Validar modal aberto
    await expect(page.locator("text=Check-in Beira-Leito (GPS & Geofencing)")).toBeVisible();

    // Confirmar Check-in
    await page.click("button:has-text('Confirmar Check-in')");
    await expect(page.locator("text=Check-in Beira-Leito (GPS & Geofencing)")).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test("7. Deve gerenciar insumos, monitorar autonomia de O2 e registrar avaliação de curativo NPUAP", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // 1. Acessar /insumos
    await page.goto("/insumos");
    await expect(page.locator("text=Gestão de Insumos, Oxigênio & Estoque Ledger")).toBeVisible();
    await expect(page.locator("text=Catálogo & Níveis de Estoque")).toBeVisible();

    // 2. Abrir modal de Nova Movimentação
    await page.getByRole("button", { name: "Nova Movimentação" }).click();
    await expect(page.locator("text=Lançamento no Livro-Razão de Estoque")).toBeVisible();
    await page.getByRole("button", { name: "Registrar no Ledger" }).click();
    await expect(page.locator("text=Lançamento no Livro-Razão de Estoque")).not.toBeVisible();

    // 3. Acessar PEP do Seu Antônio e validar abas de Oxigênio e Curativos
    await page.goto("/pep/pat_antonio");
    await expect(page.locator("text=Antônio Carlos de Albuquerque")).toBeVisible();

    // Clicar na aba Oxigênio
    await page.getByRole("tab", { name: /Oxigênio/i }).click();
    await expect(page.locator("text=Oxigenoterapia & Autonomia Residual")).toBeVisible();
    await expect(page.locator("text=Pressão Mensurada no Cilindro")).toBeVisible();

    // Clicar na aba Curativos
    await page.getByRole("tab", { name: /Curativos/i }).click();
    await expect(page.locator("text=Protocolo de Avaliação & Curativos de Lesões (NPUAP)")).toBeVisible();

    // Abrir Modal de Nova Avaliação
    await page.getByRole("button", { name: "Nova Avaliação de Ferida" }).click();
    await expect(page.locator("text=Avaliação de Ferida & Protocolo de Curativo (NPUAP)")).toBeVisible();
    await page.getByRole("button", { name: "Salvar Avaliação" }).click();
    await expect(page.locator("text=Avaliação de Ferida & Protocolo de Curativo (NPUAP)")).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});

