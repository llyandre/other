# Wikaru profile asset notes

Mode: built-in image generation, sprite-sheet raster baru, lalu ekstraksi aset individual.

Base direction:

> Premium flat 2D Japanese editorial profile medallion; one clear focal subject; restrained navy, warm cream, muted coral, sage, and sky-blue palette; sophisticated rather than childish; consistent outline; transparent outside the medallion; no text, watermark, 3D, gloss, bevel, neon color, clutter, cropped edge, or duplicated subject.

Production conversion:

- Generated master sheet: 1541×1020, exactly 15 subjects in a 5×3 grid.
- Checker background was removed by connected-background extraction before slicing.
- Every production WebP is 256×256 with alpha preserved and quality 92.
- Visible artwork is normalized to a maximum 212×212 area, leaving at least 22 px of transparent padding on every canvas edge.
- The original 15 user avatars and the administrator avatar were normalized to the same safe-area standard.
- Production assets are stored directly in this directory and loaded on demand.

New subjects and production paths:

| ID | Subject | File |
|---|---|---|
| daruma | Persistence | `daruma.webp` |
| onigiri | Cheerfulness | `onigiri.webp` |
| sensu | Adaptability | `sensu.webp` |
| take-spirit | Growth | `take-spirit.webp` |
| ame-spirit | Patience | `ame-spirit.webp` |
| yuki-spirit | Clarity | `yuki-spirit.webp` |
| nami-spirit | Courage | `nami-spirit.webp` |
| hoshi-spirit | Guidance | `hoshi-spirit.webp` |
| fude-spirit | Creativity | `fude-spirit.webp` |
| suzume | Agility | `suzume.webp` |
| kame | Consistency | `kame.webp` |
| shiba | Loyalty | `shiba.webp` |
| kintsugi | Resilience | `kintsugi.webp` |
| koma-spirit | Balance | `koma-spirit.webp` |
| kotoba-spirit | Communication | `kotoba-spirit.webp` |
