import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sitemapItems } from "@/components/Sidebar";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

const ThemeValue = () => {
  const { theme, resolvedTheme } = useTheme();
  return <span>{`${theme}:${resolvedTheme}`}</span>;
};

describe("navigation and theme defaults", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light", "skull");
    delete document.documentElement.dataset.themePreference;
  });

  it("keeps About linked directly and migrates the retired theme", () => {
    expect(sitemapItems.find(item => item.id === "about")).toMatchObject({ href: "/about" });
    window.localStorage.setItem("theme", "skull");
    window.localStorage.setItem("pre-skull-theme", "light");
    render(<ThemeProvider><ThemeValue /></ThemeProvider>);
    expect(screen.getByText("light:light")).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("skull");
  });

  it("keeps Music in the main navigation and retires the separate Photo Map page", () => {
    expect(sitemapItems.find(item => item.id === "music")).toMatchObject({ label: "Music", href: "/photos/music" });
    expect(sitemapItems.some(item => item.href === "/photos/map")).toBe(false);
  });

  it("defaults new visitors to light while preserving a saved dark preference", async () => {
    const firstRender = render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    expect(screen.getByText("light:light")).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement).toHaveClass("light"));

    firstRender.unmount();
    window.localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    expect(screen.getByText("dark:dark")).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });
});
