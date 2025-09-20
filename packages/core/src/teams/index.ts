import { Context, Effect, Layer, Runtime, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { auth } from '../auth';

// Input schemas - simplified since auth.api handles session automatically
export const CreateTeamInput = Schema.Struct({
  name: Schema.String,
});
type CreateTeamInput = typeof CreateTeamInput.Type;

export const DeleteTeamInput = Schema.Struct({
  teamId: Schema.String,
});
type DeleteTeamInput = typeof DeleteTeamInput.Type;

export const GetTeamMembersInput = Schema.Struct({
  teamId: Schema.String,
});
type GetTeamMembersInput = typeof GetTeamMembersInput.Type;

export const InvitePlayerInput = Schema.Struct({
  email: Schema.String,
  role: Schema.Literal('player'),
  teamId: Schema.String.pipe(Schema.optional),
});
type InvitePlayerInput = typeof InvitePlayerInput.Type;

export const RemoveTeamMemberInput = Schema.Struct({
  teamId: Schema.String,
  userId: Schema.String,
});
type RemoveTeamMemberInput = typeof RemoveTeamMemberInput.Type;

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
export class TeamsError extends Error {
  readonly _tag = 'TeamsError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Teams operation failed');
  }
}

// Teams Service
export class TeamsService extends Context.Tag('TeamsService')<
  TeamsService,
  {
    readonly createTeam: (
      input: CreateTeamInput,
      headers: Headers,
    ) => Effect.Effect<Team, ParseError | TeamsError>;
    readonly deleteTeam: (
      input: DeleteTeamInput,
      headers: Headers,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly getTeamMembers: (
      input: GetTeamMembersInput,
      headers: Headers,
    ) => Effect.Effect<TeamMember[], ParseError | TeamsError>;
    readonly invitePlayer: (
      input: InvitePlayerInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly removeTeamMember: (
      input: RemoveTeamMemberInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly createOrganization: (
      input: CreateOrganizationInput,
      headers: Headers,
    ) => Effect.Effect<Organization, ParseError | TeamsError>;
    readonly acceptInvitation: (
      input: AcceptInvitationInput,
      headers: Headers,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly getUserOrganizationContext: (
      headers: Headers,
    ) => Effect.Effect<DashboardData, TeamsError>;
  }
>() {}

// Teams Service Implementation
export const TeamsServiceLive = Layer.succeed(TeamsService, {
  createTeam: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(CreateTeamInput)(input);

      // First get the user session to get organization context
      const session = yield* Effect.tryPromise(() =>
        auth.api.getSession({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get session'),
        ),
      );

      if (!session?.user) {
        return yield* Effect.fail(
          new TeamsError(null, 'User not authenticated'),
        );
      }

      // Get user's organizations to find active organization
      const organizations = yield* Effect.tryPromise(() =>
        auth.api.listOrganizations({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get organizations'),
        ),
      );

      if (!organizations || organizations.length === 0) {
        return yield* Effect.fail(
          new TeamsError(null, 'No organization found for user'),
        );
      }

      const activeOrganization = organizations[0];
      if (!activeOrganization) {
        return yield* Effect.fail(
          new TeamsError(null, 'Active organization not found'),
        );
      }

      // Ensure the user's organization is active (safety measure for multi-org users)
      yield* Effect.tryPromise(() =>
        auth.api.setActiveOrganization({
          headers,
          body: {
            organizationId: activeOrganization.id,
          },
        }),
      ).pipe(
        Effect.mapError((cause) => {
          console.error('Failed to set active organization:', cause);
          return new TeamsError(cause, 'Failed to set active organization');
        }),
      );

      // Now create the team with Better Auth API
      const result = yield* Effect.tryPromise(() => {
        return auth.api.createTeam({
          headers,
          body: {
            name: validated.name,
          },
        });
      }).pipe(
        Effect.mapError((cause) => {
          console.error('Create team error details:', cause);
          return new TeamsError(cause, 'Failed to create team');
        }),
      );

      return result as Team;
    }),

  deleteTeam: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(DeleteTeamInput)(input);

      yield* Effect.tryPromise(() =>
        auth.api.removeTeam({
          headers,
          body: {
            teamId: validated.teamId,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to delete team'),
        ),
      );
    }),

  getTeamMembers: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(GetTeamMembersInput)(input);

      const result = yield* Effect.tryPromise(() =>
        auth.api.listTeamMembers({
          headers,
          query: {
            teamId: validated.teamId,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get team members'),
        ),
      );

      return (result || []) as TeamMember[];
    }),

  invitePlayer: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(InvitePlayerInput)(input);

      yield* Effect.tryPromise(() =>
        auth.api.createInvitation({
          body: {
            email: validated.email,
            role: validated.role,
            teamId: validated.teamId,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to invite player'),
        ),
      );
    }),

  removeTeamMember: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(RemoveTeamMemberInput)(input);

      yield* Effect.tryPromise(() =>
        auth.api.removeTeamMember({
          body: {
            teamId: validated.teamId,
            userId: validated.userId,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to remove team member'),
        ),
      );
    }),

  createOrganization: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(CreateOrganizationInput)(input);

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
          return new TeamsError(cause, 'Failed to create organization');
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
            console.error('Failed to set new organization as active:', cause);
            // Don't fail the whole operation if setting active fails
            return new TeamsError(
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
          (cause) => new TeamsError(cause, 'Failed to accept invitation'),
        ),
      );
    }),

  getUserOrganizationContext: (headers) =>
    Effect.gen(function* () {
      // Get user session first
      const session = yield* Effect.tryPromise(() =>
        auth.api.getSession({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get session'),
        ),
      );

      if (!session?.user) {
        return yield* Effect.succeed({
          activeOrganization: null,
          teams: [],
          activeMember: null,
          canManageTeams: false,
        });
      }

      // Get user's organizations
      const organizations = yield* Effect.tryPromise(() =>
        auth.api.listOrganizations({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get organizations'),
        ),
      );

      if (!organizations || organizations.length === 0) {
        return yield* Effect.succeed({
          activeOrganization: null,
          teams: [],
          activeMember: null,
          canManageTeams: false,
        });
      }

      const activeOrganization = organizations[0];

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
      const activeMember: OrganizationMember | null = null;

      const teams = yield* Effect.tryPromise(() =>
        auth.api.listUserTeams({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to get organizations'),
        ),
      );
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
});

// Runtime for executing teams operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const TeamsAPI = {
  async createTeam(input: CreateTeamInput, headers: Headers): Promise<Team> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.createTeam(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async deleteTeam(input: DeleteTeamInput, headers: Headers): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.deleteTeam(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async getTeamMembers(
    input: GetTeamMembersInput,
    headers: Headers,
  ): Promise<TeamMember[]> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.getTeamMembers(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async invitePlayer(input: InvitePlayerInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.invitePlayer(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async removeTeamMember(input: RemoveTeamMemberInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.removeTeamMember(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async createOrganization(
    input: CreateOrganizationInput,
    headers: Headers,
  ): Promise<Organization> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.createOrganization(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async acceptInvitation(
    input: AcceptInvitationInput,
    headers: Headers,
  ): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.acceptInvitation(input, headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async getUserOrganizationContext(headers: Headers): Promise<DashboardData> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.getUserOrganizationContext(headers);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },
};

// Types - inferred from Better Auth
export type Team = typeof auth.$Infer.Team;
export type TeamMember = typeof auth.$Infer.TeamMember;
export type Organization = typeof auth.$Infer.Organization;
export type OrganizationMember = typeof auth.$Infer.Member;
export type Invitation = typeof auth.$Infer.Invitation;

export interface DashboardData {
  activeOrganization: Organization | null;
  teams: Team[];
  activeMember: OrganizationMember | null;
  canManageTeams: boolean;
}
