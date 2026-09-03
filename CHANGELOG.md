# Changelog

## [1.0.0] - 2026-09-03

### Added

- Added the standard public `reset()` method; native form reset delegates to the same behavior.

### Changed

- Standardized private empty-value and form synchronization helpers as `#clearValue()` and `#updateFormValue()`.

## [0.6.0] - 2026-09-02

### Changed

- Made custom-element module evaluation SSR-safe by extending `JBBaseComponent` where needed and registering elements through the shared `defineWebComponent()` helper; raised the minimum `jb-core` version to `0.35.0`.
- Increased each custom theme's balloon hover offset in proportion to its larger range handle, keeping the two shapes visually separated.

## [0.4.0] - 2026-08-14

### Added

- Added the locale-aware `showPersianNumber` property and `show-persian-number` attribute to display Persian digits in tick labels, the value balloon, and accessibility text while keeping component and form values numeric.
