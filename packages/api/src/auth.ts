import { User } from '@lax-db/core/user/index';
import { useActor, withActor } from '@lax-db/core/util/actor';
import { VisibleError } from '@lax-db/core/util/error';
import { subjects } from '@lax-db/functions/src/auth/subjects';
import { createClient } from '@openauthjs/openauth/client';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Resource } from 'sst';

const client = createClient({
  issuer: Resource.Auth.url,
  clientID: 'console',
});

export const notPublic: MiddlewareHandler = async (_c, next) => {
  const actor = useActor();
  if (actor.type === 'public')
    throw new HTTPException(401, { message: 'Unauthorized' });
  return next();
};

export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader =
    c.req.query('authorization') ?? c.req.header('authorization');
  if (!authHeader) return withActor({ type: 'public', properties: {} }, next);
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    throw new VisibleError(
      'authentication',
      'auth.token',
      'Bearer token not found or improperly formatted',
    );
  }
  const bearerToken = match[1];
  const result = await client.verify(subjects, bearerToken!);

  if (result.err) {
    console.error(result.err);
    throw new HTTPException(401, {
      message: `Unauthorized: ${result.err.message}`,
    });
  }

  if (result.subject.type === 'account') {
    const workspaceID =
      c.req.header('x-sst-workspace') || c.req.query('workspaceID');

    if (!workspaceID)
      return withActor(
        {
          type: 'account',
          properties: {
            accountID: result.subject.properties.id,
            email: result.subject.properties.email,
          },
        },
        next,
      );
    const email = result.subject.properties.email;
    return withActor(
      {
        type: 'system',
        properties: {
          workspaceID,
        },
      },
      async () => {
        const users = await User.fromEmail({ email });
        const user = users[0];
        if (!user || user.timeDeleted) {
          c.status(401);
          return c.text('Unauthorized: User not found');
        }
        return withActor(
          {
            type: 'user',
            properties: { userID: user.id, workspaceID },
          },
          next,
        );
      },
    );
  }
};
