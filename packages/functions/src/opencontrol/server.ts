import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { db } from '@lax-db/core/drizzle/index';
import { handle } from 'hono/aws-lambda';
import { create } from 'opencontrol';
import { tool } from 'opencontrol/tool';
import { Resource } from 'sst';
import { tools } from 'sst/opencontrol';
import { z } from 'zod';

const databaseRead = tool({
  name: 'database_query_readonly',
  description:
    'Readonly database query for MySQL, use this if there are no direct tools',
  args: z.object({ query: z.string() }),
  async run(input) {
    return db.transaction(async (tx) => tx.execute(input.query), {
      accessMode: 'read only',
      isolationLevel: 'read committed',
    });
  },
});

const databaseWrite = tool({
  name: 'database_query_write',
  description:
    'DANGEROUS operation that writes to the database. You MUST triple check with the user before using this tool - show them the query you are about to run.',
  args: z.object({ query: z.string() }),
  async run(input) {
    return db.transaction(async (tx) => tx.execute(input.query), {
      isolationLevel: 'read committed',
    });
  },
});

console.log('opencontrol_key', process.env.OPENCONTROL_KEY);

const app = create({
  // model: createAnthropic({
  //   apiKey: Resource.AnthropicKey.value,
  // })("claude-3-7-sonnet-20250219"),
  /* @ts-expect-error */
  model: createGoogleGenerativeAI({
    apiKey: Resource.GoogleGenAIKey.value,
  })('gemini-2.5-pro-exp-03-25'),
  /* @ts-expect-error */
  tools: [databaseRead, databaseWrite, stripe, tools[0]],
});
// @ts-ignore
export const handler = handle(app);
