/** Keep the portrait focal artwork substantial without crowding its title or the site chrome. */
export function musicGlassCoverSize(width: number, height: number): number {
  return Math.min(width * (width < 600 ? 0.42 : 0.38), height * 0.38, 360);
}

/** A shared silhouette for the artwork previews and the optical foreground shell. */
export function musicGlassWidth(y: number, height: number, cover: number, width = Number.POSITIVE_INFINITY): number {
  const waist = cover;
  const gutter = width < 600 ? 64 : 80;
  const bulb = Math.max(waist, Math.min(cover * 2.4, width - gutter * 2));
  const depth = Math.abs((y - height / 2) / Math.max(1, height / 2));
  const neck = Math.min(0.7, cover / Math.max(1, height));
  const shoulder = Math.max(0, Math.min(1, (depth - neck) / Math.max(0.1, 1 - neck)));
  const smooth = (1 - Math.cos(shoulder * Math.PI)) / 2;
  return waist + (bulb - waist) * smooth;
}

export type MusicGlassParams = {
  width: number;
  height: number;
  centerX: number;
  cover: number;
  dark: boolean;
  /** Normalized pointer position in [-1, 1]; zero centers the studio lighting. */
  pointerX: number;
  pointerY: number;
  /** True only for keyboard-visible focus on the native album link. */
  focused?: boolean;
  /** Increment only when the source pixels change; lighting alone does not upload the artwork again. */
  artRevision?: number;
  /** Five unwarped square covers stacked vertically, starting at this unbounded album index. */
  atlas?: { base: number; position: number; tileSize: number };
};

export type MusicGlassRenderer = {
  render: (art: HTMLCanvasElement, params: MusicGlassParams) => void;
  dispose: () => void;
};

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D u_art;
uniform vec2 u_size;
uniform float u_center;
uniform float u_cover;
uniform float u_dark;
uniform float u_focus;
uniform vec2 u_pointer;
uniform vec4 u_atlas;
varying vec2 v_uv;

// GLSL pow(x, 2.0) is undefined for negative x. Signed Gaussian coordinates
// must be squared explicitly so highlights remain stable across GPU drivers.
float gaussian(float value) { return exp(-value*value); }

// The same broad, cosine-rounded shoulders exported as musicGlassWidth above.
vec3 profile(float y) {
  float vertical = (y - u_size.y * 0.5) / (u_size.y * 0.5);
  float waist = u_cover;
  float gutter = u_size.x < 600.0 ? 64.0 : 80.0;
  float bulb = max(waist,min(u_cover*2.4,u_size.x-gutter*2.0));
  float neck = min(0.7,u_cover/max(1.0,u_size.y));
  float span = max(0.1,1.0-neck);
  float t = clamp((abs(vertical)-neck)/span,0.0,1.0);
  float shoulder = (1.0-cos(t*3.14159265))*0.5;
  float derivative = 1.57079633*sin(t*3.14159265);
  float radius = mix(waist, bulb, shoulder) * 0.5;
  float slope = (bulb-waist) * derivative * sign(vertical) / (span * u_size.y);
  return vec3(radius, slope, shoulder);
}

// Long, softly graduated studio panels. Angular coordinates keep the highlights
// attached to the curved surface without the hard, sticker-like rectangular patches.
vec3 environment(vec3 ray) {
  float azimuth = atan(ray.x, ray.z);
  float elevation = asin(clamp(ray.y,-1.0,1.0));
  vec2 drift = u_pointer * vec2(0.035,0.025);
  float key = gaussian((azimuth + 1.02 - drift.x)/0.10);
  float keyFeather = gaussian((azimuth + 1.06 - drift.x)/0.29);
  float fill = gaussian((azimuth - 1.18 - drift.x)/0.075);
  float ceiling = gaussian((elevation + 0.9 - drift.y)/0.18);
  float graduation = 0.35 + 0.65*gaussian((elevation+0.18)/0.95);
  vec3 room = mix(vec3(0.055,0.065,0.08),vec3(0.32,0.34,0.36),1.0-u_dark);
  return room + graduation*(key*vec3(4.8,4.9,5.0)
    + keyFeather*vec3(0.5,0.53,0.57) + fill*vec3(3.0,3.15,3.35))
    + ceiling*vec3(0.65,0.68,0.72);
}

