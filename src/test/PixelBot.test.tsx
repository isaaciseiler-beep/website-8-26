import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PixelBot from "@/components/PixelBot";

describe("PixelBot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps the face minimal and uses the existing assistant toggle", () => {
    const onToggle = vi.fn();
    render(<PixelBot open={false} thinking={false} onToggle={onToggle} />);

    const bot = screen.getByRole("button", { name: "Ask AI" });
    expect(bot.querySelectorAll(".ai-robot-eye")).toHaveLength(2);
    expect(bot.querySelector(".ai-robot-visor-lip")).toBeInTheDocument();
    expect(bot.querySelector(".ai-robot-ground-contact")).toBeInTheDocument();
    expect(bot.querySelector(".ai-robot-mouth")).not.toBeInTheDocument();

    fireEvent.pointerEnter(bot);
    expect(bot).toHaveAttribute("data-action", "wave");
    expect(bot).toHaveAttribute("data-hovered", "true");

    fireEvent.click(bot);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(bot).toHaveAttribute("data-clicking", "true");
  });

  it("starts a bounded walking cycle instead of sliding in a fixed pose", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);

    const bot = screen.getByRole("button", { name: "Ask AI" });
    act(() => vi.advanceTimersByTime(8_001));

    expect(bot).toHaveAttribute("data-action", "walk");
    expect(bot).toHaveAttribute("data-direction", "left");
    expect(bot.style.getPropertyValue("--robot-walk-duration")).toMatch(/ms$/);

    act(() => vi.advanceTimersByTime(34));
    expect(bot.style.getPropertyValue("--robot-roam-offset")).not.toBe("0px");
  });

  it("does not change the robot markup when the assistant is open", () => {
    const { rerender } = render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);
    const closedBot = screen.getByRole("button", { name: "Ask AI" });
    const closedViewBox = closedBot.querySelector("svg")?.getAttribute("viewBox");

    rerender(<PixelBot open thinking={false} onToggle={vi.fn()} />);
    const openBot = screen.getByRole("button", { name: "Close AI assistant" });

    expect(openBot.querySelector("svg")?.getAttribute("viewBox")).toBe(closedViewBox);
    expect(openBot).toHaveAttribute("aria-expanded", "true");
  });
});
