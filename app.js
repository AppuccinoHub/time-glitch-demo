(() => {
  'use strict';

  const STORAGE_HELP = 'timeGlitch.helpLevel';
  const STORAGE_MUTE = 'timeGlitch.muted';

  const HELP_HINTS = {
    more: 'English gloss + tense tip under each glitch.',
    mid: 'Italian + short context under each glitch.',
    challenge: 'Italian only. Soft hint after a miss.',
  };

  const TENSE_LABEL = {
    presente: 'Presente',
    imperfetto: 'Imperfetto',
    passato: 'Passato prossimo',
  };

  /**
   * One story thread: teen friends texting about weekend plans / Saturday.
   * Each round glitches a verb on ORA or ALLORA; student picks the tense.
   * @type {Array<{
   *  id:number, side:'now'|'then',
   *  context:string, gloss:string, tip:string,
   *  correct:'presente'|'imperfetto'|'passato', why:string,
   *  nowMsgs:Array, thenMsgs:Array,
   *  fixedLine:string, fixedHtml:string
   * }>}
   */
  const ROUNDS = [
    {
      id: 1,
      side: 'now',
      context: 'Friday night — they’re making plans for tomorrow.',
      gloss: 'Hey guys, tomorrow we’re going to the cinema, right?',
      tip: 'Tip: “domani” + live plan → Presente.',
      correct: 'presente',
      why: 'They’re arranging something that hasn’t happened yet. Live plans use the presente (“andiamo”), not a past tense.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, kind: 'glitch', wrongHtml: 'domani <span class="verb-slot wrong">andavamo</span> al cinema, no?', blankHtml: 'domani <span class="verb-slot blank"></span> al cinema, no?', okHtml: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?', wrongForm: 'andavamo', okForm: 'andiamo' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
      ],
      fixedLine: 'domani andiamo al cinema, no?',
      fixedHtml: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?',
    },
    {
      id: 2,
      side: 'then',
      context: 'Looking back — Saturday’s vibe, already in progress.',
      gloss: 'There was a long line and everyone was waiting outside.',
      tip: 'Tip: background / ongoing scene → Imperfetto.',
      correct: 'imperfetto',
      why: 'This paints the scene of Saturday: the line was there, people were waiting. Background description uses imperfetto — not a single finished beat.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, html: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?' },
        { who: 'Luca', me: true, html: 'sì dai, alle 20' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
        { who: 'Giulia', me: false, kind: 'glitch', wrongHtml: 'c’<span class="verb-slot wrong">è stata</span> una fila lunghissima e tutti <span class="verb-slot wrong">hanno aspettato</span> fuori', blankHtml: 'c’<span class="verb-slot blank"></span> una fila lunghissima e tutti <span class="verb-slot blank"></span> fuori', okHtml: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori', wrongForm: 'è stata / hanno aspettato', okForm: 'era / aspettavano' },
      ],
      fixedLine: 'c’era una fila lunghissima e tutti aspettavano fuori',
      fixedHtml: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori',
    },
    {
      id: 3,
      side: 'then',
      context: 'A completed beat — Marco finally shows up.',
      gloss: 'Then all of a sudden Marco arrived (late, of course).',
      tip: 'Tip: sudden finished event → Passato prossimo.',
      correct: 'passato',
      why: 'Arrival is a finished moment in the story (“all’improvviso”). Passato prossimo marks that completed beat — not the ongoing imperfect.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, html: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?' },
        { who: 'Luca', me: true, html: 'sì dai, alle 20' },
        { who: 'Giulia', me: false, html: 'porto i popcorn 🍿' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
        { who: 'Giulia', me: false, html: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori' },
        { who: 'Sofia', me: true, kind: 'glitch', wrongHtml: 'poi all’improvviso Marco <span class="verb-slot wrong">arrivava</span> (in ritardo ovviamente)', blankHtml: 'poi all’improvviso Marco <span class="verb-slot blank"></span> (in ritardo ovviamente)', okHtml: 'poi all’improvviso Marco <span class="verb-slot ok">è arrivato</span> (in ritardo ovviamente)', wrongForm: 'arrivava', okForm: 'è arrivato' },
      ],
      fixedLine: 'poi all’improvviso Marco è arrivato (in ritardo ovviamente)',
      fixedHtml: 'poi all’improvviso Marco <span class="verb-slot ok">è arrivato</span> (in ritardo ovviamente)',
    },
    {
      id: 4,
      side: 'now',
      context: 'Right now — Giulia is checking tickets live.',
      gloss: 'Wait, I’m looking at the tickets on the site…',
      tip: 'Tip: “aspetta” / happening now → Presente.',
      correct: 'presente',
      why: 'She’s doing it this second on the site. Live action uses presente — not a past tense about Saturday.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, html: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?' },
        { who: 'Luca', me: true, html: 'sì dai, alle 20' },
        { who: 'Giulia', me: false, html: 'porto i popcorn 🍿' },
        { who: 'Giulia', me: false, kind: 'glitch', wrongHtml: 'aspetta, <span class="verb-slot wrong">ho guardato</span> i biglietti sul sito…', blankHtml: 'aspetta, <span class="verb-slot blank"></span> i biglietti sul sito…', okHtml: 'aspetta, <span class="verb-slot ok">guardo</span> i biglietti sul sito…', wrongForm: 'ho guardato', okForm: 'guardo' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
        { who: 'Giulia', me: false, html: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori' },
        { who: 'Sofia', me: true, html: 'poi all’improvviso Marco <span class="verb-slot ok">è arrivato</span> (in ritardo ovviamente)' },
      ],
      fixedLine: 'aspetta, guardo i biglietti sul sito…',
      fixedHtml: 'aspetta, <span class="verb-slot ok">guardo</span> i biglietti sul sito…',
    },
    {
      id: 5,
      side: 'then',
      context: 'Saturday night mood — what they wanted / how it felt.',
      gloss: 'It was late but nobody wanted to go home 😅',
      tip: 'Tip: describing how the night felt → Imperfetto.',
      correct: 'imperfetto',
      why: 'Wrapping the mood (how late it was / what people wanted) uses imperfetto — not a single “it got late” passato prossimo.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, html: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?' },
        { who: 'Luca', me: true, html: 'sì dai, alle 20' },
        { who: 'Giulia', me: false, html: 'porto i popcorn 🍿' },
        { who: 'Giulia', me: false, html: 'aspetta, <span class="verb-slot ok">guardo</span> i biglietti sul sito…' },
        { who: 'Luca', me: true, html: 'ci sono posti in seconda fila!!' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
        { who: 'Giulia', me: false, html: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori' },
        { who: 'Sofia', me: true, html: 'poi all’improvviso Marco <span class="verb-slot ok">è arrivato</span> (in ritardo ovviamente)' },
        { who: 'Luca', me: false, kind: 'glitch', wrongHtml: '<span class="verb-slot wrong">è stato</span> tardi ma nessuno <span class="verb-slot wrong">ha voluto</span> andare a casa 😅', blankHtml: '<span class="verb-slot blank"></span> tardi ma nessuno <span class="verb-slot blank"></span> andare a casa 😅', okHtml: '<span class="verb-slot ok">era</span> tardi ma nessuno <span class="verb-slot ok">voleva</span> andare a casa 😅', wrongForm: 'è stato / ha voluto', okForm: 'era / voleva' },
      ],
      fixedLine: 'era tardi ma nessuno voleva andare a casa 😅',
      fixedHtml: '<span class="verb-slot ok">era</span> tardi ma nessuno <span class="verb-slot ok">voleva</span> andare a casa 😅',
    },
    {
      id: 6,
      side: 'now',
      context: 'Done deal — they just booked the tickets.',
      gloss: 'Ok done, I booked them. See you tomorrow!!',
      tip: 'Tip: just-finished action (“fatto”) → Passato prossimo.',
      correct: 'passato',
      why: 'Booking is finished right now (“ok fatto”). Passato prossimo for a completed action — not “I was booking” imperfect or a vague present.',
      nowMsgs: [
        { who: 'Sofia', me: false, html: 'ehi raga 👀' },
        { who: 'Sofia', me: false, html: 'domani <span class="verb-slot ok">andiamo</span> al cinema, no?' },
        { who: 'Luca', me: true, html: 'sì dai, alle 20' },
        { who: 'Giulia', me: false, html: 'porto i popcorn 🍿' },
        { who: 'Giulia', me: false, html: 'aspetta, <span class="verb-slot ok">guardo</span> i biglietti sul sito…' },
        { who: 'Luca', me: true, html: 'ci sono posti in seconda fila!!' },
        { who: 'Sofia', me: false, kind: 'glitch', wrongHtml: 'ok fatto, li <span class="verb-slot wrong">prendevo</span>. ci vediamo domani!!', blankHtml: 'ok fatto, li <span class="verb-slot blank"></span>. ci vediamo domani!!', okHtml: 'ok fatto, li <span class="verb-slot ok">ho presi</span>. ci vediamo domani!!', wrongForm: 'prendevo', okForm: 'ho presi' },
      ],
      thenMsgs: [
        { who: 'Luca', me: false, html: 'sabato scorso…' },
        { who: 'Giulia', me: false, html: 'c’<span class="verb-slot ok">era</span> una fila lunghissima e tutti <span class="verb-slot ok">aspettavano</span> fuori' },
        { who: 'Sofia', me: true, html: 'poi all’improvviso Marco <span class="verb-slot ok">è arrivato</span> (in ritardo ovviamente)' },
        { who: 'Luca', me: false, html: '<span class="verb-slot ok">era</span> tardi ma nessuno <span class="verb-slot ok">voleva</span> andare a casa 😅' },
        { who: 'Giulia', me: true, html: 'comunque il film era figo' },
      ],
      fixedLine: 'ok fatto, li ho presi. ci vediamo domani!!',
      fixedHtml: 'ok fatto, li <span class="verb-slot ok">ho presi</span>. ci vediamo domani!!',
    },
  ];

  const state = {
    helpLevel: localStorage.getItem(STORAGE_HELP) || 'mid',
    muted: localStorage.getItem(STORAGE_MUTE) !== '0', // default ON
    roundIndex: 0,
    firstTryCorrect: 0,
    attemptedThisRound: false,
    locked: false,
  };

  const $ = (id) => document.getElementById(id);
  const screenStart = $('screenStart');
  const screenPlay = $('screenPlay');
  const screenEnd = $('screenEnd');
  const threadNow = $('threadNow');
  const threadThen = $('threadThen');
  const paneNow = $('paneNow');
  const paneThen = $('paneThen');
  const progress = $('progress');
  const feedback = $('feedback');
  const roundContext = $('roundContext');
  const roundGloss = $('roundGloss');
  const tenseTip = $('tenseTip');
  const helpHint = $('helpHint');
  const btnMute = $('btnMute');
  const btnHelp = $('btnHelp');

  let audioCtx = null;

  function showScreen(el) {
    [screenStart, screenPlay, screenEnd].forEach((s) => {
      if (!s) return;
      const on = s === el;
      s.classList.toggle('active', on);
      if (on) s.removeAttribute('hidden');
      else s.setAttribute('hidden', '');
    });
  }

  function updateMuteUI() {
    btnMute.textContent = state.muted ? '🔇' : '🔊';
    btnMute.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
  }

  function syncHelpChips() {
    document.querySelectorAll('.help-chip').forEach((chip) => {
      const on = chip.dataset.help === state.helpLevel;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    helpHint.textContent = HELP_HINTS[state.helpLevel] || HELP_HINTS.mid;
  }

  function setHelp(level) {
    if (!HELP_HINTS[level]) return;
    state.helpLevel = level;
    localStorage.setItem(STORAGE_HELP, level);
    syncHelpChips();
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
    el.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '');
  }

  function renderProgress() {
    progress.innerHTML = '';
    ROUNDS.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'prog-dot';
      if (i < state.roundIndex) d.classList.add('done');
      if (i === state.roundIndex) d.classList.add('current');
      progress.appendChild(d);
    });
  }

  function renderBubble(msg, activeGlitch) {
    const div = document.createElement('div');
    div.className = 'bubble ' + (msg.me ? 'me' : 'them');
    if (msg.who) {
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = msg.who;
      div.appendChild(who);
    }
    const body = document.createElement('div');
    if (msg.kind === 'glitch' && activeGlitch) {
      div.classList.add('glitch');
      if (state.helpLevel === 'challenge') {
        body.innerHTML = msg.blankHtml;
      } else {
        body.innerHTML = msg.wrongHtml;
      }
    } else if (msg.kind === 'glitch' && !activeGlitch) {
      div.classList.add('fixed', 'locked');
      body.innerHTML = msg.okHtml;
    } else {
      if (msg.html && msg.html.includes('verb-slot ok')) div.classList.add('locked');
      body.innerHTML = msg.html;
    }
    div.appendChild(body);
    return div;
  }

  function renderRound() {
    const round = ROUNDS[state.roundIndex];
    state.attemptedThisRound = false;
    state.locked = false;
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.className = 'feedback';

    document.querySelectorAll('.tense-chip').forEach((c) => {
      c.disabled = false;
      c.classList.remove('correct-flash');
    });

    renderProgress();

    threadNow.innerHTML = '';
    threadThen.innerHTML = '';
    round.nowMsgs.forEach((m) => threadNow.appendChild(renderBubble(m, round.side === 'now' && m.kind === 'glitch')));
    round.thenMsgs.forEach((m) => threadThen.appendChild(renderBubble(m, round.side === 'then' && m.kind === 'glitch')));

    paneNow.classList.toggle('focus-side', round.side === 'now');
    paneThen.classList.toggle('focus-side', round.side === 'then');
    paneNow.classList.toggle('dim-side', round.side !== 'now');
    paneThen.classList.toggle('dim-side', round.side !== 'then');

    // scroll glitch into view
    requestAnimationFrame(() => {
      const g = document.querySelector('.bubble.glitch');
      if (g) g.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    roundContext.textContent = round.context;

    if (state.helpLevel === 'more') {
      roundGloss.hidden = false;
      roundGloss.textContent = round.gloss;
      tenseTip.hidden = false;
      tenseTip.textContent = round.tip;
    } else if (state.helpLevel === 'mid') {
      roundGloss.hidden = true;
      tenseTip.hidden = true;
    } else {
      roundGloss.hidden = true;
      tenseTip.hidden = true;
    }
  }

  function fixGlitchBubble(round) {
    const thread = round.side === 'now' ? threadNow : threadThen;
    const glitch = thread.querySelector('.bubble.glitch');
    if (!glitch) return;
    glitch.classList.remove('glitch');
    glitch.classList.add('fixed', 'locked');
    const body = glitch.querySelector('div:last-child');
    const msg = (round.side === 'now' ? round.nowMsgs : round.thenMsgs).find((m) => m.kind === 'glitch');
    if (body && msg) body.innerHTML = msg.okHtml;
  }

  function onTense(tense) {
    if (state.locked) return;
    const round = ROUNDS[state.roundIndex];
    const firstTry = !state.attemptedThisRound;
    state.attemptedThisRound = true;

    if (tense === round.correct) {
      state.locked = true;
      if (firstTry) state.firstTryCorrect += 1;
      beep(true);
      document.querySelectorAll('.tense-chip').forEach((c) => {
        c.disabled = true;
        if (c.dataset.tense === tense) c.classList.add('correct-flash');
      });
      fixGlitchBubble(round);
      feedback.hidden = false;
      feedback.className = 'feedback ok';
      feedback.textContent = 'Glitch cleared · ' + TENSE_LABEL[round.correct] + '.';
      setTimeout(() => {
        state.roundIndex += 1;
        if (state.roundIndex >= ROUNDS.length) showEnd();
        else renderRound();
      }, 900);
    } else {
      beep(false);
      feedback.hidden = false;
      feedback.className = 'feedback soft';
      let msg = round.why;
      if (state.helpLevel === 'challenge') {
        msg = 'Not quite — think about whether this is happening now, setting a scene, or a finished event. Try again.';
      }
      feedback.textContent = msg;
    }
  }

  function showEnd() {
    showScreen(screenEnd);
    $('scoreLine').textContent = 'Score: ' + state.firstTryCorrect + '/6 first-try';
    const reel = $('replayReel');
    reel.innerHTML = '';
    ROUNDS.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'replay-card';
      card.innerHTML =
        '<div class="side-tag">' + (r.side === 'now' ? 'ORA' : 'ALLORA') + ' · Round ' + r.id + '</div>' +
        '<p class="line">' + r.fixedHtml + '</p>' +
        '<p class="tense">' + TENSE_LABEL[r.correct] + '</p>';
      reel.appendChild(card);
    });
  }

  function startGame() {
    state.roundIndex = 0;
    state.firstTryCorrect = 0;
    state.attemptedThisRound = false;
    state.locked = false;
    showScreen(screenPlay);
    renderRound();
  }

  // Events
  $('btnStart').addEventListener('click', startGame);
  $('btnReplay').addEventListener('click', startGame);
  $('btnChangeHelp').addEventListener('click', () => {
    showScreen(screenStart);
  });

  document.querySelectorAll('.help-chip').forEach((chip) => {
    chip.addEventListener('click', () => setHelp(chip.dataset.help));
  });

  document.querySelectorAll('.tense-chip').forEach((chip) => {
    chip.addEventListener('click', () => onTense(chip.dataset.tense));
  });

  btnMute.addEventListener('click', () => {
    state.muted = !state.muted;
    localStorage.setItem(STORAGE_MUTE, state.muted ? '1' : '0');
    updateMuteUI();
  });

  // Header help: cycle levels on play/end, or jump focus to start chips
  btnHelp.addEventListener('click', () => {
    if (screenStart.classList.contains('active')) {
      const order = ['more', 'mid', 'challenge'];
      const i = order.indexOf(state.helpLevel);
      setHelp(order[(i + 1) % order.length]);
      $('helpPanelStart').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // jump back to start chips only — no modal/sheet
      showScreen(screenStart);
      requestAnimationFrame(() => {
        $('helpPanelStart').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  });

  // init
  updateMuteUI();
  syncHelpChips();
  updateClock();
  setInterval(updateClock, 30000);
  showScreen(screenStart);
})();
