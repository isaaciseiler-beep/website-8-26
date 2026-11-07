# NASA satellite imagery

The footer uses real NASA satellite mosaics in monochrome. It does not generate terrain, place names, clouds, or geography.

## Sources and attribution

- **8K land surface:** NASA Scientific Visualization Studio, *High Resolution Layers from “Monsoons: Wet, Dry, Repeat…”*, Blue Marble static land layer, released June 23, 2016. Source page and required credit: [NASA SVS](https://svs.gsfc.nasa.gov/4439). Original [8192 × 4096 TIFF](https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004439/flat_bluemarble_8192x4096.tif). Credit: **NASA's Scientific Visualization Studio**. NASA's [image usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) permit factual personal web-page use with acknowledgment; no endorsement is implied.
- **Ocean surface:** NASA's 2002 Blue Marble land surface/ocean color/sea ice image, Reto Stöckli and Robert Simmon / NASA Goddard. The previous prototype's [2048 × 1024 original](https://upload.wikimedia.org/wikipedia/commons/c/cd/Land_ocean_ice_2048.jpg) supplies ocean pixels only where the 8K land TIFF is transparent. The [Wikimedia source page](https://commons.wikimedia.org/wiki/File:Land_ocean_ice_2048.jpg) offers **CC BY-SA 3.0**. [License](https://creativecommons.org/licenses/by-sa/3.0/). Ocean detail remains the resolution of that source; land detail is native 8K.

The combined derivative JPEGs are made available under **CC BY-SA 3.0**, preserving the ocean source's attribution and share-alike terms.

## Local files and processing

- `nasa-satellite-8k.jpg`: 8192 × 4096, 4,981,179 bytes. Original 8K land layer composited over the georeferenced Blue Marble ocean image, JPEG quality 93%.
- `nasa-satellite-4k.jpg`: 4096 × 2048 derivative, JPEG quality 92%.
- `nasa-satellite-2k.jpg`: 2048 × 1024 derivative, JPEG quality 90%; also the lightweight static fallback.
- `nasa-blue-marble.jpg`: unchanged original 2K ocean source, retained for provenance and reproducibility.

Processing used macOS AppKit to draw the original ocean image into an 8192 × 4096 RGB bitmap, then source-over the original NASA TIFF at its native resolution. The smaller variants use `sips --resampleWidth 4096` / `2048`. No sharpening, invented relief, scene generation, or detail synthesis was applied. The browser performs monochrome conversion and gentle sphere lighting at runtime.

## Rendering and performance

Assets load only when the footer approaches the viewport. The renderer selects 2K, 4K, or 8K against actual display pixels and GPU limits, uses mipmaps with anisotropic filtering where supported, and honors Save-Data and low reported device memory. The framebuffer uses the actual device pixel ratio up to a 4096px GPU-aware width budget. Only the upper 40% of the sphere is allocated and drawn; the invisible lower 60% never consumes framebuffer pixels. The sphere does not rotate or redraw while idle. Live Mapbox, when configured, uses its own monochrome Satellite v9 imagery and attribution.
