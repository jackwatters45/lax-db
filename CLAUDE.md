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
- **Frontend**: TanStack Start (React meta-framework), Tailwind CSS v4, Vite
- **Backend**: SST v3, AWS Lambda, Effect library for functional programming
- **Database**: PostgreSQL v17.4 with RDS Proxy, Zero (local-first), Drizzle ORM
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
bun console    # Open SST console
bun sso        # Login to AWS SSO (laxdb session)
```

### Testing
```bash
# Frontend tests (Vitest)
cd packages/frontend && bun test

# Functions tests (Bun test runner)
cd packages/functions && bun test
# Single test: add --grep "test name"

# Core package tests (Vitest)
cd packages/core && bunx vitest
# Single test: add -t "test name"
```

### Code Quality
```bash
# Biome automatically runs on pre-commit via git hooks
# Manual formatting/linting
bunx @biomejs/biome check --write .
```

## Architecture

The project uses a monorepo structure with Turbo for build orchestration:

- `/packages/api` - API endpoints and handlers
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

5. **Error Handling**: Use `VisibleError` class for client-facing errors with proper HTTP status codes. Follow standardized error codes in `ErrorCodes` object.

6. **Testing**: 
   - Frontend: Use Vitest with @testing-library/react
   - Functions: Use Bun test runner with SST shell
   - Core: Use Vitest for business logic testing

7. **Git Workflow**: Pre-commit hooks run Biome checks and type checking automatically. Pre-push runs typecheck.

## Infrastructure

AWS deployment via SST with the following components:
- **Region**: us-west-2
- **Database**: PostgreSQL v17.4 with RDS Proxy, automated migrations via Drizzle
- **Authentication**: OpenAuth with Google OIDC provider
- **VPC**: Custom VPC with bastion host and NAT gateway
- **DNS**: Cloudflare integration (laxdb.io for production, dev.laxdb.io for staging)
- **Storage**: S3 bucket for static assets
- **Monitoring**: OpenControl service for compliance monitoring
- **Stage Management**: Production (`laxdb-production` profile) and dev (`laxdb-dev` profile)

## Current Status

The project is in early development on branch `07-16-replace_tanstack_router_with_tanstack_start`, having recently migrated from TanStack Router to TanStack Start. Basic infrastructure and authentication are in place.