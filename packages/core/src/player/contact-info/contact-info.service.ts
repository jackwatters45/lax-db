import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { eq } from 'drizzle-orm';
import { Array as Arr, Effect, Schema } from 'effect';
import { DatabaseLive } from '../../drizzle/drizzle.service';
import { type Player, playerTable } from '../player.sql';
import { PlayerContactInfoError } from './contact-info.error';
import { GetPlayerContactInfoInput } from './contact-info.schema';
import {
  type PlayerContactInfo,
  playerContactInfoTable,
} from './contact-info.sql';

type PlayerWithContactInfoQuery = Pick<Player, 'name'> &
  Omit<
    PlayerContactInfo,
    'publicId' | 'playerId' | 'createdAt' | 'deletedAt' | 'updatedAt'
  > & {
    playerId: string; // player publicId
  };

export class PlayerContactInfoService extends Effect.Service<PlayerContactInfoService>()(
  'PlayerContactInfoService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      return {
        getPlayerWithContactInfo: (input: GetPlayerContactInfoInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(GetPlayerContactInfoInput)(
              input
            );

            const result: PlayerWithContactInfoQuery | undefined = yield* db
              .select({
                playerId: playerTable.publicId,
                name: playerTable.name,
                id: playerContactInfoTable.id,
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
                eq(playerTable.id, playerContactInfoTable.playerId)
              )
              .where(eq(playerTable.id, validated.playerId))
              .limit(1)
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(
                  (cause) => new PlayerContactInfoError({ cause })
                )
              );
            return result || null;
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  }
) {}
