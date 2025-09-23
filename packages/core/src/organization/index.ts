import type {
  Member,
  Organization,
  Team,
  TeamMember,
} from 'better-auth/plugins/organization';
import { desc, eq } from 'drizzle-orm';
import { Context, Effect, Layer, Runtime, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { auth } from '../auth';
import { sessionTable } from '../auth/auth.sql';
import { type DatabaseError, DatabaseLive, DatabaseService } from '../drizzle';
import { memberTable } from './organization.sql';

// Input schemas
export const CreateOrganizationInput = Schema.Struct({
  name: Schema.String,
  slug: Schema.String,
});
type CreateOrganizationInput = typeof CreateOrganizationInput.Type;

export const AcceptInvitationInput = Schema.Struct({
  invitationId: Schema.String,
});
type AcceptInvitationInput = typeof AcceptInvitationInput.Type;

// Error classes
export class OrganizationError extends Error {
  readonly _tag = 'OrganizationError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Organization operation failed');
  }
}

// Organization Service
export class OrganizationService extends Context.Tag('OrganizationService')<
  OrganizationService,
  {
    readonly createOrganization: (
      input: CreateOrganizationInput,
      headers: Headers,
    ) => Effect.Effect<void, ParseError | OrganizationError>;
    readonly acceptInvitation: (
      input: AcceptInvitationInput,
      headers: Headers,
    ) => Effect.Effect<void, ParseError | OrganizationError>;
    readonly getUserOrganizationContext: (
      headers: Headers,
    ) => Effect.Effect<DashboardData, OrganizationError>;
    readonly getActiveOrganizationId: (
      userId: string,
    ) => Effect.Effect<string | null, OrganizationError | DatabaseError>;
  }
>() {}

// Organization Service Implementation
export const OrganizationServiceLive = Layer.effect(
  OrganizationService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      createOrganization: (input, headers) =>
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
            Effect.mapError((cause) => {
              console.error('Check organization slug error details:', cause);
              return new OrganizationError(cause, 'Slug is not available');
            }),
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
            Effect.mapError((cause) => {
              console.error('Create organization error details:', cause);
              return new OrganizationError(
                cause,
                'Failed to create organization',
              );
            }),
          );

          // Set the newly created organization as the active one
          if (result?.id) {
            yield* Effect.tryPromise(() =>
              auth.api.setActiveOrganization({
                headers,
                body: {
                  organizationId: result.id,
                },
              }),
            ).pipe(
              Effect.mapError((cause) => {
                console.error(
                  'Failed to set new organization as active:',
                  cause,
                );
                // Don't fail the whole operation if setting active fails
                return new OrganizationError(
                  cause,
                  'Organization created but failed to set as active',
                );
              }),
              Effect.orElse(() => Effect.succeed(null)), // Continue even if this fails
            );
          }
        }),

      acceptInvitation: (input, headers) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(AcceptInvitationInput)(input);

          yield* Effect.tryPromise(() =>
            auth.api.acceptInvitation({
              headers,
              body: {
                invitationId: validated.invitationId,
              },
            }),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new OrganizationError(cause, 'Failed to accept invitation'),
            ),
          );
        }),

      getUserOrganizationContext: (headers) =>
        Effect.gen(function* () {
          const session = yield* Effect.tryPromise(() =>
            auth.api.getSession({ headers }),
          ).pipe(
            Effect.mapError(
              (cause) => new OrganizationError(cause, 'Failed to get session'),
            ),
          );

          if (!session?.user) {
            throw new OrganizationError(
              'No user session',
              'User not authenticated',
            );
          }

          const [activeOrganization, teams] = yield* Effect.all(
            [
              Effect.tryPromise(() =>
                auth.api.getFullOrganization({ headers }),
              ).pipe(
                Effect.mapError(
                  (cause) =>
                    new OrganizationError(
                      cause,
                      'Failed to get active organization',
                    ),
                ),
              ),
              Effect.tryPromise(() =>
                auth.api.listOrganizationTeams({ headers }),
              ).pipe(
                Effect.mapError(
                  (cause) =>
                    new OrganizationError(cause, 'Failed to get teams'),
                ),
              ),
            ],
            { concurrency: 'unbounded' },
          );

          if (!activeOrganization) {
            throw new OrganizationError(
              'No active organization',
              'User has no active organization',
            );
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
                  return new OrganizationError(
                    cause,
                    'Failed to get team members',
                  );
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
          return yield* dbService.transaction(async (tx) => {
            // First, try to get the active organization from session
            const session = await tx
              .select({
                activeOrganizationId: sessionTable.activeOrganizationId,
              })
              .from(sessionTable)
              .where(eq(sessionTable.userId, userId))
              .limit(1)
              .then((result) => result.at(0));

            if (session?.activeOrganizationId) {
              return session?.activeOrganizationId;
            }

            // No active org found, get user's first organization
            const membership = await tx
              .select({ organizationId: memberTable.organizationId })
              .from(memberTable)
              .where(eq(memberTable.userId, userId))
              .orderBy(desc(memberTable.createdAt))
              .limit(1)
              .then((result) => result.at(0));

            if (!membership) {
              return null;
            }

            return membership.organizationId;
          });
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

// Runtime for executing organization operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const OrganizationAPI = {
  async createOrganization(input: CreateOrganizationInput, headers: Headers) {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.createOrganization(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },

  async acceptInvitation(input: AcceptInvitationInput, headers: Headers) {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.acceptInvitation(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },

  async getUserOrganizationContext(headers: Headers): Promise<DashboardData> {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.getUserOrganizationContext(headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },

  async getActiveOrganizationId(userId: string): Promise<string | null> {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.getActiveOrganizationId(userId);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },

  async hasActiveOrganization(userId: string): Promise<boolean> {
    try {
      await this.getActiveOrganizationId(userId);
      return true;
    } catch (error) {
      if (
        error instanceof OrganizationError &&
        error.message.includes('No organizations found')
      ) {
        return false;
      }
      throw error; // Re-throw other errors
    }
  },
};

// Dashboard-specific type
export interface DashboardData {
  activeOrganization: Organization;
  teams: (Team & { members: TeamMember[] })[];
  activeMember: Member | null;
  canManageTeams: boolean;
}
