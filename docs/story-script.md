# The Brigands' Board

*The Magistrate's Last Game.* Story script for Latrunculi, for review before any voice is recorded.

This file mirrors `src/latrunculi/story/script.js`, `banter.js` and `tutorial-lines.js`, which are the source of truth. All wording is original; nothing is quoted from the books. Every line below is spoken aloud and shown as a subtitle.

**Title.** I kept the approved working title and added a subtitle. If you would rather lead with the mystery, *The Magistrate's Last Game* also works as the main title.

## Synopsis

Late in A.D. 303, some weeks after Aghiles first beat Titus at latrunculi. Titus arrives for his rematch with an old gaming box bought for four coins at a stall under the Colosseum arcades: a board, blue and white glass counters, three wax tablets of problems, and one empty hollow where a large piece is missing. Blandula recognises it at once. It stood beside the chair of her old master Cornelius, the Christian magistrate who died in the arena last winter. In his last days he told her that his treasure was safe and that "the board remembers". The top tablet is addressed to a friend he used to play: solve the three problems, and the board will give the door, the shelf and the place.

Each problem is played under different rules, and each leaves the enemy counters standing in a figure. The first, by the soldiers' rules, turns an X into a V: door five. The second, by the old rules in which a trapped piece is only bound and can still be rescued, leaves three strokes: shelf three, and a last line, "it is where we met", lets Blandula name the place, the library at the baths, whose walls are numbered cupboards. Cornelius hid his treasure among forty dull scrolls. The third problem needs the general, and the general is the missing piece.

They are not alone. Sabinus, a soft-spoken dealer in the goods of the condemned, bought Cornelius' estate, learned from a freedman that the secret was in the game board, and found that his stall boy had already sold it to a boy with a monkey. He offers forty coins, then threats: he knows three boys and a monkey were seen at the Christian's house last winter. But Dux has picked his belt, and the stolen notebook shows Sabinus is hiding the treasure from the imperial treasury. Each side now holds the other, like two bound pieces. Maximus gives Sabinus exactly what Titus bought, which never included the general. Dux had stolen that at the stall, and Titus has to buy it back from his own monkey, seed by seed. Titus solves the last problem: the general is shut in on the seventh square, and under the amber piece is scratched a small fish. Aghiles has seen that fish before, on a wall in the catacombs.

While Sabinus and his men watch the senator's son, nobody watches Aghiles and Blandula, who walk out of the library with a scroll case. The treasure is not gold. It is the books Diocletian's edict ordered burned: letters, songs, a Gospel, and names. Maximus knows the law; Titus will not burn any god's books; Aghiles says they are not theirs to burn or to keep, and that they do not walk past. Blandula knows someone who would know someone. Nobody asks who. That night the case goes down the back stairs to Flavia, and spends the winter under Maximus' own roof without his ever knowing. Nobody converts, and nobody tells. In the epilogue the boys play a round-robin for the title of imperator on a board scratched in the paving, Dux crowns the winner, and Titus remarks that one day he will own a proper marble set.

## Cast and voice notes

| Speaker id | Name | Voice |
|---|---|---|
| `narrator` | Narrator | Adult storyteller, warm and unhurried, with a dry twinkle; reads to ten-year-olds without talking down to them. |
| `maximus` | Maximus | Boy of fifteen, light quick voice, crisp and well-bred; dry and sarcastic, never shouts. |
| `titus` | Titus | Boy of fourteen, bright and theatrical, talks fast; swings from bragging to panic within a sentence. |
| `aghiles` | Aghiles | Young man of about seventeen, deep calm voice, few words, unhurried; warmth under the quiet, never a caricatured accent. |
| `blandula` | Blandula | Girl of about seventeen, soft low voice, gentle and steady; grief held quietly, brave when it counts. |
| `sabinus` | Sabinus | Man of about fifty, smooth soft voice, slightly nasal, always courteous; the menace is in how politely he speaks. |

- **Sabinus** is the only invented speaking character: Lucius Sabinus, a buyer of confiscated estates who also trades in information. He is not a returning villain and he is never violent on stage; his threat is what he might say, and to whom.
- **Dux** has no lines. The narrator reports what he does.
- Mentioned but silent: Maximus' mother, Titus' father (away at the docks), the steward of Titus' house, Flavia, the stew seller, and an unnamed old man with ink on his fingers, Cornelius' friend.
- **In-world names for the rule presets.** The boys never say "Bell" or "Stanway". They call the presets: the soldiers' game (legionary); the old way, or Piso's way (piso); the old way with bound men (seneca); the sailors' game (bell); the long game from Britain (stanway). The Egyptian sailors and the British officer are story colour, chosen because Bell modelled his rules on Egyptian seega and the Stanway board was dug up in Britain. The preset cards should still say what is evidence and what is reconstruction.

## How the chapters work

- Prologue, seven chapters and an epilogue. Each has one game event: a match (six of them) or a problem from the tablets (three).
- A match has an intro, one short outro for each possible winner and one for a draw, then a closing scene that is the same whoever won. Outros never describe particular moves, so they stay true whatever happened on the board.
- A problem has an intro, an outro for "solved" (the solver explains it) and one for "failed" (a friend shows the move), then the closing scene.
- Presets are introduced in the order legionary, piso, seneca, bell, stanway. Each pair of boys meets exactly twice.
- **The epilogue.** The round-robin is told, and only its deciding game is played: Titus has already lost both of his games, so Maximus against Aghiles decides the title. That keeps the epilogue to one game and within the match format. If you would rather play all three games, the script needs a third outro (Titus as imperator) and two short bridges; the draw outro, in which Dux crowns Titus, shows the tone.

| Chapter | Setting | Game | Preset | Who |
|---|---|---|---|---|
| Four Coins | cubiculum | match | legionary | Titus v Aghiles (white: Titus) |
| The First Tablet | cubiculum | problem | legionary | solved by Maximus |
| As Piso Played | colosseum | match | piso | Maximus v Titus (white: Maximus) |
| A Bound Man | cubiculum | match | seneca | Maximus v Aghiles (white: Aghiles) |
| Where They Met | cubiculum | problem | seneca | solved by Aghiles |
| The Wrong General | atrium | match | bell | Titus v Aghiles (white: Aghiles) |
| The General's Hoard | atrium | problem | stanway | solved by Titus |
| The Waiting Game | cubiculum | match | stanway | Maximus v Titus (white: Titus) |
| Imperator | colosseum | match | legionary | Maximus v Aghiles (white: Maximus) |

## The script

### Prologue: Four Coins

*Setting: Maximus' bedroom by lamplight. Titus brings an old gaming box to his rematch with Aghiles. Blandula recognises it.*

**Scene 1, before the game**

- **Narrator:** Rome, late in the year three hundred and three. In a senator's house on a dead-end street, one lamp was still burning.
- **Narrator:** It lit a table, a game board, and three friends who had no intention of going to sleep.
- **Titus:** A rematch, Aghiles. I got up right foot first, I have not sneezed all day, and my amulet is warm. The signs could not be better.
- **Maximus:** His amulet is warm because he has been clutching it since lunch.
- **Narrator:** Some weeks before, at this same table, Aghiles had beaten Titus for the first time and named himself imperator. Titus had not forgiven the omens.
- **Titus:** And I bring a new set. Well, an old one. Four coins this morning, at a stall under the Colosseum arcades. Dux has eaten half my old counters.
- **Narrator:** The box was dark wood, worn smooth. Inside lay glass counters, milk white and deep blue, a bundle of wax tablets, and one large hollow with nothing in it.
- **Maximus:** There is a piece missing. A big one, by the shape of the hollow.
- **Titus:** For four coins you do not get everything. White is mine. We play as the soldiers do: straight lines, as far as the road is clear.
- **Aghiles:** I am ready.
- **Narrator:** On Titus' shoulder sat Dux, a small monkey whose name means general. He looked at the empty hollow, then at the ceiling, and scratched his ear.

**The game: a match, Titus against Aghiles.** Preset: Legionary ("as the soldiers play"). White: Titus. Match card: "The rematch Titus has been demanding, played as the soldiers play: sixteen men a side, sliding in straight lines."

*If Titus wins:*

- **Titus:** Imperator! The signs never lie. Salute me, Aghiles. Lower. No, that is too low, now you are making fun of me.
- **Aghiles:** Hail, Titus. One game each.
- **Maximus:** One win and he is Julius Caesar. Somebody remind him how that ended.

*If Aghiles wins:*

- **Aghiles:** Imperator. Again.
- **Titus:** It is this box. I felt a chill at my ninth move, as if somebody were watching. Did nobody else feel a chill?
- **Maximus:** I felt a draught. It was your men, leaving the board.

*If the game is drawn:*

- **Maximus:** I have counted twice. The same number each. Nobody is imperator tonight.
- **Titus:** A draw is a victory the gods are saving for later.
- **Aghiles:** Then later.

**Scene 2, after the game (the same whoever won)**

