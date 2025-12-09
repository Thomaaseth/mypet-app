import { relations } from 'drizzle-orm';
import { user } from './auth-schema';
import { pets } from './pets';
import { weightEntries } from './weight-entries';
import { veterinarians } from './veterinarians';
import { petVeterinarians } from './pet-veterinarians';

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(user, {
    fields: [pets.userId],
    references: [user.id],
  }),
  weightEntries: many(weightEntries),
  petVeterinarians: many(petVeterinarians),
}));

export const userRelations = relations(user, ({ many }) => ({
  pets: many(pets),
  veterinarians: many(veterinarians),
}));

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  pet: one(pets, {
    fields: [weightEntries.petId],
    references: [pets.id],
  }),
}));

export const veterinariansRelations = relations(veterinarians, ({ one, many }) => ({
  user: one(user, {
    fields: [veterinarians.userId],
    references: [user.id],
  }),
  petVeterinarians: many(petVeterinarians),
}));

export const petVeterinariansRelations = relations(petVeterinarians, ({ one }) => ({
  pet: one(pets, {
    fields: [petVeterinarians.petId],
    references: [pets.id],
  }),
  veterinarian: one(veterinarians, {
    fields: [petVeterinarians.veterinarianId],
    references: [veterinarians.id],
  }),
}));