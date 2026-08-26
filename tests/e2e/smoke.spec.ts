import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: /Bridging/i },
  { path: "/projects", text: /Projects/i },
  { path: "/photos", text: /Photos/i },
  { path: "/photos/map", text: /Photo Map|Add .*Mapbox/i },
  { path: "/fulbrightmap", text: /New Taipei|Preparing the map|Add .*Mapbox/i },
  { path: "/experience/arcade", text: /Experience|Arcade|Start/i },
  { path: "/strike-tracker", text: /Strike Tracker/i },
];

for (const route of routes) {
  test(`${route.path} renders without page errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(route.path);
    await expect(page.locator("body")).toContainText(route.text);
    await expect(page.locator("main, #root")).toBeVisible();

    expect(errors.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
  });
}

test("mobile Ask AI stays usable when the viewport contracts for a keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Isaac leads marketing and communications at Summation.",
        confidence: "high",
        intent: "biography",
        sources: [{ id: "bio", title: "Isaac Seiler — Current Public Profile", source: "Public profile", url: "/about" }],
        suggestedQuestions: ["Which projects show that most clearly?"],
        requestId: "e2e-answer",
        model: "gpt-5.6-sol",
        mode: "reasoning",
        verified: true,
        latencyMs: 120,
        pageAware: true,
      }),
    });
  });

  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 600));
  const askButton = page.getByRole("button", { name: "Ask AI" });
  await expect(askButton).toBeVisible();
  await askButton.click();

  const input = page.getByRole("textbox", { name: "Ask AI" });
  await expect(input).toBeVisible();
  await expect(input).not.toBeFocused();
  await input.fill("Who is Isaac?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Isaac leads marketing and communications at Summation.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Isaac Seiler — Current Public Profile" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 540 });
  await expect(input).toBeVisible();
  const dock = await page.locator(".ai-dock-shell").boundingBox();
  expect(dock).not.toBeNull();
  expect((dock?.y ?? 0) + (dock?.height ?? 0)).toBeLessThanOrEqual(540);
});
