import { R2_BASE, albums, albumPhotos, coverFor, type Album } from "@/lib/photoAlbums";

export type PhotoMapEntryKind = "album" | "photo";

export interface PhotoMapEntry {
  id: string;
  kind: PhotoMapEntryKind;
  title: string;
  location: string;
  coordinates: [number, number];
  coverImage: string;
  images: string[];
  albumFolder?: Album["folder"];
  photoIds?: string[];
}

const albumCoordinates: Record<Album["folder"], [number, number]> = {
  Australia: [115.8605, -31.9505],
  GranCanaria: [-15.5474, 27.9202],
  HongKong: [114.1694, 22.3193],
  Iceland: [-19.0208, 64.9631],
  Indonesia: [115.1889, -8.4095],
  Japan: [135.7681, 35.0116],
  Korea: [126.5312, 33.4996],
  NewZealand: [170.5, -44],
  Portugal: [-8.2245, 39.3999],
  Taiwan: [120.9605, 23.6978],
  TaiwanStrait: [119.9499, 26.1602],
  Thailand: [98.3923, 7.8804],
  Vietnam: [105.8342, 21.0278],
  "kz-kyrgz": [74.5698, 42.8746],
  mongolia: [106.9057, 47.8864],
  "washington-state": [-120.7401, 47.7511],
};

const miscUsPhoto = (fileName: string) => `${R2_BASE}/misc-USA/${fileName}`;

const standalonePhotoEntries: PhotoMapEntry[] = [
  {
    id: "photo-athens",
    kind: "photo",
    title: "Athens, GA",
    location: "Athens, GA",
    coordinates: [-83.3773, 33.9519],
    coverImage: miscUsPhoto("ATHENS.JPG"),
    images: [miscUsPhoto("ATHENS.JPG")],
  },
  {
    id: "photo-dc",
    kind: "photo",
    title: "Washington, DC",
    location: "Washington, DC",
    coordinates: [-77.0369, 38.9072],
    coverImage: miscUsPhoto("DC.JPG"),
    images: [miscUsPhoto("DC.JPG")],
  },
  {
    id: "photo-glenhaven",
    kind: "photo",
    title: "Glen Haven",
    location: "Glen Haven",
    coordinates: [-85.9854, 44.9056],
    coverImage: miscUsPhoto("GLENHAVEN.JPG"),
    images: [miscUsPhoto("GLENHAVEN.JPG")],
  },
  {
    id: "photo-oakridge",
    kind: "photo",
    title: "Oak Ridge",
    location: "Oak Ridge",
    coordinates: [-84.2696, 36.0104],
    coverImage: miscUsPhoto("OAKRIDGE.JPG"),
    images: [miscUsPhoto("OAKRIDGE.JPG")],
  },
  {
    id: "photo-stl",
    kind: "photo",
    title: "St. Louis",
    location: "St. Louis",
    coordinates: [-90.1994, 38.627],
    coverImage: miscUsPhoto("STL.JPG"),
    images: [miscUsPhoto("STL.JPG")],
  },
];

const albumMapEntries: PhotoMapEntry[] = albums
  .map((album) => ({
    id: `album-${album.folder}`,
    kind: "album" as const,
    title: album.location,
    location: album.location,
    coordinates: albumCoordinates[album.folder],
    coverImage: coverFor(album),
    images: albumPhotos(album),
    albumFolder: album.folder,
    photoIds: album.photos,
  }))
  .filter((entry) => Boolean(entry.coordinates));

export const photoMapEntries: PhotoMapEntry[] = [...albumMapEntries, ...standalonePhotoEntries];

export const photoMapInitialView = {
  center: [105, 26] as [number, number],
  zoom: 0.84,
  pitch: 0,
  bearing: 0,
};
