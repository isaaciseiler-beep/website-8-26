export const TILE_BASE = "https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev";

/** Backgrounds 1.png – 10.png used for the work/news tiles. */
export const tileImages: string[] = Array.from(
  { length: 10 },
  (_, index) => `${TILE_BASE}/${index + 1}.png`,
);

export const tileImageFor = (index: number) => tileImages[index % tileImages.length];

export const profilePhotoUrl = `${TILE_BASE}/profile_photo.jpeg`;
