// ---------------------------------------------
// Architecture Summary
// ---------------------------------------------

/*

KEY IMPROVEMENTS OVER PREVIOUS VERSION:

1. **Shared Business Logic Layer**
   - GamesService contains ALL business logic
   - Both RPC and HTTP API handlers delegate to this service
   - Zero duplication of validation, error handling, logging, etc.

2. **Same Resource Exposed via Both Protocols**
   - Games: Available via RPC (GameList, GameById) AND HTTP API (GET /api/games, GET /api/games/:id)
   - Both protocols use the EXACT same underlying service methods!
   - listGames() is called by both RPC GameList and HTTP GET /api/games
   - getGameById() is called by both RPC GameById and HTTP GET /api/games/:id

3. **Thin Handler Layer**
   - RPC handlers: Just map RPC calls → service methods
   - HTTP API handlers: Just map HTTP requests → service methods
   - Handlers are now 1-2 lines each - pure protocol adaptation
   - Compare to previous version where logic was duplicated in each handler!

4. **Unified Error Handling**
   - NotFoundError and ValidationError used by both protocols
   - Consistent error experience across RPC and HTTP API
   - Validation happens once in the service layer

5. **Easy to Test**
   - Test business logic once in the service layer
   - Mock the service for handler tests
   - Protocol handlers become trivial to test

6. **Easy to Extend**
   - Add new business logic? Add to service layer (ONE place)
   - Want to expose via RPC? Add thin RPC handler (1-2 lines)
   - Want to expose via HTTP? Add thin HTTP handler (1-2 lines)
   - Want both? Add both handlers - they share the same service method!

ARCHITECTURE LAYERS:

┌─────────────────────────────────────┐
│   RPC Handlers    │  HTTP Handlers  │  ← Thin protocol adapters (1-2 lines each)
├───────────────────┴─────────────────┤
│   Services / Use Cases              │  ← ALL business logic (shared)
├─────────────────────────────────────┤
│   Repositories                      │  ← Data access (shared)
├─────────────────────────────────────┤
│   Database / External Services      │
└─────────────────────────────────────┘

This is Hexagonal Architecture (Ports & Adapters) with Effect!
- Core: Services + Repositories (protocol-agnostic)
- Adapters: RPC + HTTP API handlers (protocol-specific, thin)
- Same business logic, multiple interfaces

FILE STRUCTURE RECOMMENDATION:

packages/core/src/
├── domain/
│   ├── schemas/
│   │   ├── game.schema.ts       # Game schema
│   │   └── user.schema.ts       # User schema
│   └── errors/
│       └── api-errors.ts        # NotFoundError, ValidationError, etc.
│
├── application/
│   ├── repositories/
│   │   ├── games.repo.ts        # GamesRepo
│   │   └── users.repo.ts        # UsersRepo
│   └── services/
│       ├── games.service.ts     # GamesService (use cases)
│       └── users.service.ts     # UsersService (use cases)
│
├── infrastructure/
│   ├── rpc/
│   │   ├── games.rpc.ts         # GameRpcs + thin handlers
│   │   ├── users.rpc.ts         # UserRpcs + thin handlers
│   │   └── index.ts
│   ├── http/
│   │   ├── games.api.ts         # GamesApi + thin handlers
│   │   ├── users.api.ts         # UsersApi + thin handlers
│   │   └── index.ts
│   └── server.ts                # Server setup
│
└── clients/
    ├── rpc-client.ts
    ├── http-client.ts
    └── combined-client.ts

This is Domain-Driven Design structure:
- domain/: Pure business entities (schemas, errors)
- application/: Business logic (services, repos)
- infrastructure/: Technical details (RPC, HTTP, database)

*/
