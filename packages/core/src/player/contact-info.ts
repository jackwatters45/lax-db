import { eq } from 'drizzle-orm';
import { Context, Effect, Layer, Runtime, Schema as S } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { DatabaseError, DatabaseLive, DatabaseService } from '../drizzle';
import {
  type PlayerContactInfo,
  playerContactInfoTable,
} from './contact-info.sql';
import { type Player, playerTable } from './player.sql';

export const GetPlayerContactInfoInputSchema = S.Struct({
  playerId: S.Number,
});
export type GetPlayerContactInfoInput =
  typeof GetPlayerContactInfoInputSchema.Type;

export class PlayerContactInfoError extends Error {
  readonly _tag = 'PlayerContactInfoError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Player contact info operation failed');
  }
}

type PlayerWithContactInfoQuery = Pick<Player, 'id' | 'name'> &
  Omit<PlayerContactInfo, 'playerId' | 'createdAt' | 'deletedAt' | 'updatedAt'>;

class PlayerContactInfoService extends Context.Tag('PlayerContactInfoService')<
  PlayerContactInfoService,
  {
    readonly getPlayerWithContactInfo: (
      input: GetPlayerContactInfoInput,
    ) => Effect.Effect<
      PlayerWithContactInfoQuery | null,
      DatabaseError | ParseError
    >;
  }
>() {}

export const PlayerContactInfoServiceLive = Layer.effect(
  PlayerContactInfoService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      getPlayerWithContactInfo: (input: GetPlayerContactInfoInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(GetPlayerContactInfoInputSchema)(
            input,
          );

          const result: PlayerWithContactInfoQuery | undefined =
            yield* Effect.tryPromise({
              try: () =>
                dbService.db
                  .select({
                    id: playerTable.id,
                    publicId: playerTable.publicId,
                    name: playerTable.name,
                    email: playerContactInfoTable.email,
                    phone: playerContactInfoTable.phone,
                    facebook: playerContactInfoTable.facebook,
                    instagram: playerContactInfoTable.instagram,
                    whatsapp: playerContactInfoTable.whatsapp,
                    linkedin: playerContactInfoTable.linkedin,
                    groupme: playerContactInfoTable.groupme,
                    emergencyContactName:
                      playerContactInfoTable.emergencyContactName,
                    emergencyContactPhone:
                      playerContactInfoTable.emergencyContactPhone,
                  })
                  .from(playerTable)
                  .leftJoin(
                    playerContactInfoTable,
                    eq(playerTable.id, playerContactInfoTable.playerId),
                  )
                  .where(eq(playerTable.id, validated.playerId))
                  .limit(1)
                  .then((data) => data.at(0)),
              catch: (error) =>
                new DatabaseError(
                  error,
                  'Failed to get player with contact info',
                ),
            });

          return result || null;
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

const runtime = Runtime.defaultRuntime;

export const PlayerContactInfoAPI = {
  async getPlayerWithContactInfo(input: GetPlayerContactInfoInput) {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerContactInfoService;
      return yield* service.getPlayerWithContactInfo(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerContactInfoServiceLive),
    );
  },
};

export type PlayerWithContactInfo = Awaited<
  ReturnType<typeof PlayerContactInfoAPI.getPlayerWithContactInfo>
>;
export type PlayerWithContactInfoNonNullable =
  NonNullable<PlayerWithContactInfo>;