- **Narrator:** The door opened. Blandula came in with a bowl of walnuts, sent up by Maximus' mother, and stopped as if she had walked into a wall.
- **Blandula:** Where did you get that box?
- **Titus:** I bought it. Honestly bought it! Four coins. Why is everyone looking at me?
- **Blandula:** It stood beside my master's chair. I dusted it more mornings than I can count.
- **Narrator:** Her master had been Cornelius, an old magistrate. Last winter he was arrested as a Christian, and he died in the arena. His house was stripped to the walls.
- **Maximus:** There is writing on the top tablet. Blandula, shall I read it to you?
- **Maximus:** For my friend, if I should miss our game. Three problems. Play each to its end, and the board will give you the door, the shelf and the place.
- **Titus:** A door. A secret door! That means treasure. It always means treasure.
- **Blandula:** He used that word, in the last days. He said: my treasure is safe. The board remembers.
- **Aghiles:** Then we play.
- **Narrator:** Nobody noticed that Dux had not touched the walnuts. For Dux, that was as good as a confession.

### Chapter 1: The First Tablet

*Setting: Maximus' bedroom by lamplight. The first problem, by the soldiers' rules. An X turns into a V: door five.*

**Scene 1, before the game**

- **Narrator:** Nobody went to bed. Blandula sat on the chest by the wall, and for the first time since last winter she talked about the old man.
- **Blandula:** Every market day a friend came to play. An old man with ink on his fingers. My master scratched problems on tablets for him to take home.
- **Blandula:** When the arrests began, the friend stopped coming. Then the soldiers came instead.
- **Titus:** And the treasure? Gold? Silver plate? Do not say it was a lucky charm. I already have a lucky charm.
- **Blandula:** I never saw gold in that house. He gave most of it away.
- **Maximus:** Then we stop guessing. First tablet. As the soldiers play. White takes two men with a single move. Then read what the enemy has left standing.
- **Narrator:** Aghiles set out the counters exactly as the old man had drawn them. Titus looked at the blue army and nearly fell off his stool.
- **Titus:** It is a letter! Look, the blue men make an X. Ten! Door ten! We have solved it without moving a man!
- **Maximus:** It says play it to the end, then read. So we play. Two at one stroke. Give me a moment.

**The game: problem p1, "The First Tablet: Two at a Stroke".** Preset: Legionary ("as the soldiers play"). Solver: Maximus. Goal: "White takes two blue men with a single move."

*If the problem is solved:*

- **Maximus:** Straight between the two of them, where he looks certain to be caught. He is safe there. And both of them are gone.
- **Titus:** By Pollux. The X has lost its legs. Now it looks like geese flying south, which, I may say, is an excellent omen.
- **Maximus:** It is not geese. It is a V. The number five. Not door ten, Titus. Door five.

*If the player gives up or fails:*

- **Maximus:** No. That takes one man, not two. I went for the near one like a hungry dog.
- **Aghiles:** Up the middle, Maximus. Between the two legs of the X. Nobody closed that trap, so he is safe. And he takes both.
- **Maximus:** Yes. Thank you. Now look at the blue. The X has lost its legs. It is a V. Five. Door five, Titus, not door ten.

**Scene 2, after the game (the same whoever won)**

- **Titus:** Door five. Of what? Rome has more doors than a dog has fleas.
- **Blandula:** His house had many doors. The soldiers broke every one of them.
- **Maximus:** Then it is not in his house, or it is lost already. The second tablet says: the old way, as Piso played, and with bound men.
- **Maximus:** I have read about the old way. I have never seen it played properly. Piso was so good that somebody wrote a whole poem about him.
- **Blandula:** I have seen it. For years. They set the men down one at a time, turn by turn. Then a man moves one step. Never a slide.
- **Maximus:** Blandula, you have just become our teacher.
- **Titus:** Tomorrow, then. And at noon I want a word with the man who sold me this box.
- **Narrator:** Dux slept in the open box that night, curled around the empty hollow like a very small dragon on its gold.

### Chapter 2: As Piso Played

*Setting: a Colosseum arcade at noon. The stall has vanished. The boys practise the old way under the arcade, and a polite stranger offers ten times the price.*

**Scene 1, before the game**

- **Narrator:** Noon, in the shade of a Colosseum arcade. The stew was hot, the bread was rubbed with garlic, and the stall where Titus had bought the box was gone.
- **Titus:** It was here. Right here, next to the sausage seller. A table, a red awning, a boy minding it. I did not dream it!
- **Maximus:** A stall that sells a dead man's goods and vanishes the next day. I find that more interesting than your geese.
- **Aghiles:** Then we wait. Someone may come back.
- **Maximus:** And nobody looks twice at boys playing a game. There is a board scratched into the paving here. Half the steps in Rome have one.
- **Titus:** Piso's way, as Blandula told it. Twenty men each. Pebbles will do. We set them down one by one, wherever we like, then move one step at a time.
- **Maximus:** And a man caught between two enemies is taken at once. Two men, if you close two traps together. Aghiles, will you watch the crowd?
- **Aghiles:** I always do.
- **Narrator:** Dux was given a walnut to keep him away from the pebbles. It kept him away for exactly as long as it takes to eat a walnut.

**The game: a match, Maximus against Titus.** Preset: Piso ("the old way"). White: Maximus. Match card: "Piso's way: place twenty men each, one at a time, then move a single step. Played with pebbles on a board scratched in the paving."

*If Maximus wins:*

- **Maximus:** And that is the game. Piso would have been proud. Of me, I mean.
- **Titus:** A seer walked past just as I placed my ninth man. He looked straight at me. You all saw him look.
- **Aghiles:** He was looking at your sausage.

*If Titus wins:*

- **Titus:** Victory! One step at a time, like the tortoise! Somebody write a poem. In praise of Titus!
- **Maximus:** I was playing a new game, with pebbles, on a pavement, on an empty stomach.
- **Aghiles:** He beat you, Maximus.

*If the game is drawn:*

- **Maximus:** Level. Twenty pebbles each, and nothing to show for it.
- **Titus:** Piso never had a monkey stealing his men. I count that as a win on difficulty.

**Scene 2, after the game (the same whoever won)**

- **Narrator:** A shadow fell across the board. It belonged to a neat grey man with a soft voice, and it stayed exactly where it was.
- **Sabinus:** The animal dealer's son, with the monkey. You are easy to find, young man. My name is Sabinus. I buy and sell the goods of the condemned.
- **Sabinus:** Yesterday my boy sold you a gaming box for four coins. A mistake. It has a value of sentiment. I will give you forty for it.
- **Titus:** Forty! That is, I mean, forty is, well. I do not have it with me.
- **Maximus:** Sentiment. For the furniture of a stranger who died in the arena. You must have a very large heart, Sabinus.
- **Sabinus:** And you must be the senator's son. I should hate to trouble either of your fathers over a toy. Think about my forty. I shall ask again.
- **Narrator:** He bowed and walked away through the crowd. Two large men, who had been admiring the sausage stall, walked away after him.
- **Aghiles:** Two men with him. A third by the fountain. He did not come only to bargain.
- **Narrator:** It was then that they noticed Dux. He sat in the middle of the board, chewing the corner of a small wax notebook that nobody had seen before.
- **Titus:** Dux! Where did you, whose is that, oh no. Oh, by all the gods. He has robbed him.
- **Maximus:** Good monkey. I never thought I would say those words. Give it here.

### Chapter 3: A Bound Man

*Setting: Maximus' bedroom by lamplight. Sabinus' notebook shows what he knows. Blandula explains the rule of the bound man, and somebody is watching the house.*

**Scene 1, before the game**

- **Narrator:** That evening the notebook lay open under the lamp. Sabinus wrote a small, tidy hand, and Maximus read it aloud with growing interest.
- **Maximus:** Estate of Cornelius, condemned. Bought entire. Then: his freedman says the old man hid a treasure, and the secret is in his game board. Box not found.
- **Maximus:** And here, underlined: treasure not declared to the treasury. He means to keep it for himself. That is stealing from the emperor.
- **Titus:** Never mind the emperor! Read the last line again. The line about us.
- **Maximus:** Neighbours say three boys and a monkey went in and out of the Christian's house last winter. Find them.
- **Narrator:** Nobody spoke. Last winter they had done a great deal more in that house than go in and out, and their fathers knew nothing about any of it.
- **Aghiles:** He can hurt us. We can hurt him. So he will be careful.
- **Blandula:** That is the second tablet. Bound men. In the old way, a trapped man is not taken at once. He is turned on his back, and he waits one turn.
- **Blandula:** If his friends trap one of the two who hold him, he gets up again. My master loved that rule. He said nobody is lost while a friend can still reach him.
- **Maximus:** Seneca says a man running to a fire does not stop to ask how the bound piece gets free. Now I see what he meant.
- **Aghiles:** You showed me that rule once. We never played it. Play me now, Maximus.
- **Maximus:** The old way, then. Set down one by one, one step at a time, a man may hop over a comrade, and bound men wait. Blandula, stop us when we go wrong.

**The game: a match, Maximus against Aghiles.** Preset: Seneca ("the old way, with bound men"). White: Aghiles. Match card: "The old way with bound men: a trapped piece is turned over and waits one turn for rescue. Blandula keeps both players honest."

