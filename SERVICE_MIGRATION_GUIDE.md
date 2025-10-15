# Service Architecture Migration Guide

This guide documents the process of migrating services from the legacy architecture to the new standardized architecture using Effect-TS patterns. Use this as a checklist for migrating any service module.

## Overview

**Target Architecture:**

- Standardized error handling with typed errors
- Repository pattern for database operations
- Service layer for business logic
- Contract definitions for API specifications
- HTTP API and RPC endpoints
- Type-safe client adapters

**Example Modules:** Season, Game (completed) | **Next Target:** Player

---

## Phase 1: Core Module Preparation

### 1.1 Analyze Current State

**Files to Review:**

- `packages/core/src/{module}/{module}.service.ts` - Current service implementation
- `packages/core/src/{module}/{module}.schema.ts` - Data schemas
- `packages/core/src/{module}/{module}.sql.ts` - Database table definitions
- `packages/core/src/{module}/{module}.error.ts` - Custom error classes (if exists)

**Player Module Current State:**

```
✅ player.service.ts - Exists (direct DB access, needs repo extraction)
✅ player.schema.ts - Exists (schemas defined)
✅ player.sql.ts - Exists (tables: playerTable, teamPlayerTable)
✅ player.error.ts - Exists (custom PlayerError class)
❌ player.contract.ts - Missing (needs creation)
❌ player.repo.ts - Missing (needs creation)
```

**Key Questions:**

- [ ] Does the service use custom error classes? (Player: ✅ PlayerError)
- [ ] Does the service do direct DB operations? (Player: ✅ Yes, needs extraction)
- [ ] What CRUD operations exist? (Player: getAll, create, update, delete, team operations)
- [ ] Are there soft deletes or hard deletes? (Player: Hard deletes currently)
- [ ] What input/output schemas are defined? (Player: Multiple - see schema file)

---

### 1.2 Update Error Handling

**File:** `packages/core/src/error.ts`

**Existing Standardized Errors:**

```typescript
// Already defined - use these instead of custom errors
export class NotFoundError extends Schema.TaggedError<NotFoundError>()('NotFoundError', { ... })
export class ValidationError extends Schema.TaggedError<ValidationError>()('ValidationError', { ... })
export class DatabaseError extends Schema.TaggedError<DatabaseError>()('DatabaseError', { ... })
export class ConstraintViolationError extends Schema.TaggedError<ConstraintViolationError>()('ConstraintViolationError', { ... })
```

**Action Items:**

- [ ] Review custom error class (e.g., `PlayerError`)
- [ ] Plan migration from custom error to standardized errors
- [ ] Note: Custom errors will be removed after migration

---

### 1.3 Audit Schema Definitions

**File:** `packages/core/src/{module}/{module}.schema.ts`

**Schema Checklist:**

- [ ] **Main Entity Class** - Uses `Schema.Class<T>()` pattern
  - [ ] Includes `PublicIdSchema` (not internal `id`)
  - [ ] Includes `OrganizationIdSchema` (if multi-tenant)
  - [ ] Includes `TeamIdSchema` or `NullableTeamIdSchema` (if team-scoped)
  - [ ] Includes `TimestampsSchema` (createdAt, updatedAt, deletedAt)
- [ ] **Input Classes** - Defined for all operations:
  - [ ] `GetAll{Module}Input` - List/query operations
  - [ ] `Get{Module}Input` - Single item fetch (if applicable)
  - [ ] `Create{Module}Input` - Create operations
  - [ ] `Update{Module}Input` - Update operations with optional fields
  - [ ] `Delete{Module}Input` - Delete operations
  - [ ] Additional specialized inputs (e.g., team operations for Player)

**Player Schema Analysis:**

```typescript
// Missing main Player class - needs creation
// Has input classes: ✅ GetAllPlayersInput, CreatePlayerInput, etc.
// Has team-specific inputs: ✅ AddPlayerToTeamInput, RemovePlayerFromTeamInput
// Missing: Main Player entity class for contract/API responses
```

**Action Items:**

- [ ] Create main entity class if missing (e.g., `Player`)
- [ ] Ensure all input classes follow naming convention
- [ ] Add `publicId` field to main entity (remove internal `id`)
- [ ] Review UpdateInput - should have all fields as optional

---

### 1.4 Create Contract Definition

