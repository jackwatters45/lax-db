import type { TeamMember } from 'better-auth/plugins';
import { Effect, Schema } from 'effect';
import { AuthService } from '../auth';
import { DatabaseLive } from '../drizzle';
import { TeamError } from './team.error';
import {
  CreateTeamInput,
  DeleteTeamInput,
  GetTeamMembersInput,
  InvitePlayerInput,
  RemoveTeamMemberInput,
  UpdateTeamInput,
} from './team.schema';

// Teams Service
export class TeamService extends Effect.Service<TeamService>()('TeamService', {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      createTeam: (input: CreateTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(CreateTeamInput)(input);

          const session = yield* Effect.tryPromise(() =>
            auth.auth.api.getSession({ headers }),
          ).pipe(
            Effect.mapError(
              () => new TeamError({ customMessage: 'Failed to get session' }),
            ),
          );

          if (!session?.user) {
            return yield* Effect.fail(
              new TeamError({ customMessage: 'User not authenticated' }),
            );
          }

          const activeOrganization = yield* Effect.tryPromise(() =>
            auth.auth.api.getFullOrganization({ headers }),
          ).pipe(
            Effect.mapError(
              () =>
                new TeamError({
                  customMessage: 'Active organization not found',
                }),
            ),
          );

          if (!activeOrganization) {
            return yield* Effect.fail(
              new TeamError({
                customMessage: 'No active organization found for user',
              }),
            );
          }

          const result = yield* Effect.tryPromise(() => {
            return auth.auth.api.createTeam({
              headers,
              body: {
                name: validated.name,
              },
            });
          }).pipe(
            Effect.mapError(
              () => new TeamError({ customMessage: 'Failed to create team' }),
            ),
          );

          return result;
        }),

      updateTeam: (input: UpdateTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(UpdateTeamInput)(input);

          const result = yield* Effect.tryPromise(() => {
            return auth.auth.api.updateTeam({
              headers,
              body: {
                teamId: validated.teamId,
                data: {
                  name: validated.name,
                },
              },
            });
          }).pipe(
            Effect.mapError(
              () => new TeamError({ customMessage: 'Failed to update team' }),
            ),
          );

          if (!result) {
            return yield* Effect.fail(
              new TeamError({ customMessage: 'Failed to update team' }),
            );
          }

          return result;
        }),

      deleteTeam: (input: DeleteTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(DeleteTeamInput)(input);

          yield* Effect.tryPromise(() =>
            auth.auth.api.removeTeam({
              headers,
              body: {
                teamId: validated.teamId,
              },
            }),
          ).pipe(
            Effect.mapError(
              () => new TeamError({ customMessage: 'Failed to delete team' }),
            ),
          );
        }),

      getTeamMembers: (input: GetTeamMembersInput, headers: Headers) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(GetTeamMembersInput)(input);

          const result = yield* Effect.tryPromise(() =>
            auth.auth.api.listTeamMembers({
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
                console.warn(
                  `User not a member of team ${validated.teamId} yet`,
                );
                return null; // Will be handled by orElse below
              }
              return new TeamError({
                customMessage: 'Failed to get team members',
              });
            }),
            Effect.orElse(() => Effect.succeed([])), // Return empty array on error
          );

          return (result || []) as TeamMember[];
        }),

      invitePlayer: (input: InvitePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(InvitePlayerInput)(input);

          yield* Effect.tryPromise(() =>
            auth.auth.api.createInvitation({
              body: {
                email: validated.email,
                role: validated.role,
                teamId: validated.teamId,
              },
            }),
          ).pipe(
            Effect.mapError(
              () => new TeamError({ customMessage: 'Failed to invite player' }),
            ),
          );
        }),

      removeTeamMember: (input: RemoveTeamMemberInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(RemoveTeamMemberInput)(input);

          yield* Effect.tryPromise(() =>
            auth.auth.api.removeTeamMember({
              body: {
                teamId: validated.teamId,
                userId: validated.userId,
              },
            }),
          ).pipe(
            Effect.mapError(
              () =>
                new TeamError({
                  customMessage: 'Failed to remove team member',
                }),
            ),
          );
        }),
    };
  }),
  dependencies: [DatabaseLive, AuthService.Default],
}) {}
