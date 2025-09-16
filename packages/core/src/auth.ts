import { db } from '@lax-db/core/drizzle/index';
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { reactStartCookies } from 'better-auth/react-start';
import { Resource } from 'sst';
import { client as redis } from './redis';

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: 'sandbox',
});

export const auth = betterAuth({
  appName: 'Goalbound',
  secret: Resource.BetterAuthSecret.value,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      clientId: Resource.GoogleAuthClientId.value,
      clientSecret: Resource.GoogleAuthClientSecret.value,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
    storage: 'secondary-storage',
  },
  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get(key);
      return value ? value : null;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, 'EX', ttl);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      getCustomerCreateParams: async ({ user: _user }, _request) => ({
        metadata: {
          myCustomProperty: '123',
        },
      }),
      use: [
        checkout({
          products: [
            {
              productId: '123-456-789', // ID of Product from Polar Dashboard
              slug: 'pro', // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
          ],
          successUrl: '/success?checkout_id={CHECKOUT_ID}',
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          // onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
          // onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
          // ...  // Over 25 granular webhook handlers
          // onPayload: (payload) => // Catch-all for all events
        }),
      ],
    }),
    openAPI(),
    reactStartCookies(), // make sure this is the last plugin in the array
  ],
});
