# Art pipeline

All raster art under `public/art/` is generated with Google's image model, then keyed, aligned and
exported with `sharp`. The 3D materials for the table and the HDRI are CC0 downloads from Poly Haven.
Review everything in one image: `public/art/contact_sheet.jpg`. Cutout edges at 100 % over black and
white: `public/art/review_edges.jpg`. Every file with its pixel size: `public/art/manifest.json`.

## Model

**`gemini-nano-banana-2.1`** (Gemini API, `generateContent`) for every delivered image.

- Gemini 4 Carbon and Gemini 4 Neon were the owner's preference, but they cannot make images. Google's
  model pages list both as text-output only, with "Image generation: not supported" and no image tool
  among their built-in tools. That matches what the API returned (`NO_IMAGE`). They are reasoning
  models that accept images as input.
- Google's image-generation guide names Nano Banana 2.1 as the current recommended image model. One
  Titus candidate was also rendered with `gemini-3-pro-image` (Nano Banana Pro) for comparison; it was
  equally photoreal but the face was stiffer and older, so it was not used.
- Size and shape are set with `generationConfig.imageConfig = { aspectRatio, imageSize }`. Used here:
  `4:5` at `2K` (1856x2304) for the boys, `1:1` at `2K` (2048x2048) for Dux and the marble slab, `16:9`
  at `2K` (2752x1536) for backgrounds, key art and story plates, `1K` for small UI textures. 4K exists
  but was not needed: every delivered size is a downscale of a 2K render, never an upscale.
- Reference images (for edits and for the key art) are sent as `inlineData` parts before the text.
- **72 generations in total** (71 Nano Banana 2.1, 1 Nano Banana Pro), all logged in
  `scripts/art/raw/genlog.jsonl`. Three text-model calls (`gemini-3.5-flash`) measured the face
  landmarks; they are not image generations.

## Rebuilding

```
node scripts/art/gen.mjs <id> [<id> ...] [--force]   # render a prompt into scripts/art/raw/<id>.jpg
node scripts/art/gen.mjs --list                      # every prompt id
node scripts/art/build_all.mjs                       # rebuild public/art from the raw renders (no API calls)
```

- `scripts/art/prompts.mjs` holds every prompt, the chosen base per character (`BASE`, `DUX_BASE`) and
  the frame / pose lists.
- `scripts/art/gen.mjs` reads `GEMINI_API_KEY` from the environment or `.env`, retries on 429 / 5xx, and
  skips ids whose raw file exists unless `--force`. The key is never printed or written anywhere.
- `scripts/art/raw/` is the cache of original model output (about 190 MB). It is **git-ignored**, so it
  exists only on the machine that generated it. The model is not deterministic: re-rendering a raw file
  gives a different image, and re-rendering a character base means re-rendering all of that
  character's frames and re-running `landmarks.mjs --force`.
- Build steps, in order: `build_characters`, `build_dux`, `build_backgrounds`, `fetch_polyhaven`,
  `build_ui` (hero, cards, parchment, logo, marble slab, story plates), `build_manifest` (contact sheet,
  edge review, manifest).
- `_keytest.mjs`, `_flow.mjs`, `_faces.mjs` and `_sheet.mjs` are small inspection tools used while
  making the art (backdrop comparison, local motion between two frames, face close-ups, preview grids).

## Characters

`public/art/characters/<maximus|titus|aghiles>/<frame>.webp`, RGBA, 1024x1280, WebP quality 88.
Frames: `neutral talk blink thinking pleased rattled triumphant sulking look`.

| | Base render | What was chosen where the books are silent |
|---|---|---|
| Maximus | `maximus_neutral_a` | fine white linen tunic with two narrow purple stripes (clavi) |
| Titus | `titus_neutral_b` | warm brown eyes; ochre-terracotta wool tunic, leather belt; gold bulla on a chain |
| Aghiles | `aghiles_neutral_d` | plain undyed brown sleeveless wool tunic |

- Three candidates were rendered for each boy. Aghiles' best candidate had the right build but read as
  a man in his twenties, so it was edited once into a youth of 16-17 (`_d`), which became the base.
- Every other frame is an image edit of the base ("identical image ... change only ..."), so identity,
  clothes and light are constant.
- **Framing.** Seated, waist up, three-quarter view facing screen-right, looking down-right at the
  board; hands out of frame. The raw bottom edge is the canvas bottom edge, so the figure always runs
  off the bottom (the lowest 15 % is meant to sit behind the 3D table).
