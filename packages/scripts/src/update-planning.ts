#!/usr/bin/env node

/**
 * Script to update the planning document with current date
 * Usage: bun run packages/scripts/src/update-planning.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Console, Effect } from 'effect';

interface DocumentStats {
  readonly totalLines: number;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly completionRate: number;
}

interface UpdateResult {
  readonly success: boolean;
  readonly dateString: string;
  readonly stats: DocumentStats;
  readonly error?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const PLANNING_PATH = join(
  __dirname,
  '..',
  '..',
  'web',
  'src',
  'content',
  'planning.md',
);

// Effect-based file operations
const readPlanningFile = Effect.try({
  try: () => readFileSync(PLANNING_PATH, 'utf8'),
  catch: (error) => new PlanningError(`Failed to read planning file: ${error}`),
});

const writePlanningFile = (content: string) =>
  Effect.try({
    try: () => writeFileSync(PLANNING_PATH, content, 'utf8'),
    catch: (error) =>
      new PlanningError(`Failed to write planning file: ${error}`),
  });

// Custom error type
class PlanningError extends Error {
  readonly _tag = 'PlanningError';
}

// Pure function to update content
const updateContent = (content: string): Effect.Effect<string, never> => {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lastUpdatedRegex = /\*Last updated: .*\*/;
  const newLastUpdated = `*Last updated: ${dateString}*`;

  if (lastUpdatedRegex.test(content)) {
    return Effect.succeed(content.replace(lastUpdatedRegex, newLastUpdated));
  }
  return Effect.succeed(`${content}\n\n---\n\n${newLastUpdated}`);
};

// Pure function to calculate stats
const calculateStats = (content: string): DocumentStats => {
  const lines = content.split('\n');
  const tasks = lines.filter(
    (line) =>
      line.includes('[ ]') || line.includes('[x]') || line.includes('[X]'),
  ).length;
  const completedTasks = lines.filter(
    (line) => line.includes('[x]') || line.includes('[X]'),
  ).length;

  return {
    totalLines: lines.length,
    totalTasks: tasks,
    completedTasks,
    completionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0,
  };
};

// Main update effect
const updatePlanningDocument = Effect.gen(function* () {
  // Read file
  const content = yield* readPlanningFile;

  // Update content
  const updatedContent = yield* updateContent(content);

  // Write file
  yield* writePlanningFile(updatedContent);

  // Calculate stats
  const stats = calculateStats(updatedContent);

  // Get date string
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return { dateString, stats };
});

// Console output effects
const logSuccess = (dateString: string, stats: DocumentStats) =>
  Effect.gen(function* () {
    yield* Console.log(`✅ Planning document updated with date: ${dateString}`);
    yield* Console.log('📊 Document stats:');
    yield* Console.log(`   - Total lines: ${stats.totalLines}`);
    yield* Console.log(`   - Total tasks: ${stats.totalTasks}`);
    yield* Console.log(`   - Completed tasks: ${stats.completedTasks}`);
    yield* Console.log(`   - Completion rate: ${stats.completionRate}%`);
  });

const logError = (error: unknown) =>
  Console.log(
    `❌ Error updating planning document: ${error instanceof Error ? error.message : String(error)}`,
  );

// Main program
const program = Effect.gen(function* () {
  try {
    const result = yield* updatePlanningDocument;
    yield* logSuccess(result.dateString, result.stats);
  } catch (error) {
    yield* logError(error);
    process.exit(1);
  }
});

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Effect.runPromise(program).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { updatePlanningDocument, calculateStats };
export type { DocumentStats, UpdateResult };
