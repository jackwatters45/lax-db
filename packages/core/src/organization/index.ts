import { eq } from 'drizzle-orm';
import { Console, Context, Effect, Layer, Runtime, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { auth } from '../auth';
import { sessionTable } from '../auth/auth.sql';
import { DatabaseLive, DatabaseService } from '../drizzle';
import { memberTable, organizationTable } from './organization.sql';

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
    ) => Effect.Effect<Organization, ParseError | OrganizationError>;
    readonly acceptInvitation: (
      input: AcceptInvitationInput,
      headers: Headers,
    ) => Effect.Effect<void, ParseError | OrganizationError>;
    readonly getUserOrganizationContext: (
      headers: Headers,
    ) => Effect.Effect<DashboardData, OrganizationError>;
    readonly getActiveOrganization: (
      userId: string,
    ) => Effect.Effect<Organization, OrganizationError>;
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

          return result as Organization;
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

      // TODO: fix
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
            yield* Console.warn('No session found. Returning default context');
            return yield* Effect.succeed({
              activeOrganization: null,
              teams: [],
              activeMember: null,
              canManageTeams: false,
            });
          }

          const activeOrganization = yield* Effect.tryPromise(() =>
            auth.api.getFullOrganization({ headers }),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new OrganizationError(cause, 'Failed to get organizations'),
            ),
          );

          yield* Console.log({ activeOrganization });

          if (!activeOrganization) {
            return yield* Effect.succeed({
              activeOrganization: null,
              teams: [],
              activeMember: null,
              canManageTeams: false,
            });
          }

          // Better Auth doesn't expose listTeams or getActiveMember APIs yet
          // So we'll implement basic functionality for now and enhance later
          // TODO: what is the point
          const activeMember: OrganizationMember | null = null;

          const teams = yield* Effect.tryPromise(() =>
            auth.api.listOrganizationTeams({ headers }),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new OrganizationError(cause, 'Failed to get organizations'),
            ),
          );

          yield* Console.log({ teams });
          // Assume users who have an organization can manage teams for now
          // This will be refined when Better Auth exposes more granular member APIs
          const canManageTeams = true;

          return yield* Effect.succeed({
            activeOrganization,
            teams: teams || [],
            activeMember,
            canManageTeams,
          });
        }),

      // TODO: fix this bs
      getActiveOrganization: (userId: string) =>
        Effect.gen(function* () {
          return yield* dbService
            .transaction(async (tx) => {
              // First, try to get the active organization from session
              const session = await tx
                .select({
                  activeOrganizationId: sessionTable.activeOrganizationId,
                })
                .from(sessionTable)
                .where(eq(sessionTable.userId, userId))
                .limit(1);

              if (session[0]?.activeOrganizationId) {
                const [org] = await tx
                  .select()
                  .from(organizationTable)
                  .where(
                    eq(organizationTable.id, session[0].activeOrganizationId),
                  )
                  .limit(1);

                if (org) return org as Organization;
              }

              // No active org found, get user's first organization
              const [membership] = await tx
                .select({ organizationId: memberTable.organizationId })
                .from(memberTable)
                .where(eq(memberTable.userId, userId))
                .limit(1);

              if (!membership) {
                throw new OrganizationError(
                  'No organizations found',
                  'No organizations found',
                );
              }

              const [org] = await tx
                .select()
                .from(organizationTable)
                .where(eq(organizationTable.id, membership.organizationId))
                .limit(1);

              if (!org) {
                throw new OrganizationError(
                  'Organization not found',
                  'Organization not found',
                );
              }

              // Set as active organization
              await tx
                .update(sessionTable)
                .set({ activeOrganizationId: org.id, updatedAt: new Date() })
                .where(eq(sessionTable.userId, userId));

              return org as Organization;
            })
            .pipe(
              Effect.mapError((error) => {
                if (error instanceof OrganizationError) {
                  return error;
                }
                return new OrganizationError(
                  error,
                  'Database operation failed',
                );
              }),
            );
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

// Runtime for executing organization operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const OrganizationAPI = {
  async createOrganization(
    input: CreateOrganizationInput,
    headers: Headers,
  ): Promise<Organization> {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.createOrganization(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },

  async acceptInvitation(
    input: AcceptInvitationInput,
    headers: Headers,
  ): Promise<void> {
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

  async getActiveOrganization(userId: string): Promise<Organization> {
    const effect = Effect.gen(function* () {
      const service = yield* OrganizationService;
      return yield* service.getActiveOrganization(userId);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, OrganizationServiceLive),
    );
  },
};

// Types - we'll define these properly later to avoid circular imports
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null;
  metadata?: object | string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DashboardData {
  activeOrganization: Organization | null;
  teams: Team[];
  activeMember: OrganizationMember | null;
  canManageTeams: boolean;
}