*If Maximus wins:*

- **Maximus:** Mine. But you made me fight for every bound man. I did not enjoy that.
- **Aghiles:** It is still the rule I like best.
- **Blandula:** My master would have enjoyed watching you play, Aghiles.

*If Aghiles wins:*

- **Aghiles:** Imperator. The old way suits me.
- **Maximus:** My men were on their backs like beetles. I should like it remembered that I taught him this game.
- **Blandula:** You taught him the other game. I taught him this one.

*If the game is drawn:*

- **Aghiles:** Even.
- **Maximus:** Every time I bound one of his, he bound the one that was holding it. It is a very polite way to fight.
- **Blandula:** My master's games often ended so. He said those were the best ones.

**Scene 2, after the game (the same whoever won)**

- **Maximus:** So. Sabinus holds us, with what the neighbours saw. We hold him, with his own notebook. Two bound men, each waiting a turn.
- **Titus:** I do not want to be a bound man. I want to be a man at home in bed who never bought a box.
- **Aghiles:** Then we find it first. Whatever it is.
- **Narrator:** On the windowsill Dux gave one sharp shriek. Aghiles put out the lamp with two fingers and looked down into the dead-end street.
- **Aghiles:** One man, at the corner. He has been there since dark.
- **Maximus:** People will keep taking an interest in my window. From tonight the box goes into my chest.
- **Aghiles:** And I sleep here.
- **Narrator:** The second tablet would have to wait. It is hard to solve a problem with a stranger watching the house.

### Chapter 4: Where They Met

*Setting: Maximus' bedroom by lamplight. The second problem: free the bound man. Shelf three, and Blandula remembers where two old men first met.*

**Scene 1, before the game**

- **Narrator:** The watcher was back the next evening. So were the four of them, with the shutters closed and the second tablet in the middle of the table.
- **Maximus:** The second. The old way, with bound men. White has a man down. Free him with one move. Then count only the enemy still on their feet.
- **Titus:** A man on his back between two blue ones. One turn, and he is gone. Why did the old man draw such sad problems?
- **Blandula:** They were his favourite kind. Saving one.
- **Maximus:** Aghiles. This one is yours.
- **Aghiles:** Why mine?
- **Maximus:** Because last winter you were the one who would not leave a man lying in the dark. You have had the practice.
- **Narrator:** Aghiles said nothing. He bent over the board, as still as a hunter over a track.

**The game: problem p2, "The Second Tablet: The Bound Man".** Preset: Seneca ("the old way, with bound men"). Solver: Aghiles. Goal: "White frees the bound man with one move."

*If the problem is solved:*

- **Aghiles:** Over his comrade, and down beside the captor. Now the captor is the one bound. Our man gets up.
- **Titus:** He jumped! Straight over his own friend's head! That is allowed? I want to do that.
- **Maximus:** Now count the blue still on their feet. Three strokes, side by side. Three. Door five, shelf three.

*If the player gives up or fails:*

- **Aghiles:** No. That only blocks the way. He is still bound.
- **Blandula:** May I? This man, at the back. He can hop over his comrade. See where he comes down.
- **Aghiles:** Beside the captor. Yes. Thank you. Our man gets up.
- **Maximus:** And the blue still on their feet make three strokes, side by side. Three. Door five, shelf three.

**Scene 2, after the game (the same whoever won)**

- **Titus:** Door five, shelf three. It is in a cupboard! The treasure is in a cupboard! Whose cupboard?
- **Maximus:** There is one more line, very small. You know the house. It is where we met.
- **Blandula:** Where they met. Oh. I know that story. He told it every year.
- **Blandula:** It was at the baths, in the library. Two old men reaching for the same scroll. They argued for an hour, and were friends ever after.
- **Blandula:** I went there once, to carry his cushion. The walls are all little doors, with numbers painted above them.
- **Maximus:** By Jupiter. The library. Titus and I walk past those cupboards every week.
- **Titus:** He hid a treasure in a library? Nobody goes in there on purpose! Present company excepted.
- **Aghiles:** And the third tablet. The place.
- **Maximus:** The third needs a general, and our general is missing. Tomorrow, the library. We look first and worry afterwards.
- **Narrator:** On the windowsill Dux yawned, showed all his sharp little teeth, and looked exactly like a monkey with a clear conscience.

### Chapter 5: The Wrong General

*Setting: the atrium of Titus' house. The library shelf holds forty scrolls and a spy. Titus teaches the sailors' game with a walnut general, and Sabinus sets a deadline.*

**Scene 1, before the game**

- **Narrator:** Titus' house, the next afternoon. In the atrium the fountain splashed, and across the mosaic floor prowled a rhinoceros, a crocodile and one small monkey.
- **Maximus:** Fifth cupboard, third shelf. Forty scrolls in a row, all tagged Reports on the Drains of Rome. We could not unroll forty with the librarian watching.
- **Titus:** And two benches away sat a man reading a scroll he was holding upside down. One of the sausage admirers.
- **Aghiles:** So now Sabinus knows the house. Not the shelf.
- **Maximus:** And we know the shelf, not the place. That is the third tablet: the long game from Britain, with a general nobody can take. And we have no general.
- **Titus:** Generals I know. The sailors who bring my father's crocodiles from Egypt play a general's game on deck. They gave me a board.
- **Titus:** A small board. You set your men down two at a time. One step each. The general can leap over an enemy. And if you take a man, you move again.
- **Maximus:** That is not the tablet's game.
- **Titus:** It is a general's game, and the box is locked in your chest. This walnut is the general. Sit, Aghiles. I command a general every day of my life.
- **Narrator:** Dux looked at the walnut general with deep professional interest.

**The game: a match, Titus against Aghiles.** Preset: Bell's Dux ("the sailors' game"). White: Aghiles. Match card: "The sailors' game: a small board, men placed two at a time, a leaping general, and another move after every capture. The general is a walnut."

*If Titus wins:*

- **Titus:** The walnut general is victorious! I trained him myself. Hail me, somebody.
- **Aghiles:** Hail, Titus. Your general is being eaten.
- **Titus:** Dux! Spit him out! That is a commanding officer!

*If Aghiles wins:*

- **Aghiles:** Take a man, move again. I like the sailors' game.
- **Titus:** My general was a walnut. His heart was not in it. And I came into this atrium left foot first. I remember it now.
- **Maximus:** You live here. You come into it forty times a day.
- **Titus:** Then think how the bad luck has piled up!

*If the game is drawn:*

- **Aghiles:** Even. Neither army is the larger.
- **Titus:** My general was holding back. Walnuts are cautious by nature.
- **Maximus:** Yours is also missing. Ask your monkey.

**Scene 2, after the game (the same whoever won)**

- **Narrator:** The steward came to say that a gentleman was at the door, about a box. The gentleman had not waited to be shown in.
- **Sabinus:** A charming house. Your father is at the docks, I hear, so we may speak freely. I have lost a notebook, and I am out of patience.
- **Sabinus:** Tomorrow at noon I come back with forty coins. I leave with the box, the board, every counter and every tablet. Or I begin to talk.
- **Sabinus:** To your father, about what his son buys. And to certain officers, about three boys who were seen so often at the house of a Christian.
- **Titus:** We were, that was, we only, Maximus! Tell him!
- **Aghiles:** Maximus. One word, and I show him the door.
- **Maximus:** No. Sabinus, you shall have it. Tomorrow at noon, here. The box, the board, every counter and every tablet that Titus bought from you.
- **Sabinus:** Sensible. I do so prefer sensible boys.
- **Narrator:** When he had gone, Titus sat down on the edge of the fountain and held his amulet in both hands.
- **Titus:** You gave in. Just like that. You never give in. It is one of the worst things about you.
- **Maximus:** I promised him everything you bought. You never bought a general. And I copied all three tablets the first night. Now, who has that piece?

### Chapter 6: The General's Hoard

*Setting: the atrium of Titus' house. Titus buys the missing general back from his own monkey and solves the third problem. Under the general is a fish. At noon the box changes hands.*

**Scene 1, before the game**

- **Narrator:** Morning in the atrium, and three hours until noon. The box stood on the fountain's edge. They had searched it, and Titus, and half of Titus' house.
- **Aghiles:** The hollow was empty when Titus opened the box. But there was no dust in it. The piece was taken that same day.
- **Maximus:** Taken at the stall, then. By someone small, quick, and fond of shiny things.
- **Narrator:** Three boys turned and looked at the monkey. The monkey looked at the fountain.
- **Titus:** Dux. General. Old friend. I have here a whole purse of seeds. Bring me what you took, and it is yours. That is my final offer.
- **Narrator:** Dux thought it over. Then he slipped behind the fountain and came back with a walnut. Titus paid. A brooch pin. Titus paid. A stylus.
- **Maximus:** My stylus! I have been looking for that for a month!
- **Narrator:** The purse was nearly empty when Dux brought out the last thing, slowly, in both hands: a general of amber glass, as big as a walnut.
- **Titus:** The general had the general all along. Dux, you are a thief and a traitor, and I have never been so proud of you.
- **Maximus:** Turn the board over. A second face, twelve squares by eight. As the legions play in Britain, the tablet says. The general cannot be taken, only shut in.
- **Maximus:** White shuts in the blue general in two moves. He is your general, Titus. You do it.
- **Titus:** Me? Now? With that man coming at noon? Very well. Stand back. Give me room. Nobody breathe on the board.

