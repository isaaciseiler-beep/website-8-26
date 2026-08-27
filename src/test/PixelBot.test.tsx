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
    document.querySelectorAll("[data-robot-surface='photo-frame']").forEach((surface) => surface.remove());
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

  it("rides the real photo-frame edge and returns to the viewport floor", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1_000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });

    let top = 840;
    const photoFrame = document.createElement("a");
    photoFrame.dataset.robotSurface = "photo-frame";
    vi.spyOn(photoFrame, "getBoundingClientRect").mockImplementation(() => ({
      x: 0,
      y: top,
      top,
      left: 0,
      right: 1_000,
      bottom: top + 600,
      width: 1_000,
      height: 600,
      toJSON: () => ({}),
    }));
    document.body.append(photoFrame);

    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);
    const bot = screen.getByRole("button", { name: "Ask AI" });
    const anchor = bot.closest<HTMLElement>(".ai-robot-surface-anchor");

    act(() => vi.advanceTimersByTime(20));
    expect(bot).toHaveAttribute("data-support", "viewportFloor");

    top = 798;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(20);
    });
    expect(bot).toHaveAttribute("data-support", "photoFrameTop");
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("2px");

    top = 690;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(20);
    });
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("110px");

    top = 680;
    act(() => vi.advanceTimersByTime(181));
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("120px");

    top = 675;
    act(() => vi.advanceTimersByTime(380));
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("125px");

    top = 805;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(20);
    });
    expect(bot).toHaveAttribute("data-support", "viewportFloor");
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("0px");
  });

  it("uses alternating, stepwise wall-climb states on its rare cycle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);

    const bot = screen.getByRole("button", { name: "Ask AI" });
    const anchor = bot.closest<HTMLElement>(".ai-robot-surface-anchor");
    fireEvent.pointerEnter(bot);

    act(() => vi.advanceTimersByTime(298_000));
    fireEvent.pointerLeave(bot);
    act(() => vi.advanceTimersByTime(501));
    expect(bot).toHaveAttribute("data-climb-requested", "true");
    expect(bot).toHaveAttribute("data-action", "wallTurn");

    act(() => vi.advanceTimersByTime(621));
    expect(bot).toHaveAttribute("data-support", "rightWall");
    expect(bot).toHaveAttribute("data-action", "climbUp");

    const firstPhase = bot.getAttribute("data-climb-phase");
    act(() => vi.advanceTimersByTime(181));
    expect(bot.getAttribute("data-climb-phase")).not.toBe(firstPhase);
    expect(Number.parseFloat(anchor?.style.getPropertyValue("--robot-surface-lift") ?? "0")).toBeGreaterThan(0);

    act(() => vi.advanceTimersByTime(3_200));
    expect(bot).toHaveAttribute("data-action", "wallPause");
    act(() => vi.advanceTimersByTime(1_801));
    expect(bot).toHaveAttribute("data-action", "climbDown");
    act(() => vi.advanceTimersByTime(3_100));
    expect(bot).toHaveAttribute("data-action", "wallLand");
    expect(bot).toHaveAttribute("data-support", "viewportFloor");
    act(() => vi.advanceTimersByTime(521));
    expect(bot).toHaveAttribute("data-action", "idle");
    expect(bot).toHaveAttribute("data-climb-requested", "false");
  });
});
