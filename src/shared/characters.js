// The cast, as the books describe them. Shared by every game in this repo.
export const CHARACTERS = {
  maximus: {
    id: 'maximus', name: 'Maximus', epithet: 'Son of Senator Julius Claudius',
    blurb: 'Fifteen, small, pale and white-blond. Sharp as a pin, afraid of almost nothing, always hungry.',
    style: 'Hunts for forks and will give up a piece to gain a move.',
    glass: 'white', scale: 0.92,
  },
  titus: {
    id: 'titus', name: 'Titus', epithet: 'Son of Flavius Octavius, dealer in wild beasts',
    blurb: 'Fourteen, round-faced, curly chestnut hair, a gold amulet he never takes off. Reads omens in everything.',
    style: 'Keeps his soldiers in pairs. Plays worse after bad omens.',
    glass: 'amber', scale: 1.0,
  },
  aghiles: {
    id: 'aghiles', name: 'Aghiles', epithet: 'Of Numidia',
    blurb: 'Sixteen or seventeen, almost a giant, with a hunter’s patience. Says little. Misses nothing.',
    style: 'Builds a wall, waits for a mistake, and is deadly when few pieces remain.',
    glass: 'blue', scale: 1.12,
  },
};
export const CHARACTER_ORDER = ['maximus', 'titus', 'aghiles'];
export const FRAMES = ['neutral', 'talk', 'blink', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking', 'look'];
export const DUX_POSES = ['sit', 'eat', 'point', 'steal', 'cheer', 'scared', 'chatter', 'sleep'];

// Glass colours found in Roman sets (the Perugia tomb had blue, yellow and white).
export const GLASS = {
  white: { name: 'milk-white', color: 0xf6f1e6, attenuation: 0xefe6d6, transmission: 0.28, roughness: 0.14, depth: 1.2, css: '#efe8da' },
  blue: { name: 'cobalt', color: 0x1f47d6, attenuation: 0x061f8f, transmission: 0.72, roughness: 0.04, depth: 0.16, css: '#2248d8' },
  amber: { name: 'amber', color: 0xf5a01f, attenuation: 0xb85a00, transmission: 0.78, roughness: 0.04, depth: 0.3, css: '#f0a020' },
};

export const SETTINGS = {
  cubiculum: { id: 'cubiculum', name: 'Maximus’ room, by lamplight', exposure: 0.95, key: 0xffc78a, keyPower: 300, fill: 0xff9a4a, env: 0.3, tint: [1.0, 0.92, 0.82], flicker: 1 },
  colosseum: { id: 'colosseum', name: 'In the shade of the Colosseum', exposure: 1.0, key: 0xfff1d6, keyPower: 330, fill: 0xbfd4ff, env: 0.55, tint: [1.0, 0.98, 0.95], flicker: 0 },
  atrium: { id: 'atrium', name: 'Titus’ atrium, at dusk', exposure: 0.95, key: 0xffd9a8, keyPower: 290, fill: 0x8fb0ff, env: 0.36, tint: [0.97, 0.95, 0.95], flicker: 0.5 },
};
export const SETTING_ORDER = ['cubiculum', 'colosseum', 'atrium'];
