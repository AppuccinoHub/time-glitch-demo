# Time Glitch — Italian Level 3 demo

Split-screen chat (**ORA** / **ALLORA**). In each round a verb has "glitched" to its infinitive; students choose the tense that fixes it.

**Live:** https://appuccinohub.github.io/time-glitch-demo/

## 4 levels (unlock in order)
| Level | Tenses (chips shown) | Glitches |
|---|---|---|
| 1 · Lunedì mattina | Presente · Passato prossimo | 4 |
| 2 · La vecchia foto | Presente · Imperfetto | 4 |
| 3 · Sabato al cinema | Passato prossimo · Imperfetto | 5 |
| 4 · Estate! | all three | 5 |

- Finishing a level (every glitch fixed, any number of tries) unlocks the next. Opened levels can be replayed.
- Teacher link: add `?tutti=1` to open all levels for that visit (not saved).
- Every wrong choice has its own English explanation; correct answers show a reason + **Avanti ▶**.
- Help levels (More help / Just right / Challenge me) are on the start screen; the 🎚️ button switches them in place, even mid-round.
- Progress is saved only on this device (`localStorage`, key `timeGlitch.progress.v1`), wrapped in try/catch — no logins, nothing sent anywhere. If storage is blocked, the app still works for that visit.
- Sound is off by default; all feedback is visual. No modal / bottom-sheet overlays (Safari-safe).

## Files
- `index.html` — screens (start / play / end)
- `app.js` — content (`LEVELS`: messages + rounds) and logic
- `styles.css` — look; laptop/Chromebook (≥900px) uses an 880px two-pane card, phones go full-screen

## Local
Serve the folder statically (e.g. `python3 -m http.server`) and open `index.html`.
