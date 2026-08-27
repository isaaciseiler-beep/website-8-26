import { useEffect, useRef, useState, type CSSProperties } from "react";

interface PixelBotProps {
  open: boolean;
  thinking: boolean;
  onToggle: () => void;
}

type RobotAction = "idle" | "look" | "wave" | "sit" | "turn" | "walk";
type RobotDirection = "left" | "right";
type RobotGaze = RobotDirection | "center";

interface WalkPlan {
  target: number;
  direction: RobotDirection;
  duration: number;
}

const ACTION_DURATION: Partial<Record<RobotAction, number>> = {
  look: 1_600,
  wave: 1_200,
  sit: 3_000,
};

const ACTION_POOL: RobotAction[] = ["walk", "walk", "walk", "look", "look", "wave", "sit"];

const randomBetween = (minimum: number, maximum: number) =>
  Math.round(minimum + Math.random() * (maximum - minimum));

const getRoamLimit = () => {
  if (window.innerWidth <= 767) return Math.min(90, Math.max(40, window.innerWidth - 180));
  return Math.min(280, Math.max(120, window.innerWidth * 0.22));
};

const PixelBot = ({ open, thinking, onToggle }: PixelBotProps) => {
  const [action, setAction] = useState<RobotAction>("idle");
  const [blinking, setBlinking] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [gaze, setGaze] = useState<RobotGaze>("center");
  const [direction, setDirection] = useState<RobotDirection>("left");
  const [roamLimit, setRoamLimit] = useState(() => getRoamLimit());
  const [roamOffset, setRoamOffset] = useState(0);
  const [walkPlan, setWalkPlan] = useState<WalkPlan | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasHovered = useRef(false);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateRange = () => {
      const nextLimit = getRoamLimit();
      setRoamLimit(nextLimit);
      setRoamOffset((current) => Math.min(current, nextLimit));
    };
    window.addEventListener("resize", updateRange);
    return () => window.removeEventListener("resize", updateRange);
  }, []);

  useEffect(() => {
    if (open || hovered || reducedMotion || action !== "idle") return;
    const timer = window.setTimeout(() => {
      const nextAction = ACTION_POOL[Math.floor(Math.random() * ACTION_POOL.length)];
      if (nextAction !== "walk") {
        setAction(nextAction);
        return;
      }

      const returningHome = roamOffset > roamLimit * 0.58 && Math.random() < 0.52;
      let target = returningHome
        ? randomBetween(0, Math.max(12, Math.round(roamLimit * 0.22)))
        : randomBetween(Math.round(roamLimit * 0.24), roamLimit);

      if (Math.abs(target - roamOffset) < 34) {
        target = roamOffset < roamLimit / 2
          ? Math.min(roamLimit, roamOffset + randomBetween(44, 82))
          : Math.max(0, roamOffset - randomBetween(44, 82));
      }

      const nextDirection: RobotDirection = target > roamOffset ? "left" : "right";
      const distance = Math.abs(target - roamOffset);
      const duration = Math.round(Math.max(1_450, Math.min(5_400, distance / 0.032)));
      setWalkPlan({ target, direction: nextDirection, duration });
      setGaze(nextDirection);
      setAction(direction === nextDirection ? "walk" : "turn");
    }, randomBetween(8_000, 20_000));
    return () => window.clearTimeout(timer);
  }, [action, direction, hovered, open, reducedMotion, roamLimit, roamOffset]);

  useEffect(() => {
    const duration = ACTION_DURATION[action];
    if (!duration) return;
    const timer = window.setTimeout(() => {
      setAction("idle");
      setGaze("center");
    }, duration);
    return () => window.clearTimeout(timer);
  }, [action]);

  useEffect(() => {
    if (action !== "turn" || !walkPlan) return;
    const timer = window.setTimeout(() => {
      setDirection(walkPlan.direction);
      setAction("walk");
    }, 460);
    return () => window.clearTimeout(timer);
  }, [action, walkPlan]);

  useEffect(() => {
    if (action !== "walk" || !walkPlan) return;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => setRoamOffset(walkPlan.target));
    });
    const timer = window.setTimeout(() => {
      setAction("idle");
      setWalkPlan(null);
      setGaze("center");
    }, walkPlan.duration + 40);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [action, walkPlan]);

  useEffect(() => {
    if (open || hovered || action !== "idle" || blinking || reducedMotion) return;
    const timer = window.setTimeout(() => setBlinking(true), randomBetween(4_000, 9_000));
    return () => window.clearTimeout(timer);
  }, [action, blinking, hovered, open, reducedMotion]);

  useEffect(() => {
    if (!blinking) return;
    const timer = window.setTimeout(() => setBlinking(false), 180);
    return () => window.clearTimeout(timer);
  }, [blinking]);

  useEffect(() => {
    if (!open) return;
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
    if (!hasHovered.current && action === "idle") {
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
      clickTimer.current = window.setTimeout(() => setClicking(false), 360);
    }
    onToggle();
  };

  const robotStyle = {
    "--robot-roam-offset": `${roamOffset}px`,
    "--robot-walk-duration": `${walkPlan?.duration ?? 0}ms`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="ai-pixel-bot-trigger"
      style={robotStyle}
      data-open={open ? "true" : "false"}
      data-thinking={thinking ? "true" : "false"}
      data-action={action}
      data-direction={direction}
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
        viewBox="0 0 112 126"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <g className="ai-robot-ground-contact">
          <rect x="31" y="122" width="20" height="2" rx="1" />
          <rect x="61" y="122" width="20" height="2" rx="1" />
        </g>

        <g className="ai-robot-rig">
          <g className="ai-robot-legs">
            <g className="ai-robot-leg ai-robot-leg--left">
              <rect x="38" y="99" width="8" height="12" rx="2.5" />
            </g>
            <g className="ai-robot-leg ai-robot-leg--right">
              <rect x="66" y="99" width="8" height="12" rx="2.5" />
            </g>
          </g>

          <g className="ai-robot-feet">
            <g className="ai-robot-foot ai-robot-foot--left">
              <path className="ai-robot-foot-shell" d="M31 115c0-3 2-5 5-5h11c3 0 5 2 5 5v8H31z" />
              <path className="ai-robot-foot-plane" d="M31 119h21v4H31z" />
            </g>
            <g className="ai-robot-foot ai-robot-foot--right">
              <path className="ai-robot-foot-shell" d="M60 115c0-3 2-5 5-5h11c3 0 5 2 5 5v8H60z" />
              <path className="ai-robot-foot-plane" d="M60 119h21v4H60z" />
            </g>
          </g>

          <g className="ai-robot-arm ai-robot-arm--left">
            <rect className="ai-robot-joint-shadow" x="19" y="77" width="10" height="14" rx="4" />
            <rect className="ai-robot-arm-shell" x="17" y="86" width="11" height="14" rx="4" />
          </g>
          <g className="ai-robot-arm ai-robot-arm--right">
            <rect className="ai-robot-joint-shadow" x="83" y="77" width="10" height="14" rx="4" />
            <rect className="ai-robot-arm-shell" x="84" y="86" width="11" height="14" rx="4" />
          </g>

          <g className="ai-robot-torso">
            <path className="ai-robot-torso-shadow" d="M34 73h44c3 0 5 2 5 5H29c0-3 2-5 5-5z" />
            <rect className="ai-robot-torso-shell" x="31" y="75" width="50" height="29" rx="9" />
            <path className="ai-robot-torso-highlight" d="M37 77h30c5 0 8 2 9 5H34c0-3 1-5 3-5z" />
            <path className="ai-robot-torso-plane" d="M31 95h50v2c0 4-3 7-7 7H38c-4 0-7-3-7-7z" />
          </g>

          <g className="ai-robot-head">
            <rect className="ai-robot-ear-back ai-robot-ear--left" x="6" y="34" width="9" height="27" rx="4" />
            <rect className="ai-robot-ear-back ai-robot-ear--right" x="97" y="34" width="9" height="27" rx="4" />
            <rect className="ai-robot-ear ai-robot-ear--left" x="10" y="37" width="7" height="21" rx="3" />
            <rect className="ai-robot-ear ai-robot-ear--right" x="95" y="37" width="7" height="21" rx="3" />
            <rect className="ai-robot-head-shell" x="11" y="14" width="90" height="62" rx="14" />
            <path className="ai-robot-head-highlight" d="M25 16h57c7 0 12 3 15 8H17c2-5 5-8 8-8z" />
            <path className="ai-robot-head-plane" d="M11 63h90v1c0 7-5 12-12 12H23c-7 0-12-5-12-12z" />
            <rect className="ai-robot-visor-lip" x="21" y="29" width="70" height="37" rx="12" />
            <rect className="ai-robot-visor" x="24" y="32" width="64" height="31" rx="10" />
            <g className="ai-robot-eyes">
              <circle className="ai-robot-eye ai-robot-eye--left" cx="42" cy="46" r="4" />
              <circle className="ai-robot-eye ai-robot-eye--right" cx="70" cy="46" r="4" />
            </g>
          </g>

          <g className="ai-robot-antenna">
            <rect className="ai-robot-antenna-stem" x="54.5" y="6" width="3" height="9" rx="1.5" />
            <circle className="ai-robot-antenna-dot" cx="56" cy="4" r="3.2" />
          </g>
        </g>
      </svg>
    </button>
  );
};

export default PixelBot;
