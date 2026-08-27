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
          viewBox="0 0 96 88"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
          <ellipse className="ai-ambient-shadow" cx="48" cy="79" rx="25" ry="4" />

          <g className="ai-ambient-form">
            <path
              className="ai-ambient-shell"
              d="M40 7C62 4 79 13 85 29c2 5 3 11 3 18 0 19-13 31-34 34l-11 1C24 83 10 73 8 55L7 42C5 24 17 11 35 8l5-1Z"
            />
            <path
              className="ai-ambient-side-plane"
              d="M75 15c8 7 12 18 13 32 0 18-11 29-28 33 11-7 16-18 16-34 0-12-2-22-7-29l6-2Z"
            />
            <path
              className="ai-ambient-highlight"
              d="M19 25C24 15 34 11 48 10c11-1 20 1 27 6-10-2-21-2-33 0-10 1-18 5-23 9Z"
            />
            <rect
              className="ai-ambient-face"
              x="18"
              y="25"
              width="61"
              height="35"
              rx="16"
              transform="rotate(-2 48.5 42.5)"
            />
            <rect
              className="ai-ambient-face-edge"
              x="19"
              y="26"
              width="59"
              height="33"
              rx="15"
              transform="rotate(-2 48.5 42.5)"
            />
            <g className="ai-ambient-eyes">
              <ellipse className="ai-ambient-eye ai-ambient-eye--left" cx="39" cy="42" rx="3.6" ry="4" />
              <ellipse className="ai-ambient-eye ai-ambient-eye--right" cx="59" cy="41.3" rx="3.6" ry="4" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default PixelBot;
