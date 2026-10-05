import { test as base, expect, type Page } from "@playwright/test";

export const USERS = {
  admin: { email: "admin@plantvision.test", password: "plantvision-dev", state: "e2e/.auth/admin.json" },
  designer: { email: "designer@plantvision.test", password: "plantvision-dev", state: "e2e/.auth/designer.json" },
} as const;

/** Unique suffix so repeated runs against the same database never collide. */
export const unique = (prefix: string) =>
  `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export async function signIn(page: Page, user: (typeof USERS)[keyof typeof USERS]) {
  await page.goto("/login");
  await page.getByLabel("E-post").fill(user.email);
  await page.getByLabel("Lösenord").fill(user.password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page).toHaveURL(/\/projects/);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

export { base as test, expect };
