# iMac G3 Blueberry transparent cutout

`imac-g3-cutout.png` is an AI-assisted extraction/edit of the existing `imac-g3-blueberry-photo.jpg`, created with the built-in ImageGen tool. It is **1254 × 1254 pixels with an alpha channel**. The source photo and its provenance remain unchanged.

Original photograph: **Thomas Kaiser**, *IMac G3 blueberry front.jpg*, 19 February 2007. [Source](https://commons.wikimedia.org/wiki/File:IMac_G3_blueberry_front.jpg). This adapted image retains **[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)** and the original required credit: “iMac G3 Blueberry photograph: Thomas Kaiser, CC BY-SA 3.0.” Changes: AI-assisted background/floor extraction, flat black replacement screen, alpha-matte cleanup, and resampling. Fine physical details remain visually close to the source, but generated editing does not establish exact photographic or manufacturing fidelity.

The selected output is the **second pass** (`exec-c1eb1334-3605-4a24-b173-f24801c76f19.png`). A third cleanup was inspected but not selected because it introduced more white residue below the base. The selected PNG is copied unchanged into the project; no local raster processing was used.

## Screen placement

The actual PNG dimensions are 1254 × 1254 (not the tool preview's nominal square display size). Pixel inspection finds flat black across x190–1062 through the middle of the CRT, y200–854, with rounded upper/lower corners and slight CRT curvature. Suggested HTML screen quad, clockwise from top left:

```text
[(192, 203), (1060, 203), (1063, 853), (187, 853)]
```

These are integration estimates, not factory measurements. Preserve rounded glass clipping; the top black edge bows slightly and its exact corner pixels should remain hidden by the physical glass/bezel treatment. The main body spans approximately x62–1190, y75–1146; feet extend to roughly y1168.

The generated alpha still includes a few white/cyan residual pixels just outside the physical silhouette. A code-native smooth exterior contour should exclude these, as in the original Macintosh 128K prototype. Keep real blue translucent edges and both feet. Do not treat residual fringe pixels as additional body width.

## Selected prompt set

Initial edit (built-in ImageGen, `transparent_background: true`, original photograph as the sole edit target):

> Use case: background-extraction. Asset type: clean transparent PNG device frame for a website, edited from the supplied real product photograph. Input image 1 is the edit target. Preserve its exact physical Apple iMac G3 Blueberry slot-loading case, near-straight-on front camera, proportions, lens perspective, realistic translucent white/blue plastic, all fine vertical ribbing, tiny top microphone, iMac lettering under display, two turquoise circular speaker grilles, headphone jacks, turquoise slot-loading optical drive trim and its narrow slot, lower-right round power button, and existing base/feet. This is an extraction and display cleanup of this same photograph, not a redesign or a different iMac generation. Remove the white photographic background, floor, cast floor shadow and any extraneous peripheral entirely to actual clean alpha transparency outside the computer. Preserve all physical case edges and fine antialiasing, especially translucent edge details; remove white matte fringes. Keep the subject sharply photographic with its real ribbed texture, without painterly smoothing or invented details. Full computer visible from its top to bottom feet with a small clear transparent margin, centered. Do not change the nearly frontal camera. Replace only the screen contents with flat pure black for later native HTML overlay. Preserve the actual rounded black glass boundary and silver/white physical screen trim. No UI, text, graphics, glow or reflection inside the flat black display opening. No keyboard, mouse, cables, backdrop, floor, props, labels or additional objects. Output must be a genuine alpha-transparent PNG.

Selected cleanup edit (built-in ImageGen, `transparent_background: true`, first generated image as the sole edit target):

> Use case: background-extraction. Final alpha-matte cleanup of this exact already isolated Blueberry iMac G3 photograph. Preserve the entire computer photograph, all proportions, the existing camera, every physical detail, the ribbed translucent shell, badges, speakers, slots, feet and flat pure-black screen EXACTLY unchanged. Change only the alpha/background outside the physical computer silhouette. Remove every stray white fragment above the case, all isolated cyan/blue/white specks at both sides and below the base, all halos, leftover background and disconnected pixels. Outside the real chassis and its feet must be perfectly clean alpha transparency. Preserve clean smoothly antialiased actual case edges; do not nibble the object away. Do not add background, floor, shadow, peripherals, graphics or text. True transparent production PNG, not a checkerboard and not a black/white background.
