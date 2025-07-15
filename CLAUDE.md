# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lax DB is a lacrosse-focused web application with features including:
- Historical database for NCAA/PLL/WLL game statistics
- Film resources compilation
- Computer vision features (planned)
- Blog platform
- Cameo-like player analysis service
- Stringing database

## Tech Stack

- **Package Manager**: Bun (v1.2.1)
- **Frontend**: TanStack Start (React meta-framework), TanStack Router, Tailwind CSS v4, Vite
- **Backend**: SST v3, AWS Lambda, Effect library for functional programming
- **Database**: Zero (local-first), planning Drizzle ORM integration
- **Infrastructure**: AWS via SST, Cloudflare
- **Code Quality**: Biome (linting/formatting), TypeScript, Lefthook (git hooks)

## Essential Commands

### Development
```bash
bun dev        # Start SST development mode
bun build      # Build all packages
bun deploy     # Deploy to AWS
bun remove     # Remove AWS resources
bun typecheck  # Run TypeScript checks across all packages
```

### Testing
```bash
# Frontend tests (Vitest)
cd packages/frontend && bun test

# Functions tests (Bun test runner)
cd packages/functions && bun test
```

### Code Quality
```bash
# Biome automatically runs on pre-commit via git hooks
# Manual formatting/linting
bunx @biomejs/biome check --write .
```

## Architecture

The project uses a monorepo structure with Turbo for build orchestration:

- `/packages/core` - Business logic using Effect library, type schemas
- `/packages/frontend` - Main web app (TanStack Start)
- `/packages/functions` - AWS Lambda serverless functions
- `/packages/ui` - Shared UI components (Radix UI + shadcn/ui)
- `/packages/hello-zero` - Zero database experiment
- `/packages/zero` - Zero database configuration
- `/infra` - SST infrastructure code

## Development Guidelines

1. **Code Style**: Follow existing patterns. Biome enforces consistent formatting with single quotes and 2-space indentation.

2. **TypeScript**: Use `import type` and `export type` for type-only imports/exports (enforced by Biome).

3. **Effect Library**: Core package uses Effect for functional programming patterns. When adding business logic, follow Effect patterns for error handling and composition.

4. **Components**: When creating UI components, check `/packages/ui` for existing components using Radix UI primitives and class-variance-authority for styling.

5. **Testing**: 
   - Frontend: Use Vitest with @testing-library/react
   - Functions: Use Bun test runner with SST shell

6. **Git Workflow**: Pre-commit hooks run Biome checks and type checking automatically. Pre-push runs typecheck.

## Current Status

The project is in early development on branch `06-27-remove_old_components`, cleaning up old components. Basic infrastructure and authentication are in place.