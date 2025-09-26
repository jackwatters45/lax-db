import { auth } from '@lax-db/core/auth';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

export const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>()
  .use(cors())
  .use(logger())
  .use(async (c, next) => {
    c.header('Cache-Control', 'no-store');
    return next();
  })
  .use(
    '/api/auth/*', // or replace with "*" to enable cors for all routes
    cors({
      origin: 'http://localhost:3001', // replace with your origin
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      exposeHeaders: ['Content-Length'],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set('user', null);
      c.set('session', null);
      return next();
    }

    c.set('user', session.user);
    c.set('session', session.session);
    return next();
  })
  .on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

  .onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json(
        {
          message: error.message,
        },
        error.status,
      );
    }
    console.error(error);
    // if (error instanceof ZodError) {
    //   const e = (error as ZodError).issues[0]; // no idea why not working with type assertion
    //   if (e) {
    //     return c.json(
    //       {
    //         code: e?.code,
    //         message: e?.message,
    //       },
    //       400,
    //     );
    //   }
    // }
    return c.json(
      {
        code: 'internal',
        message: 'Internal server error',
      },
      500,
    );
  })
  .get('/', async (c) => {
    return c.text('ok');
  })
  .get('/error', async (c) => {
    console.error(new Error('bad error oh no'));
    return c.text('ok');
  });
