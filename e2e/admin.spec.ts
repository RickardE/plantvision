import path from "node:path";
import { expect, test, unique, USERS } from "./fixtures";

const plantImage = path.join(__dirname, "../tests/fixtures/plant.jpg");
const supplierCsv = path.join(__dirname, "../tests/fixtures/supplier-sample.csv");

test.use({ storageState: USERS.admin.state });

test.describe("admin", () => {
  test("creates, edits and deactivates a product", async ({ page, browser }) => {
    const name = unique("E2E Kentiapalm");
    const article = unique("E2E").replace(" ", "-");

    await page.goto("/admin/products/new");
    await page.getByLabel("Namn", { exact: true }).fill(name);
    await page.getByLabel("Artikelnummer").fill(article);
    await page.getByLabel("Kategori").selectOption({ label: "Växter" });
    await page.getByLabel(/^Höjd/).fill("150");
    await page.getByLabel(/^Bredd/).fill("60");
    await page.getByTestId("product-image-input").setInputFiles(plantImage);
    await page.getByRole("button", { name: "Skapa" }).click();

    await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Huvudbild")).toBeVisible();

    await page.getByLabel("Namn", { exact: true }).fill(`${name} XL`);
    await page.getByRole("button", { name: "Spara" }).click();
    await expect(page.getByText("Produkten är sparad.")).toBeVisible();

    await page.getByRole("button", { name: "Inaktivera" }).click();
    await expect(page.getByRole("button", { name: "Aktivera" })).toBeVisible();

    // Designers no longer find the inactive product.
    const designer = await browser.newContext({ storageState: USERS.designer.state });
    const designerPage = await designer.newPage();
    await designerPage.goto(`/products?q=${encodeURIComponent(article)}`);
    await expect(designerPage.getByText("Inga produkter matchar din sökning.")).toBeVisible();
    await designer.close();
  });

  test("creates products from a batch of images", async ({ page }) => {
    await page.goto("/admin/products/bulk");
    await page.getByTestId("bulk-image-input").setInputFiles(plantImage);
    const nameInput = page.getByLabel("Namn").first();
    await expect(nameInput).toHaveValue("Plant");
    const name = unique("E2E Bulk");
    await nameInput.fill(name);
    await page.getByLabel("Kategori för alla").selectOption({ label: "Växter" });
    await page.getByRole("button", { name: "Skapa 1 produkt" }).click();
    await expect(page.getByText("1 produkt skapad.")).toBeVisible();

    await page.goto(`/admin/products?q=${encodeURIComponent(name)}&status=all`);
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  });

  test("previews and imports a supplier file", async ({ page }) => {
    await page.goto("/admin/products/import");
    await page.getByTestId("import-file-input").setInputFiles(supplierCsv);
    const preview = page.getByTestId("import-preview");
    await expect(preview).toBeVisible();
    await expect(preview.getByText("Rader lästa")).toBeVisible();
    await page.getByRole("button", { name: /^Importera \d+ produkter$/ }).click();
    await expect(page.getByText(/^Klart: /)).toBeVisible({ timeout: 30_000 });
  });

  test("adds a category", async ({ page }) => {
    const name = unique("E2E Kategori");
    await page.goto("/admin/categories");
    await page.getByLabel("Ny kategori").fill(name);
    await page.getByRole("combobox", { name: "Typ" }).last().selectOption({ label: "Kruka" });
    await page.getByRole("button", { name: "Skapa" }).click();
    await expect(page.getByRole("textbox", { name: "Namn" }).last()).toHaveValue(name);
  });
});