float albumCoordinate(float y) {
  float dy = y-u_size.y*0.5;
  float halfCover = u_cover*0.5;
  float distance = dy/u_cover;
  if (abs(dy)>halfCover) {
    float span = max(1.0,u_size.y*0.5-halfCover);
    float t = clamp((abs(dy)-halfCover)/span,0.0,1.0);
    float curvature = clamp(span/u_cover-1.0,-0.75,0.75);
    distance = sign(dy)*(0.5+t+curvature*t*(1.0-t));
  }
  return u_atlas.y+distance+0.5;
}

float albumScale(float y) {
  float dy = abs(y-u_size.y*0.5);
  if (dy <= u_cover*0.5) return 1.0/u_cover;
  float span = max(1.0,(u_size.y-u_cover)*0.5);
  float t = clamp((dy-u_cover*0.5)/span,0.0,1.0);
  float curvature = clamp(span/u_cover-1.0,-0.75,0.75);
  return (1.0+curvature*(1.0-2.0*t))/span;
}

vec4 artwork(vec2 point, vec2 reference) {
  vec2 uv;
  if (u_atlas.w > 0.5) {
    // Choose the album before bending the ray. Refraction stays inside that image,
    // so it cannot pull a repeated strip of its neighbour across an album join.
    float album = floor(albumCoordinate(reference.y));
    float imageY = clamp(albumCoordinate(point.y)-album,0.0,1.0);
    if (reference.y < (u_size.y-u_cover)*0.5) imageY = 1.0-imageY;
    float halfWidth = profile(point.y).x;
    float imageX = (point.x-u_center)/(halfWidth*2.0)+0.5;
    // A tall phone preview is a crop through the lens, not a whole square
    // pulled lengthwise. The focal plane remains exactly 1:1 at every width.
    float portrait = (1.0-step(600.0,u_size.x))*smoothstep(1.35,1.9,u_size.y/u_size.x);
    float localAspect = clamp(halfWidth*2.0*albumScale(reference.y),0.6,1.0);
    float previewDepth = abs(reference.y-u_size.y*0.5)-u_cover*0.5;
    float previewBlend = smoothstep(0.0,u_cover*0.24,previewDepth);
    imageX = 0.5+(imageX-0.5)*mix(1.0,localAspect,portrait*previewBlend);
    vec2 pixel = clamp(vec2(imageX,imageY),vec2(0.5/u_atlas.z),vec2(1.0-0.5/u_atlas.z));
    uv = vec2(pixel.x,1.0-(clamp(album-u_atlas.x,0.0,4.0)+pixel.y)/5.0);
  } else {
    uv = vec2(point.x/u_size.x,1.0-point.y/u_size.y);
  }
  return texture2D(u_art,clamp(uv,vec2(0.0001),vec2(0.9999)));
}

