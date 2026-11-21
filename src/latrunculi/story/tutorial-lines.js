// Tutorial dialogue for Latrunculi. All wording is original.
//
// The tutorial is a flashback: earlier in the year 303, in Maximus' bedroom, Maximus and Titus teach
// Aghiles the game. Aghiles is the learner, so the player makes his moves. Maximus is precise, Titus
// wanders off the point, Aghiles asks short questions.
//
// The words never name a square, so the board positions can be built freely. What each step expects
// the position to contain is noted in a comment beside it.
//
// Rules for anyone editing: at most 160 characters per line, no stage directions, numbers spelled out,
// Aghiles never swears by a god. Line ids become audio file names: add new ids, never renumber.

const MOODS = ['neutral', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking'];

function l(id, who, text, mood) {
  if (mood && !MOODS.includes(mood)) throw new Error(`unknown mood ${mood} on ${id}`);
  return mood ? { id, who, text, mood } : { id, who, text };
}

export const TUTORIAL = {
  // ------------------------------------------------------------------ MOVE
  move: {
    title: 'Straight Lines',
    summary: 'Pieces slide in straight lines, as far as the way is clear, and never jump or move slantwise.',
    intro: [
      l('tut_move_in_01', 'narrator', "Earlier that year, in Maximus' room. A board, two heaps of counters, and Aghiles, who had never played."),
      l('tut_move_in_02', 'maximus', 'It is called latrunculi. Little brigands. Two armies, no dice, no luck. Only thinking.'),
      l('tut_move_in_03', 'titus', 'No luck! Listen to him. There is always luck. I never play without my amulet.'),
      l('tut_move_in_04', 'aghiles', 'How do they move?'),
    ],
    steps: [
      {
        id: 'move_1', // one white man with a clear road straight ahead
        prompt: [
          l('tut_move_s1_p1', 'maximus', 'In straight lines. Forward, back, left or right, as far as the way is clear.'),
          l('tut_move_s1_p2', 'maximus', 'Take the white man with the open road in front of him, and slide him forward.'),
        ],
        onWrong: [
          l('tut_move_s1_w1', 'maximus', 'Not quite. Straight up the board, along the open road.'),
        ],
        onRight: [
          l('tut_move_s1_r1', 'aghiles', 'Like a spear thrown straight.'),
          l('tut_move_s1_r2', 'maximus', 'Exactly like that.', 'pleased'),
        ],
      },
      {
        id: 'move_2', // a white man whose road is blocked by another piece part of the way along
        prompt: [
          l('tut_move_s2_p1', 'aghiles', 'Can he go slantwise? Or over another man?'),
          l('tut_move_s2_p2', 'maximus', 'Neither. Try it. Send this man as far as he can go. He must stop before the piece in his way.'),
        ],
        onWrong: [
          l('tut_move_s2_w1', 'titus', 'No, no. He cannot jump, and he cannot go slantwise. He is a soldier, not a monkey.'),
        ],
        onRight: [
          l('tut_move_s2_r1', 'maximus', 'Good. He stops where the road is blocked.'),
        ],
      },
    ],
    wrap: [
      l('tut_move_wr_01', 'titus', 'My father says elephants walk in straight lines too. Through walls, if they must. He does not sell elephants. The emperor keeps those.'),
      l('tut_move_wr_02', 'aghiles', 'And the game?'),
      l('tut_move_wr_03', 'maximus', 'Straight lines, as far as you like, no jumping. That is all there is to moving.'),
    ],
  },

  // ------------------------------------------------------------------ CAPTURE
  capture: {
    title: 'Between Two',
    summary: 'Trap one enemy between two of your men in a straight line and he is taken. Only the piece that moves makes the capture.',
    intro: [
      l('tut_capture_in_01', 'aghiles', 'How do I take a man?'),
      l('tut_capture_in_02', 'maximus', 'You trap him. One of yours on each side of him, in a straight line. Then he comes off the board.'),
      l('tut_capture_in_03', 'titus', 'A twin foe, the poets call it. Two of yours, one of theirs in the middle. Like a sausage in bread.'),
    ],
    steps: [
      {
        id: 'capture_1', // a blue man with one white man beside him; a second white man can reach the far side
        prompt: [
          l('tut_capture_s1_p1', 'maximus', 'One of your men already stands beside that blue one. Bring a second man to his other side.'),
        ],
        onWrong: [
          l('tut_capture_s1_w1', 'maximus', 'He is not trapped yet. Your two men must stand on opposite sides of him, in one straight line.'),
        ],
        onRight: [
          l('tut_capture_s1_r1', 'aghiles', 'Taken.', 'pleased'),
          l('tut_capture_s1_r2', 'titus', 'By Pollux, he says it like a hunter. Taken!'),
        ],
      },
      {
        id: 'capture_2', // a trap that is one move from closing: the learner must make the closing move himself
        prompt: [
          l('tut_capture_s2_p1', 'maximus', 'One thing more. Only the man who moves does the taking. Men who stand still take nobody.'),
          l('tut_capture_s2_p2', 'maximus', 'So a trap must be closed by a move. Close this one.'),
        ],
        onWrong: [
          l('tut_capture_s2_w1', 'titus', 'That closes nothing! Move a man in beside him, on the open side.'),
        ],
        onRight: [
          l('tut_capture_s2_r1', 'maximus', 'There. The move closes the trap, and the trap takes the man.'),
        ],
      },
    ],
    wrap: [
      l('tut_capture_wr_01', 'aghiles', 'So I need two. Always two.'),
      l('tut_capture_wr_02', 'maximus', 'Always two. A man alone takes nobody.'),
    ],
  },

  // ------------------------------------------------------------------ CORNER
  corner: {
    title: 'Corners',
    summary: 'A man in a corner has only two open sides: two enemies on those sides take him.',
    intro: [
      l('tut_corner_in_01', 'titus', 'Never hide in a corner. I learned that from a tiger. Well, from watching a tiger. From a safe distance.'),
      l('tut_corner_in_02', 'aghiles', 'Why not? Two walls guard him.'),
      l('tut_corner_in_03', 'maximus', 'Two walls hold him. A man in a corner has only two open sides. Close both, and he is taken.'),
    ],
    steps: [
      {
        id: 'corner_1', // a blue man in a corner with a white man on one open side
        prompt: [
          l('tut_corner_s1_p1', 'maximus', 'That blue man sits in the corner, and one of yours is beside him. Close his other open side.'),
        ],
        onWrong: [
          l('tut_corner_s1_w1', 'maximus', 'His other open side. Right next to him.'),
        ],
        onRight: [
          l('tut_corner_s1_r1', 'aghiles', 'The walls did half my work.'),
          l('tut_corner_s1_r2', 'maximus', 'They did. Remember it when you are the one in the corner.'),
        ],
      },
    ],
    wrap: [
      l('tut_corner_wr_01', 'titus', 'Corners are unlucky. So are thresholds, crows, and getting up on the left foot. I could go on.'),
      l('tut_corner_wr_02', 'aghiles', 'Stay out of corners. I have it.'),
    ],
  },

  // ------------------------------------------------------------------ SAFE
  safe: {
    title: 'Walking In',
    summary: 'A man who moves in between two enemies is safe, and from there he can threaten both.',
    intro: [
      l('tut_safe_in_01', 'aghiles', 'If I move my own man between two of theirs. Is he taken?'),
      l('tut_safe_in_02', 'maximus', 'No. That is the clever part. They did not close a trap. You walked in. So it is no trap at all.'),
      l('tut_safe_in_03', 'titus', "It is like walking into my father's tiger pen on purpose. The tiger is too surprised to bite. Do not try that, by the way."),
    ],
    steps: [
      {
        id: 'safe_1', // an empty square between two blue men that a white man can reach
        prompt: [
          l('tut_safe_s1_p1', 'maximus', 'Try it. Put your man in the gap between those two blue ones.'),
        ],
        onWrong: [
          l('tut_safe_s1_w1', 'maximus', 'Into the gap, between the two of them. He is safe there. I promise.'),
        ],
        onRight: [
          l('tut_safe_s1_r1', 'aghiles', 'He stands. Nothing happens.'),
        ],
      },
      {
        id: 'safe_2', // a gap between two blue men from which the white man threatens to capture each of them
        prompt: [
          l('tut_safe_s2_p1', 'maximus', 'Now make it a weapon. Find the gap where your man is safe and threatens both of his neighbours at once.'),
        ],
        onWrong: [
          l('tut_safe_s2_w1', 'titus', 'Safe, yes, but he frightens nobody there. Try the other gap.'),
        ],
        onRight: [
          l('tut_safe_s2_r1', 'maximus', 'He looks caught, and he threatens two. An old poem praises exactly that move.', 'pleased'),
        ],
      },
    ],
    wrap: [
      l('tut_safe_wr_01', 'aghiles', 'Walk in. Do not get walked around.'),
      l('tut_safe_wr_02', 'maximus', 'I could not have put it shorter.'),
    ],
  },

  // ------------------------------------------------------------------ FORK
  fork: {
    title: 'The Fork',
    summary: 'One move that threatens two captures at once: your opponent can save only one piece.',
    intro: [
      l('tut_fork_in_01', 'maximus', 'Now the best trick in the game. One move, two threats.'),
      l('tut_fork_in_02', 'aghiles', 'And he can answer only one.'),
      l('tut_fork_in_03', 'maximus', 'You see it already. He saves one man, and you take the other.'),
      l('tut_fork_in_04', 'titus', 'I invented that. Well, I use it. Often. Sometimes.'),
    ],
    steps: [
      {
        id: 'fork_1', // exactly one white move threatens two different blue men
        prompt: [
          l('tut_fork_s1_p1', 'maximus', 'Find the move that threatens two blue men at the same time.'),
        ],
        onWrong: [
          l('tut_fork_s1_w1', 'maximus', 'That threatens only one, and he simply walks away. Look for the square that looks at two.'),
        ],
        onRight: [
          l('tut_fork_s1_r1', 'aghiles', 'Two tracks. He cannot follow both.', 'pleased'),
          l('tut_fork_s1_r2', 'titus', 'By all the gods, he is going to be good at this. I do not like it.', 'rattled'),
        ],
      },
    ],
    wrap: [
      l('tut_fork_wr_01', 'maximus', 'So before every move, ask yourself: can I make two threats instead of one?'),
    ],
  },

  // ------------------------------------------------------------------ PAIRS
  pairs: {
    title: 'Side by Side',
    summary: 'Men standing side by side cover each other; a man alone in the open is a target.',
    intro: [
      l('tut_pairs_in_01', 'titus', 'Now my speciality. Defence. Keep your men in pairs, side by side.'),
      l('tut_pairs_in_02', 'aghiles', 'Why?'),
      l('tut_pairs_in_03', 'titus', 'To trap a man they need the square beside him. If your own man is standing on it, they cannot have it.'),
      l('tut_pairs_in_04', 'maximus', 'A whole block of men is called a phalanx. It is very hard to break.'),
    ],
    steps: [
      {
        id: 'pairs_1', // one white man stands alone and can be captured; the learner selects him
        prompt: [
          l('tut_pairs_s1_p1', 'titus', 'Look at the white army. One man has no neighbour. Show me which.'),
        ],
        onWrong: [
          l('tut_pairs_s1_w1', 'titus', 'No, he has a friend beside him. Look for the lonely one.'),
        ],
        onRight: [
          l('tut_pairs_s1_r1', 'aghiles', 'That one. Alone, in the open.'),
          l('tut_pairs_s1_r2', 'titus', 'Poor fellow. The poets say a man without his partner has to fight alone.'),
        ],
      },
      {
        id: 'pairs_2', // the same man: bring a friend beside him, or move him next to a friend
        prompt: [
          l('tut_pairs_s2_p1', 'titus', 'Now save him. Bring a friend to his side, or bring him home to his friends.'),
        ],
        onWrong: [
          l('tut_pairs_s2_w1', 'maximus', 'He can still be trapped along that line. Cover his open side.'),
        ],
        onRight: [
          l('tut_pairs_s2_r1', 'titus', 'Safe! Side by side, like sausages on a string.', 'pleased'),
          l('tut_pairs_s2_r2', 'aghiles', 'Like hunters. Nobody goes alone.'),
        ],
      },
    ],
    wrap: [
      l('tut_pairs_wr_01', 'maximus', 'Attack with forks. Defend in pairs. That is half the game.'),
    ],
  },

  // ------------------------------------------------------------------ PLACEMENT
  placement: {
    title: 'The Empty Board',
    summary: 'In some rules the board starts empty and the players take turns placing their men.',
    intro: [
      l('tut_placement_in_01', 'maximus', 'Not everyone starts with the men in rows. In the old way, the board begins empty.'),
      l('tut_placement_in_02', 'titus', "The sailors on my father's animal ships play like that. You set your men down in turn, wherever you please."),
      l('tut_placement_in_03', 'aghiles', 'Anywhere?'),
      l('tut_placement_in_04', 'maximus', 'Any empty square. Nobody is taken while the men are being set out. The fighting starts afterwards.'),
    ],
    steps: [
      {
        id: 'placement_1', // an empty or part-filled board: place one white man on an empty square
        prompt: [
          l('tut_placement_s1_p1', 'maximus', 'Place a man. Think about where his friends are standing.'),
        ],
        onWrong: [
          l('tut_placement_s1_w1', 'maximus', 'Not there. Choose an empty square, close to a friend.'),
        ],
        onRight: [
          l('tut_placement_s1_r1', 'aghiles', 'Beside his friend. Away from the corner.'),
          l('tut_placement_s1_r2', 'maximus', 'You are learning faster than I like.', 'pleased'),
        ],
      },
    ],
    wrap: [
      l('tut_placement_wr_01', 'titus', 'I always place my first man with my right hand. Some things are not worth the risk.'),
    ],
  },

  // ------------------------------------------------------------------ BOUND
  bound: {
    title: 'The Bound Man',
    summary: 'In the old rules a trapped piece is turned over and removed a turn later, unless a friend traps one of its captors first.',
    intro: [
      l('tut_bound_in_01', 'maximus', 'There is an older rule. I have only read about it. A trapped man is not taken off at once.'),
      l('tut_bound_in_02', 'maximus', 'He is turned on his back. Bound, they say. Alligatus. And there he waits, for one turn.'),
      l('tut_bound_in_03', 'aghiles', 'And then?'),
      l('tut_bound_in_04', 'maximus', 'Then he is taken off. Unless his friends trap one of the two who hold him. Then he is free.'),
      l('tut_bound_in_05', 'titus', 'Seneca wrote about it. Or Cicero. One of the bald ones.'),
    ],
    steps: [
      {
        id: 'bound_1', // an ordinary custodian trap is available: making it binds (flips) the blue man
        prompt: [
          l('tut_bound_s1_p1', 'maximus', 'First, bind a man. Trap that blue one between two of yours.'),
        ],
        onWrong: [
          l('tut_bound_s1_w1', 'maximus', 'One on each side of him, in a line. The same as any other trap.'),
        ],
        onRight: [
          l('tut_bound_s1_r1', 'aghiles', 'He is on his back.'),
          l('tut_bound_s1_r2', 'maximus', 'Bound. On your next turn you may lift him off.'),
        ],
      },
      {
        id: 'bound_2', // a white man is bound between two blue captors; one captor can be trapped this turn
        prompt: [
          l('tut_bound_s2_p1', 'maximus', 'Now it is your man who is bound. You have one turn to save him. Trap one of his two captors.'),
        ],
        onWrong: [
          l('tut_bound_s2_w1', 'titus', 'That does not free him! Go for one of the two who are holding him down.'),
        ],
        onRight: [
          l('tut_bound_s2_r1', 'aghiles', 'He gets up.', 'pleased'),
          l('tut_bound_s2_r2', 'maximus', 'And his captor lies down in his place. That is the whole beauty of it.'),
        ],
      },
    ],
    wrap: [
      l('tut_bound_wr_01', 'aghiles', 'I like this rule. A man down is not a man lost.'),
    ],
  },

  // ------------------------------------------------------------------ DUX
  dux: {
    title: 'The General',
    summary: 'Some rules add a general. In the long-board game he cannot be captured: you win by blocking all four of his sides.',
    intro: [
      l('tut_dux_in_01', 'maximus', "One more. An officer back from Britain showed it at one of my father's endless dinners. A long board, and each side has a general."),
      l('tut_dux_in_02', 'titus', 'Dux! Like my Dux. Only better behaved.'),
      l('tut_dux_in_03', 'aghiles', 'What does the general do?'),
      l('tut_dux_in_04', 'maximus', 'He cannot be taken. Ever. You win by shutting him in: all four sides blocked, so that he cannot move a step.'),
      l('tut_dux_in_05', 'maximus', 'Walls count. Even his own men count, as long as one of yours finishes the job.'),
    ],
    steps: [
      {
        id: 'dux_1', // the blue general has three sides blocked; one white move blocks the fourth
        prompt: [
          l('tut_dux_s1_p1', 'maximus', 'The blue general has one open side left. Close it.'),
        ],
        onWrong: [
          l('tut_dux_s1_w1', 'maximus', 'He can still step out. Find his last open side.'),
        ],
        onRight: [
          l('tut_dux_s1_r1', 'aghiles', 'Shut in. Partly by his own guards.'),
          l('tut_dux_s1_r2', 'titus', 'Poor general. Dux, do not look. It is too sad.'),
        ],
      },
    ],
    wrap: [
      l('tut_dux_wr_01', 'maximus', "So in that game, guard your own general's last door. And look for the enemy's."),
    ],
  },

  // ------------------------------------------------------------------ ENDINGS
  endings: {
    title: 'How It Ends',
    summary: 'A game ends when one army is taken or cannot move; otherwise the pieces are counted when no capture is left or the move limit runs out, and the larger army wins.',
    intro: [
      l('tut_endings_in_01', 'aghiles', 'How do I win?'),
      l('tut_endings_in_02', 'maximus', 'Take every man, or leave him none that can move. If nobody can take any more, we stop and count. The larger army wins.'),
      l('tut_endings_in_03', 'titus', 'And if a game drags on for ever, there is a limit of moves. Then we count as well.'),
      l('tut_endings_in_04', 'maximus', 'A Roman named Julius Canus was called away to his death in the middle of a game. He counted the pieces first, to prove he was ahead.'),
      l('tut_endings_in_05', 'titus', 'That is the most Roman thing I have ever heard.'),
    ],
    steps: [
      {
        id: 'endings_1', // one last capture is available to White; after it White has more men and the game is counted
        prompt: [
          l('tut_endings_s1_p1', 'maximus', 'One capture is left on this board. Take it, and then we count.'),
        ],
        onWrong: [
          l('tut_endings_s1_w1', 'maximus', 'Not that. Find the last capture first. Then we count the armies.'),
        ],
        onRight: [
          l('tut_endings_s1_r1', 'aghiles', 'I have more men. So I win.'),
          l('tut_endings_s1_r2', 'maximus', 'You do. And the winner takes a title: imperator.'),
        ],
      },
    ],
    wrap: [
      l('tut_endings_wr_01', 'aghiles', 'Imperator.'),
      l('tut_endings_wr_02', 'titus', 'Do not get used to that word. I have played for years. Nobody beats me after a few lessons.', 'pleased'),
      l('tut_endings_wr_03', 'narrator', 'It took a little longer than a few lessons. But Aghiles did beat him, and Titus still blames the omens.'),
    ],
  },
};
