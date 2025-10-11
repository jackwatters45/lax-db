// import { Polar } from '@polar-sh/sdk';

import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  admin,
  lastLoginMethod,
  openAPI,
  organization,
} from 'better-auth/plugins';
import { reactStartCookies } from 'better-auth/react-start';
import { Effect } from 'effect';
import { Resource } from 'sst';
import * as authSchema from './auth/auth.sql';
import {
  ac,
  assistantCoach,
  coach,
  headCoach,
  parent,
  player,
} from './auth/permissions';
import { OrganizationService } from './organization';
import {
  invitationTable,
  memberTable,
  organizationTable,
} from './organization/organization.sql';
import { RedisService } from './redis';
import { RuntimeServer } from './runtime.server';
import { teamMemberTable, teamTable } from './team/team.sql';
import { userTable } from './user/user.sql';

// const _polarClient = new Polar({
//   accessToken: process.env.POLAR_ACCESS_TOKEN,
//   // Use 'sandbox' if you're using the Polar Sandbox environment
//   // Remember that access tokens, products, etc. are completely separated between environments.
//   // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
//   server: 'sandbox',
// });

const db = RuntimeServer.runPromise(
  Effect.gen(function* () {
    return yield* PgDrizzle;
  }),
);

export const auth = betterAuth({
  appName: 'Goalbound',
  secret: Resource.BetterAuthSecret.value,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: userTable,
      session: authSchema.sessionTable,
      account: authSchema.accountTable,
      verification: authSchema.verificationTable,
      organization: organizationTable,
      member: memberTable,
      invitation: invitationTable,
      team: teamTable,
      teamMember: teamMemberTable,
      // subscription: authSchema.subscriptionTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
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
      const effect = Effect.gen(function* () {
        const redis = yield* RedisService;
        return yield* redis.get(key);
      });

      return await RuntimeServer.runPromise(effect);
    },
    set: async (key, value, ttl) => {
      const effect = Effect.gen(function* () {
        const redis = yield* RedisService;
        return yield* redis.set(key, value, ttl);
      });

      return await RuntimeServer.runPromise(effect);
    },
    delete: async (key) => {
      const effect = Effect.gen(function* () {
        const redis = yield* RedisService;
        return yield* redis.delete(key);
      });

      return await RuntimeServer.runPromise(effect);
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const effect = Effect.gen(function* () {
            const organization = yield* OrganizationService;
            return yield* organization.getActiveOrganizationId(session.userId);
          });
          const organizationId = await RuntimeServer.runPromise(effect);
          return {
            data: {
              ...session,
              activeOrganizationId: organizationId,
            },
          };
        },
      },
    },
  },
  plugins: [
    // polar({
    //   client: polarClient,
    //   createCustomerOnSignUp: true,
    //   getCustomerCreateParams: async ({ user: _user }, _request) => ({
    //     metadata: {
    //       myCustomProperty: '123',
    //     },
    //   }),
    //   use: [
    //     checkout({
    //       products: [
    //         {
    //           productId: '123-456-789', // ID of Product from Polar Dashboard
    //           slug: 'pro', // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
    //         },
    //       ],
    //       successUrl: '/success?checkout_id={CHECKOUT_ID}',
    //       authenticatedUsersOnly: true,
    //     }),
    //     portal(),
    //     usage(),
    //     webhooks({
    //       secret: process.env.POLAR_WEBHOOK_SECRET!,
    //       // onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
    //       // onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
    //       // ...  // Over 25 granular webhook handlers
    //       // onPayload: (payload) => // Catch-all for all events
    //     }),
    //   ],
    // }),
    admin(),
    organization({
      ac,
      roles: {
        headCoach,
        coach,
        assistantCoach,
        player,
        parent,
      },
      teams: { enabled: true },
      creatorRole: 'headCoach', // Club creator becomes head coach
      allowUserToCreateOrganization: true, // Allow creating new clubs
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invitation/${data.id}`;

        console.log('Invitation email would be sent:', {
          to: data.email,
          subject: `Join ${data.organization.name} on LaxDB`,
          inviteLink,
          clubName: data.organization.name,
          role: data.role,
        });

        // TODO: Implement actual email sending
        // await sendEmail({
        //   to: data.email,
        //   subject: `Join ${data.organization.name} on LaxDB`,
        //   template: "player-invitation",
        //   data: {
        //     inviteLink,
        //     clubName: data.organization.name,
        //     role: data.role,
        //     teamName: data.teamId ? await getTeamName(data.teamId) : null,
        //   },
        // });
      },
    }),
    openAPI(),
    lastLoginMethod(),
    reactStartCookies(), // make sure this is the last plugin in the array
  ],
});