- **Relative scale** on the shared canvas (scale factors in `build_characters.mjs`):

  | | top of hair (y) | figure width | head height |
  |---|---|---|---|
  | Maximus | 256 px | 560 px | about 364 px |
  | Titus | 198 px | 655 px | about 420 px |
  | Aghiles | 111 px | 876 px | about 411 px |

  Aghiles fills most of the frame and Maximus the least. Heads are kept close in size; the difference
  is in seated height and breadth, so the extra 3D scale (0.9 / 1.0 / 1.18) does not make it grotesque.

### Transparency

Backdrop test on Maximus (white-blond hair is the hard case), same keyer:

| Backdrop | Result |
|---|---|
| **Green** | Best. Hair wisps survive, purple stripes and blue eyes untouched. **Used for everything.** |
| Magenta | Pink fringe in the hair, magenta spill on skin, and the purple clavi partly keyed out. |
| Mid-grey | No usable key: wisps lost and the whites of the eyes punched through. |

The model's "flat" backdrop is never uniform (gradients, vignettes), so `matte.mjs` does this:

1. Estimates a smooth backdrop colour field from the pixels that are certainly backdrop.
2. Alpha from green dominance relative to the local backdrop, with a noise floor and ceiling.
3. Forces the eroded interior opaque; keeps the main blob and drops specks.
4. Un-mixes the foreground colour from the backdrop using the keyed alpha, then despills.
5. Extends interior colour outward into low-alpha edge pixels, so thin hair takes hair colour and not
   a dark or green fringe.

Per-subject options: firmer despill from the chin up for the two dark-haired boys (their hair picked
up green reflections); for Dux a firmer despill everywhere (cream belly fur) and a purity key that
removes the cast shadow under him. Matting runs at 2K and is downscaled, which hides JPEG chroma
blockiness at the edges.

Known edge limits: on a pure white backdrop the outermost wisps of Maximus' hair read slightly grey
(they are fine on dark and mid-tone scenes); Dux keeps a faint dark contact shadow between tail and
body in `sit` and `sleep`.

### Registration of the frames

The model kept the framing remarkably well: the whole-frame offset against neutral is 0-1 px for
every frame of every boy. Measured numbers are in each `meta.json` under `registration`.

- **`talk`, `blink`, `look` are overlays.** They are rebuilt as *neutral plus a feathered patch* over
  the mouth-and-chin or the eyes, so every pixel outside `changedRect` is identical to neutral. Swap
  them instantly or draw just the rectangle; no crossfade is needed and nothing shimmers.

  | | talk | blink | look |
  |---|---|---|---|
  | Maximus | patch, frame offset 0,1 px, head 0.5 px | patch, 0 px | patch, 0 px, head 0.5 px |
  | Titus | patch, 0 px | patch, 0 px | patch, 0 px, head 0.5 px |
  | Aghiles | patch, 0 px, head moved 1.1,2.3 px (followed) | patch, 0 px | patch, 0 px, head 2.3 px (followed) |

  Where the model nudged the head (Aghiles), the patch is aligned to the head before blending. Two
  frames were re-rendered because the first edit moved the head too far for a patch: Maximus `look`
  (he turned to face the camera; that render is kept as `raw/maximus_look_turn.jpg`) and Titus `talk`
  (head lifted about 4 px).
- **`thinking`, `pleased`, `rattled`, `triumphant`, `sulking` are full re-renders** aligned by
  translation (offset at most 1 px). Body and clothes sit in the same place but fabric and hair texture
  differ slightly pixel by pixel, and in `triumphant` the head lifts a little. Crossfade them over
  150-250 ms; do not flip between them every frame.
- `talk` is only registered to `neutral`. There is no talking variant of the other expressions.

`meta.json` also gives `eyeL`, `eyeR`, `mouth`, `headTop`, `chin` as normalised `[x, y]` on the neutral
frame (`eyeL` is the eye further left in the image). They were measured with a Gemini vision model and
checked by eye on a marked-up image; `scripts/art/landmarks.json` is the committed copy.

## Dux

`public/art/dux/<pose>.webp`, RGBA, 768x768: `sit eat point steal cheer scared chatter sleep`, plus
`meta.json`. Vervet-like: black face fringed with white, black-and-gold brindled fur. All poses are
edits of one base (`dux_sit_a`), lit like the boys.

- `sit eat point steal scared chatter` share one transform: body, feet and tail overlap exactly, so
  they swap or crossfade in place. `cheer` (standing) and `sleep` (curled) are placed on the same
  ground line (`groundY` in `meta.json`).