**File:** `packages/core/src/{module}/{module}.contract.ts` (CREATE NEW)

**Template:**

```typescript
import { Schema } from 'effect';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../error';
import {
  Create{Module}Input,
  Delete{Module}Input,
  GetAll{Module}Input,
  Get{Module}Input,
  {Module},
  Update{Module}Input,
} from './{module}.schema';

export const {Module}Errors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError
);

export const {Module}Contract = {
  list: {
    success: Schema.Array({Module}),
    error: {Module}Errors,
    payload: GetAll{Module}Input,
  },
  get: {
    success: {Module},
    error: {Module}Errors,
    payload: Get{Module}Input,
  },
  create: {
    success: {Module},
    error: {Module}Errors,
    payload: Create{Module}Input,
  },
  update: {
    success: {Module},
    error: {Module}Errors,
    payload: Update{Module}Input,
  },
  delete: {
    success: {Module},
    error: {Module}Errors,
    payload: Delete{Module}Input,
  },
} as const;
```

**Player-Specific Considerations:**

- Player has additional team operations (add/remove from team)
- May need additional contract methods for team-specific operations
- Consider whether team operations should be separate contracts

---

### 1.5 Create Repository Layer

**File:** `packages/core/src/{module}/{module}.repo.ts` (CREATE NEW)

**Repository Pattern:**

```typescript
import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type {
  Create{Module}Input,
  Delete{Module}Input,
  GetAll{Module}Input,
  Get{Module}Input,
  Update{Module}Input,
} from './{module}.schema';
import { type {Module}Select, {module}Table } from './{module}.sql';

export class {Module}Repo extends Effect.Service<{Module}Repo>()('{Module}Repo', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    // Remove internal 'id' from returned columns
    const { id: _, ...rest } = getTableColumns({module}Table);

    return {
      list: (input: GetAll{Module}Input) =>
        Effect.gen(function* () {
          const items: {Module}Select[] = yield* db
            .select(rest)
            .from({module}Table)
            .where(
              and(
                eq({module}Table.organizationId, input.organizationId),
                input.teamId ? eq({module}Table.teamId, input.teamId) : undefined,
                isNull({module}Table.deletedAt) // Soft delete filter
              )
            )
            .pipe(Effect.tapError(Effect.logError));

          return items;
        }),

      get: (input: Get{Module}Input) =>
        Effect.gen(function* () {
          const item: {Module}Select = yield* db
            .select(rest)
            .from({module}Table)
            .where(
              and(
                eq({module}Table.publicId, input.publicId),
                eq({module}Table.organizationId, input.organizationId),
                input.teamId ? eq({module}Table.teamId, input.teamId) : undefined,
                isNull({module}Table.deletedAt)
              )
            )
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return item;
        }),

      create: (input: Create{Module}Input) =>
        Effect.gen(function* () {
          const item: {Module}Select = yield* db
            .insert({module}Table)
            .values({
              organizationId: input.organizationId,
              teamId: input.teamId,
              // ... other fields with defaults
              fieldName: input.fieldName ?? 'defaultValue',
            })
            .returning(rest)
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return item;
        }),

      update: (input: Update{Module}Input) =>
        db
          .update({module}Table)
          .set({
            // Conditional updates - only set if defined
            ...(input.field1 !== undefined && { field1: input.field1 }),
            ...(input.field2 !== undefined && { field2: input.field2 }),
          })
          .where(
            and(
              eq({module}Table.publicId, input.publicId),
              eq({module}Table.organizationId, input.organizationId),
              input.teamId ? eq({module}Table.teamId, input.teamId) : undefined,
              isNull({module}Table.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      delete: (input: Delete{Module}Input) =>
        db
          .update({module}Table)
          .set({ deletedAt: new Date() }) // SOFT DELETE
          .where(
            and(
              eq({module}Table.publicId, input.publicId),
              eq({module}Table.organizationId, input.organizationId),
              input.teamId ? eq({module}Table.teamId, input.teamId) : undefined,
              isNull({module}Table.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
```

**Key Patterns:**

- ✅ Exclude internal `id` field from returns using `getTableColumns()`
- ✅ Use `Effect.gen()` for async operations
- ✅ Pipe errors through `Effect.tapError(Effect.logError)`
- ✅ Use `Effect.flatMap(Arr.head)` to unwrap single results
- ✅ Use soft deletes (`deletedAt`) instead of hard deletes
- ✅ Always filter `isNull(deletedAt)` in queries
- ✅ Use conditional spreads for optional update fields

