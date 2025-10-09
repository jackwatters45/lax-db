import type { Team, TeamMember } from 'better-auth/plugins';
import { Context, Effect, Layer, Runtime, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { auth } from '../auth';

// Input schemas - simplified since auth.api handles session automatically
export const CreateTeamInput = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
});
type CreateTeamInput = typeof CreateTeamInput.Type;

export const UpdateTeamInput = Schema.Struct({
  teamId: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
});
type UpdateTeamInput = typeof UpdateTeamInput.Type;

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
  teamId: Schema.optional(Schema.String),
});
type InvitePlayerInput = typeof InvitePlayerInput.Type;

export const RemoveTeamMemberInput = Schema.Struct({
  teamId: Schema.String,
  userId: Schema.String,
});
type RemoveTeamMemberInput = typeof RemoveTeamMemberInput.Type;

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
    readonly updateTeam: (
      input: UpdateTeamInput,
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
  }
>() {}

// Teams Service Implementation
export const TeamsServiceLive = Layer.succeed(TeamsService, {
  createTeam: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(CreateTeamInput)(input);

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

      const activeOrganization = yield* Effect.tryPromise(() =>
        auth.api.getFullOrganization({ headers }),
      ).pipe(
        Effect.mapError(
          (cause) => new TeamsError(cause, 'Active organization not found'),
        ),
      );

      if (!activeOrganization) {
        return yield* Effect.fail(
          new TeamsError(null, 'No active organization found for user'),
        );
      }

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

      return result;
    }),

  updateTeam: (input, headers) =>
    Effect.gen(function* () {
      const validated = yield* Schema.decode(UpdateTeamInput)(input);

      const result = yield* Effect.tryPromise(() => {
        return auth.api.updateTeam({
          headers,
          body: {
            teamId: validated.teamId,
            data: {
              name: validated.name,
            },
          },
        });
      }).pipe(
        Effect.mapError((cause) => {
          console.error('Update team error details:', cause);
          return new TeamsError(cause, 'Failed to update team');
        }),
      );

      if (!result) {
        return yield* Effect.fail(
          new TeamsError(null, 'Failed to update team'),
        );
      }

      return result;
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
        Effect.mapError((cause) => {
          // If the user is not a member of the team, return empty array
          // This can happen right after creating a team
          const errorMessage = cause?.toString() || '';
          if (errorMessage.includes('not a member of the team')) {
            console.warn(`User not a member of team ${validated.teamId} yet`);
            return null; // Will be handled by orElse below
          }
          return new TeamsError(cause, 'Failed to get team members');
        }),
        Effect.orElse(() => Effect.succeed([])), // Return empty array on error
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

  async updateTeam(input: UpdateTeamInput, headers: Headers): Promise<Team> {
    const effect = Effect.gen(function* () {
      const service = yield* TeamsService;
      return yield* service.updateTeam(input, headers);
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
};
