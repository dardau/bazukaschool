import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const studyState = sqliteTable('study_state', { key: text('key').primaryKey(), value: text('value').notNull(), updatedAt: text('updated_at').notNull() });