**Player-Specific Considerations:**

- Player has `teamPlayerTable` - may need separate repo methods or a TeamPlayerRepo
- Consider whether team operations belong in PlayerRepo or separate module

---

### 1.6 Refactor Service Layer

**File:** `packages/core/src/{module}/{module}.service.ts`

**Service Layer Responsibilities:**

- Input validation via `decodeArguments()`
- Business logic (validation rules, date checks, etc.)
- Call repository methods
- Error handling and transformation
- Logging

**Service Pattern:**

```typescript
import { Effect } from 'effect';
import { NotFoundError } from '../error';
import { decodeArguments, parsePostgresError } from '../util';
import { {Module}Repo } from './{module}.repo';
import {
  Create{Module}Input,
  Delete{Module}Input,
  GetAll{Module}Input,
  Get{Module}Input,
  Update{Module}Input,
} from './{module}.schema';

export class {Module}Service extends Effect.Service<{Module}Service>()(
  '{Module}Service',
  {
    effect: Effect.gen(function* () {
      const {module}Repo = yield* {Module}Repo;

      return {
        list: (input: GetAll{Module}Input) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetAll{Module}Input, input);
            return yield* {module}Repo.list(decoded);
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((items) =>
              Effect.log(`Found ${items.length} {module}s`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to list {module}s', error)
            )
          ),

        get: (input: Get{Module}Input) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(Get{Module}Input, input);
            const item = yield* {module}Repo.get(decoded);
            return item;
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: '{Module}', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((item) => Effect.log(`Found {module}: ${item.name}`)),
            Effect.tapError((error) =>
              Effect.logError('Failed to get {module}', error)
            )
          ),

        create: (input: Create{Module}Input) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(Create{Module}Input, input);

            // Business logic validation example
            if (decoded.endDate && decoded.startDate >= decoded.endDate) {
              return yield* Effect.fail(new ValidationError());
            }

            return yield* {module}Repo.create(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(new ValidationError())
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((item) =>
              Effect.log(`Created {module}: ${item.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to create {module}', error)
            )
          ),

        update: (input: Update{Module}Input) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(Update{Module}Input, input);
            return yield* {module}Repo.update(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: '{Module}', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((item) =>
              Effect.log(`Updated {module}: ${item.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to update {module}', error)
            )
          ),

        delete: (input: Delete{Module}Input) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(Delete{Module}Input, input);
            return yield* {module}Repo.delete(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: '{Module}', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((item) =>
              Effect.log(`Deleted {module}: ${item.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to delete {module}', error)
            )
          ),
      } as const;
    }),
    dependencies: [{Module}Repo.Default],
  }
) {}
```

**Key Changes from Legacy:**

- ❌ Remove direct DB access (move to repo)
- ❌ Remove custom errors (use standardized errors)
- ❌ Remove `Schema.decode()` (use `decodeArguments()` helper)
- ✅ Add `decodeArguments()` for input validation
- ✅ Add `parsePostgresError()` for SQL error handling
- ✅ Add comprehensive logging with `Effect.tap()` and `Effect.tapError()`
- ✅ Catch `NoSuchElementException` from `Arr.head()` and convert to `NotFoundError`
- ✅ Use repo layer dependency

**Player-Specific Migration:**

```typescript
// BEFORE (Legacy Pattern):
const validated = yield* Schema.decode(GetAllPlayersInput)(input);
const result = yield* db.select({ ... }).from(playerTable).where(...).pipe(
  Effect.tapError(Effect.logError),
  Effect.mapError((cause) => new PlayerError({ cause }))
);

// AFTER (New Pattern):
const decoded = yield* decodeArguments(GetAllPlayersInput, input);
return yield* playerRepo.list(decoded);
// Error handling in pipe()
```

---

## Phase 2: API Layer Creation

### 2.1 Create HTTP API Endpoints

**File:** `packages/api/src/{module}/{module}.api.ts` (CREATE NEW)

**HTTP API Pattern:**

```typescript
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from '@effect/platform';
import { {Module}Contract } from '@lax-db/core/{module}/{module}.contract';
import { {Module}Service } from '@lax-db/core/{module}/{module}.service';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '@lax-db/core/error';
import { Effect, Layer } from 'effect';

