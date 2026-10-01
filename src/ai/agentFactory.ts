/**
 * agentFactory — turns a prompt + JSON schema into a callable agent.
 *
 * Flow:
 *   1. No key → return fallback immediately.
 *   2. Call LLM with JSON mode, parse, validate via SchemaValidator (Ajv).
 *   3. Schema violation → one retry feeding Ajv errors back to the model.
 *   4. Transport error or second failure → return fallback.
 */

import { createLogger } from '../utils/Logger';
import { SchemaValidator } from '../utils/SchemaValidator';
import { getLLMClient } from './LLMClient';
import type { ILLMClient, LLMRequestOptions } from './LLMClient';

const log = createLogger('AgentFactory');

// ── Types ──────────────────────────────────────────────────────────

export interface AgentDefinition<TInput, TOutput> {
    name: string;
    systemPrompt: string | ((input: TInput) => string);
    userPrompt: (input: TInput) => string;
    schema: object;
    fallback: (input: TInput, reason: string) => TOutput | Promise<TOutput>;
    options?: LLMRequestOptions;
}

export interface AgentResult<TOutput> {
    success: boolean;
    data: TOutput;
    isFallback: boolean;
    reason?: string;
    metadata?: { provider: string; model: string; durationMs: number; retries: number };
}

// ── Factory ────────────────────────────────────────────────────────

export function createAgent<TInput, TOutput>(
    def: AgentDefinition<TInput, TOutput>,
    client?: ILLMClient,
): (input: TInput) => Promise<AgentResult<TOutput>> {
    return async (input: TInput): Promise<AgentResult<TOutput>> => {
        const llm = client ?? getLLMClient();

        if (!llm.isAvailable()) {
            const reason = 'LLM unavailable — no API key configured';
            log.info(`[${def.name}] ${reason}, using fallback`);
            return { success: false, data: await def.fallback(input, reason), isFallback: true, reason };
        }

        const systemPrompt = typeof def.systemPrompt === 'function' ? def.systemPrompt(input) : def.systemPrompt;
        const fullSystem = systemPrompt +
            '\n\nYou MUST respond with valid JSON matching this schema:\n' +
            JSON.stringify(def.schema, null, 2);

        let retries = 0;
        let lastError = '';
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: fullSystem },
            { role: 'user', content: def.userPrompt(input) },
        ];

        while (retries <= 1) {
            try {
                const response = await llm.complete(messages, { jsonMode: true, ...(def.options ?? {}) });

                let parsed: unknown;
                try {
                    parsed = JSON.parse(response.content);
                } catch {
                    lastError = `Invalid JSON from model: ${response.content.slice(0, 100)}`;
                    log.warn(`[${def.name}] ${lastError} (retry ${retries}/1)`);
                    if (retries < 1) {
                        messages.push(
                            { role: 'assistant', content: response.content },
                            { role: 'user', content: 'Your response was not valid JSON. Fix it and return only valid JSON matching the schema.' },
                        );
                        retries++;
                        continue;
                    }
                    break;
                }

                const validation = SchemaValidator.validate(def.schema, parsed);
                if (validation.valid) {
                    log.info(`[${def.name}] success via ${response.provider}/${response.model} in ${response.durationMs}ms`);
                    return {
                        success: true,
                        data: parsed as TOutput,
                        isFallback: false,
                        metadata: { provider: response.provider, model: response.model, durationMs: response.durationMs, retries },
                    };
                }

                lastError = `Schema validation failed:\n  - ${validation.errors.join('\n  - ')}`;
                log.warn(`[${def.name}] ${lastError} (retry ${retries}/1)`);
                if (retries < 1) {
                    messages.push(
                        { role: 'assistant', content: response.content },
                        { role: 'user', content: `Your response violated the schema:\n  - ${validation.errors.join('\n  - ')}\nFix these errors and output valid JSON.` },
                    );
                    retries++;
                    continue;
                }
                break;
            } catch (err) {
                lastError = (err as Error).message;
                log.warn(`[${def.name}] transport error: ${lastError}`);
                break;
            }
        }

        const reason = `Agent "${def.name}" failed after ${retries} retries: ${lastError}`;
        log.warn(`[${def.name}] falling back: ${reason}`);
        return { success: false, data: await def.fallback(input, reason), isFallback: true, reason };
    };
}
