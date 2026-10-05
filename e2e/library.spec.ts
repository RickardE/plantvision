import { expect, test, USERS } from "./fixtures";

test.use({ storageState: USERS.designer.state });

test.describe("product library", () => {
  test("searches, filters by category and opens a product", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("searchbox").fill("Monstera DEMO");
    await page.getByRole("searchbox").press("Enter");
    const card = page.getByRole("link", { name: /Monstera Deliciosa/ }).first();
    await expect(card).toBeVisible();

    await card.click();
    await expect(page.getByRole("heading", { name: "Monstera Deliciosa" })).toBeVisible();
    await expect(page.getByText("DEMO-P-001")).toBeVisible();
    await expect(page.getByText("70 × 120 cm").first()).toBeVisible();
  });

  test("category chips narrow the list", async ({ page }) => {
    await page.goto("/products?q=DEMO");
    await expect(page.getByRole("link", { name: /Monstera Deliciosa/ })).toBeVisible();
    await page.getByRole("link", { name: "Krukor", exact: true }).click();
    await expect(page).toHaveURL(/category=krukor/);
    await expect(page.getByRole("link", { name: /Architect Cube Svart/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Monstera Deliciosa/ })).toHaveCount(0);
  });

  test("designers cannot reach the admin pages", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });
});
