import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import type { Member } from 'better-auth/plugins/organization';
import { desc, eq } from 'drizzle-orm';
import { Array as Arr, Effect, Schema } from 'effect';
import { auth } from '../auth';
import { sessionTable } from '../auth/auth.sql';
import { DatabaseLive } from '../drizzle';
import { OrganizationError } from './organization.error';
import {
  AcceptInvitationInput,
  CreateOrganizationInput,
  type DashboardData,
} from './organization.schema';
import { memberTable } from './organization.sql';

export class OrganizationService extends Effect.Service<OrganizationService>()(
  'OrganizationService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      return {
        createOrganization: (
          input: CreateOrganizationInput,
          headers: Headers,
        ) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(CreateOrganizationInput)(
              input,
            );

            yield* Effect.tryPromise(() =>
              auth.api.checkOrganizationSlug({
                body: {
                  slug: validated.slug,
                },
              }),
            ).pipe(
              Effect.tapError((err) => Effect.logError(err)),
              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage: 'Slug is not available',
                  }),
              ),
            );

            const result = yield* Effect.tryPromise(() =>
              auth.api.createOrganization({
                headers,
                body: {
                  name: validated.name,
                  slug: validated.slug,
                },
              }),
            ).pipe(
              Effect.tapError((err) => Effect.logError(err)),
              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage: 'Failed to create organization',
                  }),
              ),
            );

            const organizationId = result?.id;
            if (!organizationId) {
              yield* Effect.fail(
                new OrganizationError({
                  customMessage: 'Failed to create organization',
                }),
              );
            }

            yield* Effect.tryPromise(() =>
              auth.api.setActiveOrganization({
                headers,
                body: {
                  organizationId,
                },
              }),
            ).pipe(
              Effect.tapError((err) => Effect.logError(err)),

              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage:
                      'Organization created but failed to set as active',
                  }),
              ),
            );

            const teams = yield* Effect.tryPromise(() =>
              auth.api.listOrganizationTeams({
                headers,
                query: {
                  organizationId,
                },
              }),
            ).pipe(
              Effect.tapError((err) => Effect.logError(err)),

              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage:
                      'Organization created but failed to get default team',
                  }),
              ),
            );

            const team = teams.find((t) => t.organizationId === organizationId);
            if (!team) {
              return yield* Effect.fail(
                new OrganizationError({
                  customMessage:
                    'Organization created but no default team found',
                }),
              );
            }

            return { teamId: team.id };
          }),

        acceptInvitation: (input: AcceptInvitationInput, headers: Headers) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(AcceptInvitationInput)(
              input,
            );

            yield* Effect.tryPromise(() =>
              auth.api.acceptInvitation({
                headers,
                body: {
                  invitationId: validated.invitationId,
                },
              }),
            ).pipe(
              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage: 'Failed to accept invitation',
                  }),
              ),
            );
          }),

        getUserOrganizationContext: (headers: Headers) =>
          Effect.gen(function* () {
            const session = yield* Effect.tryPromise(() =>
              auth.api.getSession({ headers }),
            ).pipe(
              Effect.mapError(
                () =>
                  new OrganizationError({
                    customMessage: 'Failed to get session',
                  }),
              ),
            );

            if (!session?.user) {
              throw new OrganizationError({
                customMessage: 'User not authenticated',
              });
            }

            const [activeOrganization, teams] = yield* Effect.all(
              [
                Effect.tryPromise(() =>
                  auth.api.getFullOrganization({ headers }),
                ).pipe(
                  Effect.mapError(
                    () =>
                      new OrganizationError({
                        customMessage: 'Failed to get active organization',
                      }),
                  ),
                ),
                Effect.tryPromise(() =>
                  auth.api.listOrganizationTeams({ headers }),
                ).pipe(
                  Effect.mapError(
                    () =>
                      new OrganizationError({
                        customMessage: 'Failed to get teams',
                      }),
                  ),
                ),
              ],
              { concurrency: 'unbounded' },
            );

            if (!activeOrganization) {
              throw new OrganizationError({
                customMessage: 'User has no active organization',
              });
            }

            // Get members for all teams concurrently
            const teamsWithMembers = yield* Effect.all(
              teams.map((team) =>
                Effect.tryPromise(() =>
                  auth.api.listTeamMembers({
                    headers,
                    query: {
                      teamId: team.id,
                    },
                  }),
                ).pipe(
                  Effect.mapError((cause) => {
                    // If the user is not a member of the team, return empty array
                    // This can happen right after creating a team
                    const errorMessage = cause?.toString() || '';
                    if (errorMessage.includes('not a member of the team')) {
                      console.warn(`User not a member of team ${team.id} yet`);
                      return null; // Will be handled by orElse below
                    }
                    return new OrganizationError({
                      customMessage: 'Failed to get team members',
                    });
                  }),
                  Effect.orElse(() => Effect.succeed([])), // Return empty array on error
                  Effect.map((members) => ({ ...team, members })),
                ),
              ),
              { concurrency: 'unbounded' },
            );

            // Better Auth doesn't expose listTeams or getActiveMember APIs yet
            // So we'll implement basic functionality for now and enhance later
            const activeMember: Member | null = null;

            // Assume users who have an organization can manage teams for now
            // This will be refined when Better Auth exposes more granular member APIs
            const canManageTeams = true;

            return {
              activeOrganization,
              teams: teamsWithMembers,
              activeMember,
              canManageTeams,
            } satisfies DashboardData;
          }),

        getActiveOrganizationId: (userId: string) =>
          Effect.gen(function* () {
            // First, try to get the active organization from session
            const session = yield* db
              .select({
                activeOrganizationId: sessionTable.activeOrganizationId,
              })
              .from(sessionTable)
              .where(eq(sessionTable.userId, userId))
              .limit(1)
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError((err) => Effect.logError(err)),
                Effect.mapError(() => new OrganizationError()),
              );

            if (session?.activeOrganizationId) {
              return session?.activeOrganizationId;
            }

            // No active org found, get user's first organization
            const membership = yield* db
              .select({ organizationId: memberTable.organizationId })
              .from(memberTable)
              .where(eq(memberTable.userId, userId))
              .orderBy(desc(memberTable.createdAt))
              .limit(1)
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError((err) => Effect.logError(err)),
                Effect.mapError(() => new OrganizationError()),
              );

            if (!membership) {
              return null;
            }

            return membership.organizationId;
          }),
      };
    }),
    dependencies: [DatabaseLive],
  },
) {}
