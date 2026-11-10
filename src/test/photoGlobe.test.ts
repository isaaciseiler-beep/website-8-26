import { describe, expect, it } from "vitest";
import { globeViewForLocation, normalizeGlobeView, PHOTO_GLOBE_INITIAL_VIEW, photoGlobePinOpacity, projectPhotoLocation, rotatePhotoGlobe, photoGlobeRasterPlan } from "@/lib/photoGlobe";
import { photoMapEntries } from "@/lib/photoMap";

describe("photo globe navigation", () => {
  it("puts each selected album inside the visible upper 40% of the globe", () => {
    for (const entry of photoMapEntries.filter(item => item.albumFolder)) {
      const point = projectPhotoLocation(entry.coordinates, globeViewForLocation(entry.coordinates));
      expect(point.visible, entry.id).toBe(true);
      expect(point.x).toBeCloseTo(50);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(40);
    }
  });
  it("keeps selected album pins completely inside a narrow crop", () => {
    for (const entry of photoMapEntries.filter(item => item.albumFolder)) {
      const point = projectPhotoLocation(entry.coordinates, globeViewForLocation(entry.coordinates));
      expect(photoGlobePinOpacity(point.x * 6.5, point.y * 6.5, 650, 320), entry.id).toBe(1);
    }
  });
  it("fades pins as they approach the crop and hides their full hit area at the edge", () => {
    expect(photoGlobePinOpacity(187, 130, 650, 320)).toBe(0);
    expect(photoGlobePinOpacity(195, 130, 650, 320)).toBe(.5);
    expect(photoGlobePinOpacity(325, 238, 650, 320)).toBe(0);
    expect(photoGlobePinOpacity(325, 230, 650, 320)).toBe(.5);
    expect(photoGlobePinOpacity(325, 130, 650, 320)).toBe(1);
  });
  it("rotates consistently across globe sizes and bounds the camera around the poles", () => {
    expect(rotatePhotoGlobe(PHOTO_GLOBE_INITIAL_VIEW, 65, 0, 650)).toEqual(rotatePhotoGlobe(PHOTO_GLOBE_INITIAL_VIEW, 160, 0, 1600));
    expect(rotatePhotoGlobe({ longitude: 179, latitude: 79 }, -100, 100, 650)).toMatchObject({ latitude: 80 });
    expect(normalizeGlobeView({ longitude: 721, latitude: -90 })).toEqual({ longitude: 1, latitude: -80 });
  });
  it("hides locations on the back side of the earth and below the footer crop", () => {
    expect(projectPhotoLocation([-74, 12], PHOTO_GLOBE_INITIAL_VIEW).visible).toBe(false);
    expect(projectPhotoLocation([106, -50], PHOTO_GLOBE_INITIAL_VIEW).visible).toBe(false);
    expect(projectPhotoLocation([106, 26], PHOTO_GLOBE_INITIAL_VIEW).visible).toBe(true);
  });
});


describe("satellite detail and drawing budget", () => {
  it("renders a Retina desktop at native resolution with real 8K texture detail", () => {
    expect(photoGlobeRasterPlan(1280, 2, 8192, 8192)).toMatchObject({ width: 2560, height: 1024, textureWidth: 8192, texturePath: "/images/globe/nasa-satellite-8k.jpg" });
  });
  it("draws only the visible cap and chooses sufficient mobile detail", () => {
    expect(photoGlobeRasterPlan(650, 2, 8192, 8192)).toMatchObject({ width: 1300, height: 520, textureWidth: 4096 });
    expect(photoGlobeRasterPlan(1600, 3, 8192, 8192)).toMatchObject({ width: 4096, height: 1639 });
  });
  it("bounds texture memory and transfer size on constrained devices", () => {
    expect(photoGlobeRasterPlan(1280, 2, 8192, 8192, true).textureWidth).toBe(4096);
    expect(photoGlobeRasterPlan(1280, 2, 8192, 8192, false, true).textureWidth).toBe(2048);
    expect(photoGlobeRasterPlan(1280, 2, 2048, 1024)).toMatchObject({ width: 1024, height: 410, textureWidth: 2048 });
  });
});
