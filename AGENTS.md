# AGENTS.md - Lax DB Development Guide

## Essential Commands

- `bun dev` - Start SST development mode
- `bun build` - Build all packages
- `bun deploy` - Deploy to AWS
- `bun typecheck` - Run TypeScript checks across all packages
- `cd packages/functions && bun test` - Run function tests (single test: add
  `--grep "test name"`)
- `cd packages/core && bunx vitest` - Run core package tests (single test: add
  `-t "test name"`)

## Code Style (Biome enforced)

- **Formatting**: 2 spaces, single quotes, self-closing JSX elements
- **Imports**: Use `import type` for type-only imports (enforced error)
- **Exports**: Use `export type` for type-only exports (enforced error)
- **Types**: Prefer `as const` assertions, avoid inferrable types
- **Variables**: Use single var declarators, default parameters last

## Architecture Patterns

- **Core**: Effect library for functional programming, Zod schemas, error
  handling via `VisibleError` class
- **Frontend**: TanStack Start/Router, React 19, Tailwind CSS
- **Functions**: AWS Lambda with SST, Bun test runner
- **Monorepo**: Turbo build orchestration, workspace packages with `@lax-db/*`
  naming

## Error Handling

- Use `VisibleError` class for client-facing errors with proper HTTP status
  codes
- Follow standardized error codes in `ErrorCodes` object (validation,
  authentication, etc.)
- Database errors should implement `DatabaseError` interface
