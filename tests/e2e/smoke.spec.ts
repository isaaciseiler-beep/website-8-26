import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: /Summation/i },
  { path: "/work", text: /Mapping the Rise of AI/i },
  { path: "/photos", text: /Australia/i },
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
    await expect(page.locator("#root")).toBeVisible();

    expect(errors.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
  });
}

test("mobile Ask AI stays usable when the viewport contracts for a keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let requestBody: { pageContext?: { route?: string; visibleText?: string } } | null = null;
  await page.route("**/api/chat", async (route) => {
    requestBody = route.request().postDataJSON() as typeof requestBody;
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
  await expect(page.getByRole("link", { name: "About", exact: true })).toBeVisible();
  expect(requestBody?.pageContext?.route).toBe("/");
  expect(requestBody?.pageContext?.visibleText).toContain("Summation");

  await page.setViewportSize({ width: 390, height: 540 });
  await expect(input).toBeVisible();
  const dock = await page.locator(".ai-dock-shell").boundingBox();
  expect(dock).not.toBeNull();
  expect((dock?.y ?? 0) + (dock?.height ?? 0)).toBeLessThanOrEqual(540);
});

test("desktop Ask AI focuses quickly and keeps the answer panel on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Isaac leads marketing and communications at Summation.",
        sources: [],
        requestId: "desktop-e2e-answer",
        mode: "reasoning",
        verified: true,
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Ask AI" }).click();
  const input = page.getByRole("textbox", { name: "Ask AI" });
  await expect(input).toBeFocused();
  await input.fill("Who is Isaac?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Isaac leads marketing and communications at Summation.")).toBeVisible();

  const dock = await page.locator(".ai-dock-shell").boundingBox();
  expect(dock).not.toBeNull();
  expect(dock?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((dock?.x ?? 0) + (dock?.width ?? 0)).toBeLessThanOrEqual(1440);
  expect(dock?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((dock?.y ?? 0) + (dock?.height ?? 0)).toBeLessThanOrEqual(900);
});

test("light mode stays white and overflow-free at representative widths", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  const paths = [
    "/",
    "/about",
    "/work",
    "/photos",
    "/projects/artificial-intelligence-in-state-government-index",
    "/photos/map",
  ];
  const viewports = [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of paths) {
      await page.goto(path);
      const result = await page.evaluate(() => ({
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
        rootBackground: getComputedStyle(document.querySelector<HTMLElement>("#root")!).backgroundColor,
        bodyFont: getComputedStyle(document.body).fontFamily,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));

      expect(result.bodyBackground, `${path} body at ${viewport.width}px`).toBe("rgb(255, 255, 255)");
      expect(result.htmlBackground, `${path} html at ${viewport.width}px`).toBe("rgb(255, 255, 255)");
      expect(result.rootBackground, `${path} root at ${viewport.width}px`).toBe("rgb(255, 255, 255)");
      expect(result.bodyFont, `${path} font at ${viewport.width}px`).toContain("Satoshi");
      expect(result.scrollWidth, `${path} overflow at ${viewport.width}px`).toBeLessThanOrEqual(result.viewportWidth);
    }
  }
});

test("homepage does not preload the route-only charts bundle", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const resources = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  expect(resources.some((name) => /\/assets\/charts-[^/]+\.js/.test(name))).toBe(false);
});

test("reduced motion disables the ambient assistant loop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animationName = await page.locator(".ai-ambient-form").evaluate((element) => getComputedStyle(element).animationName);
  expect(animationName).toBe("none");
});
