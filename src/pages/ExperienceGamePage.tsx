import { type PointerEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Eye, Map as MapIcon, MousePointer2, Pause, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  buildExperienceExplorerWorld,
  isWallAt,
  type ExperienceExhibit,
  type ExperienceExplorerWorld,
} from "@/lib/experienceGame";

interface PlayerState {
  x: number;
  y: number;
  angle: number;
}

interface InputState {
  keys: Set<string>;
  dragging: boolean;
  lastPointerX: number;
  lookDelta: number;
}

interface RuntimeState {
  player: PlayerState;
  started: boolean;
  paused: boolean;
  elapsed: number;
  lastTime: number;
  lastHud: number;
  activeId: string;
  nearestId: string;
  status: string;
}

interface HudState {
  activeId: string;
  nearestId: string;
  status: string;
  x: number;
  y: number;
  angle: number;
}

interface RayHit {
  distance: number;
  side: "x" | "y";
  mapX: number;
  mapY: number;
}

interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

interface ProjectedExhibit {
  exhibit: ExperienceExhibit;
  distance: number;
  screenX: number;
  screenY: number;
  width: number;
  height: number;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const FOV = Math.PI / 3;
const TURN_SPEED = 2.25;
const MOVE_SPEED = 2.35;
const STRAFE_SPEED = 1.8;
const COLLISION_RADIUS = 0.18;
const RENDER_WIDTH = 360;
const RENDER_HEIGHT = 220;
const WALL_RANGE = 14;
const INTERACT_DISTANCE = 2.15;
const EMPTY_INPUT: InputState = {
  keys: new Set<string>(),
  dragging: false,
  lastPointerX: 0,
  lookDelta: 0,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

const createRuntime = (world: ExperienceExplorerWorld): RuntimeState => ({
  player: { ...world.start },
  started: false,
  paused: false,
  elapsed: 0,
  lastTime: 0,
  lastHud: 0,
  activeId: world.exhibits[0]?.id ?? "",
  nearestId: world.exhibits[0]?.id ?? "",
  status: "Enter the gallery and wander through the work.",
});

const snapshotRuntime = (runtime: RuntimeState): HudState => ({
  activeId: runtime.activeId,
  nearestId: runtime.nearestId,
  status: runtime.status,
  x: runtime.player.x,
  y: runtime.player.y,
  angle: runtime.player.angle,
});

const castRay = (world: ExperienceExplorerWorld, x: number, y: number, angle: number): RayHit => {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let mapX = Math.floor(x);
  let mapY = Math.floor(y);

  const deltaDistX = Math.abs(1 / (dirX || 0.0001));
  const deltaDistY = Math.abs(1 / (dirY || 0.0001));
  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;
  let sideDistX = dirX < 0 ? (x - mapX) * deltaDistX : (mapX + 1 - x) * deltaDistX;
  let sideDistY = dirY < 0 ? (y - mapY) * deltaDistY : (mapY + 1 - y) * deltaDistY;
  let side: "x" | "y" = "x";

  for (let step = 0; step < 96; step += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = "x";
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = "y";
    }

    if (mapX < 0 || mapY < 0 || mapX >= world.width || mapY >= world.height) {
      return { distance: WALL_RANGE, side, mapX, mapY };
    }

    if (world.map[mapY]?.[mapX] !== "0") {
      const wallDistance =
        side === "x"
          ? (mapX - x + (1 - stepX) / 2) / (dirX || 0.0001)
          : (mapY - y + (1 - stepY) / 2) / (dirY || 0.0001);
      return { distance: Math.max(0.05, wallDistance), side, mapX, mapY };
    }
  }

  return { distance: WALL_RANGE, side, mapX, mapY };
};

const canMoveTo = (world: ExperienceExplorerWorld, x: number, y: number) =>
  !isWallAt(world, x - COLLISION_RADIUS, y - COLLISION_RADIUS) &&
  !isWallAt(world, x + COLLISION_RADIUS, y - COLLISION_RADIUS) &&
  !isWallAt(world, x - COLLISION_RADIUS, y + COLLISION_RADIUS) &&
  !isWallAt(world, x + COLLISION_RADIUS, y + COLLISION_RADIUS);

const movePlayer = (world: ExperienceExplorerWorld, player: PlayerState, dx: number, dy: number) => {
  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (canMoveTo(world, nextX, player.y)) {
    player.x = nextX;
  }

  if (canMoveTo(world, player.x, nextY)) {
    player.y = nextY;
  }
};

const nearestExhibit = (world: ExperienceExplorerWorld, player: PlayerState) =>
  world.exhibits
    .map((exhibit) => ({ exhibit, distance: distance(player, exhibit) }))
    .sort((a, b) => a.distance - b.distance)[0];

const updateExplorer = (runtime: RuntimeState, input: InputState, world: ExperienceExplorerWorld, dt: number) => {
  runtime.elapsed += dt;
  const keys = input.keys;
  const player = runtime.player;

  const left = keys.has("arrowleft") || keys.has("q");
  const right = keys.has("arrowright") || keys.has("e");
  const forward = keys.has("arrowup") || keys.has("w");
  const backward = keys.has("arrowdown") || keys.has("s");
  const strafeLeft = keys.has("a");
  const strafeRight = keys.has("d");

  if (left) player.angle -= TURN_SPEED * dt;
  if (right) player.angle += TURN_SPEED * dt;
  if (input.lookDelta) {
    player.angle += input.lookDelta * 0.006;
    input.lookDelta = 0;
  }
  player.angle = normalizeAngle(player.angle);

  let move = 0;
  if (forward) move += 1;
  if (backward) move -= 1;
  if (move) {
    movePlayer(world, player, Math.cos(player.angle) * move * MOVE_SPEED * dt, Math.sin(player.angle) * move * MOVE_SPEED * dt);
  }

  let strafe = 0;
  if (strafeRight) strafe += 1;
  if (strafeLeft) strafe -= 1;
  if (strafe) {
    const angle = player.angle + Math.PI * 0.5;
    movePlayer(world, player, Math.cos(angle) * strafe * STRAFE_SPEED * dt, Math.sin(angle) * strafe * STRAFE_SPEED * dt);
  }

  const nearest = nearestExhibit(world, player);
  if (nearest) {
    runtime.nearestId = nearest.exhibit.id;
    if (nearest.distance < INTERACT_DISTANCE) {
      runtime.activeId = nearest.exhibit.id;
      runtime.status = `Inspecting ${nearest.exhibit.organization}.`;
    } else {
      runtime.status = "Wander closer to a glowing station to inspect it.";
    }
  }
};

const loadImageCache = (world: ExperienceExplorerWorld, cache: Map<string, HTMLImageElement>) => {
  world.exhibits.forEach((exhibit) => {
    if (cache.has(exhibit.image)) return;
    const image = new Image();
    image.decoding = "async";
    image.src = exhibit.image;
    cache.set(exhibit.image, image);
  });
};

const drawImageCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
};

