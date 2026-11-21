// Every image prompt used for the game art. `node scripts/art/gen.mjs <id>` renders
// one into scripts/art/raw/<id>.jpg; the build_*.mjs scripts post-process the raw files.
// refs are paths relative to the repo root and are sent to the model before the text.

const R = (id) => `scripts/art/raw/${id}.jpg`;

// ───────────────────────── characters ─────────────────────────

const BACKDROP = {
  green:
    'Background: a perfectly flat, uniform, evenly lit pure chroma-key green (#00FF00) studio backdrop with no gradient, no shadow, no texture, no floor and no horizon. The green does not tint the subject.',
  magenta:
    'Background: a perfectly flat, uniform, evenly lit pure chroma-key magenta (#FF00FF) studio backdrop with no gradient, no shadow, no texture, no floor and no horizon. The magenta does not tint the subject.',
  grey:
    'Background: a perfectly flat, uniform, evenly lit neutral mid-grey (#808080) studio backdrop with no gradient, no shadow, no texture, no floor and no horizon.',
};

const FRAMING =
  'He is seated at a low game table that is out of frame below, shown from the waist up. His body is turned in three-quarter view toward the right side of the image, and his head is tilted slightly down: he is looking down and to the right at a game board that would lie on the table just outside the bottom-right corner of the frame. Both arms hang relaxed at his sides, with forearms and hands leaving the image through the bottom edge (hands not visible). The whole head, all of the hair and both shoulders are completely inside the frame with clear empty backdrop above the head and at the left and right sides; the figure is cut off only by the bottom edge, at the waist. Nothing else is in the image: no table, no props, no other people.';

const LIGHT =
  'Lighting: a soft warm key light from the front-right, like a nearby oil lamp, and a gentle neutral rim light from behind-left that separates him cleanly from the backdrop. Hyper-realistic cinematic photograph, 85mm lens, true-to-life skin texture, natural fabric weave, the whole subject in sharp focus, crisp clean silhouette. Historically accurate ancient Roman costume of A.D. 303, nothing modern. No text, no watermark, no border.';

const SUBJECT = {
  maximus:
    'a 15-year-old Roman boy, a senator\'s son, who is small and skinny for his age: a slight, child-sized build with narrow shoulders and a thin neck, but with the sharp, clever, slightly superior face of a young man and fine features. Permanently very pale, almost porcelain skin; very light icy pale-blue eyes; a tousled mop of hair so blond it is almost white, with white-blond eyebrows and lashes. He wears a fine white linen tunic with two narrow purple vertical stripes (clavi), one running down from each shoulder. Expression: calm and attentive with a hint of cool confidence, mouth closed.',
  titus:
    'a 14-year-old Roman boy of average height and average build with a round, cheerful, beardless face framed by curly chestnut-brown hair, warm brown eyes, and light olive Mediterranean skin with rosy cheeks. Around his neck hangs a round gold bulla amulet (a smooth, lens-shaped golden locket about four centimetres wide) on a gold chain, resting clearly visible in the middle of his chest on top of his tunic. He wears an ochre-terracotta wool tunic with short sleeves and a leather belt. Expression: relaxed and good-humoured, mouth closed.',
  aghiles:
    'a 17-year-old Numidian Berber youth from North Africa who is very tall, broad-shouldered and powerfully built, an imposing athletic frame whose shoulders span most of the image width; dark brown skin, short tightly curled black hair, eyes of deepest ebony, beardless, with a calm, steady, watchful and dignified face. He wears a plain undyed brown wool sleeveless tunic that shows his strong shoulders and upper arms. Expression: composed, serious and quietly confident, mouth closed.',
};

const neutral = (who, bg) => ({
  prompt: `Portrait of ${SUBJECT[who]} ${FRAMING} ${BACKDROP[bg]} ${LIGHT}`,
  aspect: '4:5',
  size: '2K',
});

// Derived frames: edit the chosen neutral base so identity, framing and light stay fixed.
const KEEP =
  'Edit this photograph. Keep it the identical image: exactly the same person, face shape, hair, clothing, body pose, head position and head angle, framing, camera, lighting and flat background colour, with the figure in exactly the same place and at exactly the same size in the frame. Change only the following:';
const KEEP_END = 'Everything not mentioned stays pixel-for-pixel the same. Photorealistic, no text, no watermark.';

