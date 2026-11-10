import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PHOTO_GLOBE_VISIBLE_FRACTION, photoGlobeRasterPlan, type GlobeView } from "@/lib/photoGlobe";

type Props = { view: GlobeView };
// Only render the visible cap. This keeps native-DPR drawing economical on Retina screens.
const VERTEX = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
const FRAGMENT = `precision highp float;
uniform sampler2D u_earth; uniform vec2 u_view; uniform vec2 u_resolution; uniform float u_rim_width;
void main() {
  // Pixel centers define one exact circle, including fractional viewport sizes.
  vec2 p = vec2(2.0 * gl_FragCoord.x / u_resolution.x - 1.0,
    1.0 - 2.0 * (u_resolution.y - gl_FragCoord.y) / u_resolution.x);
  float radius = length(p);
  float insidePixels = (1.0 - radius) * u_resolution.x * 0.5;
  float coverage = clamp(insidePixels + 0.5, 0.0, 1.0);
  if (coverage <= 0.0) discard;
  vec2 surface = p / max(1.0, radius);
  float z = sqrt(max(0.0, 1.0 - dot(surface, surface)));
  float latitude = asin(clamp(surface.y * cos(u_view.y) + z * sin(u_view.y), -1.0, 1.0));
  float longitude = atan(surface.x, z * cos(u_view.y) - surface.y * sin(u_view.y)) + u_view.x;
  vec2 uv = vec2(longitude / 6.28318530718 + 0.5, 0.5 - latitude / 3.14159265359);
  // Prefilter the horizon in the same pass that draws the surface.
  float horizonBias = 3.5 * (1.0 - smoothstep(0.0, u_rim_width, insidePixels));
  vec3 satellite = texture2D(u_earth, uv, horizonBias).rgb;
  float gray = dot(satellite, vec3(0.299, 0.587, 0.114));
  float light = 0.48 + 0.52 * max(0.0, dot(vec3(surface, z), normalize(vec3(-0.5, 0.7, 1.3))));
  gray = pow(gray, 0.78) * light;
  // Premultiplied coverage avoids a matte or fringe on either site background.
  gl_FragColor = vec4(vec3(gray) * coverage, coverage);
}`;

type ConnectionNavigator = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Real NASA satellite imagery, rendered locally when Mapbox is unavailable. */
export default function NativeSatelliteGlobe({ view }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rendererReady, setRendererReady] = useState(false);
  const [contextGeneration, setContextGeneration] = useState(0);
  const render = useRef<((next: GlobeView) => void) | null>(null);
  const currentView = useRef(view);
  currentView.current = view;

  useEffect(() => {
    const element = canvas.current;
    const gl = element?.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, depth: false, stencil: false });
    if (!element || !gl || gl.getParameter(gl.MAX_TEXTURE_SIZE) < 2048) return;
    let disposed = false;
    const contextLost = (event: Event) => { event.preventDefault(); element.style.opacity = "0"; setRendererReady(false); };
    const contextRestored = () => setContextGeneration(value => value + 1);
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    element.addEventListener("webglcontextlost", contextLost);
    element.addEventListener("webglcontextrestored", contextRestored);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    const viewUniform = gl.getUniformLocation(program, "u_view");
    const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
    const rimWidthUniform = gl.getUniformLocation(program, "u_rim_width");
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    const maxFramebuffer = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number, maxViewport[0], maxViewport[1] / PHOTO_GLOBE_VISIBLE_FRACTION);
    const connection = navigator as ConnectionNavigator;
    const plan = (width = element.clientWidth) => photoGlobeRasterPlan(width, window.devicePixelRatio || 1, maxTexture, maxFramebuffer, (connection.deviceMemory ?? 8) <= 4, Boolean(connection.connection?.saveData));
    let ready = false;
    let loadedTextureWidth = 0;
    let requestedTextureWidth = 0;
    const pendingImages = new Set<HTMLImageElement>();
    const draw = (next: GlobeView) => {
      if (!ready || disposed || gl.isContextLost()) return;
      const width = element.clientWidth;
      const raster = plan(width);
      if (element.width !== raster.width || element.height !== raster.height) {
        element.width = raster.width;
        element.height = raster.height;
        // Keep device pixels square; the final partial row is clipped by the cap.
        element.style.height = `${raster.height / raster.width * 100}%`;
      }
      gl.viewport(0, 0, raster.width, raster.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolutionUniform, raster.width, raster.height);
      gl.uniform2f(viewUniform, next.longitude * Math.PI / 180, next.latitude * Math.PI / 180);
      gl.uniform1f(rimWidthUniform, 14 * raster.width / Math.max(1, width));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loadTexture = () => {
      const raster = plan();
      if (requestedTextureWidth >= raster.textureWidth) return;
      requestedTextureWidth = raster.textureWidth;
      const image = new Image();
      pendingImages.add(image);
      image.decoding = "async";
      image.onload = () => {
        pendingImages.delete(image);
        if (disposed || gl.isContextLost() || image.width < loadedTextureWidth) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        loadedTextureWidth = image.width;
        element.dataset.textureWidth = String(image.width);
        ready = true;
        draw(currentView.current);
        element.style.opacity = "1";
        setRendererReady(true);
      };
      image.onerror = () => { pendingImages.delete(image); requestedTextureWidth = loadedTextureWidth; };
      image.src = raster.texturePath;
    };
    render.current = draw;
    loadTexture();
    const resize = () => { draw(currentView.current); loadTexture(); };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      disposed = true;
      element.removeEventListener("webglcontextlost", contextLost);
      element.removeEventListener("webglcontextrestored", contextRestored);
      window.removeEventListener("resize", resize);
      pendingImages.forEach(image => { image.onload = null; image.onerror = null; });
      render.current = null;
      observer.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [contextGeneration]);

  useLayoutEffect(() => { render.current?.(view); }, [view]);
  return <div className="photo-globe-satellite-fallback" data-renderer={rendererReady ? "webgl" : "static"} style={{ backgroundPosition: `${50 - view.longitude / 3.6}% center` }} aria-hidden="true">
    <canvas ref={canvas} className="photo-globe-satellite" style={{ height: `${PHOTO_GLOBE_VISIBLE_FRACTION * 100}%` }} />
  </div>;
}