const drawPixelText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color = "#f2f0e8",
) => {
  context.save();
  context.font = "700 8px 'JetBrains Mono', monospace";
  context.fillStyle = color;
  context.textAlign = "center";
  context.shadowColor = "#06110d";
  context.shadowBlur = 2;
  context.fillText(text.toUpperCase(), x, y, maxWidth);
  context.restore();
};

const projectExhibits = (
  world: ExperienceExplorerWorld,
  player: PlayerState,
  width: number,
  height: number,
): ProjectedExhibit[] =>
  world.exhibits
    .map((exhibit) => {
      const dx = exhibit.x - player.x;
      const dy = exhibit.y - player.y;
      const exhibitDistance = Math.hypot(dx, dy);
      const relativeAngle = normalizeAngle(Math.atan2(dy, dx) - player.angle);
      const inView = Math.abs(relativeAngle) < FOV * 0.68 && exhibitDistance > 0.25 && exhibitDistance < 9;

      if (!inView) return null;

      const screenX = width / 2 + Math.tan(relativeAngle) * (width / 2);
      const scale = clamp(1 / exhibitDistance, 0.16, 1.15);
      const spriteHeight = height * 0.78 * scale;
      const spriteWidth = spriteHeight * 0.72;

      return {
        exhibit,
        distance: exhibitDistance,
        screenX,
        screenY: height * 0.54 - spriteHeight * 0.46,
        width: spriteWidth,
        height: spriteHeight,
      };
    })
    .filter((item): item is ProjectedExhibit => Boolean(item))
    .sort((a, b) => b.distance - a.distance);

