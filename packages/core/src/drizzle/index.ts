import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgTransaction, PgTransactionConfig } from 'drizzle-orm/pg-core';
import { Context, Effect, Layer } from 'effect';
import { Pool } from 'pg';
import { Resource } from 'sst';

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

// Error types
export class DatabaseError extends Error {
  readonly _tag = 'DatabaseError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Database operation failed');
  }
}

// Database Service
export class DatabaseService extends Context.Tag('DatabaseService')<
  DatabaseService,
  {
    readonly db: ReturnType<typeof drizzle>;
    readonly transaction: <T>(
      callback: (tx: Transaction) => Promise<T>,
      isolationLevel?: PgTransactionConfig['isolationLevel'],
    ) => Effect.Effect<T, DatabaseError>;
  }
>() {}

// Implementation
const makeDatabaseService = Effect.gen(function* () {
  const pool = new Pool({
    host: Resource.Database.host,
    port: Resource.Database.port,
    user: Resource.Database.username,
    password: Resource.Database.password,
    database: Resource.Database.database,
  });

  const drizzleConfig =
    process.env.DRIZZLE_LOG === 'true'
      ? {
          logger: {
            logQuery(query: string, params: unknown[]) {
              console.log('[drizzle] query:', query);
              console.log('[drizzle] params:', params);
            },
          },
        }
      : {};

  const db = drizzle(pool, drizzleConfig);

  const transaction = <T>(
    callback: (tx: Transaction) => Promise<T>,
    isolationLevel?: PgTransactionConfig['isolationLevel'],
  ) =>
    Effect.tryPromise({
      try: () =>
        db.transaction(callback, {
          isolationLevel: isolationLevel || 'read committed',
        }),
      catch: (error) => new DatabaseError(error, 'Transaction failed'),
    });

  return { db, transaction };
});

// Database Layer
export const DatabaseLive = Layer.effect(DatabaseService, makeDatabaseService);

// Synchronous db export for backward compatibility
const service = Effect.runSync(makeDatabaseService);
export const db = service.db;
