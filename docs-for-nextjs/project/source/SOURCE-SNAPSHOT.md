# Source Snapshot

This folder is a bundled snapshot of the current MVP files that are still needed
for migration.

## Purpose

- Make `docs-for-nextjs/` self-contained for handoff to another AI or project
- Preserve the current working MVP logic, sample files, scripts, template
  assets, and root project docs in one place
- Avoid requiring the receiver to scan the original workspace root

## Main Contents

- root project docs: `README.md`, `PROJECT_WORKING_GUIDE.md`, `COMPLIANCE.md`,
  `UPDATES.md`
- app/runtime references: `App.tsx`, `store.ts`, `types.ts`, `index.tsx`,
  `package.json`
- UI references: `components/`, `pages/`, `utils/`
- input assets: `sample/`, `data/`
- script references: `scripts/`

## Rules

- Treat files here as reference inputs, not target architecture
- When files here conflict with the requirement docs, prefer the requirement
  docs in `docs-for-nextjs/`
- Refresh this snapshot when important source behavior changes in the root
  project

## Reading Note

- Use the bundled root docs here for background and historical context
- Use `docs-for-nextjs/` requirement docs for the migration target