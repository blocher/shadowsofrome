// In-game banter for Latrunculi. All wording is original.
//
// BANTER[event][speaker]            -> [{ id, text, mood }]   said by `speaker` when `event` happens to them
// BANTER_VS[event]['speaker>opponent'] -> [{ id, text, mood }] the same, aimed at one particular opponent
//
// Rules for anyone editing:
//   - at most 90 characters per line, written for the ear, numbers spelled out;
//   - only bind, freed, duxPieceThreat, extraMove and placement may assume a rule preset;
//   - no line may assume a setting, a story chapter, or that the third boy is in the room;
//   - Aghiles is brief and never swears by a god; nothing is ever said at the expense of his status;
//   - ids are built from event, speaker and position: append new variants at the end, never reorder.
//
// duxPieceThreat lines are worded so they fit whichever general is in danger.

const SHORT = { maximus: 'max', titus: 'tit', aghiles: 'agh' };
const MOODS = ['neutral', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking'];

function build(prefix, event, mood, variants) {
  return variants.map((v, i) => {
    const [text, m] = Array.isArray(v) ? v : [v, mood];
    if (!MOODS.includes(m)) throw new Error(`unknown mood ${m} in ${event}`);
    return { id: `${prefix}_${event.toLowerCase()}_${i + 1}`, text, mood: m };
  });
}

function event(name, mood, bySpeaker) {
  const out = {};
  for (const [speaker, variants] of Object.entries(bySpeaker)) {
    out[speaker] = build(`bn_${SHORT[speaker]}`, name, mood, variants);
  }
  return out;
}

function versus(name, mood, byPair) {
  const out = {};
  for (const [pair, variants] of Object.entries(byPair)) {
    const [speaker, opponent] = pair.split('>');
    out[pair] = build(`vs_${SHORT[speaker]}_${SHORT[opponent]}`, name, mood, variants);
  }
  return out;
}

export const BANTER = {
  gameStart: event('gameStart', 'neutral', {
    maximus: [
      'Let us begin. Try to make it last, I have not eaten yet.',
      'Sharp eyes and a clear head. That is all this game asks.',
      'I shall be gentle. No, I shall not. Your move.',
      'Whoever thinks furthest ahead wins. I have a head start.',
    ],
    titus: [
      ['Right foot first this morning. You are already beaten.', 'pleased'],
      'Wait. Let me touch my amulet. There. Now we begin.',
      ['I have played this game for years. Years! Prepare yourself.', 'pleased'],
      ['No sneezes today, no crows on my left. The gods are with me.', 'pleased'],
    ],
    aghiles: [
      'Ready.',
      'Let us begin.',
      'A hunter waits. Then he does not.',
      'Good luck. You will want it.',
    ],
  }),

  capture: event('capture', 'pleased', {
    maximus: [
      'Between two of mine. Off he goes.',
      'One prisoner. Thank you, I was collecting those.',
      'You left him alone. I did warn you. In my head.',
      'Caught by a twin foe, as the poet says.',
    ],
    titus: [
      'Ha! Caught! Off the board with you, little brigand.',
      'By Pollux, got him! Did everyone see that?',
      "One for me! Feed him to my father's crocodiles.",
      'Trapped between two! I planned that. Mostly.',
    ],
    aghiles: [
      'Taken.',
      'He was alone.',
      'One less.',
      'I saw the gap.',
    ],
  }),

  captureMulti: event('captureMulti', 'triumphant', {
    maximus: [
      'Two at one stroke! By Jupiter, that was pretty.',
      'Both my hands are rattling with prisoners.',
    ],
    titus: [
      'Two! Two at once! Somebody fetch a poet!',
      'By all the gods, a whole handful! I am magnificent.',
    ],
    aghiles: [
      'Two. With one move.',
      'Both of them. Good.',
    ],
  }),

  captured: event('captured', 'rattled', {
    maximus: [
      'Hm. I saw that. Slightly after you did.',
      ['Take him. He was the slow one anyway.', 'neutral'],
      ['A small loss. I refuse to call it a mistake.', 'sulking'],
      'By Jupiter. That one I needed.',
    ],
    titus: [
      'No! Not him! He was my favourite!',
      ['That was the omens. I felt a sneeze coming all morning.', 'sulking'],
      'You viper! He had a family!',
      ['I meant to lose that one. It is called strategy.', 'sulking'],
    ],
    aghiles: [
      ['Hm.', 'thinking'],
      ['My mistake. Not again.', 'thinking'],
      ['You saw it first.', 'neutral'],
      ['Fair. He was mine to guard.', 'neutral'],
    ],
  }),

  fork: event('fork', 'pleased', {
    maximus: [
      'Two threats, one move. You may save one. Choose.',
      'He looks trapped, and he traps two. Which will you keep?',
      'Left or right? Take your time. Neither is the answer.',
      'I do enjoy a move that asks two questions.',
    ],
    titus: [
      'Two of yours in danger at once! Choose, if you dare.',
      'Aha! Which one will you save? You cannot save both.',
      'A double threat! My father would weep with pride.',
      'Left one or right one? Either way I take one!',
    ],
    aghiles: [
      'Two tracks. You can follow only one.',
      'Save one. I take the other.',
      'Choose.',
      'Both are in reach. Decide.',
    ],
  }),

  oppBlunder: event('oppBlunder', 'pleased', {
    maximus: [
      'Are you certain? No, do not answer. Thank you.',
      'That was generous. I accept.',
      'I would say you planned that, but I have met you.',
      'A gift. And it is not even my birthday.',
    ],
    titus: [
      'Oh, thank you! The gods have clouded your eyes.',
      'You did not mean that. You did? Wonderful.',
      'Ha! Even Dux saw that mistake.',
      'A gift from Jupiter himself. I accept.',
    ],
    aghiles: [
      'You left the door open.',
      'Thank you.',
      ['Careless.', 'neutral'],
      'Are you sure? Too late.',
    ],
  }),

  myBlunder: event('myBlunder', 'rattled', {
    maximus: [
      'No. Wait. Oh, by Jupiter.',
      'That was hunger, not judgement. Somebody bring bread.',
      'Pretend you did not see that. No? Pity.',
      ['A deliberate sacrifice. I shall work out why later.', 'sulking'],
    ],
    titus: [
      'No, no, no. I spat three times and still it happened.',
      'That was not me. A spirit pushed my hand.',
      ['I knew it. I should never have got up left foot first.', 'sulking'],
      'Forget you saw that. By Pollux, what was I thinking?',
    ],
    aghiles: [
      ['Wrong.', 'thinking'],
      ['I moved too fast.', 'thinking'],
      ['That was foolish. Mine.', 'thinking'],
      ['A bad step.', 'thinking'],
    ],
  }),

  bind: event('bind', 'pleased', {
    maximus: [
      'Bound. On his back he goes. One turn to save him.',
      'Alligatus, as Seneca calls him. Tied and waiting.',
    ],
    titus: [
      'Bound! On his back like a beetle. Alligatus!',
      'Tied up tight. One more turn and he is mine.',
    ],
    aghiles: [
      'Bound. He waits.',
      'On his back. One turn.',
    ],
  }),

  freed: event('freed', 'pleased', {
    maximus: [
      'And he is on his feet again. Never count a bound man lost.',
      'Rescued. That is two of your moves wasted, I believe.',
    ],
    titus: [
      'Free! He is up! The amulet works, I told you.',
      'Rescued! Nobody leaves a man of mine lying down.',
    ],
    aghiles: [
      'He is up again.',
      'I do not leave a man down.',
    ],
  }),

  duxPieceThreat: event('duxPieceThreat', 'thinking', {
    maximus: [
      'The general is running out of room. One more side.',
      'Three sides closed. A general should always keep a door open.',
    ],
    titus: [
      ['The general is nearly shut in! Nobody breathe.', 'rattled'],
      ['One door left for the general. Oh, I cannot look.', 'rattled'],
    ],
    aghiles: [
      'The general has one way out.',
      'Almost shut in.',
    ],
  }),

  extraMove: event('extraMove', 'pleased', {
    maximus: [
      'A capture, and I move again. Do sit down.',
      'Another move for me. This rule and I are friends.',
    ],
    titus: [
      'I took one, so I go again. I love this rule.',
      'Again? Me again! Jupiter is generous today.',
    ],
    aghiles: [
      'I move again.',
      'Once more.',
    ],
  }),

  longThink: event('longThink', 'neutral', {
    maximus: [
      'Take your time. Rome was not built in a day. Nearly, though.',
      'I could walk to the baths and back before you move.',
      'The pieces will not move themselves. I have checked.',
      'Shall I send for supper while we wait? I am serious.',
    ],
    titus: [
      'Take your time. I shall just grow a beard here.',
      'Are you asleep? Dux, poke him. No, do not poke him.',
      'My father has sold a rhinoceros faster than this.',
      'Any day now. The crocodiles are getting hungry.',
    ],
    aghiles: [
      'Take your time.',
      'I can wait. I am good at waiting.',
      'The board will not change.',
      'Still thinking?',
    ],
  }),

  ahead: event('ahead', 'pleased', {
    maximus: [
      'I am ahead on prisoners. Not that I am counting. I am counting.',
      'My phalanx is nearly whole. Yours has seen better days.',
      'This is going rather well. Do not tell me I said so.',
      'More men, better squares. I like my side of the board.',
    ],
    titus: [
      'I am winning! Say it. Say Titus is winning.',
      'Look at my army. Now look at yours. Ha!',
      'The omens said today was my day. The omens never lie.',
      'More men than you! I may even enjoy this.',
    ],
    aghiles: [
      'I have more men.',
      'It goes well.',
      'My line holds.',
      'You are running out of men.',
    ],
  }),

  behind: event('behind', 'thinking', {
    maximus: [
      'I am behind. Outnumbered only means think harder.',
      'Fewer men, same brain. This is not over.',
      'Enjoy your lead. I intend to borrow it.',
      'A bad start. I have talked my way out of worse.',
    ],
    titus: [
      ['This is bad luck. A crow looked at me at breakfast.', 'sulking'],
      ['I am not losing. I am luring you in.', 'rattled'],
      ['Fewer men, yes. But braver ones.', 'sulking'],
      ['Wait. I must spit three times. There. Now watch.', 'rattled'],
    ],
    aghiles: [
      'Fewer men. Enough.',
      'I have been outnumbered before.',
      'Not finished.',
      'Then I must be careful.',
    ],
  }),

  endgame: event('endgame', 'thinking', {
    maximus: [
      'Few men left. Now every move matters.',
      'Count the pieces, as Julius Canus did. It will be close.',
    ],
    titus: [
      ['So few left. My heart cannot stand it.', 'rattled'],
      ['Every man counts now. Guard them like gold.', 'rattled'],
    ],
    aghiles: [
      'Few left. Now we hunt.',
      'The end is where I am best.',
    ],
  }),

  win: event('win', 'triumphant', {
    maximus: [
      'And that is that. Brains over everything.',
      'Victory. I shall try to be unbearable for only an hour.',
      'A good game. I enjoyed the end of it most.',
      'Won. Now, has anyone seen anything to eat?',
    ],
    titus: [
      'Victory! Salute me! Lower. Lower. Perfect.',
      'I won! The right foot never fails!',
      'By Pollux, what a game. Mostly my half of it.',
      'Winner! I shall tell my father. And the crocodiles.',
    ],
    aghiles: [
      ['Won.', 'pleased'],
      ['A good game. Thank you.', 'pleased'],
      ['Patience wins.', 'pleased'],
      ['That is the end.', 'pleased'],
    ],
  }),

  lose: event('lose', 'sulking', {
    maximus: [
      'Beaten. Fairly. I dislike how fairly.',
      'Well played. I shall go over every move tonight.',
      'I lost? Let me count again. No. I lost.',
      'You earned it. Do not make that face. Again tomorrow.',
    ],
    titus: [
      'It was the omens. I sneezed on waking. I said so.',
      'Somebody moved my amulet. This does not count.',
      'Beaten. I shall sulk for exactly one hour.',
      'Fine. You won. Tomorrow I rise right foot first.',
    ],
    aghiles: [
      ['You won. Well played.', 'neutral'],
      ['I learn more from losing.', 'thinking'],
      ['Again?', 'neutral'],
      ['Beaten. Not next time.', 'neutral'],
    ],
  }),

  draw: event('draw', 'neutral', {
    maximus: [
      'Level. Neither of us was foolish enough to lose.',
      'A draw. The dullest of all possible victories.',
    ],
    titus: [
      'A draw! The gods could not decide. Understandable.',
      'Nobody lost. I call that half a triumph.',
    ],
    aghiles: [
      'Even.',
      'Nobody falls. Good enough.',
    ],
  }),

  imperator: event('imperator', 'triumphant', {
    maximus: [
      'Imperator! By Jupiter, it suits me.',
      'Hail me. Briefly will do. Imperator Maximus.',
    ],
    titus: [
      'Imperator Titus! Hail me! Dux, my crown!',
      'Imperator! It sounds so right. Say it again.',
    ],
    aghiles: [
      'Imperator.',
      'Imperator. I like the word.',
    ],
  }),

  duxSteals: event('duxSteals', 'rattled', {
    maximus: [
      'Titus, your monkey has my prisoner. Again.',
      'I will not be robbed by an animal in the middle of a game!',
      ['That monkey takes more pieces than either of us.', 'sulking'],
      'Put it back, you thief. Titus, he is ignoring me.',
    ],
    titus: [
      'Dux! Drop that! It is a prisoner, not a nut!',
      ['He is not stealing. He is guarding it. In his cheek.', 'neutral'],
      'Bad general! Give it back. Here, have a seed.',
      ['He only takes shiny things. It is a compliment, really.', 'pleased'],
    ],
    aghiles: [
      ['The monkey has it. He is quick.', 'pleased'],
      ['Let him keep it. He earned it.', 'pleased'],
      ['Dux hunts too.', 'pleased'],
      ['He stole it clean. I did not hear him.', 'pleased'],
    ],
  }),

  duxHelps: event('duxHelps', 'thinking', {
    maximus: [
      'Now the monkey gives advice. Worse, he may be right.',
      'Dux is pointing. I refuse to thank him. Look there, though.',
    ],
    titus: [
      ['The general points! Look where his paw is. Obey him.', 'pleased'],
      ['Dux says there. He is rarely wrong. Well, sometimes.', 'pleased'],
    ],
    aghiles: [
      'The monkey points. Look.',
      'Dux sees something. So do I.',
    ],
  }),

  hint1: event('hint1', 'thinking', {
    maximus: [
      'Look for a man standing alone. Lonely men get taken.',
      'Before you move, ask what your opponent wants next.',
      'Somewhere, one move makes two threats. Find it.',
      'Check your own men first. One of them is in danger.',
    ],
    titus: [
      'One of your men is all alone out there. I would worry.',
      'Look for two of theirs with a gap between. I say no more.',
      'Something of yours is about to be eaten. Find it quickly.',
      'Keep your men side by side, like sausages. Safer that way.',
    ],
    aghiles: [
      'Look at your edges.',
      'One of yours stands alone.',
      'Two of theirs. A gap between. Think.',
      'Do not hurry. Look again.',
    ],
  }),

  undo: event('undo', 'neutral', {
    maximus: [
      'Take it back, by all means. I shall remember it anyway.',
      'A second try? Very well. Think this time.',
    ],
    titus: [
      'Taking it back? Is that even lucky? Very well.',
      'Go on, then. I never saw the first one.',
    ],
    aghiles: [
      'Take it back. I do not mind.',
      'Try again.',
    ],
  }),

  placement: event('placement', 'thinking', {
    maximus: [
      'Place them in pairs. A man with a neighbour is hard to take.',
      'Every man I set down well now saves me a move later.',
    ],
    titus: [
      'This square feels lucky. Yes. Right here.',
      'Never place your first man on the left. Everyone knows that.',
    ],
    aghiles: [
      'Side by side. Like a line of spears.',
      'I place him near his friends.',
    ],
  }),

  idle: event('idle', 'neutral', {
    maximus: [
      'Is anyone else hungry? I could eat the stew pot.',
      'The seer in the Forum promised rain. It is dry. I rest my case.',
      'After this, the baths. Then the library. Then food.',
      "My father's dinners last four hours. This game is a holiday.",
      'Seers are never exact. You cannot prove a vague man wrong.',
    ],
    titus: [
      'My father has a new buffalo. It hates everyone. I like it.',
      'I sneezed at dawn. I nearly stayed in bed all day.',
      'A seer told me to beware of water. I have not bathed since.',
      'Dux, stop pulling my hair. I am commanding an army.',
      'I know every tunnel under the arena. Every single one.',
    ],
    aghiles: [
      'In Numidia we hunted at dawn. It was quiet, like this.',
      'Maximus is hungry. He is always hungry.',
      'I do not trust omens. I trust tracks.',
      'The baths are too loud. I like this better.',
      'A good board. A good day.',
    ],
  }),
};

export const BANTER_VS = {
  gameStart: versus('gameStart', 'neutral', {
    'maximus>titus': [
      'Titus. Did you get up on the correct foot? I want no excuses.',
      'No omens today, Titus. Just you, me and arithmetic.',
      'Touch the amulet all you like. It cannot move pieces.',
    ],
    'maximus>aghiles': [
      'I taught you this game, Aghiles. Remember that kindly.',
      'No mercy, Aghiles. I know you will show me none.',
      'You are too patient, Aghiles. I intend to hurry you.',
    ],
    'titus>maximus': [
      'Today I beat you, Maximus. A seer told me. A good one.',
      'Be clever all you like. I have experience. And an amulet.',
      'No long words during the game, Maximus. They put me off.',
    ],
    'titus>aghiles': [
      'I taught you everything, Aghiles. Well, some. A little.',
      'You have beaten me before. The omens were against me.',
      'Stop looking so calm, Aghiles. It is bad luck. For me.',
    ],
    'aghiles>maximus': [
      'You talk, Maximus. I will play.',
      'You taught me well. You may regret it.',
      'Ready, Maximus. Do not hurry.',
    ],
    'aghiles>titus': [
      'Did you sneeze today, Titus? No? Then no excuses.',
      'Right foot first, Titus?',
      'Play, Titus. Leave the omens outside.',
    ],
  }),

  win: versus('win', 'triumphant', {
    'maximus>titus': [
      'It was not the omens, Titus. It was me.',
      'Blame the crows if you must. I shall blame my talent.',
      'Cheer up, Titus. You talked a very good game.',
    ],
    'maximus>aghiles': [
      'You made me work for that, Aghiles. You always do.',
      'I won, Aghiles. Stop looking so calm about it.',
      'Close. Too close. You are getting dangerous.',
    ],
    'titus>maximus': [
      'Ha! Brains, was it? Where are your brains now, Maximus?',
      'I beat Maximus! Somebody carve it on a wall!',
      'Do not sulk, Maximus. Oh, go on, sulk. I am enjoying it.',
    ],
    'titus>aghiles': [
      'Ha! The pupil has not passed the master yet!',
      'Imperator Titus! You may salute me now, Aghiles.',
      'Beaten, Aghiles! Experience always tells.',
    ],
    'aghiles>maximus': [
      ['You were hungry, Maximus. You moved too fast.', 'pleased'],
      ['A good game, Maximus. Thank you for teaching me.', 'pleased'],
      ['I waited. You came to me.', 'pleased'],
    ],
    'aghiles>titus': [
      ['It was not the omens, Titus.', 'pleased'],
      ['Good game, Titus. Blame the crow if it helps.', 'pleased'],
      ['You talked. I played.', 'pleased'],
    ],
  }),

  lose: versus('lose', 'sulking', {
    'maximus>titus': [
      'Beaten by Titus. I shall never hear the end of it.',
      'Well played, Titus. Please do not tell the whole Forum.',
      'The amulet wins. I may have to rethink the universe.',
    ],
    'maximus>aghiles': [
      'Well played, Aghiles. I should never have taught you.',
      'Beaten by my own pupil. I am proud. And furious.',
      'You waited for one mistake. I obliged. Good game.',
    ],
    'titus>maximus': [
      'You and your clever little face. It was the omens.',
      'Fine. You won, Maximus. You are still the short one.',
      'One day, Maximus. One day. Mark my words.',
    ],
    'titus>aghiles': [
      'Again? He says nothing all game, and then he wins!',
      'It was the omens, Aghiles. Not you. The omens.',
      'Hail, Aghiles. There. I said it. Do not smile.',
    ],
    'aghiles>maximus': [
      ['You won, Maximus. You saw further.', 'neutral'],
      ['Well played. I am still learning from you.', 'neutral'],
      ['Next time, Maximus.', 'neutral'],
    ],
    'aghiles>titus': [
      ['Well played, Titus. The amulet held.', 'neutral'],
      ['You won, Titus. Tell your father.', 'neutral'],
      ['You know this game well. I see it now.', 'neutral'],
    ],
  }),

  capture: versus('capture', 'pleased', {
    'maximus>titus': [
      'Was that one lucky, Titus? He does not look it.',
      'One of yours, Titus. Spit three times. It may help.',
    ],
    'maximus>aghiles': [
      'You left a gap, Aghiles. That is not like you.',
      'Even a hunter loses one now and then.',
    ],
    'titus>maximus': [
      'Did you calculate that one, Maximus? No? Ha!',
      'One of yours, clever boy! Count him gone.',
    ],
    'titus>aghiles': [
      'Got one of yours, Aghiles! Say something! Anything!',
      'Even giants lose pieces. Ha!',
    ],
    'aghiles>maximus': [
      'Too quick, Maximus.',
      'You reached too far, Maximus.',
    ],
    'aghiles>titus': [
      'Your amulet missed that one, Titus.',
      'One of yours, Titus.',
    ],
  }),
};
