# Requirements Docs

This folder contains functional requirements and runtime behavior references.

## Subfolders

- `workflow/` status transitions, roles, permissions, and action rules
- `pages/` menu-by-menu page behavior and consolidated order workspace behavior
- `domain/` order structure, master data ownership, and runtime data shape
- `blueprint/` the long-form implementation blueprint for the next project

## Read Order

1. `workflow/WORKFLOW-AND-PERMISSIONS.md`
2. `pages/MENU-FLOWS.md`
3. `pages/ORDERS-WORKSPACE.md`
4. `domain/ORDER-STRUCTURE.md`
5. `domain/MASTER-DATA-REFERENCE.md`
6. `blueprint/Objective.md`
7. `blueprint/ORDERS-WORKSPACE-CHECKLIST.md`

## When To Use What

- Use `workflow/` when implementing line actions, guards, transitions, or role
  checks.
- Use `pages/MENU-FLOWS.md` when building routes, menus, and sidebar scope.
- Use `pages/ORDERS-WORKSPACE.md` when building the unified Orders module and
  step zones.
- Use `domain/` when designing forms, data contracts, or backend mappings.
- Use `blueprint/Objective.md` when you need the overall migration target.
- Use `blueprint/ORDERS-WORKSPACE-CHECKLIST.md` when you need the detailed
  implementation checklist for the unified order flow.
