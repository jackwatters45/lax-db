import { User } from '@lax-db/core/user/index';
import { issuer } from '@openauthjs/openauth';
import { GoogleOidcProvider } from '@openauthjs/openauth/provider/google';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { Select } from '@openauthjs/openauth/ui/select';
import type { Theme } from '@openauthjs/openauth/ui/theme';
import { handle } from 'hono/aws-lambda';
import { subjects } from './subjects';

const storage = DynamoStorage({
  table: 'my-table',
  pk: 'pk',
  sk: 'sk',
});

const MY_THEME: Theme = {
  title: 'LaxDB',
  radius: 'none',
  primary: {
    light: '#09090b',
    dark: '#fafafa',
  },
  background: {
    light: '#fafafa',
    dark: '#09090b',
  },
};

const getUser = async (email: string) => await User.fromEmail(email);

const app = issuer({
  theme: MY_THEME,
  subjects,
  storage: storage,
  allow: async () => true,
  select: Select({
    providers: {
      google: {
        display: 'Google',
      },
    },
  }),
  providers: {
    google: GoogleOidcProvider({
      // TODO:
      clientID: 'Resource.GoogleAuthClientId.value',
      scopes: ['email', 'openid'],
    }),
  },
  success: async (ctx, value) => {
    if (value.provider === 'google') {
      const email = value.id.email as string;
      const user = await getUser(email);
      if (!user) {
        const id = await User.create({
          email,
          name: null,
        });
        return ctx.subject('user', { id: id });
      }
      return ctx.subject('user', { id: user.id });
    }

    throw new Error('Invalid provider');
  },
});

export const handler = handle(app);
