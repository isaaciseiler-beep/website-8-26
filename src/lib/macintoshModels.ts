export type ScreenPoint = readonly [number, number];
export type ScreenQuad = readonly [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];

export interface MacintoshModel {
  id: string;
  name: string;
  year: number;
  chassisImage: string;
  image: { width: number; height: number };
  /** A code-native crop; the photographic source remains unmodified. */
  crop: { x: number; y: number; width: number; height: number };
  silhouette?: string;
  display: { width: number; height: number; kind: 'crt' | 'lcd' };
  /** Original source-image pixels, clockwise from the upper left. */
  screen: ScreenQuad;
  radius: string;
  credit?: string;
  source?: string;
}

/** Original photographic pixels. Only the website's SVG crop and screen plane are composited. */
export const macintoshSE: MacintoshModel = {
  id: 'macintosh-se', name: 'Macintosh SE', year: 1987,
  chassisImage: '/devices/macintosh-se-front.jpg',
  image: { width: 3000, height: 3000 },
  crop: { x: 620, y: 250, width: 1760, height: 2370 },
  silhouette: 'M691 273 C1070 270 1925 269 2290 273 Q2347 274 2353 327 L2360 2268 Q2359 2299 2327 2306 L2328 2548 Q2327 2586 2287 2590 L706 2591 Q662 2590 661 2548 L659 2307 Q637 2304 636 2273 L636 328 Q636 276 691 273 Z',
  display: { width: 512, height: 384, kind: 'crt' },
  screen: [[855,548],[2134,548],[2137,1500],[852,1500]],
  radius: '4.5% / 5.5%',
  credit: 'Bukowskis',
  source: 'https://www.bukowskis.com/en/lots/977786-an-apple-computer-macintosh-se-model-m5011-apple-computer-inc-usa-1980s',
};

const { crop, screen } = macintoshSE;
const screenWidth = (Math.hypot(screen[1][0] - screen[0][0], screen[1][1] - screen[0][1])
  + Math.hypot(screen[2][0] - screen[3][0], screen[2][1] - screen[3][1])) / 2;
const screenBottomRatio = ((Math.max(...screen.map(point => point[1])) - crop.y) / crop.width).toFixed(5);
export const macintoshFrameWidth = `min(${Math.min(1120, 620 * crop.width / screenWidth)}px, 100%, calc((100svh - 136px) / ${screenBottomRatio}))`;

// The photographed base spans x=661 to x=2328, with corners about 43 source pixels deep.
const baseLeft = 661;
const baseRight = 2328;
const baseWidth = baseRight - baseLeft;
export const macintoshBaseStyle = {
  width: `calc(${macintoshFrameWidth} * ${baseWidth / crop.width})`,
  translate: `${100 * ((baseLeft + baseRight) / 2 - crop.x - crop.width / 2) / baseWidth}%`,
  '--strip-radius': `calc(100cqw * ${43 / baseWidth})`,
};

/** Solve the planar camera transform. CSS retains native hit testing and text. */
export function screenProjection(device: MacintoshModel, frameWidth: number) {
  const { crop, screen, display } = device;
  const scale = frameWidth / crop.width;
  const points = screen.map(([x,y]) => [(x-crop.x)*scale,(y-crop.y)*scale]);
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = points;
  const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3;
  const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3;
  const denominator=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/denominator;
  const h=(dx1*dy3-dx3*dy1)/denominator;
  const width=(Math.hypot(x1-x0,y1-y0)+Math.hypot(x2-x3,y2-y3))/2;
  const height=width*display.height/display.width;
  const matrix=[(x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,
    (x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,
    0,0,1,0,x0,y0,0,1];
  return { width, height, matrix, transform: `matrix3d(${matrix.join(',')})` };
}
