/**
 * Recursively widens a translation resource's literal string types to `string`.
 *
 * English namespace files use `as const` for good editor autocomplete on keys.
 * That also makes TS infer literal types for values (e.g. `"Save"` as a type,
 * not `string`), which would wrongly force every other language to contain
 * that exact same English text. Translated files type-check against
 * `TranslationShape<typeof en>` instead of `typeof en` directly, so only the
 * *keys* are enforced to match — not the literal text.
 */
export type TranslationShape<T> = {
    [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
  };