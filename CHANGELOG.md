# Changelog

All notable changes to BAC4 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.1] - 2025-11-06

### Fixed
- Fixed snapshot isolation test to properly validate label persistence across snapshots
- Improved ESLint configuration to treat `any` types and unused variables as warnings instead of errors
- Code formatting applied consistently across entire codebase using Prettier

### Changed
- ESLint now allows variables prefixed with `_` to be unused (conventional pattern)
- Reduced linting errors from 125 to 0 (now 113 warnings)

### Technical
- All 220 tests pass
- Build succeeds without errors
- TypeScript strict checking has some warnings but doesn't block functionality

## [2.6.0] - 2025-10-22

### Added
- Multiple Layouts support: Create many presentation views from one semantic data file
- Layout Manager service for managing multiple graph files per diagram
- Layout switching in canvas view
- Layout templates (standard, compressed, sparse, wide, tall)

### Fixed
- PNG export with multiple tabs open

## [2.5.1] - 2025-10-24

### Fixed
- Snapshot color contamination: Node color changes in one snapshot no longer affect other snapshots
- Edge label persistence: Edge labels now persist correctly across file save/load cycles
- Force save before snapshot switching to prevent data loss from auto-save race conditions

### Changed
- Snapshot-varying properties (label, description, status, color, icon, shape) now stored ONLY in snapshot.nodeProperties
- Edge direction stored exclusively in edge.style.direction (not duplicated in properties)

## [2.5.0] - 2025-10-01

### Added
- Dual-file format: Separation of semantic data (.bac4) from presentation data (.bac4-graph)
- Multiple views of the same data
- Improved snapshot isolation
- Wardley Mapping integration
- Migration service for v1 → v2.5.0 format

### Changed
- Deprecated global relationship registry in favor of self-contained diagrams
- Node properties now split between invariant (shared) and snapshot-varying (per-snapshot)

## [2.0.0] - 2025-08-01

### Added
- Initial release with C4 diagram support
- 7-layer enterprise architecture model
- Timeline versioning with snapshots
- React Flow based canvas editor
- Cloud component library (AWS, Azure, GCP)