void main() {
  vec2 point = vec2(v_uv.x * u_size.x, (1.0-v_uv.y) * u_size.y);
  vec3 shape = profile(point.y);
  float localX = point.x-u_center;
  float edgeDistance = shape.x-abs(localX);
  float coverage = smoothstep(-0.65, 0.65, edgeDistance);
  if (coverage < 0.001) { gl_FragColor = vec4(0.0); return; }

  float horizontal = clamp(localX / shape.x, -0.9999, 0.9999);
  float cap = sqrt(max(0.0001, 1.0-horizontal*horizontal));
  float portrait = (1.0-step(600.0,u_size.x))*smoothstep(1.35,1.9,u_size.y/u_size.x);
  float shoulderDepth = 0.07+portrait*0.035;
  float thickness = u_cover * (0.20 + shoulderDepth*shape.z);
  float gutter = u_size.x < 600.0 ? 64.0 : 80.0;
  float bulb = max(u_cover,min(u_cover*2.4,u_size.x-gutter*2.0));
  // radius' = (bulb-waist)*shoulder'/2; differentiate thickness itself,
  // rather than radius-normalizing its slope, to keep the shoulder lighting tangent.
  float depthDerivative = bulb > u_cover ? u_cover*shoulderDepth*2.0*shape.y/(bulb-u_cover) : 0.0;
  float zx = -thickness * horizontal / (shape.x*cap);
  float zy = depthDerivative*cap + thickness*horizontal*horizontal*shape.y/(shape.x*cap);
  vec3 normal = normalize(vec3(-zx, -zy, 1.0));
  vec3 incident = normalize(vec3((point.x-u_center)/u_size.y*0.15,
    (point.y-u_size.y*0.5)/u_size.y*0.16, -1.0));

  // Refraction through the front surface and a slightly flatter inner surface.
  // The second interface returns the ray to air: the glass has a wall, not a solid gel body.
  vec3 transmitted = refract(incident, normal, 1.0/1.5);
  vec3 innerNormal = normalize(mix(vec3(0.0,0.0,1.0),normal,0.72));
  vec3 emerging = refract(transmitted,innerNormal,1.5);
  if (dot(emerging,emerging)<0.001) emerging = transmitted;
  vec2 outsideSquare = abs(point-vec2(u_center,u_size.y*0.5)) - vec2(u_cover*0.5);
  float protect = 1.0-smoothstep(0.0,max(3.0,u_cover*0.025),max(outsideSquare.x,outsideSquare.y));
  vec2 offset = ((transmitted.xy/max(0.12,abs(transmitted.z))-incident.xy/max(0.12,abs(incident.z)))*thickness*0.45
    +(emerging.xy/max(0.25,abs(emerging.z))-incident.xy/max(0.12,abs(incident.z)))*thickness*0.30)*(1.0-protect);
  // Let photographs meet directly. Taper only the vertical ray displacement at a
  // join instead of stretching an edge pixel into a visible inter-album strip.
  if (u_atlas.w > 0.5) {
    float fraction = fract(albumCoordinate(point.y));
    float joinDistance = min(fraction,1.0-fraction)*u_cover;
    offset.y *= smoothstep(0.0,u_cover*0.12,joinDistance);
  }
  float dispersion = pow(abs(horizontal),10.0)*(1.0-protect)*0.025;
  vec4 middle = artwork(point+offset,point);
  vec4 red = artwork(point+offset*(1.0+dispersion),point);
  vec4 blue = artwork(point+offset*(1.0-dispersion),point);
  vec3 background = mix(vec3(1.0),vec3(0.0),u_dark);
  vec3 behind = mix(background,vec3(red.r,middle.g,blue.b),middle.a);

  vec3 reflected = reflect(incident,normal);
  float cosine = clamp(dot(-incident,normal),0.0,1.0);
  float fresnel = 0.04+0.96*pow(1.0-cosine,5.0);
  vec3 optical = behind*(1.0-fresnel)+environment(reflected)*fresnel;

  // Resolve both edges of the glass wall in screen space. The inner edge is
  // softer and slightly tinted by the longer optical path through clear glass.
  float normalDistance = max(0.0,edgeDistance)/sqrt(1.0+shape.y*shape.y);
  float wall = clamp(u_cover*0.027,4.0,9.0);
  float outerRim = gaussian(normalDistance/0.85);
  float innerRim = gaussian((normalDistance-wall)/mix(1.25,0.95,portrait));
  float rolledEdge = gaussian((normalDistance-wall*0.46)/(wall*0.32));
  float sideLight = 0.52+0.48*sin(point.y/u_size.y*5.0+horizontal*1.1+u_pointer.y*0.06);
  vec3 absorption = exp(-vec3(0.095,0.042,0.028)*rolledEdge);
  optical *= absorption;
  optical = mix(optical,mix(vec3(0.16,0.19,0.20),vec3(0.68,0.74,0.77),u_dark),outerRim*mix(0.45,0.24+sideLight*0.18,portrait));
  optical += vec3(0.76,0.87,0.93)*innerRim*(0.08+sideLight*0.14)*mix(1.0,0.78,portrait);
  optical += vec3(0.55,0.65,0.72)*rolledEdge*sideLight*0.065;
  // A restrained front-surface reflection crosses the album as one continuous pane.
  float faceLight = gaussian((horizontal+0.42+u_pointer.x*0.015)/0.055)
    * gaussian(((point.y/u_size.y)-0.37)/0.42);
  optical += vec3(0.88,0.94,1.0)*faceLight*0.028;
  optical = min(optical,vec3(1.0));
  // The native link is behind this compositing layer, so reproduce its keyboard-only outline here.
  vec2 focusDelta = abs(point-vec2(u_center,u_size.y*0.5)) - vec2(u_cover*0.5-3.0);
  float focusDistance = abs(max(focusDelta.x,focusDelta.y));
  float focusRing = 1.0-smoothstep(0.65,1.35,focusDistance);
  optical = mix(optical,mix(vec3(0.08),vec3(1.0),u_dark),u_focus*focusRing);
  gl_FragColor = vec4(optical*coverage,coverage);
}`;

type Resources = {
  program: WebGLProgram;
  vertices: WebGLBuffer;
  art: WebGLTexture;
  position: number;
  size: WebGLUniformLocation;
  center: WebGLUniformLocation;
  cover: WebGLUniformLocation;
  dark: WebGLUniformLocation;
  pointer: WebGLUniformLocation;
  focus: WebGLUniformLocation;
  atlas: WebGLUniformLocation;
};

/** The caller supplies an origin-clean art canvas. Returns null if WebGL or the shaders are unavailable. */
export function createMusicGlassRenderer(canvas: HTMLCanvasElement): MusicGlassRenderer | null {
  let gl: WebGLRenderingContext | null;
  try {
    gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false, preserveDrawingBuffer: false });
  } catch { return null; }
  if (!gl) return null;
  const gpu = gl;
  let disposed = false;
  let lost = false;
  let failedUpload = false;
  let resources: Resources | null = null;
  let last: { art: HTMLCanvasElement; params: MusicGlassParams } | null = null;
  let uploadedArt: HTMLCanvasElement | null = null;
  let uploadedRevision: number | undefined;
  let textureWidth = 0;
  let textureHeight = 0;

  const destroy = () => {
    if (!resources) return;
    gpu.deleteTexture(resources.art);
    gpu.deleteBuffer(resources.vertices);
    gpu.deleteProgram(resources.program);
    resources = null;
    uploadedArt = null;
    uploadedRevision = undefined;
    textureWidth = 0;
    textureHeight = 0;
  };

  const initialize = () => {
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let vertices: WebGLBuffer | null = null;
    let art: WebGLTexture | null = null;
    try {
      for (const [type, source] of [[gpu.VERTEX_SHADER, VERTEX_SHADER], [gpu.FRAGMENT_SHADER, FRAGMENT_SHADER]] as const) {
        const shader = gpu.createShader(type);
        if (!shader) throw new Error("Could not allocate glass shader");
        shaders.push(shader);
        gpu.shaderSource(shader, source);
        gpu.compileShader(shader);
        if (!gpu.getShaderParameter(shader, gpu.COMPILE_STATUS)) throw new Error(gpu.getShaderInfoLog(shader) || "Glass shader did not compile");
      }
      program = gpu.createProgram();
      if (!program) throw new Error("Could not allocate glass program");
      shaders.forEach(shader => gpu.attachShader(program!, shader));
      gpu.linkProgram(program);
      if (!gpu.getProgramParameter(program, gpu.LINK_STATUS)) throw new Error(gpu.getProgramInfoLog(program) || "Glass program did not link");
      vertices = gpu.createBuffer();
      art = gpu.createTexture();
      if (!vertices || !art) throw new Error("Could not allocate glass textures");
      gpu.bindBuffer(gpu.ARRAY_BUFFER, vertices);
      gpu.bufferData(gpu.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gpu.STATIC_DRAW);
      gpu.bindTexture(gpu.TEXTURE_2D, art);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.LINEAR);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
      const location = (name: string) => {
        const value = gpu.getUniformLocation(program!, name);
        if (!value) throw new Error(`Missing glass uniform ${name}`);
        return value;
      };
      resources = { program, vertices, art, position: gpu.getAttribLocation(program, "a_position"),
        size: location("u_size"), center: location("u_center"), cover: location("u_cover"), dark: location("u_dark"), pointer: location("u_pointer"), focus: location("u_focus"), atlas: location("u_atlas") };
      gpu.useProgram(program);
      gpu.uniform1i(location("u_art"), 0);
      gpu.disable(gpu.DEPTH_TEST);
      gpu.disable(gpu.BLEND);
      return true;
    } catch (error) {
      if (art) gpu.deleteTexture(art);
      if (vertices) gpu.deleteBuffer(vertices);
      if (program) gpu.deleteProgram(program);
      console.warn("Music glass is unavailable:", error instanceof Error ? error.message : "WebGL initialization failed");
      return false;
    } finally { shaders.forEach(shader => gpu.deleteShader(shader)); }
  };

  if (!initialize()) return null;

  const render = (art: HTMLCanvasElement, params: MusicGlassParams) => {
    if (disposed || lost || !resources || failedUpload || params.width <= 0 || params.height <= 0 || !art.width || !art.height) return;
    last = { art, params };
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const backingWidth = Math.max(1, Math.round(params.width*ratio));
    const backingHeight = Math.max(1, Math.round(params.height*ratio));
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    gpu.viewport(0,0,backingWidth,backingHeight);
    gpu.useProgram(resources.program);
    gpu.bindBuffer(gpu.ARRAY_BUFFER,resources.vertices);
    gpu.enableVertexAttribArray(resources.position);
    gpu.vertexAttribPointer(resources.position,2,gpu.FLOAT,false,0,0);
    gpu.activeTexture(gpu.TEXTURE0);
    gpu.bindTexture(gpu.TEXTURE_2D,resources.art);
    gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL,true);
    gpu.pixelStorei(gpu.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    try {
      const resized = art.width !== textureWidth || art.height !== textureHeight;
      if (resized || art !== uploadedArt || params.artRevision === undefined || params.artRevision !== uploadedRevision) {
        if (resized) {
          gpu.texImage2D(gpu.TEXTURE_2D,0,gpu.RGBA,gpu.RGBA,gpu.UNSIGNED_BYTE,art);
          textureWidth = art.width;
          textureHeight = art.height;
        } else {
          // Reuse the atlas allocation as albums enter the window; pointer-only
          // lighting and focus changes continue to skip all texture uploads.
          gpu.texSubImage2D(gpu.TEXTURE_2D,0,0,0,gpu.RGBA,gpu.UNSIGNED_BYTE,art);
        }
        uploadedArt = art;
        uploadedRevision = params.artRevision;
      }
    }
    catch {
      failedUpload = true;
      console.warn("Music glass requires an origin-clean artwork canvas.");
      return;
    }
    gpu.uniform2f(resources.size,params.width,params.height);
    gpu.uniform1f(resources.center,params.centerX);
    gpu.uniform1f(resources.cover,params.cover);
    gpu.uniform1f(resources.dark,params.dark ? 1 : 0);
    gpu.uniform1f(resources.focus,params.focused ? 1 : 0);
    gpu.uniform4f(resources.atlas,params.atlas?.base ?? 0,params.atlas?.position ?? 0,params.atlas?.tileSize ?? 1,params.atlas ? 1 : 0);
    gpu.uniform2f(resources.pointer,Math.max(-1,Math.min(1,params.pointerX || 0)),Math.max(-1,Math.min(1,params.pointerY || 0)));
    gpu.drawArrays(gpu.TRIANGLES,0,6);
  };

  const contextLost = (event: Event) => { event.preventDefault(); lost = true; };
  const contextRestored = () => {
    if (disposed) return;
    resources = null;
    uploadedArt = null;
    uploadedRevision = undefined;
    textureWidth = 0;
    textureHeight = 0;
    failedUpload = false;
    lost = !initialize();
    if (!lost && last) render(last.art,last.params);
  };
  canvas.addEventListener("webglcontextlost",contextLost);
  canvas.addEventListener("webglcontextrestored",contextRestored);
  return {
    render,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      last = null;
      canvas.removeEventListener("webglcontextlost",contextLost);
      canvas.removeEventListener("webglcontextrestored",contextRestored);
      destroy();
    },
  };
}
