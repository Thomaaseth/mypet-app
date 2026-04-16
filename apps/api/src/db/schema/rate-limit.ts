import { pgTable, text, integer, bigint } from 'drizzle-orm/pg-core';

export const rateLimit = pgTable('rateLimit', {
    id: text('id').primaryKey(),
    key: text('key'),
    count: integer('count'),
    lastRequest: bigint('lastRequest', { mode: 'number' }),
});