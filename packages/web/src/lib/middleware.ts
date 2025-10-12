import { AuthService } from '@lax-db/core/auth';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { Effect } from 'effect';

export const authMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const request = getRequest();
      const { headers } = request;

      const session = yield* Effect.promise(() =>
        auth.auth().api.getSession({ headers }),
      );

      if (!session) {
        const url = new URL(request.url);
        throw redirect({
          to: '/login',
          search: {
            redirectUrl: url.pathname,
          },
        });
      }

      return next({
        context: {
          session,
          headers,
        },
      });
    }),
  ),
);

const preLogMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    const clientTime = new Date();

    return ctx.next({
      context: {
        clientTime,
      },
      sendContext: {
        clientTime,
      },
    });
  })
  .server(async (ctx) => {
    const serverTime = new Date();

    return ctx.next({
      sendContext: {
        serverTime,
        durationToServer:
          serverTime.getTime() - ctx.context.clientTime.getTime(),
      },
    });
  });

export const logMiddleware = createMiddleware({ type: 'function' })
  .middleware([preLogMiddleware])
  .client(async (ctx) => {
    const res = await ctx.next();

    const now = new Date();
    console.log('Client Req/Res:', {
      duration: now.getTime() - res.context.clientTime.getTime(),
      durationToServer: res.context.durationToServer,
      durationFromServer: now.getTime() - res.context.serverTime.getTime(),
    });

    return res;
  });