- The books never name a species or colour for Dux; the look follows the brief.
- `steal`: the counter came out as a deep-blue glass dome that is nearly a ball, rounder than the
  plano-convex counters in the 3D scene.

## Backgrounds

`public/art/backgrounds/<id>.webp`, 2560x1440, WebP quality 90, no people, lower third dark and plain
for the 3D table, moderate depth-of-field blur. `<id>_env.webp` is a blurred 1024x512 reflection map:
the plate and its mirror image side by side, so it wraps horizontally without a seam. It is not a true
panorama; use it for reflections and ambient colour only.

| id | Scene |
|---|---|
| `cubiculum` | Maximus' bedroom at night: red-and-ochre frescoes, couch, bronze lamps |
| `colosseum` | shade of a Colosseum arcade at noon, hazy Forum beyond with only distant specks of a crowd |
| `atrium` | animal-dealer's atrium at dusk: impluvium fountain, lamps, animal mosaic |

The atrium mosaic shows a tiger, a rhinoceros, a buffalo, a crocodile and a monkey (the animals
Titus' father deals in; no lions or elephants). The monkey was added by one edit.

## Menu and UI

| File | Size | Notes |
|---|---|---|
| `ui/hero.webp` | 2560x1440 | The three boys at the board by lamplight, Dux on Titus' shoulder reaching for a piece. Rendered with the three character bases and Dux as reference images. Maximus sits at the back so he reads as the smallest; an earlier arrangement put him in the foreground, where he looked the biggest. |
| `ui/card_<id>.webp` | 768x1024 | The `look` frame (eyes to the viewer) over a painted dark backdrop; one crop size for all three so their relative sizes survive. |
| `ui/card_dux.webp` | 768x1024 | Dux `sit` over the same backdrop. |
| `ui/parchment.webp` | 1024x1024 | Papyrus, made tileable by cross-fading with a half-offset copy. |
| `ui/logo_mark.webp` | 512x512 RGBA | Blue glass counter on an incised marble grid, cut as a roundel with a bronze rim. |

## Story plates

`public/art/story/<id>.webp`, 1920x1080, WebP quality 82: `prologue ch1 ch2 ch3 ch4 ch5 ch6 ch7
epilogue`. None shows the boys' faces. Dux in `ch5` (hand and forearm) and `epilogue` uses the Dux
base as a reference image.

- `ch5` has blurred, unrecognisable passers-by in the background of the market.
- `ch6`: the fingers holding the counter are clean but look older than fourteen.
- `ch4`: the cupboard numerals are too small to read at this size.

## Materials and lighting for the 3D scene

| Path | Source | Notes |
|---|---|---|
| `textures/marble/slab.webp` (+ `slab_normal_gl.jpg`, `slab_arm.jpg`) | generated | **Use this for the board.** One continuous slab of worn honed marble, 2048x2048. Tone evened out and brought to a mid tone (mean RGB about 188,180,166) so white and dark-blue counters both stand out. The normal map (OpenGL) and the ARM map are derived from the albedo: micro pits and scratches only, roughness about 0.4. Not tileable; map it once across the board. |
| `textures/marble/diffuse.jpg`, `normal_gl.jpg`, `arm.jpg` | Poly Haven `marble_01`, 2k | A tiled marble wall with visible joints. Poly Haven has no seamless marble slab. Kept for floors or walls; wrong for a single board. |
| `textures/wood/diffuse.jpg`, `normal_gl.jpg`, `arm.jpg` | Poly Haven `dark_wood`, 2k | Dark red-brown boards for the table. |
| `env/studio.hdr` | Poly Haven `wooden_lounge`, 1k | Warm interior with small bright lamps, good highlights for glass. |

`arm` packs ambient occlusion in red, roughness in green, metalness in blue.

Poly Haven assets are **CC0** (public domain, no attribution required): https://polyhaven.com/license.
Asset pages: https://polyhaven.com/a/marble_01, https://polyhaven.com/a/dark_wood,
https://polyhaven.com/a/wooden_lounge. `scripts/art/fetch_polyhaven.mjs` downloads them through
`https://api.polyhaven.com/files/<asset_id>`. Poly Haven files total 10.2 MB; the generated slab set
adds about 3 MB.

## Provenance

Images made with Google's image models carry an invisible SynthID watermark. No text from the books
is used in any prompt; the character descriptions are in our own words.
