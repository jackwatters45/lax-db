import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { betterAuth, type Session, type User } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  admin,
  lastLoginMethod,
  openAPI,
  organization,
} from 'better-auth/plugins';
import { reactStartCookies } from 'better-auth/react-start';
import { desc, eq } from 'drizzle-orm';
import { Array as Arr, Effect, Layer, ManagedRuntime } from 'effect';
import { Resource } from 'sst';
import { OrganizationMembershipError } from './auth/auth.error';
import {
  ac,
  assistantCoach,
  coach,
  headCoach,
  parent,
  player,
} from './auth/auth.permissions';
import * as authSchema from './auth/auth.sql';
import { DatabaseLive } from './drizzle/drizzle.service';
import { AuthenticationError, DatabaseError } from './error';
import {
  invitationTable,
  memberTable,
  organizationTable,
} from './organization/organization.sql';
import { RedisService } from './redis';
import { teamMemberTable, teamTable } from './team/team.sql';
import { userTable } from './user/user.sql';

// import { Polar } from '@polar-sh/sdk';

// const _polarClient = new Polar({
//   accessToken: process.env.POLAR_ACCESS_TOKEN,
//   // Use 'sandbox' if you're using the Polar Sandbox environment
//   // Remember that access tokens, products, etc. are completely separated between environments.
//   // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
//   server: 'sandbox',
// });
//
//

const runtime = ManagedRuntime.make(
  Layer.mergeAll(RedisService.Default, DatabaseLive)
);

export class AuthService extends Effect.Service<AuthService>()('AuthService', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;
    const redis = yield* RedisService;

    const auth = betterAuth({
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
        get: async (key) => await runtime.runPromise(redis.get(key)),
        set: async (key, value, ttl) =>
          await runtime.runPromise(redis.set(key, value, ttl)),
        delete: async (key) => await runtime.runPromise(redis.delete(key)),
      },
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              const effect = Effect.gen(function* () {
                const sessionFromDb = yield* db
                  .select({
                    activeOrganizationId:
                      authSchema.sessionTable.activeOrganizationId,
                  })
                  .from(authSchema.sessionTable)
                  .where(eq(authSchema.sessionTable.userId, session.userId))
                  .limit(1)
                  .pipe(
                    Effect.flatMap(Arr.head),
                    Effect.tapError(Effect.logError),
                    Effect.mapError(
                      (cause) =>
                        new DatabaseError({
                          message:
                            'Failed to retrieve existing session from database',
                          cause,
                        })
                    )
                  );

                if (sessionFromDb?.activeOrganizationId) {
                  return sessionFromDb?.activeOrganizationId;
                }

                const membership = yield* db
                  .select({ organizationId: memberTable.organizationId })
                  .from(memberTable)
                  .where(eq(memberTable.userId, session.userId))
                  .orderBy(desc(memberTable.createdAt))
                  .limit(1)
                  .pipe(
                    Effect.flatMap(Arr.head),
                    Effect.tapError(Effect.logError),
                    Effect.mapError(
                      (cause) =>
                        new OrganizationMembershipError({
                          message:
                            'Failed to retrieve user organization membership',
                          cause,
                        })
                    )
                  );

                if (!membership) {
                  return null;
                }

                return membership.organizationId;
              });

              const organizationId = await runtime.runPromise(effect);
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
            const _ = await Promise.resolve();
            const _inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invitation/${data.id}`;

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

    return {
      auth, // export base auth
      getSession: (headers: Headers) =>
        Effect.tryPromise(async () => {
          const session: { session: Session; user: User } | null =
            await auth.api.getSession({ headers });

          return session;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AuthenticationError({
                cause,
                message: 'Failed to get session',
              })
          )
        ),
      getSessionOrThrow: (headers: Headers) =>
        Effect.tryPromise(async () => {
          const session: { session: Session; user: User } | null =
            await auth.api.getSession({ headers });

          return session;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AuthenticationError({
                cause,
                message: 'Failed to get session',
              })
          ),
          Effect.filterOrFail(
            (session) => !!session,
            () =>
              new AuthenticationError({
                message: 'Session is not valid',
              })
          )
        ),
      getActiveOrganization: (headers: Headers) =>
        Effect.tryPromise(() => auth.api.getFullOrganization({ headers })).pipe(
          Effect.mapError(
            (cause) =>
              new OrganizationMembershipError({
                message: 'Failed to retrieve active organization from session',
                cause,
              })
          )
        ),
      getActiveOrganizationOrThrow: (headers: Headers) =>
        Effect.tryPromise(() => auth.api.getFullOrganization({ headers })).pipe(
          Effect.mapError(
            (cause) =>
              new OrganizationMembershipError({
                message: 'Failed to retrieve active organization from session',
                cause,
              })
          ),
          Effect.filterOrFail(
            (org) => !!org,
            () =>
              new OrganizationMembershipError({
                message: 'No active organization found for the current session',
              })
          )
        ),
    };
  }),
  dependencies: [DatabaseLive, RedisService.Default],
}) {}