const EXPR_COMMON = {
  talk: 'his mouth is open mid-word as if speaking a vowel, lips parted with the upper teeth just visible; eyes, brows and head unchanged.',
  blink: 'both of his eyes are gently closed, eyelids fully shut as in the middle of a natural blink; mouth, brows and head unchanged.',
  look: 'his eyes (only the eyeballs, not the head) now look directly into the camera lens at the viewer; expression neutral and unchanged.',
};

const EXPR = {
  maximus: {
    ...EXPR_COMMON,
    thinking: 'his brow is furrowed in concentration and his eyes are narrowed, staring hard down at the board to the lower right, lips pressed thin: a clever boy calculating.',
    pleased: 'a small, superior, self-satisfied smirk with one corner of his closed mouth raised and one eyebrow slightly lifted, eyes bright, still looking down toward the board.',
    rattled: 'he looks alarmed and dismayed: eyes wide, eyebrows raised and drawn together, mouth slightly open in a small gasp, as if he has just seen a disastrous move on the board.',
    triumphant: 'he is delighted and victorious: a wide open-mouthed grin showing his teeth, eyes shining, eyebrows raised, chin lifted a little in triumph.',
    sulking: 'he is sulking: a scowl, lowered brows, lips pressed into a pout, and his eyes averted away to the left, refusing to look at the board.',
  },
  titus: {
    ...EXPR_COMMON,
    thinking: 'his brow is furrowed and his eyes are narrowed as he studies the board to the lower right, lips pursed to one side in theatrical concentration.',
    pleased: 'a broad, warm, cheerful closed-mouth smile with dimpled cheeks and merry eyes, still looking down toward the board.',
    rattled: 'he looks alarmed and dismayed in a theatrical way: eyes very wide, eyebrows shot up, mouth open in a gasp, as if he has just seen a terrible omen on the board.',
    triumphant: 'he is jubilant and victorious: a huge open-mouthed laughing grin showing his teeth, eyes crinkled with glee, eyebrows raised.',
    sulking: 'he is sulking: a scowl, lowered brows, lower lip pushed out in a pout, cheeks puffed slightly, and his eyes averted away to the left, refusing to look at the board.',
  },
  aghiles: {
    ...EXPR_COMMON,
    thinking: 'his brow is furrowed and his eyes are narrowed, studying the board to the lower right with a hunter\'s patient concentration, jaw set.',
    pleased: 'a quiet, warm, restrained closed-mouth smile, the corners of his mouth lifted and his eyes softened, still looking down toward the board.',
    rattled: 'he looks taken aback and dismayed: eyes widened, eyebrows raised, lips slightly parted, as if he has just seen a move he did not expect on the board.',
    triumphant: 'he is delighted and victorious: a broad, open, joyful smile showing his teeth, eyes bright, chin lifted a little with pride.',
    sulking: 'he is brooding: a heavy frown, lowered brows, jaw clenched and lips pressed tight, and his eyes averted away to the left, refusing to look at the board.',
  },
};

