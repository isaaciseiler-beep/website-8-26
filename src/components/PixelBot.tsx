import { useEffect, useRef, useState } from "react";

interface PixelBotProps {
  open: boolean;
  thinking: boolean;
  onToggle: () => void;
}

type RobotAction = "idle" | "look" | "wave" | "peek" | "sit" | "hop";
type RobotGaze = "left" | "center" | "right";

const ACTION_DURATION: Record<Exclude<RobotAction, "idle">, number> = {
  look: 1_600,
  wave: 1_180,
  peek: 2_100,
  sit: 3_200,
  hop: 540,
};

const ACTION_POOL: Exclude<RobotAction, "idle">[] = [
  "look",
  "look",
  "wave",
  "peek",
  "sit",
  "hop",
];

const randomBetween = (minimum: number, maximum: number) =>
  Math.round(minimum + Math.random() * (maximum - minimum));

const PixelBot = ({ open, thinking, onToggle }: PixelBotProps) => {
  const [action, setAction] = useState<RobotAction>("idle");
  const [blinking, setBlinking] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [gaze, setGaze] = useState<RobotGaze>("center");
  const hasHovered = useRef(false);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    if (open || hovered || action !== "idle") return;
    const timer = window.setTimeout(() => {
      const nextAction = ACTION_POOL[Math.floor(Math.random() * ACTION_POOL.length)];
      setAction(nextAction);
    }, randomBetween(8_000, 18_000));
    return () => window.clearTimeout(timer);
  }, [action, hovered, open]);

  useEffect(() => {
    if (action === "idle") return;
    const timer = window.setTimeout(() => setAction("idle"), ACTION_DURATION[action]);
    return () => window.clearTimeout(timer);
  }, [action]);

  useEffect(() => {
    if (open || hovered || action !== "idle" || blinking) return;
    const timer = window.setTimeout(() => setBlinking(true), randomBetween(4_000, 9_000));
    return () => window.clearTimeout(timer);
  }, [action, blinking, hovered, open]);

  useEffect(() => {
    if (!blinking) return;
    const timer = window.setTimeout(() => setBlinking(false), 180);
    return () => window.clearTimeout(timer);
  }, [blinking]);

  useEffect(() => {
    if (!open) return;
    setAction("idle");
    setBlinking(false);
    setHovered(false);
    setGaze("center");
  }, [open]);

  useEffect(() => () => {
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
  }, []);

  const beginInteraction = () => {
    if (open) return;
    setHovered(true);
    setBlinking(false);
    if (!hasHovered.current) {
      hasHovered.current = true;
      setAction("wave");
    }
  };

  const endInteraction = () => {
    setHovered(false);
    setGaze("center");
    if (action === "wave") setAction("idle");
  };

  const followPointer = (clientX: number, left: number, width: number) => {
    const nextGaze: RobotGaze = clientX < left + width * 0.44
      ? "left"
      : clientX > left + width * 0.56
        ? "right"
        : "center";
    setGaze((current) => current === nextGaze ? current : nextGaze);
  };

  const handleToggle = () => {
    if (!open) {
      setClicking(true);
      if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
      clickTimer.current = window.setTimeout(() => setClicking(false), 540);
    }
    onToggle();
  };

  return (
    <button
      type="button"
      className="ai-pixel-bot-trigger"
      data-open={open ? "true" : "false"}
      data-thinking={thinking ? "true" : "false"}
      data-action={action}
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
        className="ai-pixel-bot"
        viewBox="0 0 120 140"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <ellipse className="ai-robot-shadow" cx="60" cy="134" rx="29" ry="4" />

        <g className="ai-robot-rig">
          <g className="ai-robot-leg ai-robot-leg--left">
            <rect className="ai-robot-body-shade" x="35" y="108" width="20" height="20" rx="8" />
            <rect className="ai-robot-body" x="31" y="121" width="27" height="11" rx="5.5" />
          </g>
          <g className="ai-robot-leg ai-robot-leg--right">
            <rect className="ai-robot-body-shade" x="65" y="108" width="20" height="20" rx="8" />
            <rect className="ai-robot-body" x="62" y="121" width="27" height="11" rx="5.5" />
          </g>

          <g className="ai-robot-arm ai-robot-arm--left">
            <rect className="ai-robot-body-shade" x="17" y="77" width="19" height="39" rx="9.5" transform="rotate(14 26.5 96.5)" />
            <circle className="ai-robot-body" cx="21" cy="111" r="8" />
          </g>
          <g className="ai-robot-arm ai-robot-arm--right">
            <rect className="ai-robot-body-shade" x="84" y="77" width="19" height="39" rx="9.5" transform="rotate(-14 93.5 96.5)" />
            <circle className="ai-robot-body" cx="99" cy="111" r="8" />
          </g>

          <g className="ai-robot-torso">
            <rect className="ai-robot-body" x="34" y="76" width="52" height="43" rx="20" />
            <path className="ai-robot-body-shade" d="M36 99c10 8 38 8 48 0v7c0 10-8 15-24 15s-24-5-24-15z" />
          </g>

          <g className="ai-robot-head">
            <rect className="ai-robot-ear ai-robot-ear--left" x="8" y="35" width="17" height="36" rx="8.5" />
            <rect className="ai-robot-ear ai-robot-ear--right" x="95" y="35" width="17" height="36" rx="8.5" />
            <rect className="ai-robot-head-shell" x="18" y="23" width="84" height="59" rx="23" />
            <path className="ai-robot-head-shade" d="M20 62c15 10 65 10 80 0v5c0 10-9 15-20 15H40c-11 0-20-5-20-15z" />
            <rect className="ai-robot-visor" x="29" y="36" width="62" height="34" rx="15" />
            <g className="ai-robot-eyes">
              <circle className="ai-robot-eye ai-robot-eye--left" cx="46" cy="53" r="6.5" />
              <circle className="ai-robot-eye ai-robot-eye--right" cx="74" cy="53" r="6.5" />
            </g>
          </g>

          <g className="ai-robot-antenna">
            <rect className="ai-robot-antenna-stem" x="57" y="12" width="6" height="14" rx="3" />
            <circle className="ai-robot-antenna-dot" cx="60" cy="9" r="8" />
          </g>
        </g>
      </svg>
    </button>
  );
};

export default PixelBot;
