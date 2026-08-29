# Woven Wishes collaboration rules

- The user reviews every iteration at `http://127.0.0.1:4173/`. Start or recover it with `scripts/start_local_preview.ps1 -NoBrowser` (or `打开最新体验.cmd` for the user). Do not replace it with a terminal-bound temporary dev server.
- After changing the frontend, run `npm test -- --run` and `npm run build`, then reload the local page and check the real rendered flow. A successful build alone is not visual verification.
- Keep work on the `codex/gameplay-refinement` branch until the user approves a release. Do not push to `main`, create a formal release package, or trigger Pages deployment without explicit approval.
- Create small local Git checkpoints after a verified iteration so another Codex task can recover the exact state. Preserve unrelated user changes.
- After every verified visual/interaction revision, give the user the same fixed local experience link. Do not ask the user to locate `dist/index.html` for routine review.
- Treat the work as a digital experience inspired by the two-person collaboration of Nanjing Yunjin wooden-loom brocade weaving. Never describe it as embroidery, a traditional process simulation, or a reconstruction of the craft.
