import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

async function createAliceTicket(page: Page, subject: string) {
  await login(page, "alice@acme.com", "Password123!");
  await expect(page).toHaveURL(/\/customer(?:$|\/)/);

  await page.getByRole("link", { name: /new request/i }).click();
  await page.getByPlaceholder(/short summary/i).fill(subject);
  await page
    .getByPlaceholder(/what happened/i)
    .fill("Testing the automated Playwright workflow for the assessment.");
  await page.getByRole("button", { name: /submit request/i }).click();

  await expect(page).toHaveURL(/\/customer\/tickets\//);
  await expect(
    page.getByRole("heading", { name: subject, exact: true }),
  ).toBeVisible();

  return page.url();
}

test.describe("Full Workflow & Security", () => {
  test("Customer creates a ticket, Agent replies, Customer sees reply", async ({
    page,
  }) => {
    const subject = `E2E Test Ticket ${Date.now()}`;
    const ticketUrl = await createAliceTicket(page, subject);

    await login(page, "maya@support.com", "Password123!");
    await expect(page).toHaveURL(/\/agent(?:$|\/|\?)/);
    await page.getByRole("link", { name: subject }).click();

    const reply =
      "Hi Alice, thanks for submitting the E2E test. We have received it and are closing it now.";
    await page.getByPlaceholder(/reply to customer/i).fill(reply);
    await page.getByRole("button", { name: /send reply/i }).click();
    await expect(page.getByText(reply)).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();
    await login(page, "alice@acme.com", "Password123!");
    await page.goto(ticketUrl);
    await expect(page.getByText(reply)).toBeVisible();
  });

  test("Customer cannot access another organization's ticket", async ({
    page,
  }) => {
    const ticketUrl = await createAliceTicket(
      page,
      `E2E Tenant Isolation ${Date.now()}`,
    );

    await login(page, "bob@northwind.com", "Password123!");
    await expect(page).toHaveURL(/\/customer(?:$|\/)/);

    const response = await page.goto(ticketUrl);
    expect(response?.status()).toBe(404);
  });
});
