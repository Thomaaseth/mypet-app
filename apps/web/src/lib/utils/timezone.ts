// Detects the browser's current IANA timezone (e.g. "Europe/Paris").
export const detectBrowserTimezone = (): string =>
    Intl.DateTimeFormat().resolvedOptions().timeZone;