const drawRaycastView = (
  context: CanvasRenderingContext2D,
  world: ExperienceExplorerWorld,
  runtime: RuntimeState,
  imageCache: Map<string, HTMLImageElement>,
  reducedMotion: boolean,
) => {
  const width = RENDER_WIDTH;
  const height = RENDER_HEIGHT;
  const player = runtime.player;

  context.save();
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);

  const ceiling = context.createLinearGradient(0, 0, 0, height / 2);
  ceiling.addColorStop(0, "#06110d");
  ceiling.addColorStop(1, "#101419");
  context.fillStyle = ceiling;
  context.fillRect(0, 0, width, height / 2);

  const floor = context.createLinearGradient(0, height / 2, 0, height);
  floor.addColorStop(0, "#17231d");
  floor.addColorStop(1, "#090b0b");
  context.fillStyle = floor;
  context.fillRect(0, height / 2, width, height / 2);

  for (let y = Math.floor(height / 2); y < height; y += 8) {
    const alpha = clamp((y - height / 2) / height, 0.06, 0.22);
    context.fillStyle = `rgba(215, 255, 79, ${alpha})`;
    context.fillRect(0, y, width, 1);
  }

  const columns = 180;
  const columnWidth = width / columns;
  for (let column = 0; column < columns; column += 1) {
    const cameraX = column / columns - 0.5;
    const rayAngle = player.angle + cameraX * FOV;
    const hit = castRay(world, player.x, player.y, rayAngle);
    const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
    const wallHeight = clamp(height / correctedDistance, 0, height * 1.7);
    const top = height / 2 - wallHeight / 2;
    const shade = clamp(1 - correctedDistance / WALL_RANGE, 0.1, 0.95);
    const sideShade = hit.side === "x" ? 0.82 : 1;
    const flicker = reducedMotion ? 0 : Math.sin(runtime.elapsed * 3 + hit.mapX * 1.7 + hit.mapY) * 0.025;

    context.fillStyle = `rgba(${Math.floor(185 * shade * sideShade)}, ${Math.floor(225 * shade)}, ${Math.floor(175 * shade)}, ${0.8 + flicker})`;
    context.fillRect(Math.floor(column * columnWidth), Math.floor(top), Math.ceil(columnWidth) + 1, Math.ceil(wallHeight));

    if (column % 8 === 0) {
      context.fillStyle = `rgba(6, 17, 13, ${0.32 - shade * 0.16})`;
      context.fillRect(Math.floor(column * columnWidth), Math.floor(top), 1, Math.ceil(wallHeight));
    }
  }

  const projected = projectExhibits(world, player, width, height);
  projected.forEach(({ exhibit, distance: exhibitDistance, screenX, screenY, width: spriteWidth, height: spriteHeight }) => {
    const x = screenX - spriteWidth / 2;
    const y = screenY;
    const image = imageCache.get(exhibit.image);
    const isActive = runtime.activeId === exhibit.id;
    const glow = clamp(1 - exhibitDistance / 6, 0.22, 0.82);

    context.save();
    context.fillStyle = `rgba(215, 255, 79, ${isActive ? 0.24 : glow * 0.16})`;
    context.fillRect(Math.floor(x - 4), Math.floor(y - 4), Math.floor(spriteWidth + 8), Math.floor(spriteHeight + 8));
    context.strokeStyle = isActive ? exhibit.color : "rgba(242, 240, 232, 0.58)";
    context.lineWidth = isActive ? 3 : 1;
    context.strokeRect(Math.floor(x - 2), Math.floor(y - 2), Math.floor(spriteWidth + 4), Math.floor(spriteHeight + 4));

    if (image?.complete && image.naturalWidth > 0) {
      drawImageCover(context, image, Math.floor(x), Math.floor(y), Math.floor(spriteWidth), Math.floor(spriteHeight));
      context.fillStyle = "rgba(6, 17, 13, 0.2)";
      context.fillRect(Math.floor(x), Math.floor(y), Math.floor(spriteWidth), Math.floor(spriteHeight));
    } else {
      context.fillStyle = exhibit.color;
      context.fillRect(Math.floor(x), Math.floor(y), Math.floor(spriteWidth), Math.floor(spriteHeight));
    }

    context.fillStyle = "rgba(6, 17, 13, 0.82)";
    context.fillRect(Math.floor(x), Math.floor(y + spriteHeight - 18), Math.floor(spriteWidth), 18);
    drawPixelText(context, exhibit.organization, screenX, y + spriteHeight - 7, spriteWidth - 6, exhibit.color);
    context.restore();
  });

  context.save();
  context.strokeStyle = "rgba(215, 255, 79, 0.74)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(width / 2 - 7, height / 2);
  context.lineTo(width / 2 - 2, height / 2);
  context.moveTo(width / 2 + 2, height / 2);
  context.lineTo(width / 2 + 7, height / 2);
  context.moveTo(width / 2, height / 2 - 7);
  context.lineTo(width / 2, height / 2 - 2);
  context.moveTo(width / 2, height / 2 + 2);
  context.lineTo(width / 2, height / 2 + 7);
  context.stroke();
  context.restore();

  context.restore();
};

