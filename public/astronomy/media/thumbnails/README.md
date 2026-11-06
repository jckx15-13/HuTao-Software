# Mirrored media thumbnails

Files here are referenced by `src/data/astronomy/mediaCatalog.json` -> `thumbnail`.
Entries ship with `thumbnail: null`, so pins render SilverWolf's procedural marker and
no remote image request is ever made. Mirroring a file here and setting `thumbnail` to its
path upgrades that pin.

See docs/ASSET_DATA_ARCHITECTURE.md.
