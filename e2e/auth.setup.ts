import { signIn, test, USERS } from "./fixtures";

for (const [role, user] of Object.entries(USERS)) {
  test(`sign in as ${role}`, async ({ page }) => {
    await signIn(page, user);
    await page.context().storageState({ path: user.state });
  });
}
