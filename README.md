# In the Shadows of Rome: Games

Browser games set in the world of Sophie de Mullenheim's *In the Shadows of Rome* series (Rome, A.D. 303).

**Play:** https://blocher.github.io/shadowsofrome/

## Latrunculi

The Roman game of little brigands, played between Maximus, Titus and Aghiles, with Dux the monkey in attendance.

- **Free play.** Any two of the three boys; each seat is you or an AI (five strengths, a playing style per boy).
- **Five rule sets** reconstructed from the sources (Legionary, Piso, Seneca, Bell's Dux, Stanway) and house rules
  with every switch exposed. Each has a card saying what is ancient evidence and what is a modern guess.
- **Story.** *The Brigands' Board*: a mystery in nine chapters, each built around a match or a problem to solve.
- **Ludus.** Ten lessons and a set of problems; hints in three steps; a coach that warns before a blunder.
- **Review.** After a game: an advantage graph, every move graded, the turning points in words, and "play on from here".
- **Players and saved games.** A name picker (no passwords) lets several people share a device, each with their own
  story progress, lessons and record. Games are saved move by move and can be taken up again or looked over later.
- **Sound.** A quiet generated soundtrack, voices and table talk, each with its own switch. Built for phones as well
  as desktops.

See [PLAN.md](PLAN.md) for the design, [docs/latrunculi-research.md](docs/latrunculi-research.md) for the history
and rules research, [docs/story-script.md](docs/story-script.md) for the full script, and [docs/art.md](docs/art.md)
for how the pictures were made.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173/  (the game is at /latrunculi/)
npm test           # rules engine, AI, lessons and problems
npm run build      # static site in dist/
```

Pushing to `main` builds and publishes the site with GitHub Pages (`.github/workflows/pages.yml`).

### Voices

Spoken lines live in `src/latrunculi/story/` (`script.js`, `banter.js`, `tutorial-lines.js`); the casting is in
`cast.js`. With `ELEVENLABS_API_KEY` in the environment or in a git-ignored `.env` file:

```bash
npm run voices:audition   # candidate voices reading sample lines -> /latrunculi/voices.html
npm run voices            # record every line that is new or changed -> public/voice/
```

All 679 lines are recorded. A line is recorded again only when its text or its speaker's voice changes; with ffmpeg
installed each new recording is brought to the same loudness as the rest. Lines without a recording still appear as
subtitles.

### Layout

```
index.html                 hub page for all the games
latrunculi/                the first game (index.html, voices.html)
src/shared/                the cast, voice player, sound effects (shared by later games)
src/latrunculi/engine/     rules, presets
src/latrunculi/ai/         search, evaluation, levels and personalities, review, worker
src/latrunculi/scene/      3D stage, board and glass counters, the animated characters
src/latrunculi/game/       a game session, table talk, lessons, story mode
src/latrunculi/ui/         menus, HUD, review panel, styles
src/latrunculi/story/      script, banter, tutorial lines, voice casting
scripts/                   voices.mjs, art/ (picture pipeline), dev/ (screenshot tools)
public/art, public/voice   pictures and recordings
```

## Unofficial fan project

This is an unofficial fan project. It is not affiliated with or endorsed by the author, Mame, Magnificat or Ignatius
Press. The characters and the series belong to their owners. No text from the books is reproduced here; all dialogue
in the games is original.

## Credits

- Character, scene and story pictures were generated with Google's Nano Banana 2.1 image model from the descriptions
  in the books, then cut out and assembled with the scripts in `scripts/art/`.
- Voices are synthesised with ElevenLabs.
- Wood material and reflection environment: [Poly Haven](https://polyhaven.com) (CC0).
- 3D rendering: [three.js](https://threejs.org) (MIT). Fonts: Cinzel and EB Garamond (SIL Open Font License).
- Rules reconstructions are credited on each rule card in the game.