export const {Module}sApi = HttpApi.make('{Module}sApi').add(
  HttpApiGroup.make('{Module}s')
    .add(
      HttpApiEndpoint.post('list{Module}s', '/api/{module}s')
        .addSuccess({Module}Contract.list.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload({Module}Contract.list.payload)
    )
    .add(
      HttpApiEndpoint.post('get{Module}', '/api/{module}s/get')
        .addSuccess({Module}Contract.get.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload({Module}Contract.get.payload)
    )
    .add(
      HttpApiEndpoint.post('create{Module}', '/api/{module}s/create')
        .addSuccess({Module}Contract.create.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload({Module}Contract.create.payload)
    )
    .add(
      HttpApiEndpoint.post('update{Module}', '/api/{module}s/update')
        .addSuccess({Module}Contract.update.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload({Module}Contract.update.payload)
    )
    .add(
      HttpApiEndpoint.post('delete{Module}', '/api/{module}s/delete')
        .addSuccess({Module}Contract.delete.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload({Module}Contract.delete.payload)
    )
);

const {Module}sApiHandlers = HttpApiBuilder.group({Module}sApi, '{Module}s', (handlers) =>
  Effect.gen(function* () {
    const service = yield* {Module}Service;

    return handlers
      .handle('list{Module}s', ({ payload }) => service.list(payload))
      .handle('get{Module}', ({ payload }) => service.get(payload))
      .handle('create{Module}', ({ payload }) => service.create(payload))
      .handle('update{Module}', ({ payload }) => service.update(payload))
      .handle('delete{Module}', ({ payload }) => service.delete(payload));
  })
).pipe(Layer.provide({Module}Service.Default));

export const {Module}sApiLive = HttpApiBuilder.api({Module}sApi).pipe(
  Layer.provide({Module}sApiHandlers)
);
```

**Naming Conventions:**

- API name: `{Module}sApi` (plural)
- Group name: `{Module}s` (plural)
- Endpoint names: `list{Module}s`, `get{Module}`, `create{Module}`, etc.
- Routes: `/api/{module}s`, `/api/{module}s/get`, `/api/{module}s/create`
- Export: `{Module}sApiLive`

---

### 2.2 Create RPC Handlers

**File:** `packages/api/src/{module}/{module}.rpc.ts` (CREATE NEW)

**RPC Pattern:**

```typescript
import { Rpc, RpcGroup } from '@effect/rpc';
import { {Module}Contract } from '@lax-db/core/{module}/{module}.contract';
import { {Module}Service } from '@lax-db/core/{module}/{module}.service';
import { Effect, Layer } from 'effect';

export class {Module}Rpcs extends RpcGroup.make(
  Rpc.make('{Module}List', {
    success: {Module}Contract.list.success,
    error: {Module}Contract.list.error,
    payload: {Module}Contract.list.payload,
  }),
  Rpc.make('{Module}Get', {
    success: {Module}Contract.get.success,
    error: {Module}Contract.get.error,
    payload: {Module}Contract.get.payload,
  }),
  Rpc.make('{Module}Create', {
    success: {Module}Contract.create.success,
    error: {Module}Contract.create.error,
    payload: {Module}Contract.create.payload,
  }),
  Rpc.make('{Module}Update', {
    success: {Module}Contract.update.success,
    error: {Module}Contract.update.error,
    payload: {Module}Contract.update.payload,
  }),
  Rpc.make('{Module}Delete', {
    success: {Module}Contract.delete.success,
    error: {Module}Contract.delete.error,
    payload: {Module}Contract.delete.payload,
  })
) {}

export const {Module}Handlers = {Module}Rpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* {Module}Service;

    return {
      {Module}List: (payload) => service.list(payload),
      {Module}Get: (payload) => service.get(payload),
      {Module}Create: (payload) => service.create(payload),
      {Module}Update: (payload) => service.update(payload),
      {Module}Delete: (payload) => service.delete(payload),
    };
  })
).pipe(Layer.provide({Module}Service.Default));
```

**RPC Naming Conventions:**

- RPC class: `{Module}Rpcs` (plural)
- RPC names: `{Module}List`, `{Module}Get`, `{Module}Create`, etc. (PascalCase)
- Handler keys: Match RPC names exactly
- Export: `{Module}Handlers`

---

### 2.3 Create Client Adapters

**File:** `packages/api/src/{module}/{module}.client.ts` (CREATE NEW)

**Client Pattern:**

```typescript
import { HttpClient } from '@effect/platform';
import { RpcClient } from '@effect/rpc';
import { Array, Chunk, Effect, Stream } from 'effect';
import { {Module}Rpcs } from './{module}.rpc';

export const {Module}RpcClient = (baseUrl: string) =>
  RpcClient.make(
    {Module}Rpcs,
    Stream.fromIterable([`${baseUrl}/rpc`]).pipe(
      Stream.mapEffect((url) =>
        RpcClient.clientRequestStream(
          Chunk.of(
            new HttpClient.request.ClientRequest(url, { method: 'POST' })
          ),
          Effect.succeed,
          Array.of
        )
      ),
      Stream.flatMap((x) => x),
      Stream.tapError(Effect.logError)
    )
  );

export const {Module}HttpClient = (baseUrl: string) => {
  // HTTP client adapter implementation
  // Usually simpler than RPC - direct fetch calls
};

export const {Module}AtomClient = (baseUrl: string) => {
  // Atom (state management) client if needed
  // For real-time updates or caching
};
```

---

### 2.4 Wire Into Main Router

**File:** `packages/api/src/index.ts`

**Integration Steps:**

1. **Import modules:**

```typescript
import { {Module}sApiLive } from './{module}/{module}.api';
import { {Module}Handlers, {Module}Rpcs } from './{module}/{module}.rpc';
```

2. **Add RPC layer:**

```typescript
const AllRpcs = Layer.mergeAll(
  RpcServer.layer(SeasonRpcs).pipe(Layer.provide(SeasonHandlers)),
  RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers)),
  RpcServer.layer({Module}Rpcs).pipe(Layer.provide({Module}Handlers)), // ADD THIS
);
```

3. **Add API layer:**

```typescript
const Main = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  // ... other layers
  Layer.provide(SeasonsApiLive),
  Layer.provide(GamesApiLive),
  Layer.provide({Module}sApiLive), // ADD THIS
  Layer.provide(AllRpcs),
  // ... other layers
);
```

---

## Phase 3: Testing & Validation

### 3.1 Run Type Checking

```bash
bun typecheck
```

**Expected Output:**

```
✓ @lax-db/core:typecheck
✓ @lax-db/api:typecheck
✓ All other packages
```

**Common Type Errors:**

- Missing imports
- Contract success/error type mismatches
- Schema field mismatches
- Service method signature mismatches

---

### 3.2 Test Checklist

- [ ] **List Operation**
  - [ ] Returns array of entities
  - [ ] Filters by organization
  - [ ] Filters by team (if applicable)
  - [ ] Excludes soft-deleted items
  - [ ] Logs result count

- [ ] **Get Operation**
  - [ ] Returns single entity by publicId
  - [ ] Throws NotFoundError when not found
  - [ ] Throws NotFoundError for soft-deleted items
  - [ ] Respects organization/team scope

- [ ] **Create Operation**
  - [ ] Creates entity with required fields
  - [ ] Applies default values
  - [ ] Returns created entity
  - [ ] Validates input schema
  - [ ] Handles constraint violations (unique, foreign key)

- [ ] **Update Operation**
  - [ ] Updates only provided fields
  - [ ] Returns updated entity
  - [ ] Throws NotFoundError when not found
  - [ ] Validates input schema

- [ ] **Delete Operation**
  - [ ] Soft deletes (sets deletedAt)
  - [ ] Returns deleted entity
  - [ ] Throws NotFoundError when not found
  - [ ] Prevents double-delete

---

### 3.3 Cleanup Legacy Code

After successful migration:

- [ ] Remove custom error files (`{module}.error.ts`)
- [ ] Remove commented-out code
- [ ] Update imports across codebase
- [ ] Remove unused dependencies

---

## Player Module Checklist

### Core Package (`packages/core/src/player/`)

- [ ] **player.schema.ts**
  - [ ] Create main `Player` class with publicId, timestamps
  - [ ] Review all input classes
  - [ ] Ensure UpdatePlayerInput has all fields optional
  - [ ] Consider team operations schema placement

- [ ] **player.contract.ts** (CREATE)
  - [ ] Define PlayerErrors union
  - [ ] Define PlayerContract with CRUD operations
  - [ ] Add team operation contracts if needed

- [ ] **player.repo.ts** (CREATE)
  - [ ] Extract all DB operations from service
  - [ ] Implement list, get, create, update, delete
  - [ ] Handle teamPlayerTable operations
  - [ ] Use soft deletes
  - [ ] Exclude internal `id` field

- [ ] **player.service.ts** (REFACTOR)
  - [ ] Replace direct DB calls with repo calls
  - [ ] Replace Schema.decode with decodeArguments
  - [ ] Replace PlayerError with standardized errors
  - [ ] Add parsePostgresError for SQL errors
  - [ ] Add comprehensive logging
  - [ ] Handle NoSuchElementException → NotFoundError

- [ ] **player.error.ts** (DELETE after migration)

### API Package (`packages/api/src/player/`)

- [ ] **player.api.ts** (CREATE)
  - [ ] Define PlayersApi with HTTP endpoints
  - [ ] Create handlers using PlayerService
  - [ ] Export PlayersApiLive

- [ ] **player.rpc.ts** (CREATE)
  - [ ] Define PlayerRpcs class
  - [ ] Create PlayerHandlers layer
  - [ ] Map RPC calls to service methods

- [ ] **player.client.ts** (CREATE)
  - [ ] Implement PlayerRpcClient
  - [ ] Implement PlayerHttpClient (optional)

### Integration (`packages/api/src/index.ts`)

- [ ] Import PlayerRpcs and PlayerHandlers
- [ ] Add to AllRpcs layer
- [ ] Import and provide PlayersApiLive

---

## Common Patterns & Gotchas

### Soft Delete Implementation

**Always include deletedAt filter:**

```typescript
// ❌ WRONG - returns deleted items
.where(eq(table.organizationId, orgId))

