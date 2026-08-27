import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

interface PixelBotProps {
  open: boolean;
  thinking: boolean;
  onToggle: () => void;
}

type RobotAction =
  | "idle"
  | "look"
  | "wave"
  | "sit"
  | "turn"
  | "walk"
  | "surfaceContact"
  | "edgeInspect"
  | "wallTurn"
  | "climbUp"
  | "wallPause"
  | "climbDown"
  | "wallLand";
type RobotDirection = "left" | "right";
type RobotGaze = RobotDirection | "center" | "up" | "down";
type SupportSurface = "viewportFloor" | "photoFrameTop" | "rightWall";
type WalkPurpose = "roam" | "climb" | "edge";
type ClimbPhase = "a" | "b";

interface WalkPlan {
  target: number;
  direction: RobotDirection;
  duration: number;
  purpose: WalkPurpose;
}

const PHOTO_SURFACE_SELECTOR = "[data-robot-surface='photo-frame']";
const ACTION_DURATION: Partial<Record<RobotAction, number>> = {
  look: 1_600,
  wave: 1_200,
  sit: 3_000,
  surfaceContact: 420,
  edgeInspect: 1_900,
};
const FLOOR_ACTIONS: RobotAction[] = ["walk", "walk", "walk", "look", "look", "wave", "sit"];
const FRAME_ACTIONS: RobotAction[] = ["walk", "walk", "look", "wave", "sit", "edgeInspect"];

const randomBetween = (minimum: number, maximum: number) =>
  Math.round(minimum + Math.random() * (maximum - minimum));

const getRobotMetrics = () => window.innerWidth <= 767
  ? { width: 60, homeInset: 10 }
  : { width: 78, homeInset: 14 };

