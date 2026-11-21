// Story mode script for Latrunculi: "The Brigands' Board".
//
// All wording is original. Canon facts follow notes/book1-bible.md and notes/series-research.md.
// Every `text` is a spoken line: recorded with text-to-speech and shown as a subtitle.
// Line ids are stable and become audio file names. Do not renumber them; add new ids instead.
//
// Rules for anyone editing:
//   - at most 160 characters per line, no stage directions, numbers spelled out;
//   - Aghiles never swears by a god; nobody converts; the fathers never find out;
//   - outros must stay true whatever happened on the board, so they never describe particular moves.

const MOODS = ['neutral', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking'];

function l(id, who, text, mood) {
  if (mood && !MOODS.includes(mood)) throw new Error(`unknown mood ${mood} on ${id}`);
  return mood ? { id, who, text, mood } : { id, who, text };
}

export const SPEAKERS = {
  narrator: {
    name: 'Narrator',
    voice: 'Adult storyteller, warm and unhurried, with a dry twinkle; reads to ten-year-olds without talking down to them.',
  },
  maximus: {
    name: 'Maximus',
    voice: 'Boy of fifteen, light quick voice, crisp and well-bred; dry and sarcastic, never shouts.',
  },
  titus: {
    name: 'Titus',
    voice: 'Boy of fourteen, bright and theatrical, talks fast; swings from bragging to panic within a sentence.',
  },
  aghiles: {
    name: 'Aghiles',
    voice: 'Young man of about seventeen, deep calm voice, few words, unhurried; warmth under the quiet, never a caricatured accent.',
  },
  blandula: {
    name: 'Blandula',
    voice: 'Girl of about seventeen, soft low voice, gentle and steady; grief held quietly, brave when it counts.',
  },
  sabinus: {
    name: 'Sabinus',
    voice: 'Man of about fifty, smooth soft voice, slightly nasal, always courteous; the menace is in how politely he speaks.',
  },
};

export const STORY = {
  title: "The Brigands' Board",
  subtitle: "The Magistrate's Last Game",
  chapters: [
    // ------------------------------------------------------------------ PROLOGUE
    {
      id: 'prologue',
      title: 'Four Coins',
      setting: 'cubiculum',
      summary: 'Titus brings an old gaming box to his rematch with Aghiles. Blandula recognises it.',
      intro: [
        l('pro_in_01', 'narrator', "Rome, late in the year three hundred and three. In a senator's house on a dead-end street, one lamp was still burning."),
        l('pro_in_02', 'narrator', 'It lit a table, a game board, and three friends who had no intention of going to sleep.'),
        l('pro_in_03', 'titus', 'A rematch, Aghiles. I got up right foot first, I have not sneezed all day, and my amulet is warm. The signs could not be better.', 'pleased'),
        l('pro_in_04', 'maximus', 'His amulet is warm because he has been clutching it since lunch.'),
        l('pro_in_05', 'narrator', 'Some weeks before, at this same table, Aghiles had beaten Titus for the first time and named himself imperator. Titus had not forgiven the omens.'),
        l('pro_in_06', 'titus', 'And I bring a new set. Well, an old one. Four coins this morning, at a stall under the Colosseum arcades. Dux has eaten half my old counters.'),
        l('pro_in_07', 'narrator', 'The box was dark wood, worn smooth. Inside lay glass counters, milk white and deep blue, a bundle of wax tablets, and one large hollow with nothing in it.'),
        l('pro_in_08', 'maximus', 'There is a piece missing. A big one, by the shape of the hollow.', 'thinking'),
        l('pro_in_09', 'titus', 'For four coins you do not get everything. White is mine. We play as the soldiers do: straight lines, as far as the road is clear.'),
        l('pro_in_10', 'aghiles', 'I am ready.'),
        l('pro_in_11', 'narrator', "On Titus' shoulder sat Dux, a small monkey whose name means general. He looked at the empty hollow, then at the ceiling, and scratched his ear."),
      ],
      game: {
        type: 'match',
        preset: 'legionary',
        players: ['titus', 'aghiles'],
        white: 'titus',
        note: 'The rematch Titus has been demanding, played as the soldiers play: sixteen men a side, sliding in straight lines.',
      },
      outro: {
        titus: [
          l('pro_out_titus_01', 'titus', 'Imperator! The signs never lie. Salute me, Aghiles. Lower. No, that is too low, now you are making fun of me.', 'triumphant'),
          l('pro_out_titus_02', 'aghiles', 'Hail, Titus. One game each.'),
          l('pro_out_titus_03', 'maximus', 'One win and he is Julius Caesar. Somebody remind him how that ended.'),
        ],
        aghiles: [
          l('pro_out_aghiles_01', 'aghiles', 'Imperator. Again.', 'pleased'),
          l('pro_out_aghiles_02', 'titus', 'It is this box. I felt a chill at my ninth move, as if somebody were watching. Did nobody else feel a chill?', 'sulking'),
          l('pro_out_aghiles_03', 'maximus', 'I felt a draught. It was your men, leaving the board.'),
        ],
        draw: [
          l('pro_out_draw_01', 'maximus', 'I have counted twice. The same number each. Nobody is imperator tonight.'),
          l('pro_out_draw_02', 'titus', 'A draw is a victory the gods are saving for later.', 'pleased'),
          l('pro_out_draw_03', 'aghiles', 'Then later.'),
        ],
      },
      closing: [
        l('pro_cl_01', 'narrator', "The door opened. Blandula came in with a bowl of walnuts, sent up by Maximus' mother, and stopped as if she had walked into a wall."),
        l('pro_cl_02', 'blandula', 'Where did you get that box?'),
        l('pro_cl_03', 'titus', 'I bought it. Honestly bought it! Four coins. Why is everyone looking at me?', 'rattled'),
        l('pro_cl_04', 'blandula', "It stood beside my master's chair. I dusted it more mornings than I can count."),
        l('pro_cl_05', 'narrator', 'Her master had been Cornelius, an old magistrate. Last winter he was arrested as a Christian, and he died in the arena. His house was stripped to the walls.'),
        l('pro_cl_06', 'maximus', 'There is writing on the top tablet. Blandula, shall I read it to you?', 'thinking'),
        l('pro_cl_07', 'maximus', 'For my friend, if I should miss our game. Three problems. Play each to its end, and the board will give you the door, the shelf and the place.'),
        l('pro_cl_08', 'titus', 'A door. A secret door! That means treasure. It always means treasure.', 'pleased'),
        l('pro_cl_09', 'blandula', 'He used that word, in the last days. He said: my treasure is safe. The board remembers.'),
        l('pro_cl_10', 'aghiles', 'Then we play.'),
        l('pro_cl_11', 'narrator', 'Nobody noticed that Dux had not touched the walnuts. For Dux, that was as good as a confession.'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 1
    {
      id: 'ch1',
      title: 'The First Tablet',
      setting: 'cubiculum',
      summary: 'The first problem, by the soldiers\' rules. An X turns into a V: door five.',
      intro: [
        l('ch1_in_01', 'narrator', 'Nobody went to bed. Blandula sat on the chest by the wall, and for the first time since last winter she talked about the old man.'),
        l('ch1_in_02', 'blandula', 'Every market day a friend came to play. An old man with ink on his fingers. My master scratched problems on tablets for him to take home.'),
        l('ch1_in_03', 'blandula', 'When the arrests began, the friend stopped coming. Then the soldiers came instead.'),
        l('ch1_in_04', 'titus', 'And the treasure? Gold? Silver plate? Do not say it was a lucky charm. I already have a lucky charm.'),
        l('ch1_in_05', 'blandula', 'I never saw gold in that house. He gave most of it away.'),
        l('ch1_in_06', 'maximus', 'Then we stop guessing. First tablet. As the soldiers play. White takes two men with a single move. Then read what the enemy has left standing.'),
        l('ch1_in_07', 'narrator', 'Aghiles set out the counters exactly as the old man had drawn them. Titus looked at the blue army and nearly fell off his stool.'),
        l('ch1_in_08', 'titus', 'It is a letter! Look, the blue men make an X. Ten! Door ten! We have solved it without moving a man!', 'pleased'),
        l('ch1_in_09', 'maximus', 'It says play it to the end, then read. So we play. Two at one stroke. Give me a moment.', 'thinking'),
      ],
      game: {
        type: 'problem',
        preset: 'legionary',
        problem: 'p1',
        goal: 'White takes two blue men with a single move.',
        solver: 'maximus',
      },
      outro: {
        solved: [
          l('ch1_out_solved_01', 'maximus', 'Straight between the two of them, where he looks certain to be caught. He is safe there. And both of them are gone.', 'pleased'),
          l('ch1_out_solved_02', 'titus', 'By Pollux. The X has lost its legs. Now it looks like geese flying south, which, I may say, is an excellent omen.'),
          l('ch1_out_solved_03', 'maximus', 'It is not geese. It is a V. The number five. Not door ten, Titus. Door five.', 'triumphant'),
        ],
        failed: [
          l('ch1_out_failed_01', 'maximus', 'No. That takes one man, not two. I went for the near one like a hungry dog.', 'rattled'),
          l('ch1_out_failed_02', 'aghiles', 'Up the middle, Maximus. Between the two legs of the X. Nobody closed that trap, so he is safe. And he takes both.'),
          l('ch1_out_failed_03', 'maximus', 'Yes. Thank you. Now look at the blue. The X has lost its legs. It is a V. Five. Door five, Titus, not door ten.'),
        ],
      },
      closing: [
        l('ch1_cl_01', 'titus', 'Door five. Of what? Rome has more doors than a dog has fleas.'),
        l('ch1_cl_02', 'blandula', 'His house had many doors. The soldiers broke every one of them.'),
        l('ch1_cl_03', 'maximus', 'Then it is not in his house, or it is lost already. The second tablet says: the old way, as Piso played, and with bound men.'),
        l('ch1_cl_04', 'maximus', 'I have read about the old way. I have never seen it played properly. Piso was so good that somebody wrote a whole poem about him.', 'thinking'),
        l('ch1_cl_05', 'blandula', 'I have seen it. For years. They set the men down one at a time, turn by turn. Then a man moves one step. Never a slide.'),
        l('ch1_cl_06', 'maximus', 'Blandula, you have just become our teacher.', 'pleased'),
        l('ch1_cl_07', 'titus', 'Tomorrow, then. And at noon I want a word with the man who sold me this box.'),
        l('ch1_cl_08', 'narrator', 'Dux slept in the open box that night, curled around the empty hollow like a very small dragon on its gold.'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 2
    {
      id: 'ch2',
      title: 'As Piso Played',
      setting: 'colosseum',
      summary: 'The stall has vanished. The boys practise the old way under the arcade, and a polite stranger offers ten times the price.',
      intro: [
        l('ch2_in_01', 'narrator', 'Noon, in the shade of a Colosseum arcade. The stew was hot, the bread was rubbed with garlic, and the stall where Titus had bought the box was gone.'),
        l('ch2_in_02', 'titus', 'It was here. Right here, next to the sausage seller. A table, a red awning, a boy minding it. I did not dream it!', 'rattled'),
        l('ch2_in_03', 'maximus', "A stall that sells a dead man's goods and vanishes the next day. I find that more interesting than your geese.", 'thinking'),
        l('ch2_in_04', 'aghiles', 'Then we wait. Someone may come back.'),
        l('ch2_in_05', 'maximus', 'And nobody looks twice at boys playing a game. There is a board scratched into the paving here. Half the steps in Rome have one.'),
        l('ch2_in_06', 'titus', "Piso's way, as Blandula told it. Twenty men each. Pebbles will do. We set them down one by one, wherever we like, then move one step at a time."),
        l('ch2_in_07', 'maximus', 'And a man caught between two enemies is taken at once. Two men, if you close two traps together. Aghiles, will you watch the crowd?'),
        l('ch2_in_08', 'aghiles', 'I always do.'),
        l('ch2_in_09', 'narrator', 'Dux was given a walnut to keep him away from the pebbles. It kept him away for exactly as long as it takes to eat a walnut.'),
      ],
      game: {
        type: 'match',
        preset: 'piso',
        players: ['maximus', 'titus'],
        white: 'maximus',
        note: "Piso's way: place twenty men each, one at a time, then move a single step. Played with pebbles on a board scratched in the paving.",
      },
      outro: {
        maximus: [
          l('ch2_out_maximus_01', 'maximus', 'And that is the game. Piso would have been proud. Of me, I mean.', 'triumphant'),
          l('ch2_out_maximus_02', 'titus', 'A seer walked past just as I placed my ninth man. He looked straight at me. You all saw him look.', 'sulking'),
          l('ch2_out_maximus_03', 'aghiles', 'He was looking at your sausage.'),
        ],
        titus: [
          l('ch2_out_titus_01', 'titus', 'Victory! One step at a time, like the tortoise! Somebody write a poem. In praise of Titus!', 'triumphant'),
          l('ch2_out_titus_02', 'maximus', 'I was playing a new game, with pebbles, on a pavement, on an empty stomach.', 'sulking'),
          l('ch2_out_titus_03', 'aghiles', 'He beat you, Maximus.'),
        ],
        draw: [
          l('ch2_out_draw_01', 'maximus', 'Level. Twenty pebbles each, and nothing to show for it.'),
          l('ch2_out_draw_02', 'titus', 'Piso never had a monkey stealing his men. I count that as a win on difficulty.'),
        ],
      },
      closing: [
        l('ch2_cl_01', 'narrator', 'A shadow fell across the board. It belonged to a neat grey man with a soft voice, and it stayed exactly where it was.'),
        l('ch2_cl_02', 'sabinus', "The animal dealer's son, with the monkey. You are easy to find, young man. My name is Sabinus. I buy and sell the goods of the condemned."),
        l('ch2_cl_03', 'sabinus', 'Yesterday my boy sold you a gaming box for four coins. A mistake. It has a value of sentiment. I will give you forty for it.'),
        l('ch2_cl_04', 'titus', 'Forty! That is, I mean, forty is, well. I do not have it with me.', 'rattled'),
        l('ch2_cl_05', 'maximus', 'Sentiment. For the furniture of a stranger who died in the arena. You must have a very large heart, Sabinus.'),
        l('ch2_cl_06', 'sabinus', "And you must be the senator's son. I should hate to trouble either of your fathers over a toy. Think about my forty. I shall ask again."),
        l('ch2_cl_07', 'narrator', 'He bowed and walked away through the crowd. Two large men, who had been admiring the sausage stall, walked away after him.'),
        l('ch2_cl_08', 'aghiles', 'Two men with him. A third by the fountain. He did not come only to bargain.'),
        l('ch2_cl_09', 'narrator', 'It was then that they noticed Dux. He sat in the middle of the board, chewing the corner of a small wax notebook that nobody had seen before.'),
        l('ch2_cl_10', 'titus', 'Dux! Where did you, whose is that, oh no. Oh, by all the gods. He has robbed him.', 'rattled'),
        l('ch2_cl_11', 'maximus', 'Good monkey. I never thought I would say those words. Give it here.', 'pleased'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 3
    {
      id: 'ch3',
      title: 'A Bound Man',
      setting: 'cubiculum',
      summary: "Sabinus' notebook shows what he knows. Blandula explains the rule of the bound man, and somebody is watching the house.",
      intro: [
        l('ch3_in_01', 'narrator', 'That evening the notebook lay open under the lamp. Sabinus wrote a small, tidy hand, and Maximus read it aloud with growing interest.'),
        l('ch3_in_02', 'maximus', 'Estate of Cornelius, condemned. Bought entire. Then: his freedman says the old man hid a treasure, and the secret is in his game board. Box not found.'),
        l('ch3_in_03', 'maximus', 'And here, underlined: treasure not declared to the treasury. He means to keep it for himself. That is stealing from the emperor.'),
        l('ch3_in_04', 'titus', 'Never mind the emperor! Read the last line again. The line about us.', 'rattled'),
        l('ch3_in_05', 'maximus', "Neighbours say three boys and a monkey went in and out of the Christian's house last winter. Find them."),
        l('ch3_in_06', 'narrator', 'Nobody spoke. Last winter they had done a great deal more in that house than go in and out, and their fathers knew nothing about any of it.'),
        l('ch3_in_07', 'aghiles', 'He can hurt us. We can hurt him. So he will be careful.'),
        l('ch3_in_08', 'blandula', 'That is the second tablet. Bound men. In the old way, a trapped man is not taken at once. He is turned on his back, and he waits one turn.'),
        l('ch3_in_09', 'blandula', 'If his friends trap one of the two who hold him, he gets up again. My master loved that rule. He said nobody is lost while a friend can still reach him.'),
        l('ch3_in_10', 'maximus', 'Seneca says a man running to a fire does not stop to ask how the bound piece gets free. Now I see what he meant.', 'thinking'),
        l('ch3_in_11', 'aghiles', 'You showed me that rule once. We never played it. Play me now, Maximus.'),
        l('ch3_in_12', 'maximus', 'The old way, then. Set down one by one, one step at a time, a man may hop over a comrade, and bound men wait. Blandula, stop us when we go wrong.'),
      ],
      game: {
        type: 'match',
        preset: 'seneca',
        players: ['maximus', 'aghiles'],
        white: 'aghiles',
        note: 'The old way with bound men: a trapped piece is turned over and waits one turn for rescue. Blandula keeps both players honest.',
      },
      outro: {
        maximus: [
          l('ch3_out_maximus_01', 'maximus', 'Mine. But you made me fight for every bound man. I did not enjoy that.', 'pleased'),
          l('ch3_out_maximus_02', 'aghiles', 'It is still the rule I like best.'),
          l('ch3_out_maximus_03', 'blandula', 'My master would have enjoyed watching you play, Aghiles.'),
        ],
        aghiles: [
          l('ch3_out_aghiles_01', 'aghiles', 'Imperator. The old way suits me.', 'pleased'),
          l('ch3_out_aghiles_02', 'maximus', 'My men were on their backs like beetles. I should like it remembered that I taught him this game.', 'sulking'),
          l('ch3_out_aghiles_03', 'blandula', 'You taught him the other game. I taught him this one.'),
        ],
        draw: [
          l('ch3_out_draw_01', 'aghiles', 'Even.'),
          l('ch3_out_draw_02', 'maximus', 'Every time I bound one of his, he bound the one that was holding it. It is a very polite way to fight.', 'thinking'),
          l('ch3_out_draw_03', 'blandula', "My master's games often ended so. He said those were the best ones."),
        ],
      },
      closing: [
        l('ch3_cl_01', 'maximus', 'So. Sabinus holds us, with what the neighbours saw. We hold him, with his own notebook. Two bound men, each waiting a turn.', 'thinking'),
        l('ch3_cl_02', 'titus', 'I do not want to be a bound man. I want to be a man at home in bed who never bought a box.', 'sulking'),
        l('ch3_cl_03', 'aghiles', 'Then we find it first. Whatever it is.'),
        l('ch3_cl_04', 'narrator', 'On the windowsill Dux gave one sharp shriek. Aghiles put out the lamp with two fingers and looked down into the dead-end street.'),
        l('ch3_cl_05', 'aghiles', 'One man, at the corner. He has been there since dark.'),
        l('ch3_cl_06', 'maximus', 'People will keep taking an interest in my window. From tonight the box goes into my chest.'),
        l('ch3_cl_07', 'aghiles', 'And I sleep here.'),
        l('ch3_cl_08', 'narrator', 'The second tablet would have to wait. It is hard to solve a problem with a stranger watching the house.'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 4
    {
      id: 'ch4',
      title: 'Where They Met',
      setting: 'cubiculum',
      summary: 'The second problem: free the bound man. Shelf three, and Blandula remembers where two old men first met.',
      intro: [
        l('ch4_in_01', 'narrator', 'The watcher was back the next evening. So were the four of them, with the shutters closed and the second tablet in the middle of the table.'),
        l('ch4_in_02', 'maximus', 'The second. The old way, with bound men. White has a man down. Free him with one move. Then count only the enemy still on their feet.'),
        l('ch4_in_03', 'titus', 'A man on his back between two blue ones. One turn, and he is gone. Why did the old man draw such sad problems?'),
        l('ch4_in_04', 'blandula', 'They were his favourite kind. Saving one.'),
        l('ch4_in_05', 'maximus', 'Aghiles. This one is yours.'),
        l('ch4_in_06', 'aghiles', 'Why mine?'),
        l('ch4_in_07', 'maximus', 'Because last winter you were the one who would not leave a man lying in the dark. You have had the practice.'),
        l('ch4_in_08', 'narrator', 'Aghiles said nothing. He bent over the board, as still as a hunter over a track.'),
      ],
      game: {
        type: 'problem',
        preset: 'seneca',
        problem: 'p2',
        goal: 'White frees the bound man with one move.',
        solver: 'aghiles',
      },
      outro: {
        solved: [
          l('ch4_out_solved_01', 'aghiles', 'Over his comrade, and down beside the captor. Now the captor is the one bound. Our man gets up.', 'pleased'),
          l('ch4_out_solved_02', 'titus', "He jumped! Straight over his own friend's head! That is allowed? I want to do that."),
          l('ch4_out_solved_03', 'maximus', 'Now count the blue still on their feet. Three strokes, side by side. Three. Door five, shelf three.', 'triumphant'),
        ],
        failed: [
          l('ch4_out_failed_01', 'aghiles', 'No. That only blocks the way. He is still bound.', 'thinking'),
          l('ch4_out_failed_02', 'blandula', 'May I? This man, at the back. He can hop over his comrade. See where he comes down.'),
          l('ch4_out_failed_03', 'aghiles', 'Beside the captor. Yes. Thank you. Our man gets up.'),
          l('ch4_out_failed_04', 'maximus', 'And the blue still on their feet make three strokes, side by side. Three. Door five, shelf three.'),
        ],
      },
      closing: [
        l('ch4_cl_01', 'titus', 'Door five, shelf three. It is in a cupboard! The treasure is in a cupboard! Whose cupboard?', 'pleased'),
        l('ch4_cl_02', 'maximus', 'There is one more line, very small. You know the house. It is where we met.'),
        l('ch4_cl_03', 'blandula', 'Where they met. Oh. I know that story. He told it every year.'),
        l('ch4_cl_04', 'blandula', 'It was at the baths, in the library. Two old men reaching for the same scroll. They argued for an hour, and were friends ever after.'),
        l('ch4_cl_05', 'blandula', 'I went there once, to carry his cushion. The walls are all little doors, with numbers painted above them.'),
        l('ch4_cl_06', 'maximus', 'By Jupiter. The library. Titus and I walk past those cupboards every week.', 'rattled'),
        l('ch4_cl_07', 'titus', 'He hid a treasure in a library? Nobody goes in there on purpose! Present company excepted.'),
        l('ch4_cl_08', 'aghiles', 'And the third tablet. The place.'),
        l('ch4_cl_09', 'maximus', 'The third needs a general, and our general is missing. Tomorrow, the library. We look first and worry afterwards.'),
        l('ch4_cl_10', 'narrator', 'On the windowsill Dux yawned, showed all his sharp little teeth, and looked exactly like a monkey with a clear conscience.'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 5
    {
      id: 'ch5',
      title: 'The Wrong General',
      setting: 'atrium',
      summary: "The library shelf holds forty scrolls and a spy. Titus teaches the sailors' game with a walnut general, and Sabinus sets a deadline.",
      intro: [
        l('ch5_in_01', 'narrator', "Titus' house, the next afternoon. In the atrium the fountain splashed, and across the mosaic floor prowled a rhinoceros, a crocodile and one small monkey."),
        l('ch5_in_02', 'maximus', 'Fifth cupboard, third shelf. Forty scrolls in a row, all tagged Reports on the Drains of Rome. We could not unroll forty with the librarian watching.'),
        l('ch5_in_03', 'titus', 'And two benches away sat a man reading a scroll he was holding upside down. One of the sausage admirers.'),
        l('ch5_in_04', 'aghiles', 'So now Sabinus knows the house. Not the shelf.'),
        l('ch5_in_05', 'maximus', 'And we know the shelf, not the place. That is the third tablet: the long game from Britain, with a general nobody can take. And we have no general.'),
        l('ch5_in_06', 'titus', "Generals I know. The sailors who bring my father's crocodiles from Egypt play a general's game on deck. They gave me a board.", 'pleased'),
        l('ch5_in_07', 'titus', 'A small board. You set your men down two at a time. One step each. The general can leap over an enemy. And if you take a man, you move again.'),
        l('ch5_in_08', 'maximus', "That is not the tablet's game."),
        l('ch5_in_09', 'titus', "It is a general's game, and the box is locked in your chest. This walnut is the general. Sit, Aghiles. I command a general every day of my life."),
        l('ch5_in_10', 'narrator', 'Dux looked at the walnut general with deep professional interest.'),
      ],
      game: {
        type: 'match',
        preset: 'bell',
        players: ['titus', 'aghiles'],
        white: 'aghiles',
        note: "The sailors' game: a small board, men placed two at a time, a leaping general, and another move after every capture. The general is a walnut.",
      },
      outro: {
        titus: [
          l('ch5_out_titus_01', 'titus', 'The walnut general is victorious! I trained him myself. Hail me, somebody.', 'triumphant'),
          l('ch5_out_titus_02', 'aghiles', 'Hail, Titus. Your general is being eaten.'),
          l('ch5_out_titus_03', 'titus', 'Dux! Spit him out! That is a commanding officer!', 'rattled'),
        ],
        aghiles: [
          l('ch5_out_aghiles_01', 'aghiles', "Take a man, move again. I like the sailors' game.", 'pleased'),
          l('ch5_out_aghiles_02', 'titus', 'My general was a walnut. His heart was not in it. And I came into this atrium left foot first. I remember it now.', 'sulking'),
          l('ch5_out_aghiles_03', 'maximus', 'You live here. You come into it forty times a day.'),
          l('ch5_out_aghiles_04', 'titus', 'Then think how the bad luck has piled up!', 'rattled'),
        ],
        draw: [
          l('ch5_out_draw_01', 'aghiles', 'Even. Neither army is the larger.'),
          l('ch5_out_draw_02', 'titus', 'My general was holding back. Walnuts are cautious by nature.'),
          l('ch5_out_draw_03', 'maximus', 'Yours is also missing. Ask your monkey.'),
        ],
      },
      closing: [
        l('ch5_cl_01', 'narrator', 'The steward came to say that a gentleman was at the door, about a box. The gentleman had not waited to be shown in.'),
        l('ch5_cl_02', 'sabinus', 'A charming house. Your father is at the docks, I hear, so we may speak freely. I have lost a notebook, and I am out of patience.'),
        l('ch5_cl_03', 'sabinus', 'Tomorrow at noon I come back with forty coins. I leave with the box, the board, every counter and every tablet. Or I begin to talk.'),
        l('ch5_cl_04', 'sabinus', 'To your father, about what his son buys. And to certain officers, about three boys who were seen so often at the house of a Christian.'),
        l('ch5_cl_05', 'titus', 'We were, that was, we only, Maximus! Tell him!', 'rattled'),
        l('ch5_cl_06', 'aghiles', 'Maximus. One word, and I show him the door.'),
        l('ch5_cl_07', 'maximus', 'No. Sabinus, you shall have it. Tomorrow at noon, here. The box, the board, every counter and every tablet that Titus bought from you.'),
        l('ch5_cl_08', 'sabinus', 'Sensible. I do so prefer sensible boys.'),
        l('ch5_cl_09', 'narrator', 'When he had gone, Titus sat down on the edge of the fountain and held his amulet in both hands.'),
        l('ch5_cl_10', 'titus', 'You gave in. Just like that. You never give in. It is one of the worst things about you.', 'sulking'),
        l('ch5_cl_11', 'maximus', 'I promised him everything you bought. You never bought a general. And I copied all three tablets the first night. Now, who has that piece?', 'pleased'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 6
    {
      id: 'ch6',
      title: "The General's Hoard",
      setting: 'atrium',
      summary: 'Titus buys the missing general back from his own monkey and solves the third problem. Under the general is a fish. At noon the box changes hands.',
      intro: [
        l('ch6_in_01', 'narrator', "Morning in the atrium, and three hours until noon. The box stood on the fountain's edge. They had searched it, and Titus, and half of Titus' house."),
        l('ch6_in_02', 'aghiles', 'The hollow was empty when Titus opened the box. But there was no dust in it. The piece was taken that same day.', 'thinking'),
        l('ch6_in_03', 'maximus', 'Taken at the stall, then. By someone small, quick, and fond of shiny things.'),
        l('ch6_in_04', 'narrator', 'Three boys turned and looked at the monkey. The monkey looked at the fountain.'),
        l('ch6_in_05', 'titus', 'Dux. General. Old friend. I have here a whole purse of seeds. Bring me what you took, and it is yours. That is my final offer.'),
        l('ch6_in_06', 'narrator', 'Dux thought it over. Then he slipped behind the fountain and came back with a walnut. Titus paid. A brooch pin. Titus paid. A stylus.'),
        l('ch6_in_07', 'maximus', 'My stylus! I have been looking for that for a month!', 'rattled'),
        l('ch6_in_08', 'narrator', 'The purse was nearly empty when Dux brought out the last thing, slowly, in both hands: a general of amber glass, as big as a walnut.'),
        l('ch6_in_09', 'titus', 'The general had the general all along. Dux, you are a thief and a traitor, and I have never been so proud of you.', 'pleased'),
        l('ch6_in_10', 'maximus', 'Turn the board over. A second face, twelve squares by eight. As the legions play in Britain, the tablet says. The general cannot be taken, only shut in.'),
        l('ch6_in_11', 'maximus', 'White shuts in the blue general in two moves. He is your general, Titus. You do it.'),
        l('ch6_in_12', 'titus', 'Me? Now? With that man coming at noon? Very well. Stand back. Give me room. Nobody breathe on the board.', 'rattled'),
      ],
      game: {
        type: 'problem',
        preset: 'stanway',
        problem: 'p3',
        goal: 'White shuts in the blue general in two moves.',
        solver: 'titus',
      },
      outro: {
        solved: [
          l('ch6_out_solved_01', 'titus', 'First I take his last free man. Now his guard has to move, there is nothing else. And I step into the gap. Shut in, by his own bodyguard!', 'triumphant'),
          l('ch6_out_solved_02', 'maximus', 'That was good, Titus. I mean it. Now count his square from the left.', 'pleased'),
          l('ch6_out_solved_03', 'titus', 'One, two, three, four, five, six, seven. The seventh place. And then it says: turn him over.'),
        ],
        failed: [
          l('ch6_out_failed_01', 'titus', 'He keeps slipping out! A general nobody can take is against nature. The signs are all wrong for this.', 'sulking'),
          l('ch6_out_failed_02', 'aghiles', 'Do not chase the general. Take the last blue man who can still move. Then the guard must step aside.'),
          l('ch6_out_failed_03', 'titus', 'And I step into the gap! Shut in! I was about to see that. Seventh square from the left. And then it says: turn him over.', 'pleased'),
        ],
      },
      closing: [
        l('ch6_cl_01', 'narrator', 'Titus turned the amber general over. On the flat underside, scratched very fine, was a small fish.'),
        l('ch6_cl_02', 'titus', 'A fish. He hid a treasure and signed it with his dinner.'),
        l('ch6_cl_03', 'aghiles', "I have seen that fish. Painted on a wall, underground, by the Appian Way. Where Blandula's master is buried.", 'thinking'),
        l('ch6_cl_04', 'narrator', 'Nobody said the word. Nobody needed to. Whatever lay in the seventh place belonged to the people Rome was hunting.'),
        l('ch6_cl_05', 'titus', 'I am not going to spit. I want it noted that I thought about spitting three times, and did not.'),
        l('ch6_cl_06', 'maximus', 'Then here is the plan. At noon Titus and I are here, being sensible boys. Sabinus and his men will be watching the two of us.'),
        l('ch6_cl_07', 'aghiles', 'And nobody will be watching me. I will ask Blandula to come. She knows the doors, and a fish needs no reading.'),
        l('ch6_cl_08', 'narrator', 'At noon Sabinus came. He counted every counter, frowned at the empty hollow, and was told, quite truthfully, that it was empty when the box was bought.'),
        l('ch6_cl_09', 'sabinus', 'If this is a trick, boy, remember what I know about you.'),
        l('ch6_cl_10', 'maximus', 'And remember what your notebook knows about you. Treasure, not declared. We are two bound men, Sabinus. Leave us alone, and we lie still.'),
        l('ch6_cl_11', 'narrator', "Sabinus looked at him for a long moment. Then he counted forty coins into Titus' hand, took the box under his arm, and left without bowing."),
        l('ch6_cl_12', 'titus', 'Bought for four, sold for forty. Say what you like about today. That is good business.', 'pleased'),
      ],
    },

    // ------------------------------------------------------------------ CHAPTER 7
    {
      id: 'ch7',
      title: 'The Waiting Game',
      setting: 'cubiculum',
      summary: 'Maximus and Titus play the long game while they wait for Aghiles and Blandula. Then the treasure is on the table, and three boys must decide what to do with it.',
      intro: [
        l('ch7_in_01', 'narrator', "Evening came, and no Aghiles. The lamp was lit, and still no Aghiles. In Maximus' room two boys watched the door and pretended not to."),
        l('ch7_in_02', 'titus', "They should be back. The library shuts at dusk. What if somebody asked why a lady's maid wants a book about drains?", 'rattled'),
        l('ch7_in_03', 'maximus', 'Do not worry about Aghiles. He has a way of arriving.'),
        l('ch7_in_04', 'narrator', 'He had said much the same once before, last winter, and then waited three days. He did not mention that.'),
        l('ch7_in_05', 'titus', 'Play me. If I sit still I shall chew through my amulet. The long game, with the general. We still have the general.'),
        l('ch7_in_06', 'maximus', 'Twelve by eight, chalked on my table. My mother will ask about the chalk. Men on the back row, general in front, straight lines as far as you like.'),
        l('ch7_in_07', 'maximus', 'Nobody takes a general. You win by shutting him in. A walnut for the second general. Dux, that walnut is on duty.'),
        l('ch7_in_08', 'narrator', 'Once before they had played a game while they waited for this same friend. It had not made the time pass any faster then, either.'),
      ],
      game: {
        type: 'match',
        preset: 'stanway',
        players: ['maximus', 'titus'],
        white: 'titus',
        note: 'The long game of the third tablet: twelve by eight, with a general who cannot be taken, only shut in. Played to pass the time until Aghiles comes back.',
      },
      outro: {
        maximus: [
          l('ch7_out_maximus_01', 'maximus', 'Won. My general sends yours his regards.', 'pleased'),
          l('ch7_out_maximus_02', 'titus', 'I was listening for the door. Nobody can command an army and listen for a door. Ask any general.', 'sulking'),
        ],
        titus: [
          l('ch7_out_titus_01', 'titus', 'Victory! Maximus, your general may surrender to mine. I am the terror of Britain!', 'triumphant'),
          l('ch7_out_titus_02', 'maximus', 'I was listening for the door.', 'sulking'),
          l('ch7_out_titus_03', 'titus', 'So was I. I simply did it better.'),
        ],
        draw: [
          l('ch7_out_draw_01', 'maximus', 'Neither general shut in, and I have lost count of the moves. Call it level.'),
          l('ch7_out_draw_02', 'titus', 'Agreed. My mind was on the stairs anyway.'),
        ],
      },
      closing: [
        l('ch7_cl_01', 'narrator', 'Then came steps on the stairs, one pair heavy and one light. Aghiles ducked through the doorway with a leather scroll case under his arm.'),
        l('ch7_cl_02', 'aghiles', 'Fifth door. Third shelf. Seventh place. A tag about drains, and a small fish in the corner.'),
        l('ch7_cl_03', 'blandula', 'Two servants on an errand. Nobody looked at us twice. We might have been furniture.'),
        l('ch7_cl_04', 'narrator', 'Maximus unrolled the first scroll under the lamp, then a second, then a third. He was quiet for some time.'),
        l('ch7_cl_05', 'maximus', 'Letters. A book of songs. The story of a life, set down by a man called Mark. And names, Titus. The letters are full of names. All of it is forbidden.', 'thinking'),
        l('ch7_cl_06', 'titus', 'No gold? Not one coin? This is what he called his treasure?', 'sulking'),
        l('ch7_cl_07', 'blandula', 'He gave his gold away. These he hid. I think he meant exactly what he said.'),
        l('ch7_cl_08', 'maximus', "The law is plain. These are to be handed in and burned. Whoever keeps them is a criminal, and my father's name is on this house."),
        l('ch7_cl_09', 'titus', "Burn a god's books? Anybody's god? Not while I am in the room. That is how a house gets struck by lightning."),
        l('ch7_cl_10', 'aghiles', 'They are not ours to burn, and not ours to keep. A man hid them in his last days. Somebody is missing them.'),
        l('ch7_cl_11', 'aghiles', 'Last winter a man with a hay cart stopped on the road when everyone else walked past. We do not walk past.'),
        l('ch7_cl_12', 'maximus', 'Give them back to whom? We cannot knock on doors and ask who is a Christian.'),
        l('ch7_cl_13', 'blandula', 'I think I know someone who would know someone. Please do not ask me who.'),
        l('ch7_cl_14', 'maximus', 'Then I am not asking. I never saw these. Titus?'),
        l('ch7_cl_15', 'titus', 'Saw what?'),
        l('ch7_cl_16', 'narrator', 'Dux climbed down from the shelf and laid the amber general on top of the scrolls. It was the only thing he ever gave back without being paid.'),
        l('ch7_cl_17', 'narrator', 'That night Blandula carried the case down the back stairs to a slave named Flavia, who asked her only one thing: were you followed?'),
        l('ch7_cl_18', 'narrator', "So the old magistrate's treasure spent that winter under the roof of Senator Julius Claudius. The senator never knew. Neither did his son."),
      ],
    },

    // ------------------------------------------------------------------ EPILOGUE
    {
      id: 'epilogue',
      title: 'Imperator',
      setting: 'colosseum',
      summary: 'Lunch under the arcade, news of Sabinus, and the last game of a round-robin for the title of imperator. Dux crowns the winner.',
      intro: [
        l('epi_in_01', 'narrator', 'Some days later, at noon, three friends sat in the shade of the Colosseum with a pot of stew and a board scratched in the paving.'),
        l('epi_in_02', 'narrator', 'The stew seller had news. A dealer called Sabinus had spent four days in the library at the baths, unrolling every scroll in the fifth cupboard.'),
        l('epi_in_03', 'maximus', 'Every report on the drains of Rome. He must be the best informed man in the city.', 'pleased'),
        l('epi_in_04', 'aghiles', 'In the seventh place I left him a walnut.', 'pleased'),
        l('epi_in_05', 'titus', 'You did what? Aghiles! That is the funniest thing you have ever done, and you kept it to yourself for days?'),
        l('epi_in_06', 'narrator', 'Then to business. Three players, three games, each against each, for the title of imperator. The loser would buy the sausages.'),
        l('epi_in_07', 'narrator', 'Titus had already played both of his games, and preferred not to discuss them.'),
        l('epi_in_08', 'titus', 'A crow called three times on my left as I came out of the door. I said then that it would cost me. Nobody listens.', 'sulking'),
        l('epi_in_09', 'maximus', 'So it comes down to the last game. Aghiles and I. Whoever wins is imperator.'),
        l('epi_in_10', 'aghiles', 'As the soldiers play. The way we began.'),
        l('epi_in_11', 'titus', 'Look at us. Playing for an empire with pebbles on a pavement. One day I shall own a proper set. Marble. Too heavy for a monkey to carry off.'),
        l('epi_in_12', 'narrator', 'Maximus said nothing. But he looked at Titus for a moment, the way he looked at a board when he had just seen a good move.'),
      ],
      game: {
        type: 'match',
        preset: 'legionary',
        players: ['maximus', 'aghiles'],
        white: 'maximus',
        note: 'The deciding game of the round-robin. Titus has lost both of his; whoever wins this one is imperator.',
      },
      outro: {
        maximus: [
          l('epi_out_maximus_01', 'maximus', 'Imperator! By Jupiter, at last. Rome may kneel.', 'triumphant'),
          l('epi_out_maximus_02', 'aghiles', 'Hail, Maximus. That was a good game.'),
          l('epi_out_maximus_03', 'narrator', "Dux sprang from Titus' shoulder onto the pale head of the new emperor, and sat there like a crown that scratched."),
          l('epi_out_maximus_04', 'maximus', 'Titus. Remove your monkey.', 'rattled'),
          l('epi_out_maximus_05', 'titus', 'An emperor does not take off his crown. Ask Aghiles. He wore it first.', 'pleased'),
        ],
        aghiles: [
          l('epi_out_aghiles_01', 'aghiles', 'Imperator. Twice now. I begin to like the word.', 'triumphant'),
          l('epi_out_aghiles_02', 'maximus', 'Hail, Aghiles. Fairly won. Though when you tell this story, Titus, remember who taught him.'),
          l('epi_out_aghiles_03', 'narrator', "Dux knew the way. He sprang onto Aghiles' head and settled there, a crown for the second time."),
          l('epi_out_aghiles_04', 'titus', 'He never does that for me. Not once. And I am the one who feeds him!', 'sulking'),
        ],
        draw: [
          l('epi_out_draw_01', 'maximus', 'I have counted three times. Level. Two emperors.'),
          l('epi_out_draw_02', 'aghiles', 'Rome has four already. Who will notice two more?'),
          l('epi_out_draw_03', 'narrator', 'Dux looked from one emperor to the other, turned his back on both, and sat down firmly on the head of Titus.'),
          l('epi_out_draw_04', 'titus', 'The general has chosen! Imperator by vote of the army! Hail me! Stop laughing and hail me!', 'triumphant'),
        ],
      },
      closing: [
        l('epi_cl_01', 'titus', 'Sausages, then. I am paying, it seems. Out of my forty coins.'),
        l('epi_cl_02', 'maximus', 'Thirty-six. You paid four for the box.'),
        l('epi_cl_03', 'narrator', 'They ate in the shade and argued about the game. They did not talk about a leather case, or a fish, or an old man they had never met.'),
        l('epi_cl_04', 'narrator', 'Somewhere in Rome an old man with ink on his fingers turned an amber general over in his hand, and knew his friend had kept their game after all.'),
        l('epi_cl_05', 'narrator', 'And under the arcade, three brigands and a monkey began to set out the pebbles again.'),
      ],
    },
  ],
};

// Board notation used below: files a, b, c ... from White's left; ranks 1, 2, 3 ... from White's side.
// The squares given are candidates. Verify each with the engine's own solver and adjust freely,
// provided the goal, the number of moves and the final picture (plotMeaning) stay the same.
export const PROBLEMS = {
  p1: {
    title: 'The First Tablet: Two at a Stroke',
    preset: 'legionary',
    goal: 'White takes two blue men with a single move.',
    description:
      'Board eight by eight, soldiers\' rules (rook slides, immediate capture, more than one capture per move, entering between two enemies is safe). ' +
      'One move. Blue stands in the shape of an X: a five-man chevron b7, c6, d5, e6, f7 plus two "legs" at c4 and e4. ' +
      'White has men at b4 and f4 beside the legs and a man at d1 with the d-file clear to d4. ' +
      'The key is d1 to d4: the man slides between the two legs, where he looks trapped but is safe, and closes both traps at once (b4-c4-d4 and d4-e4-f4). ' +
      'Add two or three white decoys that can take only one leg, and no other double capture. ' +
      'If the legionary preset does not allow two captures with one move, switch that rule on for this problem only.',
    plotMeaning:
      'Before the move the blue men read as X, ten, which Titus announces too early. After it the legs are gone and the blue men read as V, five: the fifth door (cupboard five in the library of the baths).',
  },
  p2: {
    title: 'The Second Tablet: The Bound Man',
    preset: 'seneca',
    goal: 'White frees the bound man with one move.',
    description:
      'Board eight by eight, the old way with bound men (one step, hops over a friendly piece, a trapped piece is turned over and removed next turn unless one of its captors is trapped first). ' +
      'One move. A white man lies bound at c4 between blue captors at b4 and d4. White has a man at b3 below the first captor, and two men on the b-file at b6 and b7. ' +
      'The key is the hop b7 over b6 to b5: the captor at b4 is now trapped between b5 and b3, is turned over, and the white man at c4 is freed at once. ' +
      'Stepping moves that merely block must not work, and the other captor (d4) must not be trappable. ' +
      'The blue men still upright afterwards are three two-man columns: d4 and d5, f4 and f5, h4 and h5. The flipped captor at b4 does not count.',
    plotMeaning:
      'Counting only the blue men still on their feet gives three upright strokes, the numeral three: the third shelf. A last line on the tablet, "It is where we met", lets Blandula name the place: the library at the baths.',
  },
  p3: {
    title: 'The Third Tablet: The General Shut In',
    preset: 'stanway',
    goal: 'White shuts in the blue general in two moves.',
    description:
      'Board twelve by eight (files a to l), the long game with a general who cannot be captured and is beaten when all four sides are blocked, walls and his own men included, as long as an enemy completes the block. Two white moves, forced by zugzwang. ' +
      'Blue general at g8 on the far wall, with his own men at f8 and h8 and a guard at g7. White men at e8, i8, f7 and h7 freeze f8 and h8 and stand either side of the guard; a white man at g5 leaves the guard only the step to g6. ' +
      'Blue has one free man at c4, with a white man at c3 below it and a white man at c7 above with c6 and c5 empty. ' +
      'Move one: c7 to c5 captures the free man. Blue\'s only legal move is now the guard g7 to g6. Move two: f7 (or h7) steps to g7 and the general, between his own two men under the wall, cannot move. ' +
      'Put the white general somewhere harmless if the preset needs both generals. This assumes a player must move when able; if the engine allows passing, replace it with a one-move problem that ends on the same square.',
    plotMeaning:
      'The general ends shut in on the seventh square from the left: the seventh place on the shelf. Turning the real amber general over shows a small fish scratched underneath, the mark on the right scroll tag, and the sign that the treasure belongs to the Christians.',
  },
};
