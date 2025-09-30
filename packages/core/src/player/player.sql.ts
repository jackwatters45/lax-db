import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../drizzle/types';
import { teamTable } from '../team/team.sql';
import { userTable } from '../user/user.sql';

export const playerTable = pgTable(
  'player',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => userTable.id, {
      onDelete: 'set null',
    }),
    name: text('name'),
    email: text('email'), // For future invitations
    phone: text('phone'),
    dateOfBirth: text('date_of_birth'), // More accurate than age
    // Removed number, position, age - these are now team-specific in teamPlayerTable
    ...timestamps,
  },
  (table) => [
    index('idx_player_name').on(table.name),
    index('idx_player_email').on(table.email),
  ],
);

export type Player = typeof playerTable.$inferSelect;

export const teamPlayerTable = pgTable(
  'team_player',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teamTable.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => playerTable.id, { onDelete: 'cascade' }),
    jerseyNumber: integer('jersey_number'),
    position: text('position'),
    ...timestamps,
  },
  (table) => [
    index('idx_team_player_team').on(table.teamId),
    index('idx_team_player_player').on(table.playerId),
    index('idx_team_player_unique').on(table.teamId, table.playerId),
  ],
);

export type TeamPlayer = typeof teamPlayerTable.$inferSelect;
