# In the Shadows of Rome: Games — Plan

Status: **awaiting approval**. Nothing has been built yet.

This repo will hold several browser games set in the world of Sophie de Mullenheim's *In the Shadows of Rome* series
(Rome, A.D. 303). The first is **Latrunculi**, the Roman strategy game the boys themselves play in the books.

## 1. What the research found

### The books

| | Maximus | Titus | Aghiles | Dux |
|---|---|---|---|---|
| Who | Son of Senator Julius Claudius, 15 | Son of Flavius Octavius, the wild-animal dealer, 14 | Numidian Berber, 16 or 17; Maximus' slave and best friend | Titus' pet monkey; the name means "general" |
| Looks (from book 1, pp. 14–16, and later books) | Small and skinny, very pale, very light blue eyes, hair so blond it is almost white; a child's body with a young man's face; hobnailed sandals | Average height and weight, round cheerful face, curly chestnut hair; round gold amulet (bulla) at his neck; purple-bordered toga praetexta, tunic, leather belt with a big pouch | Almost a giant, a head taller than a Roman crowd; dark skin, tightly curled dark hair, ebony eyes | Small; black face fringed with white fur, body brindled black and gold, big eyes, sharp fangs |
| Character | Fearless, very clever, a little uppity, fast, always hungry, thinks seers are crooks | Smooth talker, superstitious, faint-hearted but full of bravado, short fuse, swears by Jupiter, blames omens | Loyal, unflappable, laconic, immensely strong, a hunter's senses; calls Maximus by name | Disobedient, thieving, gluttonous; rides on Titus' shoulder, neck or head |

- The book spells the name **Aghiles** (one L). The game will use that spelling.
- **Latrunculi is canon.** In book 4 Titus and Aghiles play it at a table in Maximus' bedroom; Aghiles, who has only
  recently learned, wins for the first time and declares himself *imperator*, and Dux jumps on his head as a crown.
  Titus blames bad omens. In book 5 Maximus gives Titus a set carved in marble.
- No official art of the characters exists (the covers show only walls and shadows), so the portraits will be drawn
  from the text descriptions above.
- Clothing colours for Maximus and Aghiles, and Titus' eye colour, are never stated. I will choose historically
  plausible ones and list them for you to correct.
- A full read of book one (your Kindle copy) is in progress; it feeds the story script, not this plan's structure.

### The game

What the ancient sources securely attest: a gridded board with play on the squares; two colours of glass pieces;
capture of a single piece between two enemies on a line; backward moves; a "bound" piece (*alligatus*) that can still
be rescued; captured pieces taken off; the result reckoned by piece count; a winner called *imperator*; no dice.

What nobody knows: board size, number of pieces, how far a piece moves, the starting position, whether any special
piece existed. Every playable ruleset is a modern reconstruction. Surviving boards range from 6×7 to 14×14, with 8×8
the most common. The *dux* piece is a modern idea with no ancient support.

## 2. Rule presets

All six are built on one configurable rules engine.

| Preset | Board | Pieces | Start | Movement | Capture | Game ends | Source |
|---|---|---|---|---|---|---|---|
| **Legionary** (beginner default) | 8×8 | 16 each | Two rows each | Slides like a rook | Immediate | Capture all, or most pieces when no capture is possible | Roman Army Museum (Vindolanda Trust), Museum Quintana |
| **Piso** | 8×8 | 20 each | Players place pieces in turn | One step | Immediate; several at once | A side is down to one piece or cannot move; most captures wins | Locus Ludi (Schädler and Dasen) |
| **Seneca** (most historically defensible) | 8×8 | 20 each | Placement | One step, plus hops over pieces | Trapped piece is flipped and bound, removed next turn; freed if a captor is trapped first | As Piso | Ulrich Schädler 2001, Locus Ludi |
| **Bell's Dux** | 8×7 | 16 + dux | Placement, two per turn | One step; the dux may jump an enemy | Immediate; a capture earns another move | Lose all pieces; 30 moves without capture, larger army wins | R. C. Bell 1960 |
| **Stanway** | 12×8 | 12 + dux | Back row, dux in front | Slides like a rook | Immediate; dux cannot be captured | Immobilise the enemy dux | W. J. Kowalski |
| **House rules** | 7×7 to 12×12 | 12–30 | Either | Either | Either | Any combination | You choose |