const getDefaultRoamLimit = () => {
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
  const [supportSurface, setSupportSurface] = useState<SupportSurface>("viewportFloor");
  const [roamMinimum, setRoamMinimum] = useState(0);
  const [roamLimit, setRoamLimit] = useState(() => getDefaultRoamLimit());
  const [roamOffset, setRoamOffset] = useState(0);
  const [walkPlan, setWalkPlan] = useState<WalkPlan | null>(null);
  const [climbRequested, setClimbRequested] = useState(false);
  const [climbCycle, setClimbCycle] = useState(0);
  const [climbPhase, setClimbPhase] = useState<ClimbPhase>("a");
  const [reducedMotion, setReducedMotion] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const photoFrameRef = useRef<HTMLElement | null>(null);
  const hasHovered = useRef(false);
  const clickTimer = useRef<number | null>(null);
  const actionRef = useRef<RobotAction>("idle");
  const supportRef = useRef<SupportSurface>("viewportFloor");
  const roamOffsetRef = useRef(0);
  const roamBoundsRef = useRef({ minimum: 0, maximum: getDefaultRoamLimit() });
  const surfaceLiftRef = useRef(0);
  const climbPeakRef = useRef(0);
  const openRef = useRef(open);
  const hoveredRef = useRef(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => { actionRef.current = action; }, [action]);
  useEffect(() => { roamOffsetRef.current = roamOffset; }, [roamOffset]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);
  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

  const updateSurfaceLift = useCallback((nextLift: number) => {
    const lift = Math.max(0, nextLift);
    surfaceLiftRef.current = lift;
    anchorRef.current?.style.setProperty("--robot-surface-lift", `${lift}px`);
  }, []);

  const changeSupport = useCallback((nextSupport: SupportSurface) => {
    supportRef.current = nextSupport;
    setSupportSurface(nextSupport);
  }, []);

  const updateRoamBounds = useCallback((nextMinimum: number, nextMaximum: number) => {
    const minimum = Math.max(0, Math.round(nextMinimum));
    const maximum = Math.max(minimum, Math.round(nextMaximum));
    const current = roamBoundsRef.current;
    if (current.minimum === minimum && current.maximum === maximum) return;
    roamBoundsRef.current = { minimum, maximum };
    setRoamMinimum(minimum);
    setRoamLimit(maximum);
    setRoamOffset((offset) => {
      const nextOffset = Math.min(maximum, Math.max(minimum, offset));
      roamOffsetRef.current = nextOffset;
      return nextOffset;
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateRange = () => {
      if (supportRef.current === "viewportFloor") {
        updateRoamBounds(0, getDefaultRoamLimit());
      }
    };
    window.addEventListener("resize", updateRange);
    return () => window.removeEventListener("resize", updateRange);
  }, [updateRoamBounds]);

  useEffect(() => {
    let frame = 0;
    let scrollSettleTimer = 0;
    let scrollFinalTimer = 0;
    let previousTop: number | null = null;
    let observedPhotoFrame: HTMLElement | null = null;
    let layoutObserver: ResizeObserver | null = null;

    const updateEnvironment = () => {
      frame = 0;
      const cachedPhotoFrame = photoFrameRef.current;
      const photoFrame = cachedPhotoFrame?.isConnected
        ? cachedPhotoFrame
        : document.querySelector<HTMLElement>(PHOTO_SURFACE_SELECTOR);
      photoFrameRef.current = photoFrame;
      if (!photoFrame || reducedMotionRef.current) {
        previousTop = null;
        return;
      }

      if (layoutObserver && observedPhotoFrame !== photoFrame) {
        layoutObserver.disconnect();
        layoutObserver.observe(document.body);
        layoutObserver.observe(photoFrame);
        if (photoFrame.parentElement) layoutObserver.observe(photoFrame.parentElement);
        observedPhotoFrame = photoFrame;
      }

      const rect = photoFrame.getBoundingClientRect();
      const floor = window.innerHeight;
      const movingUp = previousTop !== null && rect.top < previousTop - 0.25;
      const movingDown = previousTop !== null && rect.top > previousTop + 0.25;
      const { width: robotWidth, homeInset } = getRobotMetrics();
      const robotRight = window.innerWidth - homeInset - roamOffsetRef.current;
      const robotLeft = robotRight - robotWidth;
      const overlapsFrame = robotRight >= rect.left && robotLeft <= rect.right;
      const onWall = supportRef.current === "rightWall";

      if (!onWall && supportRef.current === "viewportFloor" && overlapsFrame) {
        const crossedFloor = previousTop !== null && previousTop > floor - 1 && rect.top <= floor - 1;
        const enteredContactBand = movingUp && rect.top <= floor + 2 && rect.top >= floor - 28;
        if ((crossedFloor || enteredContactBand) && rect.bottom > floor) {
          changeSupport("photoFrameTop");
          setClimbRequested(false);
          if (actionRef.current === "idle") setAction("surfaceContact");
        }
      }

      if (supportRef.current === "photoFrameTop") {
        if ((movingDown && rect.top >= floor - 1) || rect.top > floor + 3) {
          updateSurfaceLift(0);
          changeSupport("viewportFloor");
          updateRoamBounds(0, getDefaultRoamLimit());
          if (actionRef.current === "idle") setAction("surfaceContact");
        } else {
          updateSurfaceLift(floor - rect.top);
          const minimum = Math.max(0, window.innerWidth - homeInset - (rect.right - 6));
          const maximum = Math.min(
            getDefaultRoamLimit(),
            window.innerWidth - homeInset - robotWidth - (rect.left + 6),
          );
          updateRoamBounds(minimum, maximum);
        }
      }

      previousTop = rect.top;
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateEnvironment);
    };

    const scheduleScrollUpdate = () => {
      scheduleUpdate();
      window.clearTimeout(scrollSettleTimer);
      window.clearTimeout(scrollFinalTimer);
      scrollSettleTimer = window.setTimeout(scheduleUpdate, 180);
      scrollFinalTimer = window.setTimeout(scheduleUpdate, 560);
    };

    if (typeof ResizeObserver !== "undefined") {
      layoutObserver = new ResizeObserver(scheduleUpdate);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);
    window.addEventListener("photo-section-visibility", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(scrollSettleTimer);
      window.clearTimeout(scrollFinalTimer);
      layoutObserver?.disconnect();
      window.removeEventListener("scroll", scheduleScrollUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
      window.removeEventListener("photo-section-visibility", scheduleUpdate);
    };
  }, [changeSupport, updateRoamBounds, updateSurfaceLift]);

  const queueWalk = useCallback((requestedTarget: number, purpose: WalkPurpose) => {
    const target = Math.min(roamLimit, Math.max(roamMinimum, requestedTarget));
    const distance = Math.abs(target - roamOffset);
    if (distance < 2) {
      setGaze(purpose === "edge" ? "down" : "up");
      setAction(purpose === "climb" ? "wallTurn" : purpose === "edge" ? "edgeInspect" : "idle");
      return;
    }

    const nextDirection: RobotDirection = target > roamOffset ? "left" : "right";
    const duration = Math.round(Math.max(1_450, Math.min(5_400, distance / 0.032)));
    setWalkPlan({ target, direction: nextDirection, duration, purpose });
    setGaze(nextDirection);
    setAction(direction === nextDirection ? "walk" : "turn");
  }, [direction, roamLimit, roamMinimum, roamOffset]);

  useEffect(() => {
    if (open || hovered || reducedMotion || climbRequested || action !== "idle" || supportSurface === "rightWall") return;
    const timer = window.setTimeout(() => {
      const actionPool = supportSurface === "photoFrameTop" ? FRAME_ACTIONS : FLOOR_ACTIONS;
      const nextAction = actionPool[Math.floor(Math.random() * actionPool.length)];

      if (nextAction === "edgeInspect") {
        queueWalk(roamMinimum, "edge");
        return;
      }
      if (nextAction !== "walk") {
        setAction(nextAction);
        return;
      }

      const span = Math.max(0, roamLimit - roamMinimum);
      const returningHome = roamOffset > roamMinimum + span * 0.58 && Math.random() < 0.52;
      let target = returningHome
        ? randomBetween(roamMinimum, Math.max(roamMinimum, Math.round(roamMinimum + span * 0.22)))
        : randomBetween(Math.round(roamMinimum + span * 0.24), roamLimit);

      if (Math.abs(target - roamOffset) < 34) {
        target = roamOffset < roamMinimum + span / 2
          ? Math.min(roamLimit, roamOffset + randomBetween(44, 82))
          : Math.max(roamMinimum, roamOffset - randomBetween(44, 82));
      }
      queueWalk(target, "roam");
    }, randomBetween(8_000, 20_000));
    return () => window.clearTimeout(timer);
  }, [action, climbRequested, hovered, open, queueWalk, reducedMotion, roamLimit, roamMinimum, roamOffset, supportSurface]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      const canClimb = !openRef.current
        && !hoveredRef.current
        && actionRef.current === "idle"
        && supportRef.current === "viewportFloor";
      if (canClimb) setClimbRequested(true);
      else setClimbCycle((cycle) => cycle + 1);
    }, randomBetween(150_000, 300_000));
    return () => window.clearTimeout(timer);
  }, [climbCycle, reducedMotion]);

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
      frame = window.requestAnimationFrame(() => {
        roamOffsetRef.current = walkPlan.target;
        setRoamOffset(walkPlan.target);
      });
    });
    const timer = window.setTimeout(() => {
      const completedPurpose = walkPlan.purpose;
      setWalkPlan(null);
      setGaze(completedPurpose === "edge" ? "down" : completedPurpose === "climb" ? "up" : "center");
      const canStartClimb = completedPurpose === "climb" && supportRef.current === "viewportFloor";
      setAction(completedPurpose === "edge" ? "edgeInspect" : canStartClimb ? "wallTurn" : "idle");
    }, walkPlan.duration + 40);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [action, walkPlan]);

  useEffect(() => {
    if (!climbRequested || action !== "idle" || supportSurface !== "viewportFloor" || open || hovered) return;
    queueWalk(roamMinimum, "climb");
  }, [action, climbRequested, hovered, open, queueWalk, roamMinimum, supportSurface]);

  useEffect(() => {
    if (action !== "wallTurn" || supportSurface !== "viewportFloor" || open || hovered) return;
    setGaze("up");
    const timer = window.setTimeout(() => {
      setDirection("right");
      setClimbPhase("a");
      changeSupport("rightWall");
      climbPeakRef.current = randomBetween(35, 70);
      setAction("climbUp");
    }, 620);
    return () => window.clearTimeout(timer);
  }, [action, changeSupport, hovered, open, supportSurface]);

  useEffect(() => {
    if (action !== "climbUp" || open || hovered) return;
    const target = climbPeakRef.current || 48;
    const start = surfaceLiftRef.current;
    const steps = Math.max(1, Math.ceil((target - start) / 10));
    let step = 0;
    let timer = 0;
    const advance = () => {
      step += 1;
      setClimbPhase((phase) => phase === "a" ? "b" : "a");
      updateSurfaceLift(start + ((target - start) * step) / steps);
      if (step < steps) timer = window.setTimeout(advance, 420);
      else timer = window.setTimeout(() => setAction("wallPause"), 380);
    };
    timer = window.setTimeout(advance, 180);
    return () => window.clearTimeout(timer);
  }, [action, hovered, open, updateSurfaceLift]);

  useEffect(() => {
    if (action !== "wallPause" || open || hovered) return;
    setGaze("left");
    const timer = window.setTimeout(() => {
      setGaze("down");
      setAction("climbDown");
    }, 1_800);
    return () => window.clearTimeout(timer);
  }, [action, hovered, open]);

  useEffect(() => {
    if (action !== "climbDown" || open || hovered) return;
    const start = surfaceLiftRef.current;
    const steps = Math.max(1, Math.ceil(start / 10));
    let step = 0;
    let timer = 0;
    const descend = () => {
      step += 1;
      setClimbPhase((phase) => phase === "a" ? "b" : "a");
      updateSurfaceLift(start * (1 - step / steps));
      if (step < steps) timer = window.setTimeout(descend, 420);
      else {
        timer = window.setTimeout(() => {
          updateSurfaceLift(0);
          changeSupport("viewportFloor");
          setAction("wallLand");
        }, 360);
      }
    };
    timer = window.setTimeout(descend, 180);
    return () => window.clearTimeout(timer);
  }, [action, changeSupport, hovered, open, updateSurfaceLift]);

  useEffect(() => {
    if (action !== "wallLand") return;
    const timer = window.setTimeout(() => {
      setAction("idle");
      setGaze("center");
      setDirection("left");
      setClimbRequested(false);
      setClimbCycle((cycle) => cycle + 1);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [action]);

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

  const anchorStyle = { "--robot-surface-lift": "0px" } as CSSProperties;
  const robotStyle = {
    "--robot-roam-offset": `${roamOffset}px`,
    "--robot-walk-duration": `${walkPlan?.duration ?? 0}ms`,
  } as CSSProperties;

  return (
    <div
      ref={anchorRef}
      className="ai-robot-surface-anchor"
      style={anchorStyle}
      data-support={supportSurface}
      data-action={action}
    >
      <button
        type="button"
        className="ai-pixel-bot-trigger"
        style={robotStyle}
        data-open={open ? "true" : "false"}
        data-thinking={thinking ? "true" : "false"}
        data-action={action}
        data-direction={direction}
        data-support={supportSurface}
        data-climb-phase={climbPhase}
        data-climb-requested={climbRequested ? "true" : "false"}
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
    </div>
  );
};

export default PixelBot;
