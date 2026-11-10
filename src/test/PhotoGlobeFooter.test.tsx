import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotoGlobeFooter from "@/components/PhotoGlobeFooter";

vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("@/lib/mapboxToken", () => ({ getMapboxToken: () => "" }));
vi.mock("@/components/NativeSatelliteGlobe", () => ({ default: () => null }));

class QuietObserver {
  observe() {}
  disconnect() {}
}

class NearbyObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) { this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  disconnect() {}
}

function RouteProbe() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}{location.search}</output>;
}

describe("photo globe keyboard focus", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", QuietObserver);
    vi.stubGlobal("ResizeObserver", QuietObserver);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("focuses only the visible crop instead of the oversized sphere", () => {
    render(<MemoryRouter><PhotoGlobeFooter /></MemoryRouter>);
    const globe = screen.getByRole("group", { name: "Photo globe" });
    expect(globe).toHaveClass("photo-globe-crop");
    expect(globe).toHaveAttribute("tabindex", "0");
    expect(globe).toHaveAccessibleDescription(/arrow keys.*Home resets/);
    expect(document.querySelector(".photo-globe-native")).not.toHaveAttribute("tabindex");
    globe.focus();
    expect(globe).toHaveFocus();
    expect(fireEvent.keyDown(globe, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(globe, { key: "Home" })).toBe(false);
  });

  it("shows the selected location in the toolbar and navigates only through its album link", async () => {
    vi.stubGlobal("IntersectionObserver", NearbyObserver);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(650);
    render(<MemoryRouter><PhotoGlobeFooter /><RouteProbe /></MemoryRouter>);
    expect(screen.getByText("Explore places")).toBeVisible();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Drag to explore")).not.toBeInTheDocument();

    const taiwan = await screen.findByRole("button", { name: "Select Taiwan" });
    fireEvent.click(taiwan);
    const link = screen.getByRole("link", { name: "Open Taiwan album" });
    expect(link).toHaveTextContent("Taiwan");
    expect(link).toHaveAttribute("href", "/photos?album=Taiwan");
    expect(link.querySelector("svg")).toHaveClass("lucide-arrow-up-right");
    expect(taiwan).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Explore places")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Current route")).toHaveTextContent(/^\/$/);

    fireEvent.click(screen.getByRole("button", { name: "Select Korea" }));
    expect(taiwan).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("link", { name: "Open Taiwan album" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Open Korea album" }));
    expect(screen.getByLabelText("Current route")).toHaveTextContent("/photos?album=Korea");
  });
});
