# Changelog

## [1.2.0] - Refactoring Update

### Changed
- **Code organization and consistency:**
  - Added `extensionDisplayName` constant for consistent naming
  - Implemented `log()` and `info()` helper functions for better debugging
  - Restructured initialization flow for clarity
  - Improved settings initialization with `structuredClone()`
  - Separated event handlers into dedicated functions
  - Better error handling with descriptive messages
  
- **Settings improvements:**
  - Added debug mode toggle for optional detailed logging
  - More robust settings loading and validation
  - Cleaner checkbox state management
  
- **Code quality:**
  - Consistent use of `const` vs `let`
  - Better function documentation
  - Improved code comments
  - Removed redundant code
  
- **Manifest updates:**
  - Added `license` field (GPL-3.0)
  - Added `auto_update` field (false)
  - Bumped version to 1.2.0

### Notes
This is a refactoring release that improves code quality and maintainability without changing functionality. All existing features work exactly the same way.

## [1.1.0] - 10/11/25

### Added
- Extensions menu button to access the Boundary Index Panel anytime
- MutationObserver to automatically detect hide/unhide operations and update the panel
- Auto-scroll to top of chat when boundary message isn't loaded

### Changed
- **Settings labels updated for clarity:**
  - "Enable Ghostfinder" → "Show Lantern Button"
  - "Show Boundary Index Panel" → "Lantern Button Opens Panel"
- Boundary Index Panel is now always accessible via the Extensions menu, regardless of settings
- "Lantern Button Opens Panel" setting now only controls the lantern button behavior, not panel availability
- Default behaviour: Lantern button jumps to boundaries (panel feature disabled by default)
- Panel now preserves open/closed state when settings are changed
- Improved toast notifications with clearer instructions

### Fixed
- Panel disappearing when toggling lantern button visibility
- Boundary list not updating after hide/unhide operations on loaded messages
- Extension not detecting unloaded boundary messages beyond pagination

## [1.0.0] - 09/11/25

### Added
- Initial release
- Lantern button to jump to previous boundary messages
- Boundary Index Panel showing all boundaries in current chat
- Support for paginated messages
- Settings panel with toggle options