// ✅ CORRECT
.where(
  and(
    eq(table.organizationId, orgId),
    isNull(table.deletedAt)
  )
)
```

### Error Transformation

**Use parsePostgresError for SQL errors:**

```typescript
// ❌ WRONG - loses error context
Effect.catchTag("SqlError", () => Effect.fail(new DatabaseError()));

// ✅ CORRECT - preserves error details
Effect.catchTag("SqlError", (error) => Effect.fail(parsePostgresError(error)));
```

### Optional Fields in Updates

**Use conditional spreads:**

```typescript
// ❌ WRONG - sets undefined values
.set({
  name: input.name,
  email: input.email,
})

// ✅ CORRECT - only sets defined values
.set({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.email !== undefined && { email: input.email }),
})
```

### Return Deleted Entities

**Soft delete should return the entity:**

```typescript
// ✅ Returns deleted entity (useful for confirmation/undo)
delete: (input) =>
  db
    .update(table)
    .set({ deletedAt: new Date() })
    .where(...)
    .returning(rest)
    .pipe(Effect.flatMap(Arr.head))
```

This is not inherently bad - it provides confirmation and enables undo functionality.

---

## Reference Files

**Completed Examples:**

- `packages/core/src/season/*` - Clean season implementation
- `packages/core/src/game/*` - Clean game implementation
- `packages/api/src/season/*` - Season API/RPC
- `packages/api/src/game/*` - Game API/RPC

**Utilities:**

- `packages/core/src/error.ts` - Standardized errors
- `packages/core/src/util.ts` - Helper functions (decodeArguments, parsePostgresError)
- `packages/core/src/schema.ts` - Shared schemas

---

## Summary

**Migration Order:**

1. Core: Schema → Contract → Repo → Service
2. API: API → RPC → Client → Router
3. Test → Cleanup

**Key Principles:**

- Repository handles DB operations
- Service handles business logic
- Contracts define API shape
- Standardized errors everywhere
- Comprehensive logging
- Soft deletes by default
- Type safety throughout

**Time Estimate per Module:**

- Simple module (Season-like): 2-3 hours
- Complex module (Player-like): 4-6 hours

---

**Next Steps for Player Migration:**

1. Start with player.schema.ts - create Player class
2. Create player.contract.ts
3. Create player.repo.ts
4. Refactor player.service.ts
5. Create API layer files
6. Wire into router
7. Run typecheck
8. Test operations
