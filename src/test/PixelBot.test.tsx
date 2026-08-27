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

  it("uses only a white outer pill, a white inset, and two enlarged eyes", () => {
    const onToggle = vi.fn();
    render(<PixelBot open={false} thinking={false} onToggle={onToggle} />);

    const assistant = screen.getByRole("button", { name: "Ask AI" });
    expect(assistant.querySelectorAll(".ai-ambient-shell")).toHaveLength(1);
    expect(assistant.querySelectorAll(".ai-ambient-inset")).toHaveLength(1);
    expect(assistant.querySelectorAll(".ai-ambient-eye")).toHaveLength(2);
    assistant.querySelectorAll(".ai-ambient-eye").forEach((eye) => {
      expect(eye).toHaveAttribute("rx", "4.08");
      expect(eye).toHaveAttribute("ry", "5.04");
    });
    expect(assistant.querySelectorAll("svg path, svg rect, svg circle, svg ellipse")).toHaveLength(4);
    expect(assistant.querySelector(".ai-ambient-shadow")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-ambient-side-plane")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-ambient-highlight")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-ambient-face-edge")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-robot-antenna")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-robot-arm")).not.toBeInTheDocument();
    expect(assistant.querySelector(".ai-robot-leg")).not.toBeInTheDocument();

    fireEvent.pointerEnter(assistant);
    expect(assistant).toHaveAttribute("data-hovered", "true");

    fireEvent.click(assistant);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(assistant).toHaveAttribute("data-clicking", "true");
  });

  it("tracks the cursor across the viewport without changing React state", () => {
    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);
    const assistant = screen.getByRole("button", { name: "Ask AI" });
    vi.spyOn(assistant, "getBoundingClientRect").mockReturnValue({
      x: 320,
      y: 700,
      left: 320,
      top: 700,
      right: 390,
      bottom: 756,
      width: 70,
      height: 56,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(window, { clientX: 20, clientY: 40 });
    act(() => vi.advanceTimersByTime(20));
    expect(assistant).toHaveAttribute("data-cursor-tracking", "true");
    expect(Number.parseFloat(assistant.style.getPropertyValue("--ai-eye-x"))).toBeLessThan(0);
    expect(Number.parseFloat(assistant.style.getPropertyValue("--ai-eye-y"))).toBeLessThan(0);

    fireEvent.pointerMove(window, { clientX: 1200, clientY: 860 });
    act(() => vi.advanceTimersByTime(20));
    expect(Number.parseFloat(assistant.style.getPropertyValue("--ai-eye-x"))).toBeGreaterThan(0);
    expect(Number.parseFloat(assistant.style.getPropertyValue("--ai-eye-y"))).toBeGreaterThan(0);
  });

  it("glances quietly during its sparse awareness cycle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);

    const assistant = screen.getByRole("button", { name: "Ask AI" });
    act(() => vi.advanceTimersByTime(7_001));
    expect(assistant).toHaveAttribute("data-gaze", "left");

    act(() => vi.advanceTimersByTime(1_251));
    expect(assistant).toHaveAttribute("data-gaze", "center");
  });

  it("keeps the same character visible when the assistant opens", () => {
    const { rerender } = render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);
    const closedAssistant = screen.getByRole("button", { name: "Ask AI" });
    const closedViewBox = closedAssistant.querySelector("svg")?.getAttribute("viewBox");

    rerender(<PixelBot open thinking={false} onToggle={vi.fn()} />);
    const openAssistant = screen.getByRole("button", { name: "Close AI assistant" });

    expect(openAssistant.querySelector("svg")?.getAttribute("viewBox")).toBe(closedViewBox);
    expect(openAssistant.querySelector(".ai-ambient-shell")).toBeInTheDocument();
    expect(openAssistant).toHaveAttribute("data-open", "true");
    expect(openAssistant).toHaveAttribute("aria-expanded", "true");
  });

  it("does not attach itself to page terrain", () => {
    const photoFrame = document.createElement("div");
    photoFrame.dataset.robotSurface = "photo-frame";
    document.body.append(photoFrame);

    render(<PixelBot open={false} thinking={false} onToggle={vi.fn()} />);
    const assistant = screen.getByRole("button", { name: "Ask AI" });
    window.dispatchEvent(new Event("scroll"));
    act(() => vi.advanceTimersByTime(600));

    expect(assistant).not.toHaveAttribute("data-support");
    const anchor = assistant.closest<HTMLElement>(".ai-ambient-assistant-anchor");
    expect(anchor?.style.getPropertyValue("--robot-surface-lift")).toBe("");
    photoFrame.remove();
  });
});
