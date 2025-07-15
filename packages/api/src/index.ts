import { VisibleError } from '@lax-db/core/util/error';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { ZodError } from 'zod';
import { auth } from './auth';


export const app = new Hono()
  .use(cors())
  .use(logger())
  .use(async (c, next) => {
    c.header('Cache-Control', 'no-store');
    return next();
  })
  .use(auth)
  .onError((error, c) => {
    if (error instanceof VisibleError) {
      return c.json(
        {
          code: error.code,
          message: error.message,
        },
        400,
      );
    }
    if (error instanceof HTTPException) {
      return c.json(
        {
          message: error.message,
        },
        error.status,
      );
    }
    console.error(error);
    if (error instanceof ZodError) {
      const e = error.errors[0];
      if (e) {
        return c.json(
          {
            code: e?.code,
            message: e?.message,
          },
          400,
        );
      }
    }
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

  