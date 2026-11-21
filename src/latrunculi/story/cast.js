// Voice casting for ElevenLabs. `voice` is the one in use; `candidates` are the alternatives recorded for the
// audition page (latrunculi/voices.html). Change `voice` to a candidate's key and run `npm run voices` to re-record
// that speaker: lines whose voice or text has not changed are skipped.
export const MODEL = 'eleven_multilingual_v2';

export const CAST = {
  narrator: {
    voice: 'bill',
    candidates: {
      george: { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George: warm British storyteller', s: { stability: 0.45, similarity_boost: 0.75, style: 0.35 } },
      christopher: { id: 'G17SuINrv2H9FC6nvetn', label: 'Christopher: smooth, calm, very English', s: { stability: 0.5, similarity_boost: 0.75, style: 0.3 } },
      bill: { id: 'pqHfZKP75CvOlQylNhV4', label: 'Bill: older, wise, crisp', s: { stability: 0.5, similarity_boost: 0.75, style: 0.25 } },
    },
  },
  maximus: {
    voice: 'liam',
    candidates: {
      dylan: { id: 'NuIlfu52nTXRM2NXDrjS', label: 'Dylan: young, calm, precise', s: { stability: 0.45, similarity_boost: 0.75, style: 0.35 } },
      liam: { id: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam: young, quick, confident', s: { stability: 0.4, similarity_boost: 0.72, style: 0.4 } },
      anthony: { id: 'sjwRAsCdMJodJszgJ6Ks', label: 'Anthony: young, casual storyteller', s: { stability: 0.42, similarity_boost: 0.75, style: 0.35 } },
    },
  },
  titus: {
    voice: 'hale',
    candidates: {
      hale: { id: 'wWWn96OtTHu1sn8SRGEr', label: 'Hale: young, expressive, upbeat', s: { stability: 0.32, similarity_boost: 0.72, style: 0.6 } },
      charlie: { id: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie: young, energetic, Australian', s: { stability: 0.35, similarity_boost: 0.72, style: 0.55 } },
      will: { id: 'bIHbv24MWmeRgasZH58o', label: 'Will: young, sunny, relaxed', s: { stability: 0.35, similarity_boost: 0.7, style: 0.5 } },
    },
  },
  aghiles: {
    voice: 'brian',
    candidates: {
      edwin: { id: 'CMUEYyUNA4TrldQy4HLM', label: 'Edwin: calm, steady, deep', s: { stability: 0.55, similarity_boost: 0.78, style: 0.2 } },
      harry: { id: 'SOYHLrjzK2X1ezoPC6cr', label: 'Harry: young, rough-edged', s: { stability: 0.5, similarity_boost: 0.75, style: 0.25 } },
      brian: { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian: deep, resonant, comforting', s: { stability: 0.55, similarity_boost: 0.75, style: 0.2 } },
    },
  },
  blandula: {
    voice: 'arabella',
    candidates: {
      arabella: { id: 'Z3R5wn05IrDiVCyEkUrK', label: 'Arabella: young, gentle', s: { stability: 0.5, similarity_boost: 0.75, style: 0.3 } },
      amelia: { id: 'ZF6FPAbjXT4488VcRRnw', label: 'Amelia: young, British, bright', s: { stability: 0.5, similarity_boost: 0.75, style: 0.25 } },
      sarah: { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah: young, reassuring', s: { stability: 0.5, similarity_boost: 0.75, style: 0.25 } },
    },
  },
  sabinus: {
    voice: 'eric',
    candidates: {
      eric: { id: 'cjVigY5qzO86Huf0OWal', label: 'Eric: smooth, trustworthy', s: { stability: 0.5, similarity_boost: 0.75, style: 0.3 } },
      dominic: { id: 'yhf80q1381zd2JJQ4tM7', label: 'Dominic: British, dark, intense', s: { stability: 0.5, similarity_boost: 0.75, style: 0.3 } },
      daniel: { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel: formal, steady, British', s: { stability: 0.55, similarity_boost: 0.75, style: 0.2 } },
    },
  },
};

/** Real lines each candidate reads for the audition page (ids from the script, banter and tutorial). */
export const AUDITION_LINES = {
  narrator: ['pro_in_01', 'pro_in_02'],
  maximus: ['bn_max_capture_1', 'tut_move_s1_p1', 'bn_max_win_1'],
  titus: ['pro_in_03', 'bn_tit_captured_1', 'bn_tit_win_1'],
  aghiles: ['bn_agh_capture_2', 'bn_agh_win_1', 'bn_agh_idle_1'],
  blandula: [],
  sabinus: [],
};
