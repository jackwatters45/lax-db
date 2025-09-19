import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamp } from '../drizzle/types';
import { userTable } from '../user/user.sql';

export const sessionTable = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('session_user_id_idx').on(table.userId),
    index('session_token_idx').on(table.token),
  ],
);

export const accountTable = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verificationTable = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(
      () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: timestamp('updated_at').$defaultFn(
      () => /* @__PURE__ */ new Date(),
    ),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const teamTable = pgTable('team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const teamMemberTable = pgTable('team_member', {
  id: text('id').primaryKey(),
  teamId: text('team_id')
    .notNull()
    .references(() => teamTable.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at'),
});

export const organizationTable = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo: text('logo'),
    createdAt: timestamp('created_at').notNull(),
    metadata: text('metadata'),
  },
  (table) => [index('organization_slug_idx').on(table.slug)],
);

export const memberTable = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => [
    index('member_organization_id_idx').on(table.organizationId),
    index('member_user_id_idx').on(table.userId),
  ],
);

export const invitationTable = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    teamId: text('team_id'),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('invitation_organization_id_idx').on(table.organizationId),
    index('invitation_email_idx').on(table.email),
  ],
);