**The game: problem p3, "The Third Tablet: The General Shut In".** Preset: Stanway ("the long game from Britain"). Solver: Titus. Goal: "White shuts in the blue general in two moves."

*If the problem is solved:*

- **Titus:** First I take his last free man. Now his guard has to move, there is nothing else. And I step into the gap. Shut in, by his own bodyguard!
- **Maximus:** That was good, Titus. I mean it. Now count his square from the left.
- **Titus:** One, two, three, four, five, six, seven. The seventh place. And then it says: turn him over.

*If the player gives up or fails:*

- **Titus:** He keeps slipping out! A general nobody can take is against nature. The signs are all wrong for this.
- **Aghiles:** Do not chase the general. Take the last blue man who can still move. Then the guard must step aside.
- **Titus:** And I step into the gap! Shut in! I was about to see that. Seventh square from the left. And then it says: turn him over.

**Scene 2, after the game (the same whoever won)**

- **Narrator:** Titus turned the amber general over. On the flat underside, scratched very fine, was a small fish.
- **Titus:** A fish. He hid a treasure and signed it with his dinner.
- **Aghiles:** I have seen that fish. Painted on a wall, underground, by the Appian Way. Where Blandula's master is buried.
- **Narrator:** Nobody said the word. Nobody needed to. Whatever lay in the seventh place belonged to the people Rome was hunting.
- **Titus:** I am not going to spit. I want it noted that I thought about spitting three times, and did not.
- **Maximus:** Then here is the plan. At noon Titus and I are here, being sensible boys. Sabinus and his men will be watching the two of us.
- **Aghiles:** And nobody will be watching me. I will ask Blandula to come. She knows the doors, and a fish needs no reading.
- **Narrator:** At noon Sabinus came. He counted every counter, frowned at the empty hollow, and was told, quite truthfully, that it was empty when the box was bought.
- **Sabinus:** If this is a trick, boy, remember what I know about you.
- **Maximus:** And remember what your notebook knows about you. Treasure, not declared. We are two bound men, Sabinus. Leave us alone, and we lie still.
- **Narrator:** Sabinus looked at him for a long moment. Then he counted forty coins into Titus' hand, took the box under his arm, and left without bowing.
- **Titus:** Bought for four, sold for forty. Say what you like about today. That is good business.

### Chapter 7: The Waiting Game

*Setting: Maximus' bedroom by lamplight. Maximus and Titus play the long game while they wait for Aghiles and Blandula. Then the treasure is on the table, and three boys must decide what to do with it.*

**Scene 1, before the game**

- **Narrator:** Evening came, and no Aghiles. The lamp was lit, and still no Aghiles. In Maximus' room two boys watched the door and pretended not to.
- **Titus:** They should be back. The library shuts at dusk. What if somebody asked why a lady's maid wants a book about drains?
- **Maximus:** Do not worry about Aghiles. He has a way of arriving.
- **Narrator:** He had said much the same once before, last winter, and then waited three days. He did not mention that.
- **Titus:** Play me. If I sit still I shall chew through my amulet. The long game, with the general. We still have the general.
- **Maximus:** Twelve by eight, chalked on my table. My mother will ask about the chalk. Men on the back row, general in front, straight lines as far as you like.
- **Maximus:** Nobody takes a general. You win by shutting him in. A walnut for the second general. Dux, that walnut is on duty.
- **Narrator:** Once before they had played a game while they waited for this same friend. It had not made the time pass any faster then, either.

**The game: a match, Maximus against Titus.** Preset: Stanway ("the long game from Britain"). White: Titus. Match card: "The long game of the third tablet: twelve by eight, with a general who cannot be taken, only shut in. Played to pass the time until Aghiles comes back."

*If Maximus wins:*

- **Maximus:** Won. My general sends yours his regards.
- **Titus:** I was listening for the door. Nobody can command an army and listen for a door. Ask any general.

*If Titus wins:*

- **Titus:** Victory! Maximus, your general may surrender to mine. I am the terror of Britain!
- **Maximus:** I was listening for the door.
- **Titus:** So was I. I simply did it better.

*If the game is drawn:*

- **Maximus:** Neither general shut in, and I have lost count of the moves. Call it level.
- **Titus:** Agreed. My mind was on the stairs anyway.

**Scene 2, after the game (the same whoever won)**

- **Narrator:** Then came steps on the stairs, one pair heavy and one light. Aghiles ducked through the doorway with a leather scroll case under his arm.
- **Aghiles:** Fifth door. Third shelf. Seventh place. A tag about drains, and a small fish in the corner.
- **Blandula:** Two servants on an errand. Nobody looked at us twice. We might have been furniture.
- **Narrator:** Maximus unrolled the first scroll under the lamp, then a second, then a third. He was quiet for some time.
- **Maximus:** Letters. A book of songs. The story of a life, set down by a man called Mark. And names, Titus. The letters are full of names. All of it is forbidden.
- **Titus:** No gold? Not one coin? This is what he called his treasure?
- **Blandula:** He gave his gold away. These he hid. I think he meant exactly what he said.
- **Maximus:** The law is plain. These are to be handed in and burned. Whoever keeps them is a criminal, and my father's name is on this house.
- **Titus:** Burn a god's books? Anybody's god? Not while I am in the room. That is how a house gets struck by lightning.
- **Aghiles:** They are not ours to burn, and not ours to keep. A man hid them in his last days. Somebody is missing them.
- **Aghiles:** Last winter a man with a hay cart stopped on the road when everyone else walked past. We do not walk past.
- **Maximus:** Give them back to whom? We cannot knock on doors and ask who is a Christian.
- **Blandula:** I think I know someone who would know someone. Please do not ask me who.
- **Maximus:** Then I am not asking. I never saw these. Titus?
- **Titus:** Saw what?
- **Narrator:** Dux climbed down from the shelf and laid the amber general on top of the scrolls. It was the only thing he ever gave back without being paid.
- **Narrator:** That night Blandula carried the case down the back stairs to a slave named Flavia, who asked her only one thing: were you followed?
- **Narrator:** So the old magistrate's treasure spent that winter under the roof of Senator Julius Claudius. The senator never knew. Neither did his son.

### Epilogue: Imperator

*Setting: a Colosseum arcade at noon. Lunch under the arcade, news of Sabinus, and the last game of a round-robin for the title of imperator. Dux crowns the winner.*

**Scene 1, before the game**

- **Narrator:** Some days later, at noon, three friends sat in the shade of the Colosseum with a pot of stew and a board scratched in the paving.
- **Narrator:** The stew seller had news. A dealer called Sabinus had spent four days in the library at the baths, unrolling every scroll in the fifth cupboard.
- **Maximus:** Every report on the drains of Rome. He must be the best informed man in the city.
- **Aghiles:** In the seventh place I left him a walnut.
- **Titus:** You did what? Aghiles! That is the funniest thing you have ever done, and you kept it to yourself for days?
- **Narrator:** Then to business. Three players, three games, each against each, for the title of imperator. The loser would buy the sausages.
- **Narrator:** Titus had already played both of his games, and preferred not to discuss them.
- **Titus:** A crow called three times on my left as I came out of the door. I said then that it would cost me. Nobody listens.
- **Maximus:** So it comes down to the last game. Aghiles and I. Whoever wins is imperator.
- **Aghiles:** As the soldiers play. The way we began.
- **Titus:** Look at us. Playing for an empire with pebbles on a pavement. One day I shall own a proper set. Marble. Too heavy for a monkey to carry off.
- **Narrator:** Maximus said nothing. But he looked at Titus for a moment, the way he looked at a board when he had just seen a good move.

**The game: a match, Maximus against Aghiles.** Preset: Legionary ("as the soldiers play"). White: Maximus. Match card: "The deciding game of the round-robin. Titus has lost both of his; whoever wins this one is imperator."

*If Maximus wins:*

- **Maximus:** Imperator! By Jupiter, at last. Rome may kneel.
- **Aghiles:** Hail, Maximus. That was a good game.
- **Narrator:** Dux sprang from Titus' shoulder onto the pale head of the new emperor, and sat there like a crown that scratched.
- **Maximus:** Titus. Remove your monkey.
- **Titus:** An emperor does not take off his crown. Ask Aghiles. He wore it first.

*If Aghiles wins:*

- **Aghiles:** Imperator. Twice now. I begin to like the word.
- **Maximus:** Hail, Aghiles. Fairly won. Though when you tell this story, Titus, remember who taught him.
- **Narrator:** Dux knew the way. He sprang onto Aghiles' head and settled there, a crown for the second time.
- **Titus:** He never does that for me. Not once. And I am the one who feeds him!

*If the game is drawn:*

