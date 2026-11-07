/** Orthographic coordinates shared by the satellite globe and its accessible album pins. */
export type GlobeView = { longitude: number; latitude: number };
export const PHOTO_GLOBE_INITIAL_VIEW: GlobeView = { longitude: 106, latitude: -12 };
export const PHOTO_GLOBE_VISIBLE_FRACTION = 0.4;
const radians = Math.PI / 180;

export function normalizeGlobeView(view: GlobeView): GlobeView {
  return { longitude: ((view.longitude + 180) % 360 + 360) % 360 - 180, latitude: Math.max(-80, Math.min(80, view.latitude)) };
}

/** Dragging one globe diameter rotates the same half turn at every viewport size. */
export function rotatePhotoGlobe(view: GlobeView, x: number, y: number, diameter: number): GlobeView {
  const sensitivity = 180 / Math.max(1, diameter);
  return normalizeGlobeView({ longitude: view.longitude - x * sensitivity, latitude: view.latitude + y * sensitivity });
}

export function projectPhotoLocation(coordinates: [number, number], view: GlobeView) {
  const longitude = (coordinates[0] - view.longitude) * radians;
  const latitude = coordinates[1] * radians;
  const centerLatitude = view.latitude * radians;
  const x = Math.cos(latitude) * Math.sin(longitude);
  const y = Math.cos(centerLatitude) * Math.sin(latitude) - Math.sin(centerLatitude) * Math.cos(latitude) * Math.cos(longitude);
  const z = Math.sin(centerLatitude) * Math.sin(latitude) + Math.cos(centerLatitude) * Math.cos(latitude) * Math.cos(longitude);
  return { x: (x + 1) * 50, y: (1 - y) * 50, visible: z > 0.08 && y > 1 - PHOTO_GLOBE_VISIBLE_FRACTION * 2 };
}

/** Cropping a large sphere on a narrow screen must also remove hidden keyboard targets. */
export function isPhotoGlobePinVisible(point: ReturnType<typeof projectPhotoLocation>, diameter: number, width: number) {
  if (!point.visible || diameter <= 0 || width <= 0) return false;
  const x = (point.x / 100 - 0.5) * diameter + width / 2;
  const y = point.y / 100 * diameter;
  const radius = 22;
  return x >= radius && x <= width - radius && y >= radius && y <= diameter * PHOTO_GLOBE_VISIBLE_FRACTION - radius;
}

export function globeViewForLocation(coordinates: [number, number]): GlobeView {
  return normalizeGlobeView({ longitude: coordinates[0], latitude: coordinates[1] - 38 });
}

export type GlobeRasterPlan = { width: number; height: number; textureWidth: 2048 | 4096 | 8192; texturePath: string };

/** Match photographic detail to actual device pixels, within this GPU's resource limits. */
export function photoGlobeRasterPlan(diameter: number, pixelRatio: number, maxTexture: number, maxFramebuffer: number, limitedMemory = false, saveData = false): GlobeRasterPlan {
  const width = Math.max(1, Math.min(4096, maxFramebuffer, Math.ceil(diameter * Math.max(1, pixelRatio))));
  const desiredTexture = Math.PI * width;
  const textureWidth = !saveData && !limitedMemory && maxTexture >= 8192 && desiredTexture > 4096 ? 8192 : !saveData && maxTexture >= 4096 && desiredTexture > 2048 ? 4096 : 2048;
  return { width, height: Math.max(1, Math.ceil(width * PHOTO_GLOBE_VISIBLE_FRACTION)), textureWidth, texturePath: `/images/globe/nasa-satellite-${textureWidth / 1024}k.jpg` };
}
