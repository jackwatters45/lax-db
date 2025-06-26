import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgTransaction, PgTransactionConfig } from 'drizzle-orm/pg-core';
import { createContext } from '../context';
import { db } from './index';

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

type TxOrDb = Transaction | typeof db;

const TransactionContext = createContext<{
  tx: Transaction;
  effects: (() => void | Promise<void>)[];
}>();

export async function useTransaction<T>(callback: (trx: TxOrDb) => Promise<T>) {
  try {
    const { tx } = TransactionContext.use();
    return callback(tx);
  } catch {
    return callback(db);
  }
}

export async function afterTx(effect: () => void | Promise<void>) {
  try {
    const { effects } = TransactionContext.use();
    effects.push(effect);
  } catch {
    await effect();
  }
}

export async function createTransaction<T>(
  callback: (tx: Transaction) => Promise<T>,
  isolationLevel?: PgTransactionConfig['isolationLevel'],
): Promise<T> {
  try {
    const { tx } = TransactionContext.use();
    return callback(tx);
  } catch {
    const effects: (() => void | Promise<void>)[] = [];
    const result = await db.transaction(
      async (tx) => {
        return TransactionContext.provide({ tx, effects }, () => callback(tx));
      },
      {
        isolationLevel: isolationLevel || 'read committed',
      },
    );
    await Promise.all(effects.map((x) => x()));
    return result as T;
  }
}
