import { sql } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, pgEnum, primaryKey, bigint, unique, check, boolean, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const teamRolesEnum = pgEnum('team_roles', ['owner', 'member']);

export const teams = pgTable('teams', {
	id: uuid('id').primaryKey().unique().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').notNull()
});

export type Teams = typeof teams.$inferSelect;

export const teamMembers = pgTable('team_members', {
	teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	role: teamRolesEnum('role').notNull(),
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.teamId, table.userId] }),
	}
});

export type TeamMembers = typeof teamMembers.$inferSelect;

export const teamInvites = pgTable('team_invites', {
	teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	role: teamRolesEnum('role').notNull(),
	createdAt: timestamp('created_at').notNull()
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.teamId, table.userId] }),
	}
});

export type TeamInvites = typeof teamInvites.$inferSelect;

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom().unique(),
	name: text('name').notNull(),
	description: text('description'),
	teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
	ownerId: text('owner_id').references(() => user.id, { onDelete: 'cascade' }),
	isPublic: boolean('is_public').notNull().default(false),
	createdAt: timestamp('created_at').notNull()
}, () => {
	return {
		check: check("one-out-of-two_check", sql`team_id IS NOT NULL OR owner_id IS NOT NULL`)
	}
});

export type Projects = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const files = pgTable('files', {
	id: uuid('id').primaryKey().defaultRandom().unique(),
	projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	path: text('path').notNull(),
	name: text('name').notNull(),
	size: bigint('size', {mode: "number"}).notNull(),
	mimeType: text('mime_type'),
	createdAt: timestamp('created_at').notNull()
}, (tabel) => {
	return {
		unq: unique().on(tabel.projectId, tabel.path)
	}
});