- **Maximus:** I have counted three times. Level. Two emperors.
- **Aghiles:** Rome has four already. Who will notice two more?
- **Narrator:** Dux looked from one emperor to the other, turned his back on both, and sat down firmly on the head of Titus.
- **Titus:** The general has chosen! Imperator by vote of the army! Hail me! Stop laughing and hail me!

**Scene 2, after the game (the same whoever won)**

- **Titus:** Sausages, then. I am paying, it seems. Out of my forty coins.
- **Maximus:** Thirty-six. You paid four for the box.
- **Narrator:** They ate in the shade and argued about the game. They did not talk about a leather case, or a fish, or an old man they had never met.
- **Narrator:** Somewhere in Rome an old man with ink on his fingers turned an amber general over in his hand, and knew his friend had kept their game after all.
- **Narrator:** And under the arcade, three brigands and a monkey began to set out the pebbles again.

## The three problems

Squares are given as files a, b, c and so on from White's left, and ranks 1, 2, 3 and so on from White's side. They are candidates that I worked out on paper, not positions tested in the engine. Each needs checking with the engine's own solver, and the squares can move freely as long as the goal, the number of moves and the final picture stay the same.

### p1. The First Tablet: Two at a Stroke

- **Preset:** legionary
- **Goal:** White takes two blue men with a single move.
- **Position and idea:** Board eight by eight, soldiers' rules (rook slides, immediate capture, more than one capture per move, entering between two enemies is safe). One move. Blue stands in the shape of an X: a five-man chevron b7, c6, d5, e6, f7 plus two "legs" at c4 and e4. White has men at b4 and f4 beside the legs and a man at d1 with the d-file clear to d4. The key is d1 to d4: the man slides between the two legs, where he looks trapped but is safe, and closes both traps at once (b4-c4-d4 and d4-e4-f4). Add two or three white decoys that can take only one leg, and no other double capture. If the legionary preset does not allow two captures with one move, switch that rule on for this problem only.
- **What the final picture reveals:** Before the move the blue men read as X, ten, which Titus announces too early. After it the legs are gone and the blue men read as V, five: the fifth door (cupboard five in the library of the baths).

### p2. The Second Tablet: The Bound Man

- **Preset:** seneca
- **Goal:** White frees the bound man with one move.
- **Position and idea:** Board eight by eight, the old way with bound men (one step, hops over a friendly piece, a trapped piece is turned over and removed next turn unless one of its captors is trapped first). One move. A white man lies bound at c4 between blue captors at b4 and d4. White has a man at b3 below the first captor, and two men on the b-file at b6 and b7. The key is the hop b7 over b6 to b5: the captor at b4 is now trapped between b5 and b3, is turned over, and the white man at c4 is freed at once. Stepping moves that merely block must not work, and the other captor (d4) must not be trappable. The blue men still upright afterwards are three two-man columns: d4 and d5, f4 and f5, h4 and h5. The flipped captor at b4 does not count.
- **What the final picture reveals:** Counting only the blue men still on their feet gives three upright strokes, the numeral three: the third shelf. A last line on the tablet, "It is where we met", lets Blandula name the place: the library at the baths.

### p3. The Third Tablet: The General Shut In

- **Preset:** stanway
- **Goal:** White shuts in the blue general in two moves.
- **Position and idea:** Board twelve by eight (files a to l), the long game with a general who cannot be captured and is beaten when all four sides are blocked, walls and his own men included, as long as an enemy completes the block. Two white moves, forced by zugzwang. Blue general at g8 on the far wall, with his own men at f8 and h8 and a guard at g7. White men at e8, i8, f7 and h7 freeze f8 and h8 and stand either side of the guard; a white man at g5 leaves the guard only the step to g6. Blue has one free man at c4, with a white man at c3 below it and a white man at c7 above with c6 and c5 empty. Move one: c7 to c5 captures the free man. Blue's only legal move is now the guard g7 to g6. Move two: f7 (or h7) steps to g7 and the general, between his own two men under the wall, cannot move. Put the white general somewhere harmless if the preset needs both generals. This assumes a player must move when able; if the engine allows passing, replace it with a one-move problem that ends on the same square.
- **What the final picture reveals:** The general ends shut in on the seventh square from the left: the seventh place on the shelf. Turning the real amber general over shows a small fish scratched underneath, the mark on the right scroll tag, and the sign that the treasure belongs to the Christians.

## Appendix A: tutorial lines

A flashback to earlier in 303: Maximus and Titus teach Aghiles in Maximus' bedroom. The player makes Aghiles' moves. The words never name a square, so the positions can be built freely.

### Lesson `move`: Straight Lines

*Pieces slide in straight lines, as far as the way is clear, and never jump or move slantwise.*

- **Narrator:** Earlier that year, in Maximus' room. A board, two heaps of counters, and Aghiles, who had never played.
- **Maximus:** It is called latrunculi. Little brigands. Two armies, no dice, no luck. Only thinking.
- **Titus:** No luck! Listen to him. There is always luck. I never play without my amulet.
- **Aghiles:** How do they move?

Step `move_1`

- **Maximus:** In straight lines. Forward, back, left or right, as far as the way is clear.
- **Maximus:** Take the white man with the open road in front of him, and slide him forward.
- *If wrong:*
- **Maximus:** Not quite. Straight up the board, along the open road.
- *If right:*
- **Aghiles:** Like a spear thrown straight.
- **Maximus:** Exactly like that.

Step `move_2`

- **Aghiles:** Can he go slantwise? Or over another man?
- **Maximus:** Neither. Try it. Send this man as far as he can go. He must stop before the piece in his way.
- *If wrong:*
- **Titus:** No, no. He cannot jump, and he cannot go slantwise. He is a soldier, not a monkey.
- *If right:*
- **Maximus:** Good. He stops where the road is blocked.

Wrap-up

- **Titus:** My father says elephants walk in straight lines too. Through walls, if they must. He does not sell elephants. The emperor keeps those.
- **Aghiles:** And the game?
- **Maximus:** Straight lines, as far as you like, no jumping. That is all there is to moving.

### Lesson `capture`: Between Two

*Trap one enemy between two of your men in a straight line and he is taken. Only the piece that moves makes the capture.*

- **Aghiles:** How do I take a man?
- **Maximus:** You trap him. One of yours on each side of him, in a straight line. Then he comes off the board.
- **Titus:** A twin foe, the poets call it. Two of yours, one of theirs in the middle. Like a sausage in bread.

Step `capture_1`

- **Maximus:** One of your men already stands beside that blue one. Bring a second man to his other side.
- *If wrong:*
- **Maximus:** He is not trapped yet. Your two men must stand on opposite sides of him, in one straight line.
- *If right:*
- **Aghiles:** Taken.
- **Titus:** By Pollux, he says it like a hunter. Taken!

Step `capture_2`

- **Maximus:** One thing more. Only the man who moves does the taking. Men who stand still take nobody.
- **Maximus:** So a trap must be closed by a move. Close this one.
- *If wrong:*
- **Titus:** That closes nothing! Move a man in beside him, on the open side.
- *If right:*
- **Maximus:** There. The move closes the trap, and the trap takes the man.

Wrap-up

- **Aghiles:** So I need two. Always two.
- **Maximus:** Always two. A man alone takes nobody.

### Lesson `corner`: Corners

*A man in a corner has only two open sides: two enemies on those sides take him.*

- **Titus:** Never hide in a corner. I learned that from a tiger. Well, from watching a tiger. From a safe distance.
- **Aghiles:** Why not? Two walls guard him.
- **Maximus:** Two walls hold him. A man in a corner has only two open sides. Close both, and he is taken.

Step `corner_1`

- **Maximus:** That blue man sits in the corner, and one of yours is beside him. Close his other open side.
- *If wrong:*
- **Maximus:** His other open side. Right next to him.
- *If right:*
- **Aghiles:** The walls did half my work.
- **Maximus:** They did. Remember it when you are the one in the corner.

Wrap-up

- **Titus:** Corners are unlucky. So are thresholds, crows, and getting up on the left foot. I could go on.
- **Aghiles:** Stay out of corners. I have it.

### Lesson `safe`: Walking In

*A man who moves in between two enemies is safe, and from there he can threaten both.*

- **Aghiles:** If I move my own man between two of theirs. Is he taken?
- **Maximus:** No. That is the clever part. They did not close a trap. You walked in. So it is no trap at all.
- **Titus:** It is like walking into my father's tiger pen on purpose. The tiger is too surprised to bite. Do not try that, by the way.

Step `safe_1`

- **Maximus:** Try it. Put your man in the gap between those two blue ones.
- *If wrong:*
- **Maximus:** Into the gap, between the two of them. He is safe there. I promise.
- *If right:*
- **Aghiles:** He stands. Nothing happens.

Step `safe_2`

- **Maximus:** Now make it a weapon. Find the gap where your man is safe and threatens both of his neighbours at once.
- *If wrong:*
- **Titus:** Safe, yes, but he frightens nobody there. Try the other gap.
- *If right:*
- **Maximus:** He looks caught, and he threatens two. An old poem praises exactly that move.

Wrap-up

