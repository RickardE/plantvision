import path from "node:path";
import type { Page } from "@playwright/test";
import { expect, isPhone, test, unique, USERS } from "./fixtures";

const roomImage = path.join(__dirname, "../tests/fixtures/room.jpg");

test.use({ storageState: USERS.designer.state });

async function pickProduct(page: Page, query: string, name: string, { toSelected = false } = {}) {
  if (isPhone(page)) {
    await page
      .getByRole("button", { name: toSelected ? "Lägg till produkt vid den markerade" : "Lägg till produkt" })
      .click();
  }
  await page.getByRole("button", { name: "Alla", exact: true }).click();
  await page.getByLabel("Sök växter, krukor…").fill(query);
  await page
    .getByRole("button", { name: new RegExp(name) })
    .first()
    .click();
}

test("designer creates a project, designs a room and generates a visualization", async ({ page }) => {
  const projectName = unique("E2E Kontor");

  // Project and room.
  await page.goto("/projects");
  await page.getByRole("button", { name: "Nytt kundprojekt" }).click();
  await page.getByLabel("Projektnamn").fill(projectName);
  await page.getByLabel(/^Kund/).fill("E2E Kund AB");
  await page.getByRole("button", { name: "Skapa" }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  await page.getByRole("button", { name: "Lägg till rum" }).click();
  await page.getByLabel("Rummets namn").fill("Reception");
  await page.getByRole("button", { name: "Skapa" }).click();
  await expect(page.getByRole("heading", { name: "Reception" })).toBeVisible();

  await page.getByTestId("room-image-input").setInputFiles(roomImage);
  await page.getByRole("link", { name: "Öppna designverktyget" }).click();

  // Editor: a plant, then a pot set under it.
  await expect(page.locator("[data-testid=editor-canvas] canvas").first()).toBeVisible();
  await pickProduct(page, "DEMO-P-001", "Monstera Deliciosa");
  await expect(page.getByTestId("selection-toolbar")).toBeVisible();
  await pickProduct(page, "DEMO-K-001", "Architect Cube Svart", { toSelected: true });
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved");

  // Undo removes the pot, and the change is saved again.
  await page.getByRole("button", { name: "Klar" }).click();
  await page.getByRole("button", { name: "Ångra" }).click();
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved");
  await pickProduct(page, "DEMO-K-002", "Classico Rund Vit");
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved");

  // Export the composition from the editor.
  await page.getByRole("button", { name: "Klar" }).click();
  const compositionDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportera komposition" }).click();
  expect((await compositionDownload).suggestedFilename()).toMatch(/Reception.*Alternativ A\.jpg$/);

  // First visualization.
  await page.getByRole("button", { name: /AI/ }).first().click();
  await page.getByLabel("Extra instruktion till AI:n").fill("Kvällsljus");
  await page.getByRole("button", { name: "Skapa AI-visualisering" }).last().click();
  await expect(page).toHaveURL(/\/visualizations\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Efter")).toBeVisible({ timeout: 30_000 });

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportera bild" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.jpg$/);

  // A second, adjusted visualization, then compare the two.
  await page.getByRole("button", { name: "Justera och skapa ny" }).click();
  await page.getByLabel("Extra instruktion till AI:n").fill("Morgonljus");
  await page.getByRole("button", { name: "Justera och skapa ny" }).last().click();
  await expect(page.getByText("Morgonljus")).toBeVisible();
  await expect(page.getByText("Efter")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: "Jämför" }).click();
  await expect(page.getByRole("heading", { name: "Jämför visualiseringar" })).toBeVisible();
  await expect(page.getByRole("img")).not.toHaveCount(0);

  // The room page lists both visualizations.
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page.getByTestId("visualization-card")).toHaveCount(2);
});

test("a failed generation is shown with a way to retry", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Nytt kundprojekt" }).click();
  await page.getByLabel("Projektnamn").fill(unique("E2E Fel"));
  await page.getByRole("button", { name: "Skapa" }).click();
  await page.getByRole("button", { name: "Lägg till rum" }).click();
  await page.getByLabel("Rummets namn").fill("Hall");
  await page.getByRole("button", { name: "Skapa" }).click();
  await page.getByTestId("room-image-input").setInputFiles(roomImage);
  await page.getByRole("link", { name: "Öppna designverktyget" }).click();
  await pickProduct(page, "DEMO-P-003", "Sansevieria Laurentii");
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved");

  await page.getByRole("button", { name: /AI/ }).first().click();
  // The mock provider fails on this marker.
  await page.getByLabel("Extra instruktion till AI:n").fill("__FAIL__");
  await page.getByRole("button", { name: "Skapa AI-visualisering" }).last().click();
  await expect(page.getByTestId("visualization-status")).toHaveAttribute("data-status", "failed", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Justera och skapa ny" })).toBeVisible();
});
