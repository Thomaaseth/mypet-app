import type en from './locales/en';

/**
 * Recursively flattens a nested object type into a union of dotted-path
 * string literals — e.g. `{ pets: { card: { openMenu: string } } }` becomes
 * `'pets.card.openMenu'`. Applied to `typeof en`, this gives the real,
 * complete set of valid i18next keys for this app, derived directly from
 * the actual resource tree (not hand-maintained, so it can't drift).
 *
 * Used to verify — at compile time — that keys emitted by shared Zod
 * schemas (packages/shared/src/validations/*.ts) actually exist in the
 * translation resources. See __typecheck__/validation-keys.assert.ts.
 */
type Primitive = string | number | boolean;

type Paths<T, Prefix extends string = ''> = T extends Primitive
  ? Prefix
  : {
      [K in keyof T & string]: Paths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

export type TranslationKey = Paths<typeof en>;

/**
 * Identity at runtime; forces a Zod message argument in an apps/web-only
 * (not shared with packages/shared) schema to be a literal member of the
 * real translation-key set, so a typo fails `tsc` here instead of silently
 * rendering as a raw key at runtime.
 */
export const key = (k: TranslationKey): string => k;