- **Aghiles:** Walk in. Do not get walked around.
- **Maximus:** I could not have put it shorter.

### Lesson `fork`: The Fork

*One move that threatens two captures at once: your opponent can save only one piece.*

- **Maximus:** Now the best trick in the game. One move, two threats.
- **Aghiles:** And he can answer only one.
- **Maximus:** You see it already. He saves one man, and you take the other.
- **Titus:** I invented that. Well, I use it. Often. Sometimes.

Step `fork_1`

- **Maximus:** Find the move that threatens two blue men at the same time.
- *If wrong:*
- **Maximus:** That threatens only one, and he simply walks away. Look for the square that looks at two.
- *If right:*
- **Aghiles:** Two tracks. He cannot follow both.
- **Titus:** By all the gods, he is going to be good at this. I do not like it.

Wrap-up

- **Maximus:** So before every move, ask yourself: can I make two threats instead of one?

### Lesson `pairs`: Side by Side

*Men standing side by side cover each other; a man alone in the open is a target.*

- **Titus:** Now my speciality. Defence. Keep your men in pairs, side by side.
- **Aghiles:** Why?
- **Titus:** To trap a man they need the square beside him. If your own man is standing on it, they cannot have it.
- **Maximus:** A whole block of men is called a phalanx. It is very hard to break.

Step `pairs_1`

- **Titus:** Look at the white army. One man has no neighbour. Show me which.
- *If wrong:*
- **Titus:** No, he has a friend beside him. Look for the lonely one.
- *If right:*
- **Aghiles:** That one. Alone, in the open.
- **Titus:** Poor fellow. The poets say a man without his partner has to fight alone.

Step `pairs_2`

- **Titus:** Now save him. Bring a friend to his side, or bring him home to his friends.
- *If wrong:*
- **Maximus:** He can still be trapped along that line. Cover his open side.
- *If right:*
- **Titus:** Safe! Side by side, like sausages on a string.
- **Aghiles:** Like hunters. Nobody goes alone.

Wrap-up

- **Maximus:** Attack with forks. Defend in pairs. That is half the game.

### Lesson `placement`: The Empty Board

*In some rules the board starts empty and the players take turns placing their men.*

- **Maximus:** Not everyone starts with the men in rows. In the old way, the board begins empty.
- **Titus:** The sailors on my father's animal ships play like that. You set your men down in turn, wherever you please.
- **Aghiles:** Anywhere?
- **Maximus:** Any empty square. Nobody is taken while the men are being set out. The fighting starts afterwards.

Step `placement_1`

- **Maximus:** Place a man. Think about where his friends are standing.
- *If wrong:*
- **Maximus:** Not there. Choose an empty square, close to a friend.
- *If right:*
- **Aghiles:** Beside his friend. Away from the corner.
- **Maximus:** You are learning faster than I like.

Wrap-up

- **Titus:** I always place my first man with my right hand. Some things are not worth the risk.

### Lesson `bound`: The Bound Man

*In the old rules a trapped piece is turned over and removed a turn later, unless a friend traps one of its captors first.*

- **Maximus:** There is an older rule. I have only read about it. A trapped man is not taken off at once.
- **Maximus:** He is turned on his back. Bound, they say. Alligatus. And there he waits, for one turn.
- **Aghiles:** And then?
- **Maximus:** Then he is taken off. Unless his friends trap one of the two who hold him. Then he is free.
- **Titus:** Seneca wrote about it. Or Cicero. One of the bald ones.

Step `bound_1`

- **Maximus:** First, bind a man. Trap that blue one between two of yours.
- *If wrong:*
- **Maximus:** One on each side of him, in a line. The same as any other trap.
- *If right:*
- **Aghiles:** He is on his back.
- **Maximus:** Bound. On your next turn you may lift him off.

Step `bound_2`

- **Maximus:** Now it is your man who is bound. You have one turn to save him. Trap one of his two captors.
- *If wrong:*
- **Titus:** That does not free him! Go for one of the two who are holding him down.
- *If right:*
- **Aghiles:** He gets up.
- **Maximus:** And his captor lies down in his place. That is the whole beauty of it.

Wrap-up

- **Aghiles:** I like this rule. A man down is not a man lost.

### Lesson `dux`: The General

*Some rules add a general. In the long-board game he cannot be captured: you win by blocking all four of his sides.*

- **Maximus:** One more. An officer back from Britain showed it at one of my father's endless dinners. A long board, and each side has a general.
- **Titus:** Dux! Like my Dux. Only better behaved.
- **Aghiles:** What does the general do?
- **Maximus:** He cannot be taken. Ever. You win by shutting him in: all four sides blocked, so that he cannot move a step.
- **Maximus:** Walls count. Even his own men count, as long as one of yours finishes the job.

Step `dux_1`

- **Maximus:** The blue general has one open side left. Close it.
- *If wrong:*
- **Maximus:** He can still step out. Find his last open side.
- *If right:*
- **Aghiles:** Shut in. Partly by his own guards.
- **Titus:** Poor general. Dux, do not look. It is too sad.

Wrap-up

- **Maximus:** So in that game, guard your own general's last door. And look for the enemy's.

### Lesson `endings`: How It Ends

*A game ends when one army is taken or cannot move; otherwise the pieces are counted when no capture is left or the move limit runs out, and the larger army wins.*

- **Aghiles:** How do I win?
- **Maximus:** Take every man, or leave him none that can move. If nobody can take any more, we stop and count. The larger army wins.
- **Titus:** And if a game drags on for ever, there is a limit of moves. Then we count as well.
- **Maximus:** A Roman named Julius Canus was called away to his death in the middle of a game. He counted the pieces first, to prove he was ahead.
- **Titus:** That is the most Roman thing I have ever heard.

Step `endings_1`

- **Maximus:** One capture is left on this board. Take it, and then we count.
- *If wrong:*
- **Maximus:** Not that. Find the last capture first. Then we count the armies.
- *If right:*
- **Aghiles:** I have more men. So I win.
- **Maximus:** You do. And the winner takes a title: imperator.

Wrap-up

- **Aghiles:** Imperator.
- **Titus:** Do not get used to that word. I have played for years. Nobody beats me after a few lessons.
- **Narrator:** It took a little longer than a few lessons. But Aghiles did beat him, and Titus still blames the omens.

## Appendix B: banter

Lines the boys say during any game. Only `bind`, `freed`, `duxPieceThreat`, `extraMove` and `placement` assume a rule preset. No line assumes a setting, a story chapter, or that the third boy is present. The `duxPieceThreat` lines are worded to fit whichever general is in danger.

**gameStart**

- **Maximus:** Let us begin. Try to make it last, I have not eaten yet. / Sharp eyes and a clear head. That is all this game asks. / I shall be gentle. No, I shall not. Your move. / Whoever thinks furthest ahead wins. I have a head start.
- **Titus:** Right foot first this morning. You are already beaten. / Wait. Let me touch my amulet. There. Now we begin. / I have played this game for years. Years! Prepare yourself. / No sneezes today, no crows on my left. The gods are with me.
- **Aghiles:** Ready. / Let us begin. / A hunter waits. Then he does not. / Good luck. You will want it.

**capture**

- **Maximus:** Between two of mine. Off he goes. / One prisoner. Thank you, I was collecting those. / You left him alone. I did warn you. In my head. / Caught by a twin foe, as the poet says.
- **Titus:** Ha! Caught! Off the board with you, little brigand. / By Pollux, got him! Did everyone see that? / One for me! Feed him to my father's crocodiles. / Trapped between two! I planned that. Mostly.
- **Aghiles:** Taken. / He was alone. / One less. / I saw the gap.

**captureMulti**

- **Maximus:** Two at one stroke! By Jupiter, that was pretty. / Both my hands are rattling with prisoners.
- **Titus:** Two! Two at once! Somebody fetch a poet! / By all the gods, a whole handful! I am magnificent.
- **Aghiles:** Two. With one move. / Both of them. Good.

**captured**

- **Maximus:** Hm. I saw that. Slightly after you did. / Take him. He was the slow one anyway. / A small loss. I refuse to call it a mistake. / By Jupiter. That one I needed.
- **Titus:** No! Not him! He was my favourite! / That was the omens. I felt a sneeze coming all morning. / You viper! He had a family! / I meant to lose that one. It is called strategy.
- **Aghiles:** Hm. / My mistake. Not again. / You saw it first. / Fair. He was mine to guard.

**fork**

- **Maximus:** Two threats, one move. You may save one. Choose. / He looks trapped, and he traps two. Which will you keep? / Left or right? Take your time. Neither is the answer. / I do enjoy a move that asks two questions.
- **Titus:** Two of yours in danger at once! Choose, if you dare. / Aha! Which one will you save? You cannot save both. / A double threat! My father would weep with pride. / Left one or right one? Either way I take one!
- **Aghiles:** Two tracks. You can follow only one. / Save one. I take the other. / Choose. / Both are in reach. Decide.

**oppBlunder**

