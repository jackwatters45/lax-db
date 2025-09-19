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
class TeamsService extends Context.Tag('TeamsService')<
  TeamsService,
  {
    readonly createTeam: (
      input: CreateTeamInput,
    ) => Effect.Effect<Team, ParseError | TeamsError>;
    readonly deleteTeam: (
      input: DeleteTeamInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly getTeamMembers: (
      input: GetTeamMembersInput,
    ) => Effect.Effect<TeamMember[], ParseError | TeamsError>;
    readonly invitePlayer: (
      input: InvitePlayerInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly removeTeamMember: (
      input: RemoveTeamMemberInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly createOrganization: (
      input: CreateOrganizationInput,
    ) => Effect.Effect<Organization, ParseError | TeamsError>;
    readonly acceptInvitation: (
      input: AcceptInvitationInput,
    ) => Effect.Effect<void, ParseError | TeamsError>;
    readonly getDashboardData: () => Effect.Effect<DashboardData, TeamsError>;
  }
>() {}

// Teams Service Implementation
export const TeamsServiceLive = Layer.succeed(TeamsService, {
  createTeam: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(CreateTeamInput)(input);

      const result = yield* Effect.tryPromise(() =>
        auth.api.createTeam({
          body: {
            name: validated.name,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to create team'),
        ),
      );

      return result as Team;
    }),

  deleteTeam: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(DeleteTeamInput)(input);

      yield* Effect.tryPromise(() =>
        auth.api.removeTeam({
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

  getTeamMembers: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(GetTeamMembersInput)(input);

      const result = yield* Effect.tryPromise(() =>
        auth.api.listTeamMembers({
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

  createOrganization: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(CreateOrganizationInput)(input);

      const result = yield* Effect.tryPromise(() =>
        auth.api.createOrganization({
          body: {
            name: validated.name,
            slug: validated.slug,
          },
        }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Failed to create organization'),
        ),
      );

      return result as Organization;
    }),

  acceptInvitation: (input) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(AcceptInvitationInput)(input);

      yield* Effect.tryPromise(() =>
        auth.api.acceptInvitation({
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

  getDashboardData: () =>
    Effect.gen(function* () {
      // TODO: Implement proper session-based data fetching
      return yield* Effect.succeed({
        activeOrganization: null,
        teams: [],
        activeMember: null,
        canManageTeams: false,
      });
    }),
});

// Runtime for executing teams operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const TeamsAPI = {
  async createTeam(input: CreateTeamInput): Promise<Team> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.createTeam(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async deleteTeam(input: DeleteTeamInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.deleteTeam(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async getTeamMembers(input: GetTeamMembersInput): Promise<TeamMember[]> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.getTeamMembers(input);
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
  ): Promise<Organization> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.createOrganization(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async acceptInvitation(input: AcceptInvitationInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.acceptInvitation(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, TeamsServiceLive),
    );
  },

  async getDashboardData(): Promise<DashboardData> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.getDashboardData();
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
