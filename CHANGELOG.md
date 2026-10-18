# Changelog

Notable changes to Puzzle Zimablue are recorded here. Releases follow [Semantic Versioning](https://semver.org/).

## [0.5.1] - 2026-10-18

### Changed

- Reflowed account avatar choices into a responsive grid with larger previews and touch targets.

## [0.5.0] - 2026-10-18

### Added

- Account preferences for the reference image, reduced motion, sound, and effect volume, with a local fallback for guests.
- A keyboard shortcut (`A`) to toggle the reference image while playing, outside text fields.
- Optional Tronche avatars for signed-in accounts.
- Zimablue illustration descriptions saved with puzzles and shown on the completion screen.

## [0.4.0] - 2026-10-18

### Added

- Versioned puzzle attempts bound to stable daily or weekly puzzle IDs and rectangular grid dimensions, with support for up to 1,024 pieces.
- Weekly Master puzzle data storage for localized content, layout, and optional landscape, portrait, and square image variants.
- Automated tests for attempt encoding, replay verification, puzzle identity, and layout limits.

### Changed

- Account and device saves now use attempt format v2. Existing v1 saved sessions are invalidated by the D1 migration.
- Puzzle boards, score summaries, and player statistics now use row and column dimensions.

## [0.3.2] - 2026-10-18

### Changed

- Removed the white accent line from the blue card in the brand mark.

## [0.3.1] - 2026-10-18

### Added

- Direct home link on the puzzle completion screen.

## [0.3.0] - 2026-10-18

### Added

- Automatic puzzle-session saves for guests on their device and for signed-in players across devices.
- Periodic session synchronization with revision checks and a notice when a newer save replaces the current board.

## [0.2.0] - 2026-10-18

### Added

- Historical verified leaderboards for each published puzzle, with participant and score metrics.
- Private cumulative player statistics and an explicitly opt-in public profile.

## [0.1.1] - 2026-10-18

### Changed

- Simplified the completion screen actions and reduced visual button density.

## [0.1.0] - 2026-10-18

### Added

- Verified daily leaderboard and localized About page.
- Admin dashboard for completion and verified-score metrics.
- Animated loading screen using the project logo.
- Takumi renderer dependency for Nuxt OG image generation.
- Display the current app version in the site footer.
