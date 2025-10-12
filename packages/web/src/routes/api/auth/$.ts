import { AuthService } from '@lax-db/core/auth';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { createFileRoute } from '@tanstack/react-router';
import { Effect } from 'effect';

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        RuntimeServer.runPromise(
          Effect.gen(function* () {
            const auth = yield* AuthService;
            return yield* Effect.promise(() => auth.auth().handler(request));
          }),
        ),
      POST: ({ request }) =>
        RuntimeServer.runPromise(
          Effect.gen(function* () {
            const auth = yield* AuthService;
            return yield* Effect.promise(() => auth.auth().handler(request));
          }),
        ),
    },
  },
});
