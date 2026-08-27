import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatOrb from "@/components/ChatOrb";
import { setSiteOverlayOpen } from "@/lib/siteOverlay";

describe("ChatOrb", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 24 });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    document.body.removeAttribute("data-site-sidebar-open");
    document.body.removeAttribute("data-site-search-open");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("closes the deployed assistant when a site panel opens", async () => {
    render(
      <MemoryRouter>
        <main>Page</main>
        <ChatOrb />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ask AI" }));
    expect(await screen.findByRole("textbox", { name: "Ask AI" })).toBeInTheDocument();

    act(() => setSiteOverlayOpen("sidebar", true));

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Ask AI" })).not.toBeInTheDocument());
  });

  it("uses the ambient assistant as the trigger from the top of the page", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

    render(
      <MemoryRouter>
        <main>Page</main>
        <ChatOrb />
      </MemoryRouter>,
    );

    const bot = await screen.findByRole("button", { name: "Ask AI" });
    expect(bot.querySelector(".ai-ambient-assistant")).toBeInTheDocument();

    fireEvent.click(bot);
    expect(await screen.findByRole("button", { name: "Close AI assistant" })).toHaveAttribute("aria-expanded", "true");
  });

  it("sends the current rendered page content with each question", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ message: "A short summary.", sources: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/projects/custom-story"]}>
        <main>
          <h1>A custom story</h1>
          <p>This page explains a community research project and its results.</p>
        </main>
        <ChatOrb />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ask AI" }));
    const input = await screen.findByRole("textbox", { name: "Ask AI" });
    fireEvent.change(input, { target: { value: "Summarize this page" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.pageContext.route).toBe("/projects/custom-story");
    expect(body.pageContext.title).toBe("A custom story");
    expect(body.pageContext.visibleText).toContain("community research project and its results");
  });

  it("does not auto-focus and summon the keyboard on a mobile pointer", async () => {
    render(
      <MemoryRouter>
        <main>Page</main>
        <ChatOrb />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ask AI" }));
    const input = await screen.findByRole("textbox", { name: "Ask AI" });

    await new Promise((resolve) => window.setTimeout(resolve, 300));
    expect(input).not.toHaveFocus();
  });

  it("keeps answer chrome compact and only shows extras for the latest answer", async () => {
    let requestCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      requestCount += 1;
      return new Response(JSON.stringify({
        message: requestCount === 1 ? "A short, human answer." : "A second short answer.",
        sources: [
          { id: "bio", title: "Isaac Seiler — Current Public Profile", source: "Profile", url: "/about" },
          { id: "current-role", title: "Current Role at Summation", source: "Role", url: "/about" },
        ],
        suggestedQuestions: [requestCount === 1 ? "What came next?" : "What did he build?"],
        requestId: `answer-${requestCount}`,
        mode: "reasoning",
        verified: true,
        confidence: "high",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    render(
      <MemoryRouter>
        <main>Page</main>
        <ChatOrb />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ask AI" }));
    const input = await screen.findByRole("textbox", { name: "Ask AI" });
    fireEvent.change(input, { target: { value: "Who is Isaac?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("A short, human answer.");
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Summation" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    expect(screen.queryByText(/Evidence-checked|high confidence|biography/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "What came next?" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("A second short answer.");
    expect(screen.queryByRole("button", { name: "What came next?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What did he build?" })).toBeInTheDocument();
  });
});
