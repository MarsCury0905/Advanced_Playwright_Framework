/**
 * AI Provider config — checks whether a valid LLM API key is present.
 * Set OPENAI_API_KEY or GEMINI_API_KEY in your .env to enable AI features.
 */

export function hasApiKey(): boolean {
    return !!(
        process.env.OPENAI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.ANTHROPIC_API_KEY
    );
}
