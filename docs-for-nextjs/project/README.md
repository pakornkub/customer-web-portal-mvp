# Project Source Map

This folder explains which files in the current MVP repository are still needed
when extracting behavior into the next project.

## Contents

- `CURRENT-MVP-FILE-MAP.md` source-file inventory with purpose and migration use
- `source/` bundled snapshot of the required current-project files
- `source/SOURCE-SNAPSHOT.md` guide for consuming the bundled snapshot

This includes current runtime files, data inputs, and the `scripts/` folder
classification used during docs/database generation.

It also includes bundled root-level project docs that provide historical and
working-context references.

## Use

- Read this folder after the main requirements docs are understood.
- Use it when another AI or developer must inspect the current repository for
  exact behavior, field names, seed values, or PDF generation logic.
- Prefer the bundled copies under `source/` when handing off this docs pack to
  another workspace or AI.
- Do not treat this folder as the target architecture. The target architecture
  is defined by the requirement and database docs.
