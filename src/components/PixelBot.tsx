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
  const clickTimer = useRef<number | null>(null);

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

  const followPointer = (clientX: number, left: number, width: number) => {
    const nextGaze: AssistantGaze = clientX < left + width * 0.44
      ? "left"
      : clientX > left + width * 0.56
        ? "right"
        : "center";
    setGaze((current) => current === nextGaze ? current : nextGaze);
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
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          followPointer(event.clientX, bounds.left, bounds.width);
        }}
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
              transform="rotate(-2 48 36)"
            />
            <rect
              className="ai-ambient-inset"
              x="22"
              y="24"
              width="52"
              height="24"
              rx="12"
              transform="rotate(-1.4 48 36)"
            />
            <g className="ai-ambient-eyes">
              <ellipse className="ai-ambient-eye ai-ambient-eye--left" cx="41" cy="36.2" rx="3.4" ry="4.2" />
              <ellipse className="ai-ambient-eye ai-ambient-eye--right" cx="56" cy="35.8" rx="3.4" ry="4.2" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default PixelBot;