- **Maximus:** Are you certain? No, do not answer. Thank you. / That was generous. I accept. / I would say you planned that, but I have met you. / A gift. And it is not even my birthday.
- **Titus:** Oh, thank you! The gods have clouded your eyes. / You did not mean that. You did? Wonderful. / Ha! Even Dux saw that mistake. / A gift from Jupiter himself. I accept.
- **Aghiles:** You left the door open. / Thank you. / Careless. / Are you sure? Too late.

**myBlunder**

- **Maximus:** No. Wait. Oh, by Jupiter. / That was hunger, not judgement. Somebody bring bread. / Pretend you did not see that. No? Pity. / A deliberate sacrifice. I shall work out why later.
- **Titus:** No, no, no. I spat three times and still it happened. / That was not me. A spirit pushed my hand. / I knew it. I should never have got up left foot first. / Forget you saw that. By Pollux, what was I thinking?
- **Aghiles:** Wrong. / I moved too fast. / That was foolish. Mine. / A bad step.

**bind**

- **Maximus:** Bound. On his back he goes. One turn to save him. / Alligatus, as Seneca calls him. Tied and waiting.
- **Titus:** Bound! On his back like a beetle. Alligatus! / Tied up tight. One more turn and he is mine.
- **Aghiles:** Bound. He waits. / On his back. One turn.

**freed**

- **Maximus:** And he is on his feet again. Never count a bound man lost. / Rescued. That is two of your moves wasted, I believe.
- **Titus:** Free! He is up! The amulet works, I told you. / Rescued! Nobody leaves a man of mine lying down.
- **Aghiles:** He is up again. / I do not leave a man down.

**duxPieceThreat**

- **Maximus:** The general is running out of room. One more side. / Three sides closed. A general should always keep a door open.
- **Titus:** The general is nearly shut in! Nobody breathe. / One door left for the general. Oh, I cannot look.
- **Aghiles:** The general has one way out. / Almost shut in.

**extraMove**

- **Maximus:** A capture, and I move again. Do sit down. / Another move for me. This rule and I are friends.
- **Titus:** I took one, so I go again. I love this rule. / Again? Me again! Jupiter is generous today.
- **Aghiles:** I move again. / Once more.

**longThink**

- **Maximus:** Take your time. Rome was not built in a day. Nearly, though. / I could walk to the baths and back before you move. / The pieces will not move themselves. I have checked. / Shall I send for supper while we wait? I am serious.
- **Titus:** Take your time. I shall just grow a beard here. / Are you asleep? Dux, poke him. No, do not poke him. / My father has sold a rhinoceros faster than this. / Any day now. The crocodiles are getting hungry.
- **Aghiles:** Take your time. / I can wait. I am good at waiting. / The board will not change. / Still thinking?

**ahead**

- **Maximus:** I am ahead on prisoners. Not that I am counting. I am counting. / My phalanx is nearly whole. Yours has seen better days. / This is going rather well. Do not tell me I said so. / More men, better squares. I like my side of the board.
- **Titus:** I am winning! Say it. Say Titus is winning. / Look at my army. Now look at yours. Ha! / The omens said today was my day. The omens never lie. / More men than you! I may even enjoy this.
- **Aghiles:** I have more men. / It goes well. / My line holds. / You are running out of men.

**behind**

- **Maximus:** I am behind. Outnumbered only means think harder. / Fewer men, same brain. This is not over. / Enjoy your lead. I intend to borrow it. / A bad start. I have talked my way out of worse.
- **Titus:** This is bad luck. A crow looked at me at breakfast. / I am not losing. I am luring you in. / Fewer men, yes. But braver ones. / Wait. I must spit three times. There. Now watch.
- **Aghiles:** Fewer men. Enough. / I have been outnumbered before. / Not finished. / Then I must be careful.

**endgame**

- **Maximus:** Few men left. Now every move matters. / Count the pieces, as Julius Canus did. It will be close.
- **Titus:** So few left. My heart cannot stand it. / Every man counts now. Guard them like gold.
- **Aghiles:** Few left. Now we hunt. / The end is where I am best.

**win**

- **Maximus:** And that is that. Brains over everything. / Victory. I shall try to be unbearable for only an hour. / A good game. I enjoyed the end of it most. / Won. Now, has anyone seen anything to eat?
- **Titus:** Victory! Salute me! Lower. Lower. Perfect. / I won! The right foot never fails! / By Pollux, what a game. Mostly my half of it. / Winner! I shall tell my father. And the crocodiles.
- **Aghiles:** Won. / A good game. Thank you. / Patience wins. / That is the end.

**lose**

- **Maximus:** Beaten. Fairly. I dislike how fairly. / Well played. I shall go over every move tonight. / I lost? Let me count again. No. I lost. / You earned it. Do not make that face. Again tomorrow.
- **Titus:** It was the omens. I sneezed on waking. I said so. / Somebody moved my amulet. This does not count. / Beaten. I shall sulk for exactly one hour. / Fine. You won. Tomorrow I rise right foot first.
- **Aghiles:** You won. Well played. / I learn more from losing. / Again? / Beaten. Not next time.

**draw**

- **Maximus:** Level. Neither of us was foolish enough to lose. / A draw. The dullest of all possible victories.
- **Titus:** A draw! The gods could not decide. Understandable. / Nobody lost. I call that half a triumph.
- **Aghiles:** Even. / Nobody falls. Good enough.

**imperator**

- **Maximus:** Imperator! By Jupiter, it suits me. / Hail me. Briefly will do. Imperator Maximus.
- **Titus:** Imperator Titus! Hail me! Dux, my crown! / Imperator! It sounds so right. Say it again.
- **Aghiles:** Imperator. / Imperator. I like the word.

**duxSteals**

- **Maximus:** Titus, your monkey has my prisoner. Again. / I will not be robbed by an animal in the middle of a game! / That monkey takes more pieces than either of us. / Put it back, you thief. Titus, he is ignoring me.
- **Titus:** Dux! Drop that! It is a prisoner, not a nut! / He is not stealing. He is guarding it. In his cheek. / Bad general! Give it back. Here, have a seed. / He only takes shiny things. It is a compliment, really.
- **Aghiles:** The monkey has it. He is quick. / Let him keep it. He earned it. / Dux hunts too. / He stole it clean. I did not hear him.

**duxHelps**

- **Maximus:** Now the monkey gives advice. Worse, he may be right. / Dux is pointing. I refuse to thank him. Look there, though.
- **Titus:** The general points! Look where his paw is. Obey him. / Dux says there. He is rarely wrong. Well, sometimes.
- **Aghiles:** The monkey points. Look. / Dux sees something. So do I.

**hint1**

- **Maximus:** Look for a man standing alone. Lonely men get taken. / Before you move, ask what your opponent wants next. / Somewhere, one move makes two threats. Find it. / Check your own men first. One of them is in danger.
- **Titus:** One of your men is all alone out there. I would worry. / Look for two of theirs with a gap between. I say no more. / Something of yours is about to be eaten. Find it quickly. / Keep your men side by side, like sausages. Safer that way.
- **Aghiles:** Look at your edges. / One of yours stands alone. / Two of theirs. A gap between. Think. / Do not hurry. Look again.

**undo**

- **Maximus:** Take it back, by all means. I shall remember it anyway. / A second try? Very well. Think this time.
- **Titus:** Taking it back? Is that even lucky? Very well. / Go on, then. I never saw the first one.
- **Aghiles:** Take it back. I do not mind. / Try again.

**placement**

- **Maximus:** Place them in pairs. A man with a neighbour is hard to take. / Every man I set down well now saves me a move later.
- **Titus:** This square feels lucky. Yes. Right here. / Never place your first man on the left. Everyone knows that.
- **Aghiles:** Side by side. Like a line of spears. / I place him near his friends.

**idle**

- **Maximus:** Is anyone else hungry? I could eat the stew pot. / The seer in the Forum promised rain. It is dry. I rest my case. / After this, the baths. Then the library. Then food. / My father's dinners last four hours. This game is a holiday. / Seers are never exact. You cannot prove a vague man wrong.
- **Titus:** My father has a new buffalo. It hates everyone. I like it. / I sneezed at dawn. I nearly stayed in bed all day. / A seer told me to beware of water. I have not bathed since. / Dux, stop pulling my hair. I am commanding an army. / I know every tunnel under the arena. Every single one.
- **Aghiles:** In Numidia we hunted at dawn. It was quiet, like this. / Maximus is hungry. He is always hungry. / I do not trust omens. I trust tracks. / The baths are too loud. I like this better. / A good board. A good day.

### Lines aimed at one opponent

**gameStart**

- **Maximus to Titus:** Titus. Did you get up on the correct foot? I want no excuses. / No omens today, Titus. Just you, me and arithmetic. / Touch the amulet all you like. It cannot move pieces.
- **Maximus to Aghiles:** I taught you this game, Aghiles. Remember that kindly. / No mercy, Aghiles. I know you will show me none. / You are too patient, Aghiles. I intend to hurry you.
- **Titus to Maximus:** Today I beat you, Maximus. A seer told me. A good one. / Be clever all you like. I have experience. And an amulet. / No long words during the game, Maximus. They put me off.
- **Titus to Aghiles:** I taught you everything, Aghiles. Well, some. A little. / You have beaten me before. The omens were against me. / Stop looking so calm, Aghiles. It is bad luck. For me.
- **Aghiles to Maximus:** You talk, Maximus. I will play. / You taught me well. You may regret it. / Ready, Maximus. Do not hurry.
- **Aghiles to Titus:** Did you sneeze today, Titus? No? Then no excuses. / Right foot first, Titus? / Play, Titus. Leave the omens outside.

