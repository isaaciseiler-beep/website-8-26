# iMac G4 transparent cutout

## Source and intended use

Active asset: `public/devices/imac-g4-cutout.png`, **1422 × 1106**, PNG with alpha. Created on 6 November 2026 using the built-in ImageGen editing tool from the user's supplied front-facing product photograph:

`/var/folders/d2/thbt42q94jndpyw9_7d4r9b40000gn/T/codex-clipboard-3b1023ca-f298-4bce-949b-dbf47d75ba99.jpg`

The user explicitly requested this example without its speakers, keyboard, and other peripherals. No photographer or source license was supplied with the attachment; this record does not assert public-domain or Creative Commons rights. The active cutout is an AI-assisted photographic edit, **not an unchanged photograph**. It preserves the supplied wide, front-facing G4 appearance; the obscured lower base is reconstructed. The exact hardware SKU is unverified, so the interface should call it “iMac G4” without a 15-inch claim.

The black display is a placeholder beneath the live HTML interface. No generated screen graphics are used. Retain the supplied 16:10-style wide screen rather than substituting the earlier, squarer 15-inch candidate.

## Native pixel calibration

- Image: 1422 × 1106.
- Display opening, clockwise from top left: **(320, 108), (1098, 108), (1098, 588), (320, 588)**. These are visual edge measurements, within about two source pixels. The black aperture is approximately 778 × 480.
- White/clear display cabinet: approximately x228–1185, y22–674; rounded outer corners.
- Chrome support: approximately x669–748, y645–754.
- Dome base: approximately x438–981, y752–1085.

The PNG has true alpha, but the extraction retains small pale fragments immediately outside the hardware and a few isolated fragments in the arm gap. Apply a code-native silhouette clip to exclude them. The following native-pixel, three-subpath silhouette is a starting calibration for the photographed panel, chrome support, and dome; it intentionally excludes all detached fragments. Adjust by a source pixel if needed when checking light and dark backgrounds:

```svg
<path d="
  M 288 23 H 1124
  Q 1184 23 1184 83 V 614
  Q 1184 673 1125 673 H 287
  Q 228 673 228 614 V 83
  Q 228 23 288 23 Z

  M 671 645 H 746 V 684
  Q 746 706 729 718 L 730 753 H 688 L 689 718
  Q 669 708 669 684 Z

  M 708 752
  C 558 750 440 886 438 1000
  L 438 1031
  C 438 1069 478 1075 541 1080
  C 660 1090 845 1087 947 1074
  Q 980 1068 980 1031
  C 979 883 851 754 708 752 Z
" />
```

The screen is a flat rectangle, so no projective distortion is necessary for this asset. Keep the corner radius small enough to fill the black aperture without covering its white bezel.

## Editing record

The first edit used the user's exact photograph as `referenced_image_paths` with `transparent_background: true`:

> Use case: precise-object-edit / background-extraction. Edit THIS EXACT supplied front-facing iMac G4 product photograph. Preserve the actual photographed computer, camera angle, colors, neutral white plastic, clear acrylic display outline, original physical hardware, lighting, chrome support, Apple emblem, drive tray, iMac lettering and shape exactly unchanged. Do not redesign, redraw or stylize the computer. Only make these requested localized edits: (1) Remove the two separate circular speakers, full detached keyboard, mouse and every cable. (2) Reconstruct only the small bottom portion of the same hemispherical computer base that was hidden by the keyboard, continuing its existing real shape faithfully. (3) Replace all screen graphics with a uniform pure BLACK display opening while retaining its exact original rectangular boundaries. (4) Remove the white background completely, leaving TRUE clean transparent alpha outside the actual computer, including the clear gaps around the chrome support. Maintain the original precisely straight-on frontal screen, its WIDE 16:10 display aspect and existing bezel proportions from THIS photo; do not substitute the squarer 15-inch variant. The complete computer alone should be centered with modest transparent breathing room around it. Preserve the source's crisp real studio-photography appearance; no new textures, grunge, fake grain, haze, bloom, halos, color cast, vignette, pedestal, detached shadows, added screws or invented hardware. No checkerboard or white/gray background painted into the image. Clean production-ready transparent PNG of this exact real product, no external objects.

One cleanup edit referenced that first output, again with `transparent_background: true`:

> Background-extraction cleanup only. Keep this exact image's computer pixels, silhouette, proportions, screen rectangle, real photographic shading and all hardware unchanged. Do not regenerate or redesign the computer. Remove the stray white/pale fragments in the otherwise transparent background: above the display, along the outside display sides and bottom edge, and especially the large detached white islands floating in the gap on BOTH sides of the chrome arm. Every pixel outside the actual physical computer silhouette must have alpha zero. The gap between the display and base must be wholly transparent except for the actual narrow chrome support arm. No white matte, no leftover fragments, no halo or shadow beyond the true object edge. Only the white plastic computer, dark screen and chrome support should remain. Keep true crisp antialiased object edges against transparent alpha.

Final tool output, copied unchanged into the public asset:

`/Users/isaacseiler/.codex/generated_images/01a1b39d-e5e7-7361-b0e3-c558830a63e0/exec-5edcc065-3cd5-40f8-9861-e6cad6e5e857.png`

No raster modifications were performed outside ImageGen. Verification: inspected final PNG, confirmed its 1422 × 1106 dimensions and alpha channel using `sips`, and measured screen/cabinet coordinates against the native image. The silhouette clip and live HTML alignment are integration responsibilities; those are separate from this asset's verification.
