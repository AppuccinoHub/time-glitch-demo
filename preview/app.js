(() => {
  'use strict';

  /* ======================================================================
     Time Glitch: Italian 3 · PREVIEW build ("identify the tense" + audio)
     The student version at the site root is NOT affected: this copy uses
     its own localStorage keys (timeGlitchPreview.*).
     Round flow: the verb is shown conjugated → the sentence is read aloud
     (Web Speech API, it-IT) → the student picks the tense → "Perché?"
     (2 meaning choices) → Avanti.
     Every storage and speech call is wrapped: errors never break the app,
     and the sentence is always visible as text.
     ====================================================================== */

  const KEY_HELP = 'timeGlitchPreview.helpLevel';
  const KEY_MUTE = 'timeGlitchPreview.muted';
  const KEY_PROGRESS = 'timeGlitchPreview.progress.v1';

  /* ---------- safe storage ---------- */
  const store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (_) { /* storage blocked/full: keep going */ }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch (_) { /* ignore */ }
    },
  };

  const HELP_ORDER = ['more', 'mid', 'challenge'];
  const HELP_NAME = { more: 'More help', mid: 'Just right', challenge: 'Challenge me' };
  const HELP_HINTS = {
    more: 'Italian context + English gloss + a form-clue card under each glitch.',
    mid: 'Italian context line under each glitch.',
    challenge: 'No context line. A short Italian nudge after a miss.',
  };

  const TENSE_ORDER = ['presente', 'imperfetto', 'passato'];
  const TENSE_LABEL = { presente: 'Presente', imperfetto: 'Imperfetto', passato: 'Passato prossimo' };
  const NUDGE = {
    presente: 'Succede adesso o è vero oggi?',
    imperfetto: 'È una scena, un’abitudine o un’azione in corso nel passato?',
    passato: 'È un’azione finita?',
  };

  /* Form-clue card (More help): one card per level; model verbs are never a round's own verb. */
  const HINT_COL = {
    presente: '1 word · parlo, parla, legge',
    imperfetto: '1 word, <b>-av- / -ev- / -iv-</b> before the ending · parl<b>av</b>o, legg<b>ev</b>a',
    passato: '2 words · ho parlato, sono andata',
  };
  const HINT_TRAP = {
    1: 'Careful: è / sono / ho + a participle (-ato, -uto, -ito) is passato prossimo, not presente.',
    2: 'Careful: look at the letters right before the ending, not just any «v» in the verb.',
    3: 'Careful: some verbs (like essere) have an irregular imperfetto, but it’s still ONE word. Only the passato prossimo has two.',
    4: 'Careful: è / sono + a participle (-ato, -uto, -ito) is passato prossimo, not presente.',
  };

  /* ======================================================================
     CONTENT
     Messages: { who, me?, text, from } → visible from round index `from`.
     Glitch messages: { who, me?, glitch: roundIndex, pre, post }.
     Rounds:
       correct, forms[correct] = the verb exactly as it appears in the chat
       verb/mean   infinitive + English meaning (More help gloss)
       gloss       English with «…» where the verb goes
       formOk      form note shown when the tense is right
       fb[wrong]   [form clue, story reason] for each wrong tense
       why         { ok, no, noWhy, full, okFirst } for the Perché? step
       label       end-screen label (IT)
     `me: true` = Luca, the student ("tu").
     ====================================================================== */
  const LEVELS = [
    {
      id: 1,
      title: 'Lunedì mattina',
      tenses: ['presente', 'passato'],
      now: [
        { who: 'Giulia', text: 'Ragazzi, dove siete? 😬', from: 0 },
        { who: 'Sofia', glitch: 0, pre: 'Io vi ', post: ' davanti al cancello. Sbrigatevi!' },
        { who: 'Luca', me: true, text: 'Arrivo! 🏃', from: 2 },
        { who: 'Marco', glitch: 2, pre: 'Aiuto! ', post: ' il libro di storia a casa. 😭' },
      ],
      then: [
        { who: 'Marco', text: 'Sabato abbiamo giocato contro la terza B. ⚽', from: 0 },
        { who: 'Luca', me: true, glitch: 1, pre: 'Sì, e alla fine ', post: ' 4 a 2. 😩' },
        { who: 'Sofia', text: 'Dopo la partita siete andati da Gino, vero? 🍕', from: 3 },
        { who: 'Giulia', glitch: 3, pre: 'Da Gino? Mio cugino ', post: ' lì. La prossima volta chiedete di Matteo!' },
      ],
      rounds: [
        {
          side: 'now', verb: 'aspettare', mean: 'to wait for', correct: 'presente',
          forms: { presente: 'aspetto', passato: 'ho aspettato' },
          context: 'Lunedì, 7:55, prima della campanella.',
          gloss: 'I … you in front of the gate. Hurry up!',
          formOk: '«aspetto» = aspettare, io form: one word.',
          fb: {
            passato: ['«aspetto» is one word. The passato prossimo needs two: «ho aspettato».',
              'Sofia is still at the gate and says «Sbrigatevi!»: the waiting is happening now.'],
          },
          why: {
            ok: 'It’s happening right now', no: 'A finished action: the waiting is over',
            noWhy: 'Not over: Sofia says «Sbrigatevi!» because she’s still waiting.',
            full: 'Sofia is at the gate at this very moment and tells everyone to hurry. Something happening now takes the presente.',
            okFirst: true,
          },
          label: 'Presente · adesso',
        },
        {
          side: 'then', verb: 'perdere', mean: 'to lose', correct: 'passato',
          forms: { presente: 'perdiamo', passato: 'abbiamo perso' },
          context: 'Nel gruppo si parla della partita di sabato.',
          gloss: 'Yes, and in the end we … 4–2.',
          formOk: '«abbiamo perso» = avere + the participle of perdere: two words.',
          fb: {
            presente: ['Two words: the helper «abbiamo» + the participle «perso». The presente is one word: «perdiamo».',
              'The match was on Saturday and it has a final score (4–2): it’s over.'],
          },
          why: {
            ok: 'One finished event with a final score', no: 'Something happening right now',
            noWhy: 'The match was on Saturday, not now: 4–2 is the final score.',
            full: 'The match was on Saturday and it ended 4–2. One completed event takes the passato prossimo.',
            okFirst: false,
          },
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'dimenticare', mean: 'to forget', correct: 'passato',
          forms: { presente: 'dimentico', passato: 'Ho dimenticato' },
          context: 'In classe, prima della lezione di storia.',
          gloss: 'Help! I … my history book at home.',
          formOk: '«Ho dimenticato» = avere + the participle of dimenticare (io).',
          fb: {
            presente: ['«ho» alone is presente, but here it’s helper + participle: «ho dimenticato». The presente would be «dimentico».',
              'Marco is already at school without the book: the forgetting is done.'],
          },
          why: {
            ok: 'A finished action whose result matters now', no: 'Something Marco always does (a habit)',
            noWhy: 'It’s not a habit: he forgot the book once, today, and now he’s stuck without it.',
            full: 'The forgetting already happened (the book is at home) and Marco is dealing with the result now: passato prossimo.',
            okFirst: true,
          },
          label: 'Passato prossimo · azione finita, risultato adesso',
        },
        {
          side: 'then', verb: 'lavorare', mean: 'to work', correct: 'presente',
          forms: { presente: 'lavora', passato: 'ha lavorato' },
          context: 'Si parla della serata in pizzeria.',
          gloss: 'At Gino’s? My cousin … there. Next time ask for Matteo!',
          formOk: '«lavora» = lavorare, lui form: one word.',
          fb: {
            passato: ['One word, ending in -a (the lui/lei form). The passato prossimo would be two words: «ha lavorato».',
              'Giulia says to ask for Matteo next time: he still works there today.'],
          },
          why: {
            ok: 'A fact that’s still true today', no: 'A job he had on Saturday that’s now over',
            noWhy: '«La prossima volta chiedete di Matteo!»: he still works there.',
            full: 'Matteo works at Gino’s today. A fact that is true now takes the presente, even in a chat about Saturday.',
            okFirst: false,
          },
          label: 'Presente · vero ancora oggi',
        },
      ],
    },
    {
      id: 2,
      title: 'La vecchia foto',
      tenses: ['presente', 'imperfetto'],
      now: [
        { who: 'Marco', text: 'Ciao! Ma voi fate ancora danza? 💃', from: 0 },
        { who: 'Giulia', glitch: 1, pre: 'Io no, ma Sofia sì: ', post: ' a lezione tre volte a settimana.' },
        { who: 'Sofia', text: 'E tu, Marco? Giochi ancora a calcio?', from: 2 },
        { who: 'Marco', glitch: 2, pre: 'No, adesso faccio pallavolo. Da piccolo ', post: ' a calcio con Luca.' },
        { who: 'Luca', me: true, text: 'Vero! Eri fortissimo. ⚽', from: 3 },
      ],
      then: [
        { who: 'Sofia', text: 'Guardate cosa ho trovato: io e Giulia in prima elementare! 📸', photo: '👧🏻👧🏽🎒', from: 0 },
        { who: 'Giulia', glitch: 0, pre: '', post: ' sei anni, che piccole! 😍' },
        { who: 'Luca', me: true, text: 'E chi è la maestra nella foto?', from: 3 },
        { who: 'Giulia', glitch: 3, pre: 'La maestra Rossi! ', post: ' a mio fratello, che è in terza elementare.' },
      ],
      rounds: [
        {
          side: 'then', verb: 'avere', mean: 'to have; Italian uses avere for age', correct: 'imperfetto',
          forms: { presente: 'Abbiamo', imperfetto: 'Avevamo' },
          context: 'Sofia ha trovato una vecchia foto.',
          gloss: 'We … six years old, so little!',
          formOk: '«Avevamo» = avere, noi form, with -ev- before the ending.',
          fb: {
            presente: ['Look before the ending: av-EV-amo. That -ev- marks the imperfetto. The presente would be «abbiamo».',
              'They’re in high school now. In the old photo they were six: age in the past.'],
          },
          why: {
            ok: 'Describing their age back then, in the photo', no: 'Their age right now',
            noWhy: 'They’re in high school now; they were six in the old photo.',
            full: 'Age and description in the past take the imperfetto: in the photo they were six. (Italian uses avere for age.)',
            okFirst: false,
          },
          label: 'Imperfetto · età nel passato',
        },
        {
          side: 'now', verb: 'andare', mean: 'to go', correct: 'presente',
          forms: { presente: 'va', imperfetto: 'andava' },
          context: 'Marco fa una domanda alle ragazze.',
          gloss: 'Not me, but Sofia does: she … to class three times a week.',
          formOk: '«va» = andare, lei form (io vado, tu vai, lei va).',
          fb: {
            imperfetto: ['«va» is andare in the presente, lui/lei form (io vado, tu vai, lei va). The imperfetto would be «andava», with the -ava ending.',
              'Giulia says Sofia still dances («Sofia sì»), three times a week. It’s a habit that’s true now, so the presente fits.'],
          },
          why: {
            ok: 'A habit that’s still true now', no: 'A habit that ended in the past',
            noWhy: '«Sofia sì»: Sofia still dances, so the habit hasn’t ended.',
            full: 'Sofia still goes to dance class three times a week. A habit that is true now takes the presente.',
            okFirst: true,
          },
          label: 'Presente · abitudine di oggi',
        },
        {
          side: 'now', verb: 'giocare', mean: 'to play', correct: 'imperfetto',
          forms: { presente: 'gioco', imperfetto: 'giocavo' },
          context: 'Sofia chiede a Marco del suo sport.',
          gloss: 'No, now I play volleyball. When I was little I … soccer with Luca.',
          formOk: '«giocavo» = giocare, io form, with -av- before the ending.',
          fb: {
            presente: ['gioc-AV-o: the -av- before the ending marks the imperfetto. The presente would be «gioco».',
              'Now Marco plays volleyball. «Da piccolo» means when he was little: a past habit.'],
          },
          why: {
            ok: 'A habit in the past, when he was little', no: 'What Marco does these days',
            noWhy: 'These days he plays volleyball («adesso faccio pallavolo»); soccer was «da piccolo».',
            full: '«Da piccolo» points to something Marco used to do again and again. A habit in the past takes the imperfetto.',
            okFirst: false,
          },
          label: 'Imperfetto · abitudine nel passato',
        },
        {
          side: 'then', verb: 'insegnare', mean: 'to teach', correct: 'presente',
          forms: { presente: 'Insegna', imperfetto: 'Insegnava' },
          context: 'Tutti guardano la foto di Sofia.',
          gloss: 'Ms. Rossi! She … my brother, who is in third grade.',
          formOk: '«Insegna» = insegnare, lei form: no -av- before the ending.',
          fb: {
            imperfetto: ['No -av- before the ending. The imperfetto would be «insegnava».',
              'Giulia’s brother is in third grade now («che è in terza»), so Ms. Rossi teaches him today.'],
          },
          why: {
            ok: 'True now: her brother is in Ms. Rossi’s class today', no: 'Part of the old photo, back then',
            noWhy: 'Look at «che è in terza»: her brother is in third grade now.',
            full: 'The photo is old, but Ms. Rossi teaches Giulia’s brother today. Something true now takes the presente.',
            okFirst: true,
          },
          label: 'Presente · vero ancora oggi',
        },
      ],
    },
    {
      id: 3,
      title: 'Sabato al cinema',
      tenses: ['passato', 'imperfetto'], // label order; chips always use TENSE_ORDER
      now: [
        { who: 'Marco', text: 'Scusate ancora per sabato… 🙈', from: 0 },
        { who: 'Marco', glitch: 2, pre: '', post: ' stanchissimo e mi sono addormentato sul divano. 😴' },
        { who: 'Giulia', text: 'Tranquillo! Ma il film ti è piaciuto?', from: 3 },
        { who: 'Marco', glitch: 3, pre: 'Sì, tantissimo! Però ', post: ' i primi venti minuti.' },
      ],
      then: [
        { who: 'Luca', me: true, text: 'Sabato al cinema: che serata! 🎬', from: 0 },
        { who: 'Giulia', glitch: 0, pre: 'Quando siamo arrivati, ', post: ' già una fila lunghissima.' },
        { who: 'Sofia', glitch: 1, pre: 'E Marco ', post: ' mezz’ora dopo, con i popcorn! 😂' },
        { who: 'Luca', me: true, glitch: 4, pre: 'Dopo il film ', post: ' tardi, ma nessuno voleva tornare a casa. 😅' },
      ],
      rounds: [
        {
          side: 'then', verb: 'esserci', mean: 'there is / there are', correct: 'imperfetto',
          forms: { imperfetto: 'c’era', passato: 'c’è stata' },
          context: 'Il gruppo ricorda la serata al cinema.',
          gloss: 'When we arrived, … already a really long line.',
          formOk: '«c’era» = ci + era: essere has its own imperfetto (ero, eri, era).',
          fb: {
            passato: ['One word (c’ + era), no helper + participle. «Era» is the imperfetto of essere. The passato prossimo would be «c’è stata».',
              'The line was already there («già») when they arrived: it’s the scene, not the event.'],
          },
          why: {
            ok: 'The background: the scene when they arrived', no: 'The main event: something that happened once',
            noWhy: 'The line was already there («già»). The event is «siamo arrivati»; the line is the scene.',
            full: 'The long line was the scene they found when they arrived. Background and description take the imperfetto.',
            okFirst: true,
          },
          label: 'Imperfetto · scena / descrizione',
        },
        {
          side: 'then', verb: 'arrivare', mean: 'to arrive', correct: 'passato',
          forms: { imperfetto: 'arrivava', passato: 'è arrivato' },
          context: 'Sofia continua il racconto.',
          gloss: 'And Marco … half an hour later, with the popcorn!',
          formOk: '«è arrivato» = essere + the participle of arrivare, -o to agree with Marco.',
          fb: {
            imperfetto: ['Two words: the helper «è» + the participle «arrivato». The imperfetto is one word: «arrivava».',
              'Marco showed up once, at one moment on Saturday: a completed action.'],
          },
          why: {
            ok: 'One action at one moment: he showed up', no: 'Something Marco used to do',
            noWhy: 'It happened once, on Saturday, half an hour late; it’s not a habit.',
            full: 'Marco arrived once, half an hour after the others, and that’s done. One completed action takes the passato prossimo.',
            okFirst: false,
          },
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'essere', mean: 'to be', correct: 'imperfetto',
          forms: { imperfetto: 'Ero', passato: 'sono stato' },
          context: 'Oggi Marco si scusa con gli amici.',
          gloss: 'I … super tired and I fell asleep on the sofa.',
          formOk: '«Ero» = essere, io form: irregular imperfetto (ero, eri, era).',
          fb: {
            passato: ['«Ero» is one word: it’s the imperfetto of essere (irregular). The passato prossimo would be «sono stato».',
              'Being tired is how Marco felt: the background for the event «mi sono addormentato».'],
          },
          why: {
            ok: 'How Marco felt: a state in the background', no: 'The main event of the story',
            noWhy: 'The event is «mi sono addormentato»; being tired is the background.',
            full: 'Feeling tired is a state, the background to the event (he fell asleep). States and feelings in the background take the imperfetto.',
            okFirst: true,
          },
          label: 'Imperfetto · stato d’animo',
        },
        {
          side: 'now', verb: 'perdere', mean: 'to miss', correct: 'passato',
          forms: { imperfetto: 'perdevo', passato: 'ho perso' },
          context: 'Giulia fa una domanda a Marco.',
          gloss: 'Yes, a lot! But I … the first twenty minutes.',
          formOk: '«ho perso» = avere + the participle of perdere (io).',
          fb: {
            imperfetto: ['Two words: helper + participle. The imperfetto would be one word with -ev-: «perdevo».',
              'Marco missed the first twenty minutes once, on Saturday, and that part is over.'],
          },
          why: {
            ok: 'A single completed action', no: 'Something that kept happening again and again',
            noWhy: 'He missed the start once, at that one film on Saturday.',
            full: 'Marco missed the first twenty minutes on Saturday. One finished action takes the passato prossimo.',
            okFirst: false,
          },
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'then', verb: 'essere', mean: 'to be', correct: 'imperfetto',
          forms: { imperfetto: 'era', passato: 'è stato' },
          context: 'Luca ricorda la fine della serata.',
          gloss: 'After the film it … late, but nobody wanted to go home.',
          formOk: '«era» = essere, lui/lei form: irregular imperfetto.',
          fb: {
            passato: ['One word: «era» is the imperfetto of essere. The passato prossimo would be «è stato».',
              '«Era tardi» describes the time. Italian uses the imperfetto for clock time and «it was late».'],
          },
          why: {
            ok: 'Describing the time: it was late', no: 'An event that happened and ended',
            noWhy: '«Tardi» describes the time of night; it isn’t an event.',
            full: 'Time, weather and age are descriptions, not events. «Era tardi» sets the scene: imperfetto.',
            okFirst: true,
          },
          label: 'Imperfetto · ora / descrizione',
        },
      ],
    },
    {
      id: 4,
      title: 'Estate!',
      tenses: ['presente', 'imperfetto', 'passato'],
      now: [
        { who: 'Giulia', text: 'Primo giorno di vacanza! ☀️ Che fate quest’estate?', from: 0 },
        { who: 'Luca', me: true, glitch: 0, pre: 'A luglio ', post: ' in Sicilia con i miei. Non vedo l’ora!' },
        { who: 'Marco', text: 'Io resto in città, ma ad agosto vado al mare in Liguria.', from: 1 },
        { who: 'Giulia', text: 'Sofia, stamattina ti ho scritto dieci messaggi! 😤', from: 3 },
        { who: 'Sofia', glitch: 3, pre: 'Scusa! Quando mi hai scritto, ', post: ' ancora. 😴' },
      ],
      then: [
        { who: 'Sofia', text: 'Io l’estate scorsa sono andata in Sicilia, da mia zia! 🌋', from: 0 },
        { who: 'Sofia', glitch: 1, pre: 'Un giorno, mentre ', post: ' vicino agli scogli, ho visto un polpo! 🐙' },
        { who: 'Giulia', text: 'Che paura! 😱', from: 2 },
        { who: 'Sofia', glitch: 2, pre: 'L’ultimo giorno ', post: ' sull’Etna con mio zio. Che vista!' },
        { who: 'Luca', me: true, text: 'Io ci vado a luglio! Ci vediamo lì? 😄', from: 4 },
        { who: 'Sofia', glitch: 4, pre: 'Sì! Mia zia ', post: ' a Catania e ci torno anche quest’estate.' },
      ],
      rounds: [
        {
          side: 'now', verb: 'andare', mean: 'to go', correct: 'presente',
          forms: { presente: 'vado', imperfetto: 'andavo', passato: 'sono andato' },
          context: 'Il primo giorno di vacanza, il gruppo fa progetti.',
          gloss: 'In July I … to Sicily with my parents. I can’t wait!',
          formOk: '«vado» = andare, io form: the «v» belongs to the verb, it isn’t an imperfetto ending.',
          fb: {
            imperfetto: ['No -av- before the ending: the «v» belongs to the verb. The imperfetto would be «andavo».',
              'Luca is talking about his plan for this summer, not something he used to do.'],
            passato: ['One word. The passato prossimo would be two: «sono andato».',
              'It’s the first day of vacation and the trip is in July: it hasn’t happened yet.'],
          },
          why: {
            ok: 'A plan for the near future', no: 'A trip that already happened',
            noWhy: 'The trip is in July and it’s only the first day of vacation: «Non vedo l’ora!»',
            full: 'Italian often uses the presente for planned events. The trip is in July, still ahead.',
            okFirst: false,
          },
          label: 'Presente · programma',
        },
        {
          side: 'then', verb: 'nuotare', mean: 'to swim', correct: 'imperfetto',
          forms: { presente: 'nuoto', imperfetto: 'nuotavo', passato: 'ho nuotato' },
          context: 'Sofia racconta la sua vacanza in Sicilia.',
          gloss: 'One day, while I … near the rocks, I saw an octopus!',
          formOk: '«nuotavo» = nuotare, io form, with -av- before the ending.',
          fb: {
            presente: ['nuot-AV-o: -av- before the ending means imperfetto. The presente would be «nuoto».',
              'Sofia is telling a story from last summer, not what she’s doing now.'],
            passato: ['One word, not helper + participle. The passato prossimo would be «ho nuotato».',
              '«Mentre…»: she was in the middle of swimming when she saw the octopus.'],
          },
          why: {
            ok: 'In progress when something else happened', no: 'One finished action in a list of events',
            noWhy: '«Mentre» = while: she was in the middle of swimming when «ho visto un polpo» happened.',
            full: 'The swimming was going on when the octopus appeared («ho visto»). An action in progress takes the imperfetto.',
            okFirst: true,
          },
          label: 'Imperfetto · azione in corso',
        },
        {
          side: 'then', verb: 'salire', mean: 'to go up', correct: 'passato',
          forms: { presente: 'salgo', imperfetto: 'salivo', passato: 'sono salita' },
          context: 'Sofia continua a raccontare.',
          gloss: 'On the last day I … Mount Etna with my uncle. What a view!',
          formOk: '«sono salita» = essere + the participle of salire, -a because Sofia is female.',
          fb: {
            presente: ['«sono» alone is presente, but here it’s helper + participle (sono + salita), two words = passato prossimo. The presente would be «salgo».',
              'Sofia is telling about one trip on the last day of the holiday. It happened and it’s finished.'],
            imperfetto: ['The imperfetto would be one word with -iv-: «salivo». Here there are two words (helper + participle).',
              'It’s one complete event, not a background scene or a habit.'],
          },
          why: {
            ok: 'One complete trip on one specific day', no: 'A background scene that was still going on',
            noWhy: 'It’s the main event of that day, and it’s finished: she went up and saw the view.',
            full: 'Sofia went up Etna once, on the last day, and the trip is over. One completed event takes the passato prossimo.',
            okFirst: false,
          },
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'dormire', mean: 'to sleep', correct: 'imperfetto',
          forms: { presente: 'dormo', imperfetto: 'dormivo', passato: 'ho dormito' },
          context: 'Più tardi, nello stesso gruppo.',
          gloss: 'Sorry! When you texted me, I … still.',
          formOk: '«dormivo» = dormire, io form, with -iv- before the ending.',
          fb: {
            presente: ['dorm-IV-o: -iv- before the ending means imperfetto. The presente would be «dormo».',
              'Sofia is awake and replying now; the sleeping was this morning.'],
            passato: ['One word, no helper. The passato prossimo would be «ho dormito».',
              'She was still asleep («ancora») when Giulia wrote: in progress, not a finished block.'],
          },
          why: {
            ok: 'In progress when the messages arrived', no: 'A finished action: she slept, then woke up',
            noWhy: '«Ancora» = still: she was in the middle of sleeping when Giulia wrote.',
            full: 'Sofia was still asleep when the messages arrived («quando mi hai scritto»). An action in progress takes the imperfetto.',
            okFirst: true,
          },
          label: 'Imperfetto · azione in corso',
        },
        {
          side: 'then', verb: 'abitare', mean: 'to live', correct: 'presente',
          forms: { presente: 'abita', imperfetto: 'abitava', passato: 'ha abitato' },
          context: 'Luca ha un’idea.',
          gloss: 'Yes! My aunt … in Catania and I’m going back there this summer too.',
          formOk: '«abita» = abitare, lei form: no -av- before the ending.',
          fb: {
            imperfetto: ['No -av- before the ending. The imperfetto would be «abitava».',
              'Sofia is going back to her aunt’s this summer: she still lives in Catania.'],
            passato: ['One word. The passato prossimo would be «ha abitato».',
              'It isn’t a finished period: the aunt lives there today.'],
          },
          why: {
            ok: 'A fact that’s still true today', no: 'Where the aunt used to live',
            noWhy: 'Sofia is going back to her aunt’s this summer («ci torno»), so she still lives there.',
            full: 'The aunt lives in Catania today. A fact that is true now takes the presente, even in a story about last summer.',
            okFirst: false,
          },
          label: 'Presente · vero ancora oggi',
        },
      ],
    },
  ];

  /* ---------- progress ---------- */
  function freshProgress() { return { v: 1, done: [], best: {} }; }
  function loadProgress() {
    try {
      const p = JSON.parse(store.get(KEY_PROGRESS, 'null'));
      if (p && p.v === 1 && Array.isArray(p.done)) {
        return {
          v: 1,
          done: p.done.filter((n) => Number.isInteger(n) && n >= 1 && n <= LEVELS.length),
          best: (p.best && typeof p.best === 'object') ? p.best : {},
        };
      }
    } catch (_) { /* corrupt → start fresh */ }
    return freshProgress();
  }
  function saveProgress() { store.set(KEY_PROGRESS, JSON.stringify(state.progress)); }

  let teacherAll = false;
  try { teacherAll = new URLSearchParams(window.location.search).get('tutti') === '1'; } catch (_) { teacherAll = false; }

  const savedHelp = store.get(KEY_HELP, 'mid');
  const state = {
    helpLevel: HELP_HINTS[savedHelp] ? savedHelp : 'mid',
    muted: store.get(KEY_MUTE, '0') === '1', // PREVIEW default: sound ON (this build exists to test audio)
    progress: loadProgress(),
    selected: null,
    level: null,
    roundIndex: 0,
    tried: [],         // wrong tenses tried this round
    solved: false,     // tense step done
    whyTried: [],      // wrong Perché options tried this round
    whyDone: false,    // Perché step done
    firstTry: [],      // per round: tense right first time
    whyFirst: [],      // per round: Perché right first time
  };

  const isDone = (n) => state.progress.done.includes(n);
  const isUnlocked = (n) => teacherAll || n === 1 || isDone(n - 1);

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const screenStart = $('screenStart');
  const screenPlay = $('screenPlay');
  const screenEnd = $('screenEnd');
  const threadNow = $('threadNow');
  const threadThen = $('threadThen');
  const paneNow = $('paneNow');
  const paneThen = $('paneThen');
  const progressEl = $('progress');
  const roundCount = $('roundCount');
  const levelBadge = $('levelBadge');
  const feedback = $('feedback');
  const roundContext = $('roundContext');
  const roundGloss = $('roundGloss');
  const formHint = $('formHint');
  const promptEl = $('roundPrompt');
  const tenseRow = $('tenseRow');
  const whyBox = $('whyBox');
  const whyRow = $('whyRow');
  const whyFeedback = $('whyFeedback');
  const btnNext = $('btnNextRound');
  const helpHint = $('helpHint');
  const headerSubtitle = $('headerSubtitle');
  const btnMute = $('btnMute');
  const btnHelp = $('btnHelp');
  const btnStart = $('btnStart');
  const levelList = $('levelList');
  const levelHint = $('levelHint');
  const audioBar = $('audioBar');
  const audioStatus = $('audioStatus');
  const audioNote = $('audioNote');
  const btnRepeat = $('btnRepeat');
  const btnPause = $('btnPause');
  const glitchDock = $('glitchDock');
  const LEVEL_HINT_DEFAULT = levelHint ? levelHint.textContent : '';

  let audioCtx = null;
  let subtitleTimer = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };

  function showScreen(el) {
    [screenStart, screenPlay, screenEnd].forEach((s) => {
      const on = s === el;
      s.classList.toggle('active', on);
      if (on) s.removeAttribute('hidden');
      else s.setAttribute('hidden', '');
    });
    setSubtitle();
  }

  function baseSubtitle() {
    if (screenStart.classList.contains('active') || !state.level) return 'Ora · Allora · Italiano 3';
    return 'Livello ' + state.level.id + ' di ' + LEVELS.length;
  }
  function setSubtitle(temp) {
    clearTimeout(subtitleTimer);
    headerSubtitle.textContent = temp || baseSubtitle();
    if (temp) subtitleTimer = setTimeout(() => { headerSubtitle.textContent = baseSubtitle(); }, 2200);
  }

  /* ======================================================================
     SPEECH (Web Speech API). Rules:
     - it-IT only; an Italian voice is required (never Italian read by an English voice)
     - the first tap (Inizia / Vai al livello / Rifai) unlocks audio
     - Pausa = cancel, Riprendi = re-read from the start. This is reliable on
       ChromeOS and Android, where speechSynthesis.pause()/resume() misbehave.
     - every call wrapped in try/catch; the game never waits for audio
     ====================================================================== */
  const speech = {
    synth: null,
    voice: null,
    checked: false,     // voice list looked at (or timed out)
    unlocked: false,
    status: 'idle',     // idle | speaking | paused | done
    token: 0,
    timer: null,
    watchdog: null,
    log: [],            // for automated tests: what was spoken / cancelled
  };
  try { if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) speech.synth = window.speechSynthesis; } catch (_) { speech.synth = null; }

  function pickVoice() {
    if (!speech.synth) return null;
    let list = [];
    try { list = speech.synth.getVoices() || []; } catch (_) { list = []; }
    const norm = (v) => String((v && v.lang) || '').toLowerCase().replace('_', '-');
    const it = Array.prototype.filter.call(list, (v) => norm(v).startsWith('it'));
    if (!it.length) return null;
    return it.find((v) => norm(v) === 'it-it' && v.localService) || it.find((v) => norm(v) === 'it-it') || it[0];
  }

  function refreshVoice() {
    try {
      const v = pickVoice();
      if (v) { speech.voice = v; speech.checked = true; }
    } catch (_) { /* ignore */ }
    renderAudio();
  }

  function initSpeech() {
    if (!speech.synth) { speech.checked = true; return; }
    try {
      refreshVoice();
      if (typeof speech.synth.addEventListener === 'function') speech.synth.addEventListener('voiceschanged', refreshVoice);
      else speech.synth.onvoiceschanged = refreshVoice;
    } catch (_) { /* ignore */ }
    // Voices load asynchronously; stop waiting after 2 s (a later voiceschanged still upgrades us).
    setTimeout(() => { if (!speech.checked) { speech.checked = true; refreshVoice(); } }, 2000);
  }

  const audioAvailable = () => !!(speech.synth && speech.voice);

  function spokenText() {
    if (!state.level || !screenPlay.classList.contains('active')) return '';
    const r = round();
    const msg = state.level.now.concat(state.level.then).find((m) => m.glitch === state.roundIndex);
    if (!r || !msg) return '';
    const raw = msg.pre + r.forms[r.correct] + msg.post;
    // Emoji would be read aloud by name: strip them.
    let clean = raw;
    try { clean = raw.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D]/gu, ''); } catch (_) { /* old engines: keep raw */ }
    return clean.replace(/\s+/g, ' ').trim();
  }

  function setAudioStatus(s) {
    speech.status = s;
    renderAudio();
    markReading();
  }

  function stopSpeech(reason) {
    clearTimeout(speech.timer);
    clearInterval(speech.watchdog);
    speech.token += 1; // late events from the old utterance are ignored
    try { if (speech.synth) speech.synth.cancel(); } catch (_) { /* ignore */ }
    speech.log.push('cancel:' + (reason || ''));
  }

  function speakCurrent(reason) {
    if (state.muted || !audioAvailable() || !speech.unlocked) { renderAudio(); return; }
    const text = spokenText();
    if (!text) return;
    stopSpeech('restart');
    const token = speech.token;
    setAudioStatus('speaking');
    // Short gap after cancel(): Chrome sometimes drops a speak() issued in the same tick.
    speech.timer = setTimeout(() => {
      if (token !== speech.token) return;
      try {
        const u = new window.SpeechSynthesisUtterance(text);
        u.lang = 'it-IT';
        if (speech.voice) u.voice = speech.voice;
        u.rate = 0.9;
        u.onend = () => { if (token === speech.token) { clearInterval(speech.watchdog); setAudioStatus('done'); } };
        u.onerror = () => { if (token === speech.token) { clearInterval(speech.watchdog); setAudioStatus('done'); } };
        speech.synth.speak(u);
        speech.log.push('speak:' + (reason || '') + ':' + text);
        // Watchdog: some engines never fire onend. If nothing is speaking or queued, stop showing "Sto leggendo…".
        const started = Date.now();
        speech.watchdog = setInterval(() => {
          if (token !== speech.token) { clearInterval(speech.watchdog); return; }
          let busy = false;
          try { busy = !!(speech.synth.speaking || speech.synth.pending); } catch (_) { busy = false; }
          if ((!busy && Date.now() - started > 1500) || Date.now() - started > 20000) {
            clearInterval(speech.watchdog);
            try { speech.synth.cancel(); } catch (_) { /* ignore */ }
            setAudioStatus('done');
          }
        }, 500);
      } catch (_) {
        setAudioStatus('done');
      }
    }, 60);
  }

  function unlockSpeech() {
    // Runs inside a tap handler: browsers only allow speech after a user gesture.
    if (!speech.synth || speech.unlocked) return;
    speech.unlocked = true;
    if (state.muted) return;
    try {
      const u = new window.SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'it-IT';
      speech.synth.speak(u);
    } catch (_) { /* ignore */ }
  }

  function haltSpeech(reason, nextStatus) {
    const wasActive = speech.status === 'speaking' || speech.status === 'paused';
    stopSpeech(reason);
    if (wasActive || nextStatus) setAudioStatus(nextStatus || 'done');
  }

  function markReading() {
    const reading = speech.status === 'speaking';
    document.querySelectorAll('.bubble.glitch').forEach((b) => b.classList.toggle('reading', reading));
  }

  function renderAudio() {
    if (!audioBar) return;
    const inPlay = screenPlay.classList.contains('active');
    if (!inPlay) { audioBar.hidden = true; audioNote.hidden = true; return; }
    if (state.muted) {
      audioBar.hidden = true;
      audioNote.hidden = false;
      audioNote.textContent = '🔇 Audio spento. Tocca 🔇 in alto per attivarlo.';
      return;
    }
    if (!audioAvailable()) {
      if (!speech.checked) {
        audioNote.hidden = true;
        audioBar.hidden = false;
        audioStatus.innerHTML = '<span class="ico" aria-hidden="true">⏳</span>Preparo l’audio…';
        btnRepeat.hidden = true;
        btnPause.hidden = true;
        return;
      }
      audioBar.hidden = true;
      audioNote.hidden = false;
      audioNote.textContent = '🔇 Audio non disponibile su questo dispositivo: leggi la frase nella chat.';
      return;
    }
    audioNote.hidden = true;
    audioBar.hidden = false;
    btnRepeat.hidden = false;
    const s = speech.status;
    const pauseHadFocus = document.activeElement === btnPause;
    if (s === 'speaking') {
      audioStatus.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>Sto leggendo…';
      btnPause.hidden = false;
      btnPause.textContent = '⏸ Pausa';
      btnPause.setAttribute('aria-label', 'Pausa');
    } else if (s === 'paused') {
      audioStatus.innerHTML = '<span class="eq paused" aria-hidden="true"><i></i><i></i><i></i></span>In pausa';
      btnPause.hidden = false;
      btnPause.textContent = '▶ Riprendi';
      btnPause.setAttribute('aria-label', 'Riprendi: rileggi la frase');
    } else {
      audioStatus.innerHTML = s === 'done'
        ? '<span class="ico" aria-hidden="true">🔊</span>Frase letta'
        : '<span class="ico" aria-hidden="true">🔊</span>Ascolta la frase';
      btnPause.hidden = true;
      if (pauseHadFocus) btnRepeat.focus({ preventScroll: true });
    }
  }

  /* ---------- mute / help ---------- */
  function updateMuteUI() {
    btnMute.textContent = state.muted ? '🔇' : '🔊';
    btnMute.setAttribute('aria-label', state.muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off');
    btnMute.setAttribute('aria-pressed', state.muted ? 'false' : 'true');
  }

  function syncHelpChips() {
    document.querySelectorAll('.help-chip').forEach((chip) => {
      chip.setAttribute('aria-pressed', chip.dataset.help === state.helpLevel ? 'true' : 'false');
    });
    helpHint.textContent = HELP_HINTS[state.helpLevel];
    btnHelp.setAttribute('aria-label', 'Help level: ' + HELP_NAME[state.helpLevel] + '. Change');
    btnHelp.title = 'Help level: ' + HELP_NAME[state.helpLevel];
  }

  function setHelp(level) {
    if (!HELP_HINTS[level]) return;
    state.helpLevel = level;
    store.set(KEY_HELP, level);
    syncHelpChips();
    if (screenPlay.classList.contains('active')) renderDockHelp();
  }

  function beep(ok) {
    if (state.muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = ok ? 660 : 280;
      g.gain.value = 0.04;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      o.stop(audioCtx.currentTime + 0.2);
    } catch (_) { /* ignore */ }
  }

  function updateClock() {
    const el = $('statusTime');
    if (!el) return;
    const d = new Date();
    el.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ---------- start screen ---------- */
  function defaultSelection() {
    const firstOpen = LEVELS.find((l) => isUnlocked(l.id) && !isDone(l.id));
    if (firstOpen) return firstOpen.id;
    const unlocked = LEVELS.filter((l) => isUnlocked(l.id));
    return unlocked[unlocked.length - 1].id;
  }

  function pairLabel(level) {
    return level.tenses.length === 3 ? 'Tutti e tre i tempi' : level.tenses.map((t) => TENSE_LABEL[t]).join(' · ');
  }

  function renderLevels() {
    if (state.selected === null || !isUnlocked(state.selected)) state.selected = defaultSelection();
    levelList.innerHTML = '';
    LEVELS.forEach((lvl) => {
      const unlocked = isUnlocked(lvl.id);
      const done = isDone(lvl.id);
      const selected = unlocked && lvl.id === state.selected;
      const best = state.progress.best[lvl.id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-card' + (done ? ' is-done' : '') + (selected ? ' is-selected' : '') + (unlocked ? '' : ' is-locked');
      btn.dataset.level = String(lvl.id);
      btn.setAttribute('role', 'listitem');
      const reason = 'Completa il Livello ' + (lvl.id - 1) + ' per sbloccarlo';
      let pill;
      if (!unlocked) pill = '<span class="pill locked">Bloccato</span>';
      else if (done) pill = '<span class="pill done">✓ Fatto' + (typeof best === 'number' ? ' · ' + best + '/' + lvl.rounds.length : '') + '</span>';
      else pill = '<span class="pill open">▶ Gioca</span>';
      btn.innerHTML =
        '<span class="level-num" aria-hidden="true">' + (unlocked ? lvl.id : '🔒') + '</span>' +
        '<span><span class="level-title">Livello ' + lvl.id + ' <span class="theme">' + escapeHtml(lvl.title) + '</span></span>' +
        '<span class="level-pair">' + pairLabel(lvl) + '</span>' +
        (unlocked ? '' : '<span class="level-reason">' + reason + '</span>') + '</span>' + pill;
      let aria = 'Livello ' + lvl.id + ', ' + lvl.title + ', ' + pairLabel(lvl) + ', ' + lvl.rounds.length + ' glitch. ';
      if (!unlocked) { aria += 'Bloccato. ' + reason + '.'; btn.setAttribute('aria-disabled', 'true'); }
      else {
        aria += done ? 'Completato. Puoi rifarlo.' : 'Aperto.';
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      }
      btn.setAttribute('aria-label', aria);
      btn.addEventListener('click', () => onLevelCard(lvl.id));
      levelList.appendChild(btn);
    });
    btnStart.disabled = false;
    btnStart.textContent = 'Inizia il Livello ' + state.selected + ' ▶';
    levelHint.classList.remove('is-alert');
    levelHint.textContent = teacherAll
      ? 'Modalità insegnante: tutti i livelli sono aperti (solo per questa visita).'
      : LEVEL_HINT_DEFAULT;
  }

  function onLevelCard(id) {
    if (!isUnlocked(id)) {
      levelHint.textContent = '🔒 Livello ' + id + ' bloccato: completa il Livello ' + (id - 1) + ' per sbloccarlo.';
      levelHint.classList.add('is-alert');
      return;
    }
    state.selected = id;
    renderLevels();
    const card = levelList.querySelector('[data-level="' + id + '"]');
    if (card) card.focus({ preventScroll: true });
  }

  let resetArmed = false;
  let resetTimer = null;
  function onReset() {
    const btn = $('btnResetProgress');
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = 'Sicuro? Tocca di nuovo per azzerare';
      btn.classList.add('armed');
      resetTimer = setTimeout(() => {
        resetArmed = false;
        btn.textContent = 'Azzera i progressi';
        btn.classList.remove('armed');
      }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    resetArmed = false;
    btn.textContent = 'Azzera i progressi';
    btn.classList.remove('armed');
    state.progress = freshProgress();
    store.remove(KEY_PROGRESS);
    state.selected = null;
    renderLevels();
    levelHint.textContent = 'Progressi azzerati. Si riparte dal Livello 1.';
  }

  /* ---------- play ---------- */
  function round() { return state.level.rounds[state.roundIndex]; }

  function renderBubble(msg) {
    const div = document.createElement('div');
    div.className = 'bubble ' + (msg.me ? 'me' : 'them');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = msg.me ? 'Luca (tu)' : msg.who;
    div.appendChild(who);
    const body = document.createElement('div');
    if (typeof msg.glitch === 'number') {
      const r = state.level.rounds[msg.glitch];
      const form = escapeHtml(r.forms[r.correct]);
      const fixed = msg.glitch < state.roundIndex || (msg.glitch === state.roundIndex && state.solved);
      const slot = fixed
        ? '<span class="verb-slot ok">' + form + '</span>'
        : '<span class="verb-target">' + form + '<span class="tag" aria-hidden="true">?</span><span class="sr-only"> (verbo evidenziato)</span></span>';
      body.innerHTML = escapeHtml(msg.pre) + slot + escapeHtml(msg.post);
      div.appendChild(body);
      div.classList.add(fixed ? 'fixed' : 'glitch');
      if (fixed) {
        const tag = document.createElement('div');
        tag.className = 'fixed-tag';
        tag.textContent = '✓ ' + TENSE_LABEL[r.correct];
        div.appendChild(tag);
      } else {
        div.setAttribute('aria-current', 'true');
        div.dataset.target = '1';
      }
      return div;
    }
    body.textContent = msg.text;
    if (msg.photo) {
      const ph = document.createElement('div');
      ph.className = 'photo';
      ph.setAttribute('aria-hidden', 'true');
      ph.textContent = msg.photo;
      body.appendChild(ph);
    }
    div.appendChild(body);
    return div;
  }

  const visible = (m) => (typeof m.glitch === 'number' ? m.glitch : m.from) <= state.roundIndex;

  function renderThreads() {
    threadNow.innerHTML = '';
    threadThen.innerHTML = '';
    state.level.now.filter(visible).forEach((m) => threadNow.appendChild(renderBubble(m)));
    state.level.then.filter(visible).forEach((m) => threadThen.appendChild(renderBubble(m)));
    markReading();
    scrollThreads();
  }

  // AUTO-SCROLL: each pane jumps to its newest message; the current glitch bubble is always kept in view.
  function scrollThreads() {
    requestAnimationFrame(() => {
      const behavior = reducedMotion() ? 'auto' : 'smooth';
      [threadNow, threadThen].forEach((t) => {
        let top = Math.max(0, t.scrollHeight - t.clientHeight); // newest message
        const target = t.querySelector('[data-target="1"]');
        if (target) {
          const tTop = target.getBoundingClientRect().top - t.getBoundingClientRect().top + t.scrollTop;
          if (tTop < top) top = Math.max(0, tTop - 8); // bubble taller than the pane: show its start
        }
        try { t.scrollTo({ top, behavior }); } catch (_) { t.scrollTop = top; }
      });
    });
  }

  function renderProgress() {
    const total = state.level.rounds.length;
    progressEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('div');
      d.className = 'prog-dot';
      if (i < state.roundIndex || (i === state.roundIndex && state.whyDone)) d.classList.add('done');
      else if (i === state.roundIndex) d.classList.add('current');
      progressEl.appendChild(d);
    }
    const label = 'Glitch ' + (state.roundIndex + 1) + ' di ' + total;
    roundCount.textContent = label;
    progressEl.setAttribute('aria-label', label);
  }

  function renderFormHint() {
    const lvl = state.level;
    const cols = TENSE_ORDER.filter((t) => lvl.tenses.includes(t))
      .map((t) => '<div class="fh-col"><dt>' + TENSE_LABEL[t] + '</dt><dd>' + HINT_COL[t] + '</dd></div>').join('');
    formHint.innerHTML =
      '<p class="fh-title">Indizio: una o due parole? Come finisce il verbo?</p>' +
      '<dl>' + cols + '</dl>' +
      '<p class="fh-trap">' + HINT_TRAP[lvl.id] + '</p>';
  }

  function glossHtml(r) {
    const form = escapeHtml(r.forms[r.correct]);
    return escapeHtml(r.gloss) + ' <span class="nowrap">(' + form + ' ← <i>' + escapeHtml(r.verb) + '</i>,</span> ' + escapeHtml(r.mean) + ')';
  }

  function renderDockHelp() {
    const r = round();
    roundContext.textContent = r.context;
    roundContext.hidden = state.helpLevel === 'challenge';
    const more = state.helpLevel === 'more' && !state.solved;
    roundGloss.innerHTML = glossHtml(r);
    roundGloss.hidden = !more;
    if (more) renderFormHint();
    formHint.hidden = !more;
  }

  function renderChips() {
    tenseRow.innerHTML = '';
    tenseRow.classList.toggle('two', state.level.tenses.length === 2);
    TENSE_ORDER.filter((t) => state.level.tenses.includes(t)).forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tense-chip';
      b.dataset.tense = t;
      if (state.tried.includes(t)) {
        b.classList.add('tried');
        b.disabled = true;
        b.innerHTML = TENSE_LABEL[t] + '<span class="sub">già provato</span>';
        b.setAttribute('aria-label', TENSE_LABEL[t] + ', già provato');
      } else {
        b.textContent = TENSE_LABEL[t];
      }
      b.addEventListener('click', () => onTense(t));
      tenseRow.appendChild(b);
    });
    tenseRow.hidden = state.solved;
    promptEl.hidden = state.solved;
  }

  // Perché? options: the order is fixed per round (okFirst), so the right answer isn't always in the same place.
  function whyOptions(r) {
    const ok = { key: 'ok', text: r.why.ok };
    const no = { key: 'no', text: r.why.no };
    return r.why.okFirst ? [ok, no] : [no, ok];
  }

  function renderWhy() {
    const r = round();
    whyBox.hidden = !state.solved;
    whyRow.innerHTML = '';
    // Once answered, the two choices collapse into the feedback line (saves room on phones).
    whyRow.hidden = state.whyDone;
    $('whyPrompt').hidden = state.whyDone;
    if (!state.solved) { whyFeedback.hidden = true; return; }
    whyOptions(r).forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'why-opt';
      b.dataset.why = o.key;
      b.textContent = o.text;
      if (state.whyTried.includes(o.key)) {
        b.classList.add('tried');
        b.disabled = true;
        b.setAttribute('aria-label', o.text + ', già provato');
      }
      if (state.whyDone) {
        b.disabled = true;
        if (o.key === 'ok') b.classList.add('correct');
      }
      b.addEventListener('click', () => onWhy(o.key));
      whyRow.appendChild(b);
    });
  }

  function scrollDockTo(el) {
    requestAnimationFrame(() => {
      try { el.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch (_) { /* ignore */ }
    });
  }

  function renderRound(focusChip) {
    state.tried = [];
    state.solved = false;
    state.whyTried = [];
    state.whyDone = false;
    feedback.hidden = true;
    feedback.innerHTML = '';
    feedback.className = 'feedback';
    whyFeedback.hidden = true;
    whyFeedback.innerHTML = '';
    btnNext.hidden = true;

    const r = round();
    levelBadge.innerHTML = '<span class="badge-level">Livello ' + state.level.id + ' · </span>' + pairLabel(state.level);
    renderProgress();
    renderThreads();
    paneNow.classList.toggle('focus-side', r.side === 'now');
    paneThen.classList.toggle('focus-side', r.side === 'then');
    paneNow.classList.toggle('dim-side', r.side !== 'now');
    paneThen.classList.toggle('dim-side', r.side !== 'then');
    renderDockHelp();
    renderChips();
    renderWhy();
    speech.status = 'idle';
    renderAudio();
    glitchDock.scrollTop = 0;
    if (focusChip) {
      const first = tenseRow.querySelector('.tense-chip:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
    // AUTO-SPEAK the new sentence shortly after its bubble appears.
    const idx = state.roundIndex;
    const lvlId = state.level.id;
    setTimeout(() => {
      if (state.level && state.level.id === lvlId && state.roundIndex === idx && screenPlay.classList.contains('active')) speakCurrent('auto');
    }, 400);
  }

  function formPart(r, t) { return '<span class="fb-part"><b>The form:</b> ' + escapeHtml(r.fb[t][0]) + '</span>'; }
  function storyPart(r, t) { return '<span class="fb-part"><b>The story:</b> ' + escapeHtml(r.fb[t][1]) + '</span>'; }

  function onTense(tense) {
    if (state.solved || state.tried.includes(tense)) return;
    const r = round();
    if (tense === r.correct) {
      state.solved = true;
      state.firstTry[state.roundIndex] = state.tried.length === 0;
      beep(true);
      let html = '<span class="fb-title">Esatto! «' + escapeHtml(r.forms[r.correct]) + '» · ' + TENSE_LABEL[r.correct] + '</span>' +
        '<span class="fb-form">' + escapeHtml(r.formOk) + '</span>';
      if (state.helpLevel === 'challenge' && state.tried.length) {
        html += state.tried.map((t) => '<span class="fb-extra"><strong>' + TENSE_LABEL[t] + '?</strong> ' + escapeHtml(r.fb[t][0]) + '</span>').join('');
      }
      feedback.hidden = false;
      feedback.className = 'feedback ok';
      feedback.innerHTML = html;
      renderThreads();
      renderDockHelp();
      renderChips();
      renderWhy();
      const firstOpt = whyRow.querySelector('.why-opt:not(:disabled)');
      if (firstOpt) firstOpt.focus({ preventScroll: true });
      scrollDockTo(whyBox);
    } else {
      state.tried.push(tense);
      beep(false);
      feedback.hidden = false;
      feedback.className = 'feedback soft';
      if (state.helpLevel === 'challenge') {
        const nudge = TENSE_ORDER.filter((t) => state.level.tenses.includes(t)).map((t) => NUDGE[t]).join(' ');
        feedback.innerHTML = '<span class="fb-title">Quasi! Riprova.</span>Pensa: ' + nudge.charAt(0).toLowerCase() + nudge.slice(1);
      } else {
        feedback.innerHTML = '<span class="fb-title">Quasi! Riprova.</span>' + formPart(r, tense) + storyPart(r, tense);
      }
      renderChips();
      const next = tenseRow.querySelector('.tense-chip:not(:disabled)');
      if (next) next.focus({ preventScroll: true });
      scrollDockTo(feedback);
    }
  }

  function onWhy(key) {
    if (!state.solved || state.whyDone || state.whyTried.includes(key)) return;
    const r = round();
    whyFeedback.hidden = false;
    if (key === 'ok') {
      state.whyDone = true;
      state.whyFirst[state.roundIndex] = state.whyTried.length === 0;
      beep(true);
      whyFeedback.className = 'feedback ok';
      whyFeedback.innerHTML = '<span class="fb-title">✓ Sì! ' + escapeHtml(r.why.ok) + '.</span>' + escapeHtml(r.why.full);
      const last = state.roundIndex === state.level.rounds.length - 1;
      btnNext.textContent = last ? 'Fine del livello ▶' : 'Avanti ▶';
      btnNext.hidden = false;
      renderWhy();
      renderProgress();
      btnNext.focus({ preventScroll: true });
      scrollDockTo(btnNext);
    } else {
      state.whyTried.push(key);
      beep(false);
      whyFeedback.className = 'feedback soft';
      whyFeedback.innerHTML = '<span class="fb-title">Non proprio. Riprova.</span>' + escapeHtml(r.why.noWhy);
      renderWhy();
      const other = whyRow.querySelector('.why-opt:not(:disabled)');
      if (other) other.focus({ preventScroll: true });
      scrollDockTo(whyFeedback);
    }
  }

  function onNextRound() {
    if (!state.whyDone) return;
    haltSpeech('round-change');
    state.roundIndex += 1;
    if (state.roundIndex >= state.level.rounds.length) showEnd();
    else renderRound(true);
  }

  function startLevel(id) {
    const lvl = LEVELS.find((l) => l.id === id);
    if (!lvl || !isUnlocked(id)) return;
    haltSpeech('level-start');
    unlockSpeech();
    state.level = lvl;
    state.selected = id;
    state.roundIndex = 0;
    state.firstTry = [];
    state.whyFirst = [];
    showScreen(screenPlay);
    renderRound(true);
  }

  /* ---------- end ---------- */
  function showEnd() {
    haltSpeech('level-end');
    const lvl = state.level;
    const total = lvl.rounds.length;
    const score = state.firstTry.filter(Boolean).length;
    const whyScore = state.whyFirst.filter(Boolean).length;
    const next = LEVELS.find((l) => l.id === lvl.id + 1);
    const wasUnlocked = next ? isUnlocked(next.id) : true;

    if (!isDone(lvl.id)) state.progress.done.push(lvl.id);
    state.progress.done.sort();
    const prevBest = state.progress.best[lvl.id];
    state.progress.best[lvl.id] = typeof prevBest === 'number' ? Math.max(prevBest, score) : score;
    saveProgress();

    state.roundIndex = total; // everything shown as fixed
    showScreen(screenEnd);
    renderAudio();
    $('endTitle').textContent = 'Livello ' + lvl.id + ' completato!';
    $('scoreLine').textContent = 'Tempo giusto al primo colpo: ' + score + ' su ' + total;
    const whyLine = $('whyScoreLine');
    whyLine.hidden = false;
    whyLine.textContent = '«Perché?» giusto al primo colpo: ' + whyScore + ' su ' + total;

    const unlockLine = $('unlockLine');
    const allDone = LEVELS.every((l) => isDone(l.id));
    if (next && !wasUnlocked) {
      unlockLine.hidden = false;
      unlockLine.textContent = '🔓 Sbloccato: Livello ' + next.id + ' · ' + pairLabel(next);
    } else if (!next && allDone) {
      unlockLine.hidden = false;
      unlockLine.textContent = '🎉 Hai riparato tutti i glitch!';
    } else {
      unlockLine.hidden = true;
    }

    const reel = $('replayReel');
    reel.innerHTML = '';
    lvl.rounds.forEach((r, i) => {
      const msg = lvl.now.concat(lvl.then).find((m) => m.glitch === i);
      const card = document.createElement('div');
      card.className = 'replay-card';
      const first = state.firstTry[i];
      card.innerHTML =
        '<span class="try' + (first ? ' first' : '') + '">' + (first ? '⭐ al primo colpo' : '✓ con un altro tentativo') + '</span>' +
        '<div class="side-tag">' + (r.side === 'now' ? 'ORA' : 'ALLORA') + ' · Glitch ' + (i + 1) + '</div>' +
        '<p class="line">' + escapeHtml(msg.pre) + '<span class="verb-slot ok">' + escapeHtml(r.forms[r.correct]) + '</span>' + escapeHtml(msg.post) + '</p>' +
        '<p class="tense">' + r.label + '</p>';
      reel.appendChild(card);
    });
    reel.scrollTop = 0;

    const btnNextLevel = $('btnNextLevel');
    const btnReplay = $('btnReplay');
    btnReplay.textContent = 'Rifai il Livello ' + lvl.id;
    if (next) {
      btnNextLevel.hidden = false;
      btnNextLevel.textContent = 'Vai al Livello ' + next.id + ' ▶';
      btnReplay.className = 'ghost-btn';
    } else {
      btnNextLevel.hidden = true;
      btnReplay.className = 'primary-btn';
    }
    (next ? btnNextLevel : btnReplay).focus({ preventScroll: true });
  }

  function goHome() {
    haltSpeech('level-exit');
    state.level = null;
    state.selected = null;
    renderLevels();
    showScreen(screenStart);
    renderAudio();
  }

  /* ---------- events ---------- */
  btnStart.addEventListener('click', () => startLevel(state.selected));
  btnNext.addEventListener('click', onNextRound);
  $('btnReplay').addEventListener('click', () => startLevel(state.level.id));
  $('btnNextLevel').addEventListener('click', () => startLevel(state.level.id + 1));
  $('btnHome').addEventListener('click', goHome);
  $('btnLevels').addEventListener('click', goHome);
  $('btnResetProgress').addEventListener('click', onReset);

  btnRepeat.addEventListener('click', () => { unlockSpeech(); speakCurrent('repeat'); });
  btnPause.addEventListener('click', () => {
    if (speech.status === 'speaking') {
      // Reliable "pause" on ChromeOS/Android: stop now…
      stopSpeech('pause');
      setAudioStatus('paused');
    } else if (speech.status === 'paused') {
      // …and "resume" = read the short sentence again from the start.
      speakCurrent('resume');
    }
  });

  document.querySelectorAll('.help-chip').forEach((chip) => {
    chip.addEventListener('click', () => setHelp(chip.dataset.help));
  });

  btnMute.addEventListener('click', () => {
    state.muted = !state.muted;
    store.set(KEY_MUTE, state.muted ? '1' : '0');
    updateMuteUI();
    if (state.muted) haltSpeech('mute', 'idle');
    else { unlockSpeech(); speech.status = 'idle'; }
    renderAudio();
    markReading();
  });

  document.addEventListener('visibilitychange', () => {
    try { if (document.hidden) haltSpeech('hidden'); } catch (_) { /* ignore */ }
  });
  window.addEventListener('pagehide', () => { try { stopSpeech('pagehide'); } catch (_) { /* ignore */ } });

  // Header help button: cycles the help level IN PLACE (never leaves the round).
  btnHelp.addEventListener('click', () => {
    const i = HELP_ORDER.indexOf(state.helpLevel);
    setHelp(HELP_ORDER[(i + 1) % HELP_ORDER.length]);
    setSubtitle('Aiuto: ' + HELP_NAME[state.helpLevel]);
    if (screenStart.classList.contains('active')) {
      $('helpPanelStart').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Keep the newest message in view when the dock grows or shrinks (feedback, Perché?, More help).
  try {
    if ('ResizeObserver' in window) {
      let last = 0;
      new ResizeObserver(() => {
        const h = glitchDock.offsetHeight;
        if (h !== last && state.level && screenPlay.classList.contains('active')) { last = h; scrollThreads(); }
      }).observe(glitchDock);
    }
  } catch (_) { /* ignore */ }

  /* ---------- init ---------- */
  updateMuteUI();
  syncHelpChips();
  updateClock();
  setInterval(updateClock, 30000);
  renderLevels();
  showScreen(screenStart);
  try { initSpeech(); } catch (_) { speech.checked = true; }

  // Exposed for automated tests only (read-only snapshot).
  window.__timeGlitch = {
    preview: true,
    levels: LEVELS,
    state: () => JSON.parse(JSON.stringify({
      progress: state.progress, helpLevel: state.helpLevel, roundIndex: state.roundIndex,
      level: state.level && state.level.id, teacherAll, muted: state.muted,
      solved: state.solved, whyDone: state.whyDone, firstTry: state.firstTry, whyFirst: state.whyFirst,
    })),
    speech: () => ({ status: speech.status, voice: speech.voice ? speech.voice.name : null, checked: speech.checked, unlocked: speech.unlocked, log: speech.log.slice() }),
  };
})();
