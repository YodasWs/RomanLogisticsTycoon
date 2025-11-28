# Contribution Guide - Feature Branches

## Branch Structure

All changes have been organized into separate feature branches for clean, reviewable pull requests:

### 1. `feature/oop-refactor-modules` ✅

**Focus:** OOP Refactoring of Core Game Modules

**Changes:**

- Convert `City.mjs`, `Nation.mjs`, `Laborer.mjs`, `Faction.mjs` from factory functions to ES6 classes
- Implement private fields (`#field`) for proper encapsulation
- Create `ActionManager` singleton for centralized action management
- Remove module-level shared state (fixed `activeUnitIndex` bug)
- Add comprehensive OOP refactoring documentation

**Files Modified:**

- `src/pages/game/modules/City.mjs`
- `src/pages/game/modules/Nation.mjs`
- `src/pages/game/modules/Laborer.mjs`
- `src/pages/game/modules/Faction.mjs`
- `src/pages/game/modules/Actions.mjs`
- `docs/OOP_REFACTORING.md`

**Commit:** `ad5eda9`

---

### 2. `feature/settings-ui-implementation` ✅

**Focus:** Settings System and UI Components

**Changes:**

- Implement `SettingsManager` with circuit breaker pattern and localStorage persistence
- Create `TitleScreen` scene with loading bar and fade transitions
- Add comprehensive Settings overlay with multiple sections:
  - Graphics settings (resolution, quality, effects)
  - Audio settings (master, music, SFX volumes)
  - Game settings (autosave, notifications, tooltips)
  - Controls settings (keyboard shortcuts customization)
- Add game logo and title background assets
- **FIX CRITICAL:** Convert SCSS from tabs to 2-space indentation (79 errors fixed)

**Files Modified:**

- `src/pages/game/modules/SettingsManager.mjs` (new)
- `src/pages/game/scenes/TitleScreen.mjs` (new)
- `src/pages/game/game.html`
- `src/pages/game/game.scss` ⚠️ **INDENTATION FIXED**
- `src/pages/game/scenes/MainMenu.mjs`
- `src/pages/game/scenes/scenes.mjs`
- `docs/img/game-logo.png` (new)
- `docs/img/title-background.png` (new)

**Commit:** `4637c40`

---

### 3. `feature/centralize-input-manager` ✅

**Focus:** Centralized Input Management System

**Changes:**

- Complete rewrite of `InputManager` with centralized architecture
- Add `KEYBOARD_SHORTCUTS` constant as single source of truth
- Implement event-driven system emitting `'input:*'` events
- Create scene-specific setup methods:
  - `#setupMainGameListeners()` - Movement, actions, camera controls
  - `#setupCityViewListeners()` - City management
  - `#setupTileViewListeners()` - Tile inspection
  - `#setupSettingsListeners()` - Settings navigation
- Add device-aware pointer handling (touch/pen/mouse thresholds)
- Static helper methods for external access

**Files Modified:**

- `src/pages/game/modules/InputManager.mjs`
- `docs/InputManager.md` (new)

**Commit:** `411daa4`

---

### 4. `chore/update-dependencies-and-utilities` ✅

**Focus:** Utility Updates and Code Cleanup

**Changes:**

- Clean up Config.mjs exports and add missing depth layers
- Update Game.mjs event emitter and scene management
- Refine Hex.mjs pathfinding and grid utilities
- Clean Movable.mjs movement logic
- Update ctrl.js module initialization

**Files Modified:**

- `src/pages/game/modules/Config.mjs`
- `src/pages/game/modules/Game.mjs`
- `src/pages/game/modules/Hex.mjs`
- `src/pages/game/modules/Movable.mjs`
- `src/pages/game/ctrl.js`

**Commit:** `d4fe4d0`

---

## How to Review Each Branch

### Review Order (Recommended)

1. `chore/update-dependencies-and-utilities` - Foundation changes
2. `feature/oop-refactor-modules` - Core architecture refactoring
3. `feature/centralize-input-manager` - Input system overhaul
4. `feature/settings-ui-implementation` - UI features

### Testing Each Branch

