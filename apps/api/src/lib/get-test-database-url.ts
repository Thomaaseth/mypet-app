// Helper to get database URL with test support
export function getTestDatabaseUrl(): string {
    const url = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/pettr_test';
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    // pathname must be like "/pettr_test" —
    const databaseName = parsed.pathname.replace(/^\//, '');
    // SAFETY GUARD 
    // Two independent checks, both required:
    //   1. Host must be localhost/127.0.0.1 — never a remote host,
    //      never a tunnel/port-forward exposing a remote DB as local.
    //   2. Database NAME must end in "_test" — protects against a real/
    //      important local database also running on port 5432. Never
    //      point TEST_DATABASE_URL at a database you care about, even
    //      locally, even under a plausible-looking name.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        throw new Error(`Refusing to run tests against non-local host "${hostname}"`);
    }
    if (!databaseName.endsWith('_test')) {
        throw new Error(
            `Refusing to run tests against database "${databaseName}" — ` +
            `test database names must end in "_test".`
        );
    }
        return url;
}
