import { expect, signIn, test, USERS } from "./fixtures";

test.describe("authentication", () => {
  test("redirects signed-out visitors to the login page and back after signing in", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login\?next=%2Fproducts/);
    await page.getByLabel("E-post").fill(USERS.designer.email);
    await page.getByLabel("Lösenord").fill(USERS.designer.password);
    await page.getByRole("button", { name: "Logga in" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("rejects a wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-post").fill(USERS.designer.email);
    await page.getByLabel("Lösenord").fill("wrong-password");
    await page.getByRole("button", { name: "Logga in" }).click();
    await expect(page.getByText("Fel e-post eller lösenord.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs out from the profile page", async ({ page }) => {
    await signIn(page, USERS.designer);
    await page.goto("/profile");
    await page.getByRole("button", { name: "Logga ut" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });

  test("API routes answer 401 when signed out", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(401);
  });
});
