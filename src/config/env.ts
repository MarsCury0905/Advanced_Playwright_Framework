/**
 * env — environment variable helpers.
 *
 * `envOr(key, fallback)` reads process.env[key] and returns the fallback
 * when the variable is absent or empty. Used by DataGenerator to prefer
 * .env-defined values over Faker-generated ones.
 */

export function envOr(key: string, fallback: string): string {
    const value = process.env[key];
    return value && value.trim() !== '' ? value.trim() : fallback;
}

export function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        throw new Error(`[env] Required environment variable "${key}" is not set.`);
    }
    return value.trim();
}