House-rules switches: board size, pieces per side, fixed start or placement, who moves first, one step or rook slide,
hopping, immediate or delayed capture, corner capture, capturing several at once, whether moving between two enemies is
safe, extra move after a capture, dux type, end conditions, no-capture move limit, repetition rule.

Every preset has an in-game card stating what is ancient evidence and what is the reconstructor's guess. Rook-move
variants can be drawn with careful play, so each has a move limit with a piece-count result.

## 3. Play modes

- **Free play.** Pick any two of Maximus, Titus and Aghiles. Each seat is a human or an AI, so human v human (same
  device), human v AI and AI v AI all work. Pick a preset, a setting and who moves first.
- **AI v AI** can be watched at adjustable speed, paused and stepped, with the same banter as any other game.
- **Story mode** (section 6).
- **Ludus** (section 5): tutorial, drills and puzzles.

### AI

A search engine running in a Web Worker so the board never freezes: alpha-beta with iterative deepening, a
transposition table, move ordering and capture extensions. The placement phase uses pattern heuristics plus a shallow
search.

Two independent dials per AI seat:

| Level | Behaviour |
|---|---|
| Tiro (recruit) | Sees one move ahead, often misses threats |
| Miles (soldier) | Takes what is offered, falls for forks |
| Centurio | Solid club player; plans two or three moves ahead |
| Legatus | Strong; rarely blunders |
| Imperator | Full search within a time budget |

| Personality | Style |
|---|---|
| Maximus | Sharp tactician: hunts forks, sacrifices for tempo, overreaches at low levels |
| Titus | Experienced and cautious: keeps pieces paired, plays worse for a few moves after a loss ("bad omens") at low levels |
| Aghiles | Patient hunter: solid phalanx, waits for a mistake, strongest in the endgame |

## 4. Graphics

A real-time 3D scene (Three.js, physically based rendering):

- A marble board with an incised grid, modelled on boards scratched into the steps of the Basilica Julia.
- Plano-convex glass counters with true refraction, in the colours found in Roman sets: milk white, deep blue, amber.
  Each boy has his own colour.
- Bound pieces flip upside down, as in Schädler's reconstruction. Captured pieces are carried to the captor's tray.
- Three settings: the Colosseum arcade at noon (where the boys eat lunch in book 1), Maximus' bedroom by lamplight
  (where they play in book 4), and Titus' atrium with its fountain and wild-animal mosaic.
- Flickering oil-lamp light, soft shadows, depth of field, bloom, filmic tone mapping.
- **The characters** appear as painted portraits beside the board and in dialogue, in the style of Roman panel
  portraits, each with a set of expressions (thinking, pleased, rattled, triumphant, sulking).
- **Dux** is animated in the scene: he rides on Titus' shoulder, scampers along the table, steals walnuts and captured
  pieces, crowns the winner, and points at the board when you ask for a hint.

Limit to state plainly: I have no image-generation tool in this session, so portraits would be hand-built vector and
shader artwork. That can look polished and stylised, not like a commissioned painting. I will deliver one finished
portrait per character as a style test before drawing the full expression sets. If you can supply an image-generation
API key, painted portraits become possible (decision 1 below).

Textures and sky lighting would come from Poly Haven (CC0 licence), downloaded into the repo.

## 5. Teaching, hints and analysis

- **Tutorial.** Framed as Maximus and Titus teaching Aghiles, which is how the books have it. Interactive lessons:
  moving, the custodian capture, corners, moving safely between two enemies, the fork, the phalanx, bound pieces, the
  dux, placement. Each lesson ends with a short drill.
- **Puzzles.** "Capture in two", "save the bound piece", "trap the dux", graded by difficulty.
- **Hints during play,** in three steps: a spoken nudge, then the piece to look at, then the move. Optional overlays
  show which pieces are in danger and which squares are safe.
- **Coach mode** warns before a blunder and offers a take-back.
- **Post-game analysis.** Every position is re-searched after the game:
  - an advantage graph across the whole game;
  - each move tagged best, good, inaccuracy, mistake or blunder, with the better move shown;
  - the three turning points, explained in words;
  - accuracy score per player;
  - step through the replay, and "play on from here" against the AI from any position;
  - export of the move list.

## 6. Story and voices

Working title: ***The Brigands' Board***. *Latrunculi* means "little brigands", and the series is a set of mysteries.
The story is original, sits in the gaps of the books, and puts nothing in the boys' mouths that contradicts them. The
outline below is a proposal; the full script comes to you for review before any voice is recorded.

