import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { eq } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../../drizzle/drizzle.service';
import { playerTable } from '../player.sql';
import type { GetPlayerContactInfoInput } from './contact-info.schema';
import { playerContactInfoTable } from './contact-info.sql';

type PlayerWithContactInfoQuery = {
  playerId: string;
  name: string | null;
  id: number;
  email: string | null;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  groupme: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

export class ContactInfoRepo extends Effect.Service<ContactInfoRepo>()(
  'ContactInfoRepo',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      return {
        getPlayerWithContactInfo: (input: GetPlayerContactInfoInput) =>
          db
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
              emergencyContactName: playerContactInfoTable.emergencyContactName,
              emergencyContactPhone:
                playerContactInfoTable.emergencyContactPhone,
            })
            .from(playerTable)
            .leftJoin(
              playerContactInfoTable,
              eq(playerTable.id, playerContactInfoTable.playerId)
            )
            .where(eq(playerTable.id, input.playerId))
            .limit(1)
            .pipe(
              Effect.flatMap(Arr.head),
              Effect.tapError(Effect.logError),
              Effect.map((result): PlayerWithContactInfoQuery | null => {
                if (!result || result.id === null) {
                  return null;
                }
                return result as PlayerWithContactInfoQuery;
              })
            ),
      } as const;
    }),
    dependencies: [DatabaseLive],
  }
) {}