const drawMiniMap = (
  context: CanvasRenderingContext2D,
  world: ExperienceExplorerWorld,
  runtime: RuntimeState,
  width: number,
  height: number,
) => {
  context.save();
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#06110d";
  context.fillRect(0, 0, width, height);
  const tile = Math.min(width / world.width, height / world.height);
  const offsetX = (width - world.width * tile) / 2;
  const offsetY = (height - world.height * tile) / 2;

  world.map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      context.fillStyle = cell === "1" ? "rgba(242, 240, 232, 0.18)" : "rgba(215, 255, 79, 0.035)";
      context.fillRect(offsetX + x * tile, offsetY + y * tile, Math.ceil(tile), Math.ceil(tile));
    });
  });

  world.exhibits.forEach((exhibit) => {
    context.fillStyle = runtime.activeId === exhibit.id ? exhibit.color : "rgba(242, 240, 232, 0.6)";
    context.fillRect(offsetX + exhibit.x * tile - 2, offsetY + exhibit.y * tile - 2, 4, 4);
  });

  const player = runtime.player;
  context.fillStyle = "#d7ff4f";
  context.beginPath();
  context.arc(offsetX + player.x * tile, offsetY + player.y * tile, 3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#d7ff4f";
  context.beginPath();
  context.moveTo(offsetX + player.x * tile, offsetY + player.y * tile);
  context.lineTo(offsetX + (player.x + Math.cos(player.angle) * 0.8) * tile, offsetY + (player.y + Math.sin(player.angle) * 0.8) * tile);
  context.stroke();
  context.restore();
};

const IconButton = ({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`inline-flex h-10 w-10 items-center justify-center border transition ${
      active
        ? "border-[#d7ff4f] bg-[#d7ff4f] text-[#06110d]"
        : "border-white/18 bg-white/[0.06] text-[#f2f0e8] hover:border-white/38 hover:bg-white/[0.1]"
    }`}
  >
    {children}
  </button>
);

