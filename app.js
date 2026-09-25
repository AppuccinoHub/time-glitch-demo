(() => {
  'use strict';

  /* ======================================================================
     Time Glitch — Italian 3 · 4 levels
     L1 Presente/Passato prossimo · L2 Presente/Imperfetto
     L3 Passato prossimo/Imperfetto · L4 all three
     Progress is stored ONLY on this device (localStorage), wrapped in
     try/catch so blocked storage never breaks the app. No logins, no data sent.
     ====================================================================== */

  const KEY_HELP = 'timeGlitch.helpLevel';
  const KEY_MUTE = 'timeGlitch.muted';
  const KEY_PROGRESS = 'timeGlitch.progress.v1';

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
    more: 'Italian context + English gloss + a tip question under each glitch.',
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

  /* ======================================================================
     CONTENT
     Messages: { who, me?, text, from }  → visible from round index `from`.
     Glitch messages: { who, me?, glitch: roundIndex, pre, post }.
     Rounds: verb (infinitive shown), correct tense, forms (exactly as they
     appear in the sentence), context (IT), gloss (EN), tip, why{wrongTense},
     ok (reason when correct), label (IT, end screen).
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
          side: 'now', verb: 'aspettare', correct: 'presente',
          forms: { presente: 'aspetto', passato: 'ho aspettato' },
          context: 'Lunedì, 7:55, prima della campanella.',
          gloss: 'I [to wait for] you in front of the gate. Hurry up!',
          tip: 'Is Sofia still at the gate? Look at «Sbrigatevi!»',
          why: { passato: '«Vi ho aspettato» means the waiting is over. But Sofia is still at the gate and tells everyone to hurry up — it’s happening right now.' },
          ok: 'Sofia is waiting at this moment.',
          label: 'Presente · adesso',
        },
        {
          side: 'then', verb: 'perdere', correct: 'passato',
          forms: { presente: 'perdiamo', passato: 'abbiamo perso' },
          context: 'Nel gruppo si parla della partita di sabato.',
          gloss: 'Yes, and in the end we [to lose] 4–2.',
          tip: 'Is the match still going on, or is there a final score?',
          why: { presente: '«Perdiamo» would mean the match is happening now or is still to come. It was on Saturday and it’s over, with a final score: a completed event.' },
          ok: 'A finished event with a final result.',
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'dimenticare', correct: 'passato',
          forms: { presente: 'Dimentico', passato: 'Ho dimenticato' },
          context: 'In classe, prima della lezione di storia.',
          gloss: 'Help! I [to forget] my history book at home.',
          tip: 'Marco is at school, the book is at home. When did the forgetting happen?',
          why: { presente: '«Dimentico» would describe something happening now or a habit («I always forget»). Marco is already at school without the book: the forgetting is done, and he’s dealing with the result.' },
          ok: 'A finished action — the result is right now.',
          label: 'Passato prossimo · azione finita, risultato adesso',
        },
        {
          side: 'then', verb: 'lavorare', correct: 'presente',
          forms: { presente: 'lavora', passato: 'ha lavorato' },
          context: 'Si parla della serata in pizzeria.',
          gloss: 'At Gino’s? My cousin [to work] there. Next time ask for Matteo!',
          tip: 'Is this about Saturday, or about Matteo’s job today? Look at «La prossima volta…»',
          why: { passato: '«Ha lavorato» would mean his job there is over. But Giulia says to ask for him next time — he still works there. A fact that is true now takes the presente, even in a chat about Saturday.' },
          ok: 'A fact that is true today.',
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
          side: 'then', verb: 'avere', correct: 'imperfetto',
          forms: { presente: 'Abbiamo', imperfetto: 'Avevamo' },
          context: 'Sofia ha trovato una vecchia foto.',
          gloss: 'We [to be] six — so little! (Italian uses avere for age.)',
          tip: 'Is this their age today, or their age in the photo?',
          why: { presente: '«Abbiamo sei anni» would be their age today — but they’re in high school. In the photo they were six: age and description in the past take the imperfetto.' },
          ok: 'Age in the past.',
          label: 'Imperfetto · età nel passato',
        },
        {
          side: 'now', verb: 'andare', correct: 'presente',
          forms: { presente: 'va', imperfetto: 'andava' },
          context: 'Marco fa una domanda alle ragazze.',
          gloss: 'Not me, but Sofia does: she [to go] to class three times a week.',
          tip: '«Sofia sì» — does Sofia still dance?',
          why: { imperfetto: '«Andava» = she used to go (maybe not anymore). But Giulia says Sofia still dances («Sofia sì»). A habit that is true now takes the presente.' },
          ok: 'A habit that is still true today.',
          label: 'Presente · abitudine di oggi',
        },
        {
          side: 'now', verb: 'giocare', correct: 'imperfetto',
          forms: { presente: 'gioco', imperfetto: 'giocavo' },
          context: 'Sofia chiede a Marco del suo sport.',
          gloss: 'No, now I play volleyball. When I was little I [to play] soccer with Luca.',
          tip: 'Two time frames: «adesso» and «da piccolo». Which one is the glitched verb in?',
          why: { presente: '«Gioco» would mean he plays soccer now — but he just said he plays volleyball now. «Da piccolo» points to a past habit: imperfetto.' },
          ok: 'A habit in the past.',
          label: 'Imperfetto · abitudine nel passato',
        },
        {
          side: 'then', verb: 'insegnare', correct: 'presente',
          forms: { presente: 'Insegna', imperfetto: 'Insegnava' },
          context: 'Tutti guardano la foto di Sofia.',
          gloss: 'Ms. Rossi! She [to teach] my brother, who is in third grade.',
          tip: 'Is the brother in third grade now or back then? Look at «che è».',
          why: { imperfetto: '«Insegnava» puts her teaching in the past. But Giulia’s brother is in third grade <strong>now</strong> («che è in terza»), so Ms. Rossi teaches him today.' },
          ok: 'True right now, even though the photo is old.',
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
          side: 'then', verb: 'esserci', correct: 'imperfetto',
          forms: { imperfetto: 'c’era', passato: 'c’è stata' },
          context: 'Il gruppo ricorda la serata al cinema.',
          gloss: 'When we arrived, there [to be] already a really long line.',
          tip: 'Was the line one event, or the scene they found when they arrived?',
          why: { passato: '«C’è stata» presents the line as a completed event. But the line was already there when they arrived («già») — it’s the background scene, so imperfetto.' },
          ok: 'The scene when they arrived.',
          label: 'Imperfetto · scena / descrizione',
        },
        {
          side: 'then', verb: 'arrivare', correct: 'passato',
          forms: { imperfetto: 'arrivava', passato: 'è arrivato' },
          context: 'Sofia continua il racconto.',
          gloss: 'And Marco [to arrive] half an hour later, with the popcorn!',
          tip: 'One arrival at one moment — or a habit / background scene?',
          why: { imperfetto: '«Arrivava» would describe a habit («he used to arrive») or an action in progress. This is one specific moment on Saturday — Marco showed up once, and it’s done: passato prossimo.' },
          ok: 'One completed moment (essere + arrivato, agreeing with Marco).',
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'essere', correct: 'imperfetto',
          forms: { imperfetto: 'Ero', passato: 'Sono stato' },
          context: 'Oggi Marco si scusa con gli amici.',
          gloss: 'I [to be] super tired and I fell asleep on the sofa.',
          tip: 'Which part is the event, and which part is how Marco felt?',
          why: { passato: '«Sono stato stanchissimo» presents the tiredness as a finished event. Here it’s how Marco felt — the background for the event «mi sono addormentato». Feelings and states in the background take the imperfetto.' },
          ok: 'A state (how he felt) behind the event.',
          label: 'Imperfetto · stato d’animo',
        },
        {
          side: 'now', verb: 'perdere', correct: 'passato',
          forms: { imperfetto: 'perdevo', passato: 'ho perso' },
          context: 'Giulia fa una domanda a Marco.',
          gloss: 'Yes, a lot! But I [to miss] the first twenty minutes.',
          tip: 'Missing the start of the film: did it happen once, or was it a habit?',
          why: { imperfetto: '«Perdevo» would suggest an ongoing or repeated action. Marco missed the first twenty minutes once, on Saturday, and that part is finished: passato prossimo.' },
          ok: 'A single completed action.',
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'then', verb: 'essere', correct: 'imperfetto',
          forms: { imperfetto: 'era', passato: 'è stato' },
          context: 'Luca ricorda la fine della serata.',
          gloss: 'After the film it [to be] late, but nobody wanted to go home.',
          tip: 'Is this an event, or a description of the time / situation?',
          why: { passato: '«È stato tardi» treats the time as an event — Italian doesn’t say it that way. Clock time and «it was late» describe the situation: imperfetto.' },
          ok: 'Describing the time.',
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
          side: 'now', verb: 'andare', correct: 'presente',
          forms: { presente: 'vado', imperfetto: 'andavo', passato: 'sono andato' },
          context: 'Il primo giorno di vacanza, il gruppo fa progetti.',
          gloss: 'In July I [to go] to Sicily with my parents. I can’t wait!',
          tip: 'Has the trip happened yet? Look at «Non vedo l’ora!»',
          why: {
            imperfetto: '«Andavo» describes a past habit («I used to go») — not a plan. Luca is answering «what are you doing this summer?»',
            passato: '«Sono andato» means the trip already happened. It’s the first day of vacation and the trip is in July — it’s still ahead. Italian often uses the presente for planned events.',
          },
          ok: 'Presente for a planned trip.',
          label: 'Presente · programma',
        },
        {
          side: 'then', verb: 'nuotare', correct: 'imperfetto',
          forms: { presente: 'nuoto', imperfetto: 'nuotavo', passato: 'ho nuotato' },
          context: 'Sofia racconta la sua vacanza in Sicilia.',
          gloss: 'One day, while I [to swim] near the rocks, I saw an octopus!',
          tip: 'Two actions: one in progress, one that interrupts it. Which is the glitched verb?',
          why: {
            presente: '«Nuoto» would put the swimming now. But Sofia is telling a story from last summer («ho visto un polpo»).',
            passato: '«Ho nuotato» presents the swimming as finished. Here the swimming was in progress when something interrupted it («mentre… ho visto») — an action in progress takes the imperfetto.',
          },
          ok: 'An action in progress, interrupted by «ho visto».',
          label: 'Imperfetto · azione in corso',
        },
        {
          side: 'then', verb: 'salire', correct: 'passato',
          forms: { presente: 'salgo', imperfetto: 'salivo', passato: 'sono salita' },
          context: 'Sofia continua a raccontare.',
          gloss: 'On the last day I [to go up] Mount Etna with my uncle. What a view!',
          tip: 'One trip on one specific day — finished, or in progress?',
          why: {
            presente: '«Salgo» would mean she’s climbing now. This happened on the last day of last summer’s trip.',
            imperfetto: '«Salivo» would make the climb sound ongoing or habitual, leaving us waiting for what happened next. It’s one complete trip on one day: passato prossimo.',
          },
          ok: 'One completed event (essere + salita, agreeing with Sofia).',
          label: 'Passato prossimo · azione finita',
        },
        {
          side: 'now', verb: 'dormire', correct: 'imperfetto',
          forms: { presente: 'dormo', imperfetto: 'dormivo', passato: 'ho dormito' },
          context: 'Più tardi, nello stesso gruppo.',
          gloss: 'Sorry! When you texted me, I [to sleep] still.',
          tip: 'Was the sleeping still in progress when the messages arrived?',
          why: {
            presente: '«Dormo» would mean Sofia is asleep right now — but she’s replying! The sleeping was this morning, when the messages arrived.',
            passato: '«Ho dormito» presents the sleep as a finished block. Here Sofia was in the middle of sleeping when Giulia wrote («quando mi hai scritto… ancora»): action in progress → imperfetto.',
          },
          ok: 'In progress when something else happened.',
          label: 'Imperfetto · azione in corso',
        },
        {
          side: 'then', verb: 'abitare', correct: 'presente',
          forms: { presente: 'abita', imperfetto: 'abitava', passato: 'ha abitato' },
          context: 'Luca ha un’idea.',
          gloss: 'Yes! My aunt [to live] in Catania and I’m going back there this summer too.',
          tip: 'Does the aunt live there only in the story, or still today?',
          why: {
            imperfetto: '«Abitava» would mean she used to live there (maybe not anymore). But Sofia is going back to stay with her this summer — she still lives there: presente.',
            passato: '«Ha abitato» would describe a finished period of living there. The aunt still lives in Catania today, so it’s a current fact: presente.',
          },
          ok: 'A fact that is still true today.',
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
    muted: store.get(KEY_MUTE, '1') !== '0', // default: sound OFF
    progress: loadProgress(),
    selected: null,
    level: null,       // current level object
    roundIndex: 0,
    tried: [],         // wrong tenses tried this round
    solved: false,
    firstTry: [],      // per round: true/false
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
  const tenseTip = $('tenseTip');
  const promptEl = $('roundPrompt');
  const tenseRow = $('tenseRow');
  const btnNext = $('btnNextRound');
  const helpHint = $('helpHint');
  const headerSubtitle = $('headerSubtitle');
  const btnMute = $('btnMute');
  const btnHelp = $('btnHelp');
  const btnStart = $('btnStart');
  const levelList = $('levelList');
  const levelHint = $('levelHint');
  const LEVEL_HINT_DEFAULT = levelHint ? levelHint.textContent : '';

  let audioCtx = null;
  let subtitleTimer = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

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

  function glitchSlot(msg, activeRound) {
    const r = state.level.rounds[msg.glitch];
    let slot;
    const fixed = msg.glitch < state.roundIndex || (msg.glitch === state.roundIndex && state.solved) || activeRound === 'end';
    if (fixed) {
      slot = '<span class="verb-slot ok">' + r.forms[r.correct] + '</span>';
    } else if (state.tried.length) {
      const last = state.tried[state.tried.length - 1];
      slot = '<span class="verb-slot wrong">' + r.forms[last] + '</span>';
    } else {
      slot = '<span class="verb-slot inf" aria-label="glitch: ' + r.verb + '">' + r.verb + '</span>';
    }
    return { html: escapeHtml(msg.pre) + slot + escapeHtml(msg.post), fixed };
  }

  function renderBubble(msg) {
    const div = document.createElement('div');
    div.className = 'bubble ' + (msg.me ? 'me' : 'them');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = msg.me ? 'Luca (tu)' : msg.who;
    div.appendChild(who);
    const body = document.createElement('div');
    if (typeof msg.glitch === 'number') {
      const g = glitchSlot(msg);
      body.innerHTML = g.html;
      div.classList.add(g.fixed ? 'fixed' : 'glitch');
      if (!g.fixed) div.setAttribute('aria-current', 'true');
    } else {
      body.textContent = msg.text;
      if (msg.photo) {
        const ph = document.createElement('div');
        ph.className = 'photo';
        ph.setAttribute('aria-hidden', 'true');
        ph.textContent = msg.photo;
        body.appendChild(ph);
      }
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
    scrollThreads();
  }

  function scrollThreads() {
    requestAnimationFrame(() => {
      [threadNow, threadThen].forEach((t) => { t.scrollTop = t.scrollHeight; });
    });
  }

  function renderProgress() {
    const total = state.level.rounds.length;
    progressEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('div');
      d.className = 'prog-dot';
      if (i < state.roundIndex || (i === state.roundIndex && state.solved)) d.classList.add('done');
      else if (i === state.roundIndex) d.classList.add('current');
      progressEl.appendChild(d);
    }
    const label = 'Glitch ' + (state.roundIndex + 1) + ' di ' + total;
    roundCount.textContent = label;
    progressEl.setAttribute('aria-label', label);
  }

  function renderDockHelp() {
    const r = round();
    roundContext.textContent = r.context;
    roundContext.hidden = state.helpLevel === 'challenge';
    roundGloss.textContent = r.gloss;
    tenseTip.textContent = 'Tip: ' + r.tip;
    roundGloss.hidden = state.helpLevel !== 'more';
    tenseTip.hidden = state.helpLevel !== 'more' || state.solved;
    scrollThreads();
  }

  function renderChips() {
    const r = round();
    tenseRow.innerHTML = '';
    tenseRow.classList.toggle('two', state.level.tenses.length === 2);
    TENSE_ORDER.filter((t) => state.level.tenses.includes(t)).forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tense-chip';
      b.dataset.tense = t;
      const tried = state.tried.includes(t);
      if (tried) {
        b.classList.add('tried');
        b.disabled = true;
        b.innerHTML = TENSE_LABEL[t] + '<span class="sub">già provato</span>';
        b.setAttribute('aria-label', TENSE_LABEL[t] + ', già provato');
      } else {
        b.textContent = TENSE_LABEL[t];
      }
      if (state.solved) {
        b.disabled = true;
        if (t === r.correct) b.classList.add('correct-flash');
      }
      b.addEventListener('click', () => onTense(t));
      tenseRow.appendChild(b);
    });
  }

  function renderRound(focusChip) {
    state.tried = [];
    state.solved = false;
    feedback.hidden = true;
    feedback.innerHTML = '';
    feedback.className = 'feedback';
    btnNext.hidden = true;
    promptEl.hidden = false;

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
    if (focusChip) {
      const first = tenseRow.querySelector('.tense-chip:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function onTense(tense) {
    if (state.solved || state.tried.includes(tense)) return;
    const r = round();
    if (tense === r.correct) {
      state.solved = true;
      state.firstTry[state.roundIndex] = state.tried.length === 0;
      beep(true);
      let html = '<span class="fb-title">Esatto! «' + escapeHtml(r.forms[r.correct]) + '» · ' + TENSE_LABEL[r.correct] + '</span>' + r.ok;
      if (state.helpLevel === 'challenge' && state.tried.length) {
        html += state.tried.map((t) => '<span class="fb-extra"><strong>' + TENSE_LABEL[t] + '?</strong> ' + r.why[t] + '</span>').join('');
      }
      feedback.hidden = false;
      feedback.className = 'feedback ok';
      feedback.innerHTML = html;
      promptEl.hidden = true;
      tenseTip.hidden = true;
      const last = state.roundIndex === state.level.rounds.length - 1;
      btnNext.textContent = last ? 'Fine del livello ▶' : 'Avanti ▶';
      btnNext.hidden = false;
      renderProgress();
      renderThreads();
      renderChips();
      btnNext.focus({ preventScroll: true });
    } else {
      state.tried.push(tense);
      beep(false);
      feedback.hidden = false;
      feedback.className = 'feedback soft';
      if (state.helpLevel === 'challenge') {
        const nudge = TENSE_ORDER.filter((t) => state.level.tenses.includes(t)).map((t) => NUDGE[t]).join(' ');
        feedback.innerHTML = '<span class="fb-title">Quasi! Riprova.</span>Pensa: ' + nudge.charAt(0).toLowerCase() + nudge.slice(1);
      } else {
        feedback.innerHTML = '<span class="fb-title">Quasi! Riprova.</span>' + r.why[tense];
      }
      renderThreads();
      renderChips();
      const next = tenseRow.querySelector('.tense-chip:not(:disabled)');
      if (next) next.focus({ preventScroll: true });
    }
    scrollThreads();
  }

  function onNextRound() {
    if (!state.solved) return;
    state.roundIndex += 1;
    if (state.roundIndex >= state.level.rounds.length) showEnd();
    else renderRound(true);
  }

  function startLevel(id) {
    const lvl = LEVELS.find((l) => l.id === id);
    if (!lvl || !isUnlocked(id)) return;
    state.level = lvl;
    state.selected = id;
    state.roundIndex = 0;
    state.firstTry = [];
    showScreen(screenPlay);
    renderRound(true);
  }

  /* ---------- end ---------- */
  function showEnd() {
    const lvl = state.level;
    const total = lvl.rounds.length;
    const score = state.firstTry.filter(Boolean).length;
    const next = LEVELS.find((l) => l.id === lvl.id + 1);
    const wasUnlocked = next ? isUnlocked(next.id) : true;

    if (!isDone(lvl.id)) state.progress.done.push(lvl.id);
    state.progress.done.sort();
    const prevBest = state.progress.best[lvl.id];
    state.progress.best[lvl.id] = typeof prevBest === 'number' ? Math.max(prevBest, score) : score;
    saveProgress();

    state.roundIndex = total; // everything shown as fixed
    showScreen(screenEnd);
    $('endTitle').textContent = 'Livello ' + lvl.id + ' completato!';
    $('scoreLine').textContent = 'Al primo colpo: ' + score + ' su ' + total;

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
        '<p class="line">' + escapeHtml(msg.pre) + '<span class="verb-slot ok">' + r.forms[r.correct] + '</span>' + escapeHtml(msg.post) + '</p>' +
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
    state.level = null;
    state.selected = null;
    renderLevels();
    showScreen(screenStart);
  }

  /* ---------- events ---------- */
  btnStart.addEventListener('click', () => startLevel(state.selected));
  btnNext.addEventListener('click', onNextRound);
  $('btnReplay').addEventListener('click', () => startLevel(state.level.id));
  $('btnNextLevel').addEventListener('click', () => startLevel(state.level.id + 1));
  $('btnHome').addEventListener('click', goHome);
  $('btnLevels').addEventListener('click', goHome);
  $('btnResetProgress').addEventListener('click', onReset);

  document.querySelectorAll('.help-chip').forEach((chip) => {
    chip.addEventListener('click', () => setHelp(chip.dataset.help));
  });

  btnMute.addEventListener('click', () => {
    state.muted = !state.muted;
    store.set(KEY_MUTE, state.muted ? '1' : '0');
    updateMuteUI();
  });

  // Header help button: cycles the help level IN PLACE (never leaves the round).
  btnHelp.addEventListener('click', () => {
    const i = HELP_ORDER.indexOf(state.helpLevel);
    setHelp(HELP_ORDER[(i + 1) % HELP_ORDER.length]);
    setSubtitle('Aiuto: ' + HELP_NAME[state.helpLevel]);
    if (screenStart.classList.contains('active')) {
      $('helpPanelStart').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  /* ---------- init ---------- */
  updateMuteUI();
  syncHelpChips();
  updateClock();
  setInterval(updateClock, 30000);
  renderLevels();
  showScreen(screenStart);

  // Exposed for automated tests only (read-only snapshot).
  window.__timeGlitch = { levels: LEVELS, state: () => JSON.parse(JSON.stringify({ progress: state.progress, helpLevel: state.helpLevel, roundIndex: state.roundIndex, level: state.level && state.level.id, teacherAll })) };
})();
