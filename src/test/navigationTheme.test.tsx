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

  it("removes About from navigation and migrates the retired theme", () => {
    expect(sitemapItems.some(item => item.id === "about")).toBe(false);
    window.localStorage.setItem("theme", "skull");
    window.localStorage.setItem("pre-skull-theme", "light");
    render(<ThemeProvider><ThemeValue /></ThemeProvider>);
    expect(screen.getByText("light:light")).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("skull");
  });

  it("lists Music as a top-level destination immediately after Photo Map", () => {
    const photosIndex = sitemapItems.findIndex((item) => item.id === "photos");
    const photos = sitemapItems[photosIndex];
    const music = sitemapItems[photosIndex + 1];

    expect(photos).toMatchObject({ label: "Photo Map", href: "/photos/map" });
    expect(photos.children).toBeUndefined();
    expect(music).toMatchObject({ id: "music", label: "Music", href: "/photos/music" });
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