const ExhibitPanel = ({ exhibit, nearby }: { exhibit: ExperienceExhibit; nearby: boolean }) => (
  <aside className="border border-white/12 bg-[#07130f]/90 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl lg:h-full">
    <div className="relative aspect-[16/10] overflow-hidden border border-white/10 [image-rendering:pixelated]">
      <img src={exhibit.image} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06110d]/90 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d7ff4f]">{exhibit.period}</p>
        <h2 className="mt-1 text-2xl leading-[1.06] tracking-tight text-[#f2f0e8]">{exhibit.organization}</h2>
      </div>
    </div>

    <div className="mt-5 space-y-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">Station file</p>
        <p className="mt-2 text-lg leading-tight text-[#f2f0e8]">{exhibit.role}</p>
      </div>

      <p className="text-sm leading-6 text-white/74">{exhibit.blurb}</p>

      <div className="flex flex-wrap gap-2">
        {exhibit.focus.map((focus) => (
          <span key={focus} className="border border-[#d7ff4f]/34 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#d7ff4f]">
            {focus}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/38">Artifacts</p>
          <p className="mt-1 font-mono text-xl text-[#f7b955]">{exhibit.artifactCount}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/38">Range</p>
          <p className="mt-1 font-mono text-xl text-[#35e5c2]">{nearby ? "Near" : "Far"}</p>
        </div>
      </div>

      <div className="border border-white/10 bg-black/20 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">Guide note</p>
        <p className="mt-2 text-sm leading-6 text-white/72">
          {nearby
            ? "You are close enough to read the station. This is exploration mode: browse, turn, drift, and let the work feel spatial."
            : "Move closer to a glowing wall station and the dossier will follow your attention."}
        </p>
      </div>
    </div>
  </aside>
);

const HelpStrip = () => (
  <div className="grid gap-2 border border-white/10 bg-white/[0.045] p-3 sm:grid-cols-3">
    <div className="flex items-center gap-2">
      <MousePointer2 className="h-4 w-4 text-[#35e5c2]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/54">Drag to look</span>
    </div>
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-[#d7ff4f]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/54">WASD to walk</span>
    </div>
    <div className="flex items-center gap-2">
      <MapIcon className="h-4 w-4 text-[#f7b955]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/54">Arrows turn</span>
    </div>
  </div>
);

const ExperienceGamePage = () => {
  const world = useMemo(() => buildExperienceExplorerWorld(), []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSizeRef = useRef<CanvasSize>({ width: 1, height: 1, dpr: 1 });
  const runtimeRef = useRef<RuntimeState>(createRuntime(world));
  const inputRef = useRef<InputState>({
    keys: new Set(EMPTY_INPUT.keys),
    dragging: EMPTY_INPUT.dragging,
    lastPointerX: EMPTY_INPUT.lastPointerX,
    lookDelta: EMPTY_INPUT.lookDelta,
  });
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const prefersReducedMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudState>(() => snapshotRuntime(runtimeRef.current));

  const activeExhibit = world.exhibits.find((exhibit) => exhibit.id === hud.activeId) ?? world.exhibits[0];
  const nearest = world.exhibits.find((exhibit) => exhibit.id === hud.nearestId) ?? activeExhibit;
  const nearby = distance({ x: hud.x, y: hud.y }, nearest) < INTERACT_DISTANCE;

  const syncHud = useCallback(() => {
    setHud(snapshotRuntime(runtimeRef.current));
  }, []);

  const launch = useCallback(() => {
    runtimeRef.current.started = true;
    runtimeRef.current.paused = false;
    runtimeRef.current.status = "Gallery open. Walk toward the lit stations.";
    setStarted(true);
    setPaused(false);
    syncHud();
    window.setTimeout(() => canvasRef.current?.focus(), 0);
  }, [syncHud]);

  const restart = useCallback(() => {
    runtimeRef.current = createRuntime(world);
    runtimeRef.current.started = true;
    inputRef.current.keys.clear();
    inputRef.current.dragging = false;
    inputRef.current.lookDelta = 0;
    setStarted(true);
    setPaused(false);
    syncHud();
    window.setTimeout(() => canvasRef.current?.focus(), 0);
  }, [syncHud, world]);

  const togglePause = useCallback(() => {
    if (!started) {
      launch();
      return;
    }

    setPaused((value) => {
      runtimeRef.current.paused = !value;
      return !value;
    });
  }, [launch, started]);

  useEffect(() => {
    document.title = "Experience Explorer | Isaac Seiler";
  }, []);

  useEffect(() => {
    runtimeRef.current.started = started;
    runtimeRef.current.paused = paused;
  }, [paused, started]);

  useEffect(() => {
    loadImageCache(world, imageCacheRef.current);
  }, [world]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const controlKey = key.startsWith("arrow") || ["w", "a", "s", "d", "q", "e", "p", "r"].includes(key);
      if (controlKey) event.preventDefault();

      if (key === "p") {
        togglePause();
        return;
      }

      if (key === "r") {
        restart();
        return;
      }

      inputRef.current.keys.add(key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      inputRef.current.keys.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [restart, togglePause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mapCanvas = mapCanvasRef.current;
    if (!canvas || !mapCanvas) return undefined;

    const context = canvas.getContext("2d");
    const mapContext = mapCanvas.getContext("2d");
    if (!context || !mapContext) return undefined;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasSizeRef.current = { width: Math.max(320, rect.width), height: Math.max(360, rect.height), dpr };
      canvas.width = RENDER_WIDTH;
      canvas.height = RENDER_HEIGHT;
      mapCanvas.width = 280;
      mapCanvas.height = 128;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    const loop = (time: number) => {
      const runtime = runtimeRef.current;
      const dt = runtime.lastTime ? Math.min(0.04, (time - runtime.lastTime) / 1000) : 0.016;
      runtime.lastTime = time;

      if (runtime.started && !runtime.paused) {
        updateExplorer(runtime, inputRef.current, world, dt);
      } else {
        runtime.elapsed += dt * (prefersReducedMotion ? 0 : 0.45);
      }

      drawRaycastView(context, world, runtime, imageCacheRef.current, Boolean(prefersReducedMotion));
      drawMiniMap(mapContext, world, runtime, 280, 128);

      if (time - runtime.lastHud > 90) {
        runtime.lastHud = time;
        setHud(snapshotRuntime(runtime));
      }

      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion, world]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(event.pointerId);
    inputRef.current.dragging = true;
    inputRef.current.lastPointerX = event.clientX;
    if (!started) launch();
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!inputRef.current.dragging) return;
    inputRef.current.lookDelta += event.clientX - inputRef.current.lastPointerX;
    inputRef.current.lastPointerX = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    inputRef.current.dragging = false;
  };

  return (
    <main className="min-h-svh overflow-hidden bg-[#06110d] text-[#f2f0e8]">
      <div className="mx-auto flex min-h-svh w-full max-w-[1720px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/experience"
              aria-label="Back to experience"
              title="Back to experience"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/18 bg-white/[0.06] text-[#f2f0e8] transition hover:border-white/38 hover:bg-white/[0.1]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d7ff4f]">Hidden build</p>
              <h1 className="truncate text-3xl leading-none tracking-tight text-[#f2f0e8] sm:text-5xl">
                Experience Explorer
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton label={started && !paused ? "Pause" : "Enter"} onClick={togglePause} active={started && !paused}>
              {started && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </IconButton>
            <IconButton label="Restart" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
            </IconButton>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="relative min-h-[520px] flex-1 overflow-hidden border border-white/10 bg-black shadow-2xl shadow-black/35">
              <canvas
                ref={canvasRef}
                tabIndex={0}
                role="application"
                aria-label="First-person retro professional experience explorer"
                className="h-full min-h-[520px] w-full touch-none bg-[#06110d] outline-none [image-rendering:pixelated]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />

              {!started && (
                <motion.div
                  className="absolute inset-0 grid place-items-center bg-[#06110d]/58 p-6 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  <div className="max-w-lg border border-[#d7ff4f]/36 bg-[#06110d]/88 p-5 text-center shadow-2xl shadow-black/40">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d7ff4f]">Gallery booted</p>
                    <h2 className="mt-3 text-4xl leading-[1] tracking-tight text-[#f2f0e8] sm:text-6xl">
                      Walk the resume.
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/68">
                      A low-res first-person gallery of AI work, communications systems, policy research, teaching,
                      reporting, and campaign operations.
                    </p>
                    <button
                      type="button"
                      onClick={launch}
                      className="mt-6 inline-flex items-center gap-2 bg-[#d7ff4f] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[#06110d] transition hover:bg-[#f2f0e8]"
                    >
                      <Play className="h-4 w-4" />
                      Enter
                    </button>
                  </div>
                </motion.div>
              )}

              {paused && started && (
                <div className="absolute inset-0 grid place-items-center bg-[#06110d]/64 p-6 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="inline-flex items-center gap-2 border border-white/20 bg-white/[0.08] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[#f2f0e8] transition hover:border-[#d7ff4f] hover:text-[#d7ff4f]"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="border border-white/10 bg-white/[0.045] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">Explorer status</p>
                <p className="mt-2 min-h-6 text-sm leading-6 text-white/72">{hud.status}</p>
              </div>
              <canvas
                ref={mapCanvasRef}
                aria-label="Gallery map"
                className="h-24 w-full border border-white/10 bg-black/20 [image-rendering:pixelated] lg:h-full"
              />
            </div>

            <HelpStrip />
          </div>

          <div className="min-h-0">
            <ExhibitPanel exhibit={activeExhibit} nearby={nearby} />
          </div>
        </section>

        <p className="sr-only" aria-live="polite">
          {hud.status}
        </p>
      </div>
    </main>
  );
};

export default ExperienceGamePage;