```powershell
# Test OOP Refactoring
git checkout feature/oop-refactor-modules
npm run build
npm run dev
# Verify: City, Nation, Faction, Laborer still work as classes

# Test Settings UI
git checkout feature/settings-ui-implementation
npm run build
npm run dev
# Verify: Settings menu opens, TitleScreen loads, SCSS has no errors

# Test Input Manager
git checkout feature/centralize-input-manager
npm run build
npm run dev
# Verify: Keyboard shortcuts work, events fire correctly

# Test Utilities
git checkout chore/update-dependencies-and-utilities
npm run build
npm run dev
# Verify: Game loads, utilities work correctly
```

---

## Creating Pull Requests

### PR #1: OOP Refactoring

```
Title: refactor: Convert game modules to ES6 classes with OOP principles

Description:
Converts City, Nation, Laborer, Faction, and Actions modules from factory functions
to proper ES6 classes with private fields for better encapsulation.

Key changes:
- Private fields (#field) for encapsulation
- Instance-scoped state (no more shared variables)
- ActionManager singleton pattern
- Comprehensive documentation

Breaking changes: None (all public APIs maintained)

Closes: #[issue-number]
```

### PR #2: Settings UI Implementation

```
Title: feat: Add Settings UI and Title Screen with persistent configuration

Description:
Implements a comprehensive settings system with localStorage persistence,
title screen with loading animation, and fixes critical SCSS indentation issues.

Key changes:
- SettingsManager with circuit breaker pattern
- TitleScreen scene with transitions
- Modern settings overlay (graphics, audio, game, controls)
- FIXED: 79 mixed tabs/spaces errors in game.scss

Closes: #[issue-number]
```

### PR #3: Centralized Input Manager

```
Title: feat: Centralize input management with KEYBOARD_SHORTCUTS registry

Description:
Complete rewrite of InputManager with centralized keyboard shortcut registry
and event-driven architecture for better maintainability.

Key changes:
- KEYBOARD_SHORTCUTS constant (single source of truth)
- Event-driven system (input:* events)
- Scene-specific handlers
- Device-aware pointer handling
- Comprehensive documentation

Closes: #[issue-number]
```

### PR #4: Utilities and Dependencies Update

```
Title: chore: Update utilities and clean up code

Description:
Minor updates to utility modules and code cleanup for better consistency.

Key changes:
- Config.mjs cleanup
- Game.mjs event improvements
- Hex.mjs pathfinding refinements
- Code formatting consistency

Closes: #[issue-number]
```

---

## Merge Strategy

### Recommended Merge Order:

1. Merge `chore/update-dependencies-and-utilities` first (foundation)
2. Merge `feature/oop-refactor-modules` (core changes)
3. Merge `feature/centralize-input-manager` (input system)
4. Merge `feature/settings-ui-implementation` last (UI layer)

### Handling Conflicts:

If conflicts occur, they will likely be in:

- `src/pages/game/scenes/MainMenu.mjs` (Settings UI + OOP changes)
- `src/pages/game/modules/Game.mjs` (Multiple branches touch this)

Resolve by:

1. Accept both changes
2. Ensure event emitters are consistent
3. Test the merged result

---

## Current Branch Status

```
✅ feature/oop-refactor-modules            [ad5eda9] 6 files changed
✅ feature/settings-ui-implementation      [4637c40] 8 files changed
✅ feature/centralize-input-manager        [411daa4] 2 files changed
✅ chore/update-dependencies-and-utilities [d4fe4d0] 5 files changed
```

**All branches ready for push and PR creation!**

---

## Pushing to GitHub

```powershell
# Push all feature branches
git push origin feature/oop-refactor-modules
git push origin feature/settings-ui-implementation
git push origin feature/centralize-input-manager
git push origin chore/update-dependencies-and-utilities
```

---

## Critical Fix Included

### ⚠️ SCSS Indentation Issue - RESOLVED

**Branch:** `feature/settings-ui-implementation`
**File:** `src/pages/game/game.scss`
**Issue:** 79 "Mixed tabs and spaces" errors
**Fix:** Converted entire file to consistent 2-space indentation

This fix is included in the Settings UI branch since the SCSS changes
are part of the UI implementation.

---

## Documentation Added

1. **OOP_REFACTORING.md** - Complete guide to OOP changes
2. **InputManager.md** - InputManager API documentation
3. **CONTRIBUTION_GUIDE.md** - This file

All documentation is ready for review alongside code changes.