// The neutral candidate chosen for each boy (see docs/art.md).
export const BASE = { maximus: 'maximus_neutral_a', titus: 'titus_neutral_b', aghiles: 'aghiles_neutral_d' };
export const FRAMES = ['neutral', 'talk', 'blink', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking', 'look'];

export const PROMPTS = {
  // neutral candidates (backdrop test: green vs magenta vs grey on Maximus, the hard case)
  maximus_neutral_a: neutral('maximus', 'green'),
  maximus_neutral_b: neutral('maximus', 'magenta'),
  maximus_neutral_c: neutral('maximus', 'grey'),
  titus_neutral_a: neutral('titus', 'green'),
  titus_neutral_b: neutral('titus', 'green'),
  titus_neutral_c: { ...neutral('titus', 'green'), model: 'gemini-3-pro-image' },
  aghiles_neutral_a: neutral('aghiles', 'green'),
  aghiles_neutral_b: neutral('aghiles', 'green'),
  aghiles_neutral_c: neutral('aghiles', 'green'),
  // candidate b had the right build but read as a man in his twenties: make him a youth of 17
  aghiles_neutral_d: {
    refs: [R('aghiles_neutral_b')],
    prompt: `${KEEP} make him clearly a youth of 16 or 17 rather than a grown man: a younger, smoother, fresher teenage face with slightly softer features, no stubble, no forehead lines, while keeping his very tall, broad-shouldered, powerful build exactly as it is. His eyes are a little more open, with a calm, steady, watchful gaze down at the board to the lower right. ${KEEP_END}`,
    aspect: '4:5',
    size: '2K',
  },
};

// Maximus turned his whole head for the generic "look" edit, so his is spelled out more tightly.
EXPR.maximus.look = 'only his irises and pupils move: he glances sideways toward the camera out of the corners of his eyes, looking at the viewer. His head does not turn or lift at all; it stays tilted down and turned to the right in exactly the same three-quarter view, with the nose, mouth, chin, ears and hair exactly where they are. Expression neutral and unchanged.';

// Titus lifted his head when he opened his mouth; keep the head still so talk can overlay neutral.
EXPR.titus.talk = 'only his lips and lower jaw move: his mouth is open mid-word as if speaking a vowel, lips parted with the upper teeth just visible. His head does not lift, turn or move at all; the hair, forehead, eyes, nose, ears and cheeks stay exactly where they are, and his eyes keep looking down at the board.';

for (const who of Object.keys(EXPR)) {
  for (const [frame, change] of Object.entries(EXPR[who])) {
    PROMPTS[`${who}_${frame}`] = {
      get refs() {
        return [R(BASE[who])];
      },
      prompt: `${KEEP} ${change} ${KEEP_END}`,
      aspect: '4:5',
      size: '2K',
    };
  }
}

// ───────────────────────── Dux the monkey ─────────────────────────

const DUX_LOOK =
  'a small pet monkey of ancient Rome, vervet-like and small enough to ride on a boy\'s shoulder: a black face fringed all round with white fur, body fur brindled black and gold, big bright expressive amber-brown eyes, small dark hands and feet, a long slender tail';
const DUX_SHOT =
  'The whole monkey, including all of its tail, hands and feet, is inside the frame with clear empty backdrop on every side. Its body is turned in three-quarter view toward the right side of the image. Background: a perfectly flat, uniform, evenly lit pure chroma-key green (#00FF00) studio backdrop with no gradient, no texture, no floor, no horizon and no cast shadow under the animal. The green does not tint the fur. Lighting: a soft warm key light from the front-right, like a nearby oil lamp, and a gentle neutral rim light from behind-left. Hyper-realistic wildlife studio photograph, every hair sharp, crisp clean silhouette. No collar, no clothing, no props, no text, no watermark.';

const DUX_KEEP =
  'Edit this photograph. It must stay the same individual monkey: identical face, white facial fringe, black-and-gold brindled fur, eye colour, body size and proportions, the same size in the frame, the same camera, the same warm lighting from the front-right and the same flat green backdrop with no cast shadow. The whole animal including its tail stays inside the frame. Change only its pose and expression:';
const DUX_END = 'Hyper-realistic photograph, anatomically correct monkey with five fingers on each hand, no text, no watermark.';

export const DUX_BASE = 'dux_sit_a';
export const DUX_POSES = ['sit', 'eat', 'point', 'steal', 'cheer', 'scared', 'chatter', 'sleep'];
const DUX_EDIT = {
  eat: 'it sits and nibbles a walnut that it holds up to its mouth in both hands, cheeks full, eyes greedy and content.',
  point: 'it sits leaning forward and stretches one arm out, pointing with its index finger down and forward toward the lower right, as if pointing at a spot on a game board; it looks where it points, alert and helpful.',
  steal: 'it crouches a little lower and hugs to its chest, in both hands, one deep-blue glass gaming counter: not a ball but a low dome, a round glass button flat on the bottom and gently domed on top, the size of a large coin, held so its flat-bottomed dome profile shows. Its head is turned toward the camera and it looks straight at the viewer out of narrowed eyes with a sly, sneaky, guilty little grin, caught in the act of stealing.',
  cheer: 'it stands upright on its hind legs with both arms thrown straight up in the air, mouth wide open in a gleeful whoop, eyes bright with delight.',
  scared: 'it sits hunched and covers both of its eyes with its two hands, frightened, shoulders drawn up, tail wrapped close.',
  chatter: 'it sits upright and scolds, leaning forward with its mouth open chattering, small teeth showing, brows drawn down, one hand raised and shaking in indignation.',
  sleep: 'it is fast asleep, curled up in a ball lying on its side with its eyes closed, its tail wrapped around its body and its head resting on its hands.',
};

for (const v of ['a', 'b']) {
  PROMPTS[`dux_sit_${v}`] = {
    prompt: `Full-body portrait of ${DUX_LOOK}. It sits upright on its haunches, alert and curious, looking toward the lower right with its head slightly tilted, hands resting on its knees, tail curled beside it. ${DUX_SHOT}`,
    aspect: '1:1',
    size: '2K',
  };
}
for (const [pose, change] of Object.entries(DUX_EDIT)) {
  PROMPTS[`dux_${pose}`] = {
    get refs() {
      return [R(DUX_BASE)];
    },
    prompt: `${DUX_KEEP} ${change} ${DUX_END}`,
    aspect: '1:1',
    size: '2K',
  };
}

// ───────────────────────── backgrounds ─────────────────────────
// The game table and the players are 3D / sprites in front of these, so each is an empty room
// seen from a seat at the table: no people, lower third plain, dark and out of focus.

const BG_COMMON =
  'There are no people and no animals anywhere in the image. The camera is at the eye height of someone seated at a low table, looking straight across the space; the table itself is not in the picture. The lower third of the image is plain, dark and softly out of focus with no objects in it. The whole scene has a moderate, natural depth-of-field blur, as a backdrop behind a sharply focused foreground subject would. Hyper-realistic cinematic photograph, 35mm lens, physically accurate light, rich detail, historically accurate Rome of A.D. 303, nothing modern, no text, no watermark, no border.';

export const BACKGROUNDS = ['cubiculum', 'colosseum', 'atrium'];
const BG = {
  cubiculum:
    'Interior of a boy\'s bedroom (cubiculum) in a Roman senator\'s villa at night. Frescoed walls in the Pompeian style: deep cinnabar-red panels framed with ochre-yellow and black bands, thin painted columns and small garlands. Against the far wall a wooden sleeping couch (lectus) with turned legs, a striped wool blanket and a bolster. Two bronze oil lamps on tall bronze lampstands and one small clay lamp in a wall niche burn with small warm flames, the only light: pools of warm amber light on the frescoes, deep soft shadows in the corners, a faint haze of lamp smoke. A wooden chest and a bronze-bound stool stand by the wall. The floor in the foreground falls away into darkness.',
  colosseum:
    'In the deep cool shade inside the ground-floor arcade of the Colosseum in Rome at noon, in antiquity when the amphitheatre is complete and in use. Massive travertine piers and round arches recede in a curving row; the pale stone is pitted and warm grey. Through the tall arches opposite the camera, far beyond, lies the sunlit paved square toward the Roman Forum: brilliant, hazy, overexposed daylight, pale temples and columns dissolving in dust and heat, and only tiny indistinct blurred specks of a distant crowd, no recognisable figures. Shafts of dusty sunlight slant in through the arches and catch motes in the air. The paving of the arcade floor in the foreground lies in deep plain shadow.',
  atrium:
    'The atrium of a wealthy wild-animal dealer\'s town house in Rome at dusk. In the centre, a shallow marble impluvium pool with a small bronze fountain jet, under the square opening in the roof (compluvium) through which a deep blue-violet evening sky shows. Around the pool the floor is a large black-and-coloured tesserae mosaic of wild animals: a tiger, a rhinoceros, a crocodile, a buffalo and, clearly visible near the pool, a small monkey. Corinthian columns, walls painted in ochre and dark red, a doorway to a lamplit tablinum beyond. Bronze oil lamps on stands and hanging on chains burn with warm flames whose light glints on the water and the mosaic, contrasting with the cool blue dusk from above. The floor nearest the camera falls into plain darkness.',
};
for (const id of BACKGROUNDS) PROMPTS[`bg_${id}`] = { prompt: `${BG[id]} ${BG_COMMON}`, aspect: '16:9', size: '2K' };
// The first atrium render had every animal but an unmistakable monkey; this edit redraws the
// long-tailed creature left of the pool as one. (A first attempt at this edit produced a monkey
// that stood up out of the floor like a statue, hence the insistence on flatness.)
PROMPTS.bg_atrium_monkey = {
  refs: [R('bg_atrium')],
  prompt: 'Edit this photograph. Keep it the identical image: same room, camera, lighting, colours, depth of field and every object. Change only one detail of the flat floor mosaic: the long-tailed mosaic animal to the left of the pool is redrawn as an unmistakable monkey, walking on all fours in profile toward the right, with a dark face ringed by a pale fringe and a long tail curling up over its back. It is only a picture laid in stone tesserae in the floor: completely flat, lying in the plane of the floor, foreshortened by perspective exactly like the tiger mosaic beside it, in the same muted stone colours, casting no shadow and not standing up from the floor. The tiger, rhinoceros, buffalo and crocodile mosaics stay exactly as they are. No people, no live animals, no statues, no text.',
  aspect: '16:9',
  size: '2K',
};

// ───────────────────────── menu / UI art ─────────────────────────

const HERO = (extra = '') => ({
  get refs() {
    return [R(BASE.maximus), R(BASE.titus), R(BASE.aghiles), R(DUX_BASE)];
  },
  prompt:
    'Cinematic key art for a historical game, one hyper-realistic photograph. Use the four reference images for the exact identity of the characters: image 1 is MAXIMUS (small, skinny 15-year-old, very pale, white-blond tousled hair, light blue eyes, white linen tunic with two narrow purple stripes); image 2 is TITUS (14, round cheerful face, curly chestnut hair, ochre-terracotta tunic, round gold bulla amulet on a chain at his chest); image 3 is AGHILES (17, Numidian, very tall, broad and powerful, dark skin, short tightly curled black hair, plain brown sleeveless wool tunic); image 4 is DUX, Titus\'s small pet monkey (black face with a white fringe, black-and-gold brindled fur). Their faces, hair, skin, builds and clothes must match the references exactly, and the green studio backdrops of the references must not appear. ' +
    'Scene: night in a frescoed Roman bedroom, A.D. 303, deep red and ochre painted walls lost in shadow. The three boys sit around a low wooden table playing latrunculi. On the table lies a thick slab of cream marble incised with a square grid of eight by eight cells, with plano-convex glass gaming counters on it, some deep blue and some milk white, glinting. A bronze oil lamp with a small flame stands on the table and is the main light: warm amber light on their faces, deep soft shadows, a faint haze. Maximus sits on the left, leaning in with a cool, clever half-smile, one hand moving a blue counter. Titus sits in the middle behind the table, facing the camera, laughing, his gold bulla catching the light. Aghiles sits on the right, by far the biggest, towering over the other two, calm and watchful, arms resting on the table. Dux the monkey perches on the table edge beside Titus, stretching one arm out to steal a white counter. ' +
    'Composition: wide 16:9 shot from just above table height, the board in the lower centre foreground in sharp focus, the boys in a triangle around it, darker empty space in the upper third for a title. Shallow depth of field, anamorphic film look, rich detail in skin, linen, wool, marble and glass. Wholesome and warm. Every hand has five fingers. Nothing modern, no text, no letters, no watermark, no border. ' + extra,
  aspect: '16:9',
  size: '2K',
});
PROMPTS.ui_hero_a = HERO();
PROMPTS.ui_hero_b = HERO('The camera is a little further back so that all three boys are seen from the waist up with space around them.');

PROMPTS.ui_card_bg = {
  prompt:
    'A dark painted portrait backdrop, like the background of an old oil portrait or a Roman panel painting: deep umber and dark Pompeian red, loosely brushed, mottled, slightly lighter and warmer in the upper middle, falling to near black at the edges and corners, subtle visible brushwork and fine craquelure. Completely abstract: no objects, no figures, no frame, no text. Flat, evenly photographed painted surface filling the whole image.',
  aspect: '3:4',
  size: '1K',
};
PROMPTS.ui_parchment = {
  prompt:
    'A flat, evenly lit, top-down scan of a sheet of aged ancient papyrus filling the entire image edge to edge: warm honey-beige with the fine criss-cross weave of papyrus fibres, faint horizontal and vertical strips, soft irregular stains, slight foxing and darker worn patches, low contrast, no strong shadows, no folds, no torn edges, no holes, no border, no writing, no text, no objects. Seamless texture for a user-interface panel.',
  aspect: '1:1',
  size: '1K',
};
PROMPTS.ui_logo = {
  prompt:
    'An emblem photographed from directly above, perfectly centred and symmetrical: one single plano-convex deep cobalt-blue glass gaming counter (a round glass dome, flat underneath, like a large glass button) with a bright soft highlight, resting exactly in the centre cell of a square grid of lines incised into a polished cream-white marble slab. The grid lines are thin, straight and evenly spaced, three cells by three visible, parallel to the image edges. The marble fills the whole image edge to edge. Warm soft lamplight from the upper left, a gentle shadow and a blue caustic glow beside the counter. Hyper-realistic macro photograph, sharp, minimal, no other objects, no text, no watermark.',
  aspect: '1:1',
  size: '1K',
};

// Second hero arrangement: in a/b Maximus sat in the foreground and so looked the biggest of the
// three, which is the opposite of canon. Here he sits at the back, Titus (with Dux) in front left.
const HERO2 = (extra = '') => ({
  get refs() {
    return [R(BASE.maximus), R(BASE.titus), R(BASE.aghiles), R(DUX_BASE)];
  },
  prompt:
    'Cinematic key art for a historical game, one hyper-realistic photograph. Use the four reference images for the exact identity of the characters: image 1 is MAXIMUS (a small, skinny, child-sized 15-year-old, very pale, white-blond tousled hair, light blue eyes, white linen tunic with two narrow purple stripes); image 2 is TITUS (14, average build, round cheerful face, curly chestnut hair, ochre-terracotta tunic, round gold bulla amulet on a chain at his chest); image 3 is AGHILES (17, Numidian, very tall, broad and powerful, dark skin, short tightly curled black hair, plain brown sleeveless wool tunic); image 4 is DUX, Titus\'s small pet monkey (black face with a white fringe, black-and-gold brindled fur). Their faces, hair, skin, builds and clothes must match the references exactly, and the green studio backdrops of the references must not appear. ' +
    'Relative size is essential: Maximus is clearly the smallest and slightest of the three boys, Titus is a head taller and sturdier than Maximus, and Aghiles is a giant beside both, nearly twice as broad as Maximus. ' +
    'Scene: night in a frescoed Roman bedroom, A.D. 303, deep red and ochre painted walls lost in shadow. The three boys sit around a low wooden table playing latrunculi. On the table lies a thick slab of cream marble incised with a square grid of eight by eight cells, with plano-convex glass gaming counters on it, some deep blue and some milk white, glinting. One bronze oil lamp with a single small flame stands on the table beside the board and is the main light: warm amber light on their faces, deep soft shadows, a faint haze. Maximus sits in the middle, behind the table, facing the camera: small, pale, leaning in with a cool, clever half-smile as he places a blue counter with his fingertips. Titus sits on the left in three-quarter view, laughing, his gold bulla catching the light, and Dux the monkey sits on Titus\'s shoulder, leaning down and stretching one arm toward the board to steal a white counter. Aghiles sits on the right in three-quarter view, by far the biggest, towering over the other two, calm and watchful, his forearms resting on the table. ' +
    'Composition: wide 16:9 shot from just above table height, the board in the lower centre foreground in sharp focus, the boys in a triangle around it, darker empty space in the upper third for a title. Shallow depth of field, anamorphic film look, rich detail in skin, linen, wool, marble and glass. Wholesome and warm. Every hand has five fingers. Nothing modern, no text, no letters, no watermark, no border. ' + extra,
  aspect: '16:9',
  size: '2K',
});
PROMPTS.ui_hero_c = HERO2();
PROMPTS.ui_hero_d = HERO2('The camera is a little further back so that all three boys are seen from the waist up with room around them.');

// ───────────────────────── board marble (one continuous slab) ─────────────────────────
// The Poly Haven marble_01 set is a tiled wall with visible joints, wrong for a single board.
for (const v of ['a', 'b']) {
  PROMPTS[`tex_slab_${v}`] = {
    prompt:
      'A flat texture map: a perfectly top-down, orthographic, evenly lit photograph of ONE continuous slab of worn, honed Roman marble filling the entire image edge to edge. Colour: a mid-tone warm cream shading to pale grey, clearly not bright white, with fine grey-brown veining, small pits, faint scratches and soft stains from centuries of use. The tone and the density of detail are even across the whole image, with no large dark or light patches. Matte honed surface, completely flat uniform lighting: no shadows, no highlights, no vignette, no perspective. No seams, no tiles, no joints, no grid, no slab edges, no objects, no text.',
    aspect: '1:1',
    size: '2K',
  };
}

// ───────────────────────── story chapter plates ─────────────────────────
// Cutscene stills. None shows the boys' faces; Dux appears with the base sprite as reference.
const PLATE =
  'Hyper-realistic cinematic still, 16:9, shallow depth of field, rich physically accurate light, film grain, historically accurate Rome of A.D. 303, nothing modern. No faces of people are visible. No text, no letters, no numerals drawn as modern digits, no watermark, no border.';
const COUNTER = 'plano-convex glass gaming counters (round glass domes, flat underneath, about two centimetres wide)';
export const STORY = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'epilogue'];
const STORY_SCENE = {
  prologue: `A worn old wooden gaming box with bronze corner fittings stands open on a wooden table by the light of a single bronze oil lamp. Beside and partly inside it: a small square slab of cream marble incised with a square grid, a scatter of deep-blue and milk-white ${COUNTER}, and three wooden wax writing tablets tied with a leather thong. Four worn bronze Roman coins lie on the table next to the box. Dark room, warm amber lamplight, deep shadows.`,
  ch1: 'Close-up of an open Roman wax writing tablet (a wooden frame filled with dark wax) lying on a wooden table by oil-lamp light. Scratched into the wax is a diagram of a game board: a neat square grid with small circles and dots marking pieces in some of the cells, and no writing. A bronze stylus lies beside the tablet; the small flame of a clay oil lamp glows out of focus behind.',
  ch2: 'In the cool shade of a ground-floor arcade of the Colosseum at noon: on the travertine paving at the foot of a massive pier stands a street stew-vendor\'s big blackened bronze cooking pot on a small charcoal brazier, steam rising and catching a shaft of dusty sunlight, with a wooden ladle and a stack of chipped red clay bowls beside it. Beyond the arches the sunlit square is a bright haze. Nobody is in the picture.',
  ch3: `Extreme close-up, low angle, of a cream marble game board incised with a square grid, by lamplight. Several deep-blue ${COUNTER} stand on the cells dome-up, and among them, in the centre and in sharp focus, one single milk-white counter lies turned upside down, its flat underside facing up and its dome resting on the marble. Warm highlights and blue caustic glints on the stone.`,
  ch4: 'The library room of a great Roman public bath: tall wooden cupboards (armaria) line the walls, their panelled doors each marked with a small painted Roman numeral, some doors standing open on pigeonholes full of papyrus scrolls with little parchment tags hanging from their ends. A reading table with a scroll half unrolled. Shafts of pale daylight slant down from high windows through dusty air onto a marble floor. Empty of people, hushed.',
  ch5: 'A market stall in a Roman street at dusk, heaped with confiscated household goods: bronze lamps, folded cloth, a small chest, pottery, a pair of sandals, a wooden gaming box. In the foreground, in sharp focus, the small dark hand and gold-and-black brindled furry arm of a little monkey reaches in from the edge of the frame and closes its fingers on a single amber-yellow glass gaming counter (a round glass dome, flat underneath) lying among the goods. Blue dusk light, one warm torch glow. Only the monkey\'s hand and forearm are visible; no people.',
  ch6: 'Macro close-up by oil-lamp light: the slim, clean fingertips of a fourteen-year-old boy (thumb and two fingers only, the rest of the hand out of frame) hold up a single amber-yellow glass gaming counter (a round glass dome, flat underneath) with its flat underside turned toward the camera. Scratched very small and fine into the flat underside is the simplest outline of a fish: just two curved lines that meet at the nose and cross at the tail, with no eye and no other marks. The amber glass glows from the lamp flame behind it; dark background with a soft warm bokeh.',
  ch7: 'A niche cupboard set into a plastered Roman wall, its wooden door ajar. On the shelf inside, half in deep shadow, stands a cylindrical leather scroll case (a capsa) with a strap and a fitted lid, worn and scuffed, with the ends of two papyrus scrolls just visible. A narrow blade of warm lamplight falls across the case from the gap of the door; dust on the shelf. Still and secret.',
  epilogue: `Sunset in a ground-floor arcade of the Colosseum: low golden-orange light rakes between the travertine piers across the paving. On a stone step in the foreground lies a cream marble game board incised with a square grid, with blue and white ${COUNTER} on it throwing long shadows. Beside the board sits a small monkey, the same individual as in the reference image (black face with a white fringe, black-and-gold brindled fur), holding one glass counter in both hands and looking at it. Beyond the arches the sky glows. No people.`,
};
for (const id of STORY) {
  const withDux = id === 'epilogue' || id === 'ch5';
  PROMPTS[`story_${id}`] = { ...(withDux && { refs: [R(DUX_BASE)] }), prompt: `${STORY_SCENE[id]} ${PLATE}${withDux ? ' Use the reference image only for the monkey\'s appearance; its green backdrop must not appear.' : ''}`, aspect: '16:9', size: '2K' };
}
