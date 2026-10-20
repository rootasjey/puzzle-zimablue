# Changelog

Notable changes to Puzzle Zimablue are recorded here. Releases follow [Semantic Versioning](https://semver.org/).

## [0.10.6] - 2026-10-20

### Improved

- Refined the top-bar brand mark with squarer, more angular cards and individual shadows.

## [0.10.5] - 2026-10-20

### Improved

- Keep the desktop account avatar and label on one line in the top navigation.

## [0.10.4] - 2026-10-20

### Improved

- Hide the mobile header and bottom navigation while scrolling down, and reveal them when scrolling up or reaching a page edge.

## [0.10.3] - 2026-10-20

### Improved

- Replaced the crowded mobile header navigation with a bottom navigation bar, hidden while playing.

## [0.10.2] - 2026-10-20

### Improved

- Separated the secondary archive link from the primary replay button on the completion screen.

## [0.10.1] - 2026-10-20

### Improved

- Made replaying a previously completed puzzle the primary action when reopening it.

## [0.10.0] - 2026-10-20

### Added

- Added a saved account language preference, with a matching shortcut in the header and an option in account settings.

## [0.9.4] - 2026-10-20

### Changed

- Matched the Admin button press feedback and popup transitions to the theme selector.

## [0.9.3] - 2026-10-20

### Changed

- Grouped the admin calendar and Master editor under one Admin menu.

## [0.9.2] - 2026-10-20

### Fixed

- Fixed the admin shortcut to the weekly Master and distinguished it from the public Master link.

## [0.9.1] - 2026-10-20

### Fixed

- Restored two-finger pinch zoom and panning on the weekly Master board on mobile.

## [0.9.0] - 2026-10-20

### Added

- Added the weekly Master with an admin-configurable square illustration, 16 × 16 or 20 × 20 grid, a ranked attempt per account, practice retries, and a weekly leaderboard.
- Added zoom and pan controls for the Master board, plus explicit confirmation before abandoning or resetting a ranked run.

### Changed

- Adjusted the Master board and mobile navigation to keep the puzzle usable on narrow and short screens.

## [0.8.0] - 2026-10-19

### Added

- Expanded daily puzzle difficulties to 36, 49, and 64 pieces, with a searchable Una UI combobox in the admin editor.

## [0.7.0] - 2026-10-19

### Added

- Custom Tronche avatar palettes, including import from a playground URL, with account-level persistence.

## [0.6.5] - 2026-10-18

### Changed

- Increased the spacing above account navigation and moved its component-specific styles into its Vue component.

## [0.6.4] - 2026-10-18

### Changed

- Added more space between the main navigation divider and the account return link.

## [0.6.3] - 2026-10-18

### Changed

- Kept account navigation mounted across the progress and settings pages and visible while scrolling.

## [0.6.2] - 2026-10-18

### Changed

- Removed the card frame from account settings and aligned the opening navigation on both account pages.

## [0.6.1] - 2026-10-18

### Changed

- Matched the Settings content width to the My account page.

## [0.6.0] - 2026-10-18

### Changed

- Added shared account navigation and moved public-name and historical-profile controls into a dedicated profile section in Settings.

## [0.5.2] - 2026-10-18

### Changed

- Simplified the avatar helper text in French and English.

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