- **Premise.** At an auction of goods seized from a condemned household, Maximus buys an old gaming box: a board, blue
  and white glass pieces, and wax tablets of game problems. One piece is missing. The problems, once solved, leave
  the pieces in patterns that spell out a trail. Someone else wants the box.
- **Why it suits the game.** Each chapter is a match between two of the boys or a set problem from the tablets. Notes
  in the box say whose rules to play by, which is how the presets enter the story one at a time.
- **Dux** has the missing piece, and it is the *dux*.
- **Background, as in the books.** Diocletian's edict of 303 ordered Christian books burned. What the trail leads to,
  and what three pagan boys decide to do about it, is the ending. Nobody converts; the books leave that open.
- **Shape.** A prologue (the tutorial), about seven short chapters, and an epilogue: a round-robin for the title of
  *imperator*, with Dux crowning the winner.
- **You choose a side each chapter,** or watch the AI play both.
- The friendship between Maximus and Aghiles is written the way the books write it: as friends and equals over the
  board, with no jokes at the expense of Aghiles' status.

**Banter.** Each boy has lines for about 25 game events (capture, loss, fork, blunder, long think, hint, win, defeat,
Dux stealing a piece), in several variants, plus lines aimed at each specific opponent. All dialogue is original.

**Voices (ElevenLabs).** Following the escape room's method: lines live in a data file, a script records them to MP3
and skips unchanged lines, and the game plays them with subtitles.

- The key is **not** stored in the escape room repo; its script reads `ELEVENLABS_API_KEY` from the environment, and
  that variable is not set in this shell. You will need to supply it. It is never committed.
- Estimate: 700–800 lines, 50,000–70,000 characters in total.
- Casting: I will record one test line in two or three candidate voices per character and narrator, on an audition
  page for you to choose by ear.

## 7. Technology and repository

- Vite, plain JavaScript modules and Three.js, matching the escape room. Tests with Vitest.
- Static site: no server, no keys in the browser.
- Layout:

```
index.html                 hub page for all the games
latrunculi/                the first game
src/shared/                characters, portraits, dialogue, voice player (reused by later games)
src/latrunculi/engine/     rules, presets, notation
src/latrunculi/ai/         search, evaluation, personalities, worker
src/latrunculi/scene/      3D board, pieces, settings, Dux
src/latrunculi/ui/         menus, setup, hints, analysis
src/latrunculi/story/      chapters, script, banter
scripts/voices.mjs         ElevenLabs recording
public/voice/              recorded lines
docs/                      rules sources, character sheets
```

- Saved games, story progress and settings are kept in the browser's local storage.
- Works with mouse, touch and keyboard; subtitles on every line; piece markers that do not rely on colour; a
  reduced-motion setting.

**Public repository.** `github.com/blocher/shadowsofrome`, public as you asked, with a commit and push at each
milestone and at meaningful steps within them.

- The README will state that this is an unofficial fan project, not affiliated with the author or publishers.
- No text from the books goes into the repo. Detailed notes from the Kindle read stay in a git-ignored local folder;
  only short character sheets in my own words are committed.
- The characters and series name belong to the author and publishers. A public repo and a public site using them is
  your decision to make; say so if you would rather keep either private.

## 8. Milestones

Each ends with a commit, a push, and something you can open and try.

1. **Rules engine.** All presets and switches, with tests built from the published rules.
2. **AI.** Search, five levels, three personalities; self-play tests showing each level beats the one below.
3. **Board.** 3D scene, pieces, move input, a full game playable human v human.
4. **Characters.** Portrait style test for your sign-off, then expression sets, Dux, character and seat selection.
5. **Teaching.** Tutorial, puzzles, hints, coach mode, post-game analysis.
6. **Story.** Full script for your review, voice auditions, recording, story mode and banter.
7. **Polish.** Sound, the two further settings, touch and small screens, performance, accessibility.

Not included: online play between two devices, accounts, and any server.

## 9. Decisions for you

| # | Decision | My default if you just approve |
|---|---|---|
| 1 | Character portraits: hand-built artwork, or painted portraits from an image-generation API key you supply | Hand-built, with a style test for sign-off |
| 2 | ElevenLabs key | You set `ELEVENLABS_API_KEY` before milestone 6; everything else is built and tested with subtitles only |
| 3 | Publish a playable site on GitHub Pages from the repo | Not published until you say so |
| 4 | Name spelling | "Aghiles", as the book has it |
| 5 | Download CC0 textures and lighting from Poly Haven | Yes |
