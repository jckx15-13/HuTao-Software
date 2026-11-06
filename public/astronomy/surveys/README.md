# Mirrored all-sky survey previews

Files here are referenced by `src/data/astronomy/surveys.json` -> `allSkyPreview.localPath`.
They are intentionally NOT committed: they are large, and several carry archive-specific
licence terms. The app runs correctly with this directory empty — each missing survey is
reported as explicitly unavailable in the telescope data-configuration panel rather than
being silently replaced by another survey's imagery.

See docs/ASSET_DATA_ARCHITECTURE.md for how to populate and verify this directory.
