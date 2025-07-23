import { relations } from 'drizzle-orm';
import { user } from './auth-schema';
import { pets } from './pets';
import { weightEntries } from './weight-entries';

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(user, {
    fields: [pets.userId],
    references: [user.id],
  }),
  weightEntries: many(weightEntries),
}));

export const userRelations = relations(user, ({ many }) => ({
  pets: many(pets),
}));

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  pet: one(pets, {
    fields: [weightEntries.petId],
    references: [pets.id],
  }),
}));