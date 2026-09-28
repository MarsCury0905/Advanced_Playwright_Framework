import dotenv from 'dotenv';
import path from 'path';

/**
 * EnvUtil — Centralized environment loader and variable reader.
 * Ensures the .env file is loaded safely once from the project root.
 */
export class EnvUtil {
    private static isLoaded = false;

    /**
     * Loads the root .env file into process.env.
     * Safe to call multiple times (loads only once).
     */
    public static load(customFileName = '.env'): void {
        if (this.isLoaded) return;

        const envPath = path.resolve(process.cwd(), customFileName);
        dotenv.config({ path: envPath });
        this.isLoaded = true;
    }

    /**
     * Reads an environment variable with an optional fallback.
     */
    public static get(key: string, fallback = ''): string {
        this.load();
        const val = process.env[key];
        return val && val.trim() !== '' ? val.trim() : fallback;
    }
}

// Self-invoking execution when imported directly
EnvUtil.load();