**win**

- **Maximus to Titus:** It was not the omens, Titus. It was me. / Blame the crows if you must. I shall blame my talent. / Cheer up, Titus. You talked a very good game.
- **Maximus to Aghiles:** You made me work for that, Aghiles. You always do. / I won, Aghiles. Stop looking so calm about it. / Close. Too close. You are getting dangerous.
- **Titus to Maximus:** Ha! Brains, was it? Where are your brains now, Maximus? / I beat Maximus! Somebody carve it on a wall! / Do not sulk, Maximus. Oh, go on, sulk. I am enjoying it.
- **Titus to Aghiles:** Ha! The pupil has not passed the master yet! / Imperator Titus! You may salute me now, Aghiles. / Beaten, Aghiles! Experience always tells.
- **Aghiles to Maximus:** You were hungry, Maximus. You moved too fast. / A good game, Maximus. Thank you for teaching me. / I waited. You came to me.
- **Aghiles to Titus:** It was not the omens, Titus. / Good game, Titus. Blame the crow if it helps. / You talked. I played.

**lose**

- **Maximus to Titus:** Beaten by Titus. I shall never hear the end of it. / Well played, Titus. Please do not tell the whole Forum. / The amulet wins. I may have to rethink the universe.
- **Maximus to Aghiles:** Well played, Aghiles. I should never have taught you. / Beaten by my own pupil. I am proud. And furious. / You waited for one mistake. I obliged. Good game.
- **Titus to Maximus:** You and your clever little face. It was the omens. / Fine. You won, Maximus. You are still the short one. / One day, Maximus. One day. Mark my words.
- **Titus to Aghiles:** Again? He says nothing all game, and then he wins! / It was the omens, Aghiles. Not you. The omens. / Hail, Aghiles. There. I said it. Do not smile.
- **Aghiles to Maximus:** You won, Maximus. You saw further. / Well played. I am still learning from you. / Next time, Maximus.
- **Aghiles to Titus:** Well played, Titus. The amulet held. / You won, Titus. Tell your father. / You know this game well. I see it now.

**capture**

- **Maximus to Titus:** Was that one lucky, Titus? He does not look it. / One of yours, Titus. Spit three times. It may help.
- **Maximus to Aghiles:** You left a gap, Aghiles. That is not like you. / Even a hunter loses one now and then.
- **Titus to Maximus:** Did you calculate that one, Maximus? No? Ha! / One of yours, clever boy! Count him gone.
- **Titus to Aghiles:** Got one of yours, Aghiles! Say something! Anything! / Even giants lose pieces. Ha!
- **Aghiles to Maximus:** Too quick, Maximus. / You reached too far, Maximus.
- **Aghiles to Titus:** Your amulet missed that one, Titus. / One of yours, Titus.

## Assumptions to verify

I have book one in full and only the samples of books two to six. Each point below is something the script relies on that I could not confirm. Where one is wrong, the line ids to change are given.

1. **When it happens.** The story sits after the latrunculi scene in book 4 and before Titus takes the toga virilis in book 5. So Titus still wears his amulet (he clutches it throughout), and he does not yet own the marble set. I say only "late in the year three hundred and three" and "some weeks" after Aghiles' first win, and name no season.
2. **Book 4's game.** I assume the game the boys normally play fits the Legionary preset (men in two rows, sliding in straight lines), and that nothing in book 4 or in book 5's footnote describes rules that contradict it. Aghiles played black in book 4; this box has blue and white counters, and he takes either colour.
3. **Blandula.** I assume that late in 303 she still lives in Maximus' household in his mother's service, still cannot read, is still not a Christian, and is still on quiet, friendly terms with Aghiles. Her fate after book 1 is not in any sample.
4. **Flavia and the hidden community.** I assume Flavia is still a slave in the senator's household late in 303, that Christians still meet there, and that Maximus still does not know. The last two narrator lines of chapter 7 (`ch7_cl_17`, `ch7_cl_18`) depend on this.
5. **What Blandula knows.** She says she knows "someone who would know someone" (`ch7_cl_13`). Book 1 ends before she has any contact with Flavia's group; I assume that by now she has at least guessed.
6. **Christians the boys know.** Maximus says they cannot knock on doors asking who is a Christian (`ch7_cl_12`). If books 2 to 4 leave the boys knowing a Christian in Rome by name, that person might be the more natural one to receive the scrolls, and the scene should change.
7. **Cornelius' house.** I assume that after book 1 the villa was confiscated, stripped and its contents sold, and that no later book says otherwise. The freedman who talks to Sabinus is invented; book 1 says only that Cornelius freed his slaves.
8. **Cornelius and the library.** That he read at the baths library, met a friend there, and played latrunculi with him every market day is invented. Book 1 gives him arthritis, kindness and a Gospel scroll, and I have contradicted none of it. The friend is never named, so he can be anyone.
9. **The fish.** Book 1 has frescoes of fish in the catacomb that Aghiles and Blandula visit. That Aghiles noticed and remembers them (`ch6_cl_03`) is my inference. None of the boys says what the fish means.
10. **References back to book 1.** Without naming Paulus or Victor, the script mentions: a man Aghiles would not leave lying in the dark (`ch4_in_07`); the man with the hay cart (`ch7_cl_11`); Maximus waiting three days for Aghiles (`ch7_in_04`); the game played on the patio while waiting (`ch7_in_08`); an unwelcome visitor through Maximus' window (`ch3_cl_06`); and neighbours who saw the boys at Cornelius' villa (`ch3_in_05`). All are from my reading of book 1; please check none is undone by a later book.
11. **The fathers.** Titus' father is "at the docks" for a day (`ch5_cl_02`); that is invented, as are the Egyptian sailors who bring his crocodiles and play a general's game. Titus' house has a steward, unnamed here (book 3 calls him Faustus). Maximus' father's post as head of the water supply in book 4 is not mentioned.
12. **The baths and the library.** Maximus and Titus go there "every week" (`ch4_cl_06`). Book 1's epilogue and book 6 support the habit; I assume it holds in 303. Numbered cupboards and tagged scrolls are historical colour, not from the books.
13. **The stew seller and the seer** from book 1 are mentioned as still working near the Colosseum.
14. **Titus' record.** The epilogue says Titus lost both his round-robin games. Book 4 calls him the more experienced player and has him blame the omens when he loses; I assume nothing later makes him the regular champion.
15. **The marble set.** Titus wishes for "a proper set. Marble" and Maximus says nothing (`epi_in_11`, `epi_in_12`). That is a wink at book 5 and states nothing. If the gift in book 5 is meant as a complete surprise to Titus, or is explained differently, the wink may need softening.
16. **Dux.** I give him no species, colour or tail. Pulling Titus' hair, stealing walnuts, shrieking at someone hidden and being paid in seeds are from the books; stealing counters and picking a pocket are my extensions of the same habits. That he jumps on the winner's head a second time echoes book 4; Titus' line that Aghiles "wore it first" (`epi_out_maximus_05`) relies on that scene.
17. **The tutorial flashback.** It is set "earlier that year". Book 4 says Aghiles learned the rules only recently; I assume it does not say who taught him, or that it was Maximus and Titus. The officer back from Britain at one of the senator's dinners is invented.
18. **"Rome has four already"** (`epi_out_draw_02`). Aghiles' joke about four emperors is history (Diocletian shared power with three colleagues in 303), not something from the books. Cut it if the books speak of Diocletian as sole emperor.
19. **Aghiles and belief.** Following book 1, he never swears by any god and is given no religion. One sample of book 2 has him speak of honouring the spirits of nature after a hunt; I have left that out and not contradicted it.

## Character counts

Characters of spoken text, counted from the modules. Every outro variant is counted, since every variant is recorded.

| Module | Lines | Characters |
|---|---:|---:|
| Story | 260 | 23,761 |
| Banter | 303 | 12,035 |
| Tutorial | 116 | 7,136 |
| **Total** | **679** | **42,932** |

| Speaker | Story | Banter | Tutorial | Total lines | Total characters |
|---|---:|---:|---:|---:|---:|
| Narrator | 6,605 | 0 | 206 | 56 | 6,811 |
| Maximus | 6,663 | 4,877 | 4,113 | 231 | 15,653 |
| Titus | 5,780 | 4,777 | 2,093 | 192 | 12,650 |
| Aghiles | 2,062 | 2,381 | 724 | 171 | 5,167 |
| Blandula | 1,767 | 0 | 0 | 21 | 1,767 |
| Sabinus | 884 | 0 | 0 | 8 | 884 |

The three per-module columns are characters. The longest story or tutorial line is within the limit of one hundred and sixty characters, and the longest banter line within ninety.
