# Database Docs

This folder contains backend persistence references and generated seed/schema
artifacts.

## Contents

- `DATABASE-SCHEMA.md` logical relational design
- `DATABASE-SCHEMA-SQLSERVER.md` SQL Server physical naming and table guidance
- `schema.prisma.example` generic Prisma starting point
- `schema.sqlserver.prisma` SQL Server-oriented Prisma model draft
- `schema.sqlserver.ddl.sql` concrete SQL Server DDL
- `MASTER-DATA-SEED.json` generated reference seed payload
- `seed.sqlserver.sql` generated SQL Server seed script

## Generation Commands

- `node ./scripts/export_docs_seed.mjs`
- `node ./scripts/export_sqlserver_seed.mjs`

## Read Order

1. `DATABASE-SCHEMA.md`
2. `DATABASE-SCHEMA-SQLSERVER.md`
3. `schema.sqlserver.prisma`
4. `schema.sqlserver.ddl.sql`
5. `MASTER-DATA-SEED.json`
6. `seed.sqlserver.sql`
