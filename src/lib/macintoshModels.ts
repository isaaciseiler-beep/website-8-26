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
  license?: string;
  licenseName?: string;
}

/** Hardware and camera geometry never own the mounted exploration tree. */
export const macintoshModels = {
  'macintosh-128k': {
    id: 'macintosh-128k', name: 'Macintosh 128K', year: 1984,
    chassisImage: '/devices/macintosh-128k-chassis.png',
    image: { width: 1055, height: 1490 }, crop: { x: 0, y: 0, width: 1055, height: 1490 },
    silhouette: 'M80 41 L975 41 Q1017 41 1017 85 L1017 1397 Q1017 1448 975 1448 L80 1448 Q39 1448 39 1400 L39 85 Q39 41 80 41 Z',
    display: { width: 512, height: 342, kind: 'crt' },
    screen: [[180.4,278.6],[874.6,278.6],[874.6,742],[180.4,742]], radius: '8% / 7%',
  },
  'imac-g3': {
    id: 'imac-g3', name: 'iMac G3 · Blueberry', year: 2000,
    chassisImage: '/devices/imac-g3-cutout.png',
    image: { width: 1254, height: 1254 }, crop: { x: 35, y: 55, width: 1180, height: 1130 },
    silhouette: 'M140 96 C230 68 440 73 625 72 C840 69 1050 74 1115 96 C1156 111 1167 139 1172 191 L1189 938 L1184 1078 C1181 1124 1156 1144 1103 1145 L1060 1145 L1060 1160 Q1049 1170 1024 1168 L995 1164 L994 1146 L266 1146 L263 1161 Q258 1169 229 1169 Q199 1168 191 1155 L190 1145 L137 1144 Q86 1140 76 1100 L62 940 L61 650 L77 300 L82 190 Q87 127 109 111 Q125 101 140 96 Z',
    display: { width: 1024, height: 768, kind: 'crt' },
    screen: [[192,203],[1060,203],[1063,853],[187,853]], radius: '2% / 2.5%',
    credit: 'Thomas Kaiser', source: 'https://commons.wikimedia.org/wiki/File:IMac_G3_blueberry_front.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/3.0/', licenseName: 'CC BY-SA 3.0',
  },
  'imac-g4': {
    id: 'imac-g4', name: 'iMac G4', year: 2002,
    chassisImage: '/devices/imac-g4-cutout.png',
    image: { width: 1422, height: 1106 }, crop: { x: 210, y: 8, width: 995, height: 1090 },
    silhouette: 'M286 25 H1125 Q1180 25 1180 82 V613 Q1180 670 1125 670 H285 Q230 670 230 614 V82 Q230 25 286 25 Z M674 646 H744 V687 Q743 709 727 719 V755 H691 V719 Q674 708 674 687 Z M708 754 C555 754 439 893 438 1016 Q431 1064 469 1075 Q698 1100 946 1073 Q983 1067 980 1023 C978 879 861 754 708 754 Z',
    display: { width: 1440, height: 900, kind: 'lcd' },
    screen: [[320,108],[1098,108],[1098,588],[320,588]], radius: '.35%',
  },
  'macbook-air': {
    id: 'macbook-air', name: 'MacBook Air', year: 2008,
    chassisImage: '/devices/macbook-air-2008-photo.png',
    image: { width: 1312, height: 976 }, crop: { x: 0, y: 0, width: 1312, height: 976 },
    display: { width: 1280, height: 800, kind: 'lcd' },
    screen: [[373,95],[1198,96],[1182,621],[333,600]], radius: '.5%',
    credit: 'Tim Malabuyo · EWikist', source: 'https://commons.wikimedia.org/wiki/File:MacBook_Air_black.png',
    license: 'https://creativecommons.org/licenses/by/2.0/', licenseName: 'CC BY 2.0',
  },
} as const satisfies Record<string, MacintoshModel>;

export type MacintoshModelId = keyof typeof macintoshModels;
export const defaultMacintoshModel: MacintoshModelId = 'macintosh-128k';
export function isMacintoshModel(value: unknown): value is MacintoshModelId {
  return typeof value === 'string' && Object.hasOwn(macintoshModels, value);
}

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
