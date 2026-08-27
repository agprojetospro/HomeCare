import { test, expect } from "@playwright/test";

test.describe("HomeCare E2E Browser Flows & Zero-Console-Error Validation", () => {
  test("1. Deve carregar a Dashboard sem erros de console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/");
    await expect(page).toHaveTitle(/CuraHome CRM/);
    await expect(page.locator("text=Central Operacional HomeCare")).toBeVisible();
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

  test("3. Deve vincular um paciente em /escalas e liberar o PEP imediatamente", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Acessar Escalas
    await page.goto("/escalas");
    await expect(page.locator("text=Escalas, Plantões & Vínculos Assistenciais")).toBeVisible();

    // Abrir Modal de Vínculo
    await page.click("button:has-text('Vincular Paciente ↔ Profissional')");
    await expect(page.locator("text=Atribuição Assistencial (Vínculo)")).toBeVisible();

    // Selecionar Maria Francisca e Confirmar
    await page.selectOption("#asPat", "pat_maria");
    await page.click("button:has-text('Confirmar Vínculo')");

    // Acessar o PEP da Maria Francisca
    await page.goto("/pep/pat_maria");
    await expect(page.locator("text=Maria Francisca dos Santos")).toBeVisible();
    await expect(page.locator("text=Aferir Sinais")).toBeVisible();
    await expect(page.locator("text=Acesso Restrito ao Prontuário")).not.toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });

  test("4. Deve navegar por todas as 14 telas principais sem falhas de renderização", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    const routes = [
      "/",
      "/pacientes",
      "/pacientes/pat_antonio",
      "/triagem",
      "/pad",
      "/escalas",
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
});
