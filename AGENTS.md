# Repository instructions

## Commits and application versioning

- Create a focused local commit after each coherent, completed, verified implementation phase. Stage only files relevant to that phase and preserve unrelated worktree changes. Do not push unless the user explicitly asks.
- Treat a commit that changes shipped application behavior, content, or presentation as a versioned app change. In the same commit, update `package.json` and `package-lock.json` to the same version and add a dated entry for that version to `CHANGELOG.md`.
- Use a patch bump for bug fixes, visual or accessibility polish, and small backward-compatible improvements (for example, `0.1.0` to `0.1.1`). Use a minor bump for new user-facing capabilities or substantial behavior changes while the app is pre-1.0 (for example, `0.1.1` to `0.2.0`). After 1.0, use a major bump for backward-incompatible changes, a minor bump for backward-compatible features, and a patch bump for fixes and polish.
- Do not bump the app version for documentation-only changes, tests, CI/tooling maintenance, or refactors that do not change observable app behavior. When a phase contains multiple app changes, choose the highest applicable bump and summarize the phase in one changelog entry.
- Create a local Git tag matching each versioned app commit (`vX.Y.Z`) after committing. Tags identify source versions; they do not deploy or publish anything. Do not push tags unless the user explicitly authorizes the push.
- Follow these rules together with the versioning section in `README.md`. Do not amend existing commits unless the user explicitly authorizes it.
