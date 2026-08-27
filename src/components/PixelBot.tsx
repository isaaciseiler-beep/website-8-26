import { useEffect, useRef, useState } from "react";

interface PixelBotProps {
  open: boolean;
  thinking: boolean;
  onToggle: () => void;
}

type AssistantGaze = "left" | "center" | "right";

const randomBetween = (minimum: number, maximum: number) =>
  Math.round(minimum + Math.random() * (maximum - minimum));

const PixelBot = ({ open, thinking, onToggle }: PixelBotProps) => {
  const [blinking, setBlinking] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [gaze, setGaze] = useState<AssistantGaze>("center");
  const [awarenessCycle, setAwarenessCycle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const clickTimer = useRef<number | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const pointerPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (open || hovered || blinking || reducedMotion) return;
    const timer = window.setTimeout(() => setBlinking(true), randomBetween(4_000, 9_000));
    return () => window.clearTimeout(timer);
  }, [blinking, hovered, open, reducedMotion]);

  useEffect(() => {
    if (!blinking) return;
    const timer = window.setTimeout(() => setBlinking(false), 180);
    return () => window.clearTimeout(timer);
  }, [blinking]);

  useEffect(() => {
    if (open || hovered || reducedMotion) return;
    let returnTimer = 0;
    const awarenessTimer = window.setTimeout(() => {
      setGaze(Math.random() < 0.5 ? "left" : "right");
      returnTimer = window.setTimeout(() => {
        setGaze("center");
        setAwarenessCycle((cycle) => cycle + 1);
      }, 1_250);
    }, randomBetween(7_000, 14_000));
    return () => {
      window.clearTimeout(awarenessTimer);
      window.clearTimeout(returnTimer);
    };
  }, [awarenessCycle, hovered, open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    setBlinking(false);
    setGaze("center");
  }, [open]);

  useEffect(() => {
    if (reducedMotion) return;

    const updateEyes = () => {
      pointerFrame.current = null;
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const deltaX = pointerPosition.current.x - (bounds.left + bounds.width / 2);
      const deltaY = pointerPosition.current.y - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(deltaX, deltaY);
      const influence = Math.min(1, distance / 240);
      const angle = Math.atan2(deltaY, deltaX);
      const eyeX = Math.cos(angle) * 3.2 * influence;
      const eyeY = Math.sin(angle) * 2 * influence;

      trigger.dataset.cursorTracking = "true";
      trigger.style.setProperty("--ai-eye-x", `${eyeX.toFixed(2)}px`);
      trigger.style.setProperty("--ai-eye-y", `${eyeY.toFixed(2)}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      if (pointerFrame.current === null) {
        pointerFrame.current = window.requestAnimationFrame(updateEyes);
      }
    };

    const resetEyes = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      trigger.removeAttribute("data-cursor-tracking");
      trigger.style.removeProperty("--ai-eye-x");
      trigger.style.removeProperty("--ai-eye-y");
    };

    const page = document.documentElement;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetEyes);
    page.addEventListener("pointerleave", resetEyes);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetEyes);
      page.removeEventListener("pointerleave", resetEyes);
      if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
      pointerFrame.current = null;
      resetEyes();
    };
  }, [reducedMotion]);

  useEffect(() => () => {
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
  }, []);

  const beginInteraction = () => {
    setHovered(true);
    setBlinking(false);
  };

  const endInteraction = () => {
    setHovered(false);
    setGaze("center");
  };

  const handleToggle = () => {
    setClicking(true);
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => setClicking(false), 320);
    onToggle();
  };

  return (
    <div className="ai-ambient-assistant-anchor">
      <button
        ref={triggerRef}
        type="button"
        className="ai-ambient-assistant-trigger"
        data-open={open ? "true" : "false"}
        data-thinking={thinking ? "true" : "false"}
        data-blinking={blinking ? "true" : "false"}
        data-hovered={hovered ? "true" : "false"}
        data-clicking={clicking ? "true" : "false"}
        data-gaze={gaze}
        onClick={handleToggle}
        onPointerEnter={beginInteraction}
        onPointerLeave={endInteraction}
        onFocus={beginInteraction}
        onBlur={endInteraction}
        aria-label={open ? "Close AI assistant" : "Ask AI"}
        aria-expanded={open}
      >
        <svg
          className="ai-ambient-assistant"
          viewBox="0 0 96 72"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
          <g className="ai-ambient-form">
            <rect
              className="ai-ambient-shell"
              x="5"
              y="7"
              width="86"
              height="58"
              rx="29"
            />
            <rect
              className="ai-ambient-inset"
              x="22"
              y="24"
              width="52"
              height="24"
              rx="12"
            />
            <g className="ai-ambient-eyes">
              <ellipse className="ai-ambient-eye ai-ambient-eye--left" cx="41" cy="36.2" rx="4.08" ry="5.04" />
              <ellipse className="ai-ambient-eye ai-ambient-eye--right" cx="56" cy="35.8" rx="4.08" ry="5.04" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default PixelBot;
