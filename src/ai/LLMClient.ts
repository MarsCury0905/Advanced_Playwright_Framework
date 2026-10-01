/**
 * LLMClient — unified transport for all supported LLM providers.
 *
 * Two HTTP dialects, zero SDK dependencies:
 *   1. OpenAI-compatible  (Groq, DeepSeek, OpenRouter, OpenAI, Google Gemini)
 *   2. Anthropic Messages API
 *
 * Provider, model, base URL and API key are resolved from env via `@config/env`.
 * Prompt and response bodies are never logged (they may contain app data).
 */

import { createLogger } from '../utils/Logger';
import { envOr } from '../config/env';

const log = createLogger('LLMClient');

// ── Types ──────────────────────────────────────────────────────────

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMRequestOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    jsonMode?: boolean;
}

export interface LLMUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface LLMResponse {
    content: string;
    usage?: LLMUsage;
    durationMs: number;
    provider: string;
    model: string;
}

export interface ILLMClient {
    complete(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
    isAvailable(): boolean;
}

// ── Provider registry ──────────────────────────────────────────────

type ProviderName = 'groq' | 'deepseek' | 'openrouter' | 'openai' | 'anthropic' | 'google';

interface ProviderConfig {
    baseUrl: string;
    defaultModel: string;
    keyEnv: string;
    dialect: 'openai' | 'anthropic';
}

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
    groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'qwen/qwen3.8-27b',
        keyEnv: 'GROQ_API_KEY',
        dialect: 'openai',
    },
    deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        keyEnv: 'DEEPSEEK_API_KEY',
        dialect: 'openai',
    },
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'deepseek/deepseek-chat',
        keyEnv: 'OPENROUTER_API_KEY',
        dialect: 'openai',
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        keyEnv: 'OPENAI_API_KEY',
        dialect: 'openai',
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-5-haiku-latest',
        keyEnv: 'ANTHROPIC_API_KEY',
        dialect: 'anthropic',
    },
    google: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        defaultModel: 'gemini-2.0-flash',
        keyEnv: 'GEMINI_API_KEY',
        dialect: 'openai',
    },
};

function resolveProvider(): ProviderName {
    const raw = envOr('AI_PROVIDER', 'groq').toLowerCase();
    if (raw in PROVIDERS) return raw as ProviderName;
    log.warn(`Unknown AI_PROVIDER "${raw}", falling back to groq`);
    return 'groq';
}

// ── OpenAI-compatible dialect ──────────────────────────────────────

async function completeOpenAI(
    baseUrl: string,
    apiKey: string,
    messages: LLMMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    timeoutMs: number,
    jsonMode: boolean,
): Promise<{ content: string; usage?: LLMUsage; model: string }> {
    const body: Record<string, unknown> = {
        model, messages, max_tokens: maxTokens, temperature,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`LLM API ${res.status}: ${errText.slice(0, 200)}`);
        }

        const json = (await res.json()) as {
            choices: { message: { content: string } }[];
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
            model?: string;
        };
        const content = json.choices?.[0]?.message?.content ?? '';
        const usage: LLMUsage | undefined = json.usage
            ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens, totalTokens: json.usage.total_tokens }
            : undefined;
        return { content, usage, model: json.model ?? model };
    } finally {
        clearTimeout(timer);
    }
}

// ── Anthropic Messages dialect ─────────────────────────────────────

async function completeAnthropic(
    baseUrl: string,
    apiKey: string,
    messages: LLMMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    timeoutMs: number,
): Promise<{ content: string; usage?: LLMUsage; model: string }> {
    const system = messages.find((m) => m.role === 'system')?.content;
    const chat = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = { model, max_tokens: maxTokens, temperature, messages: chat };
    if (system) body.system = system;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`LLM API ${res.status}: ${errText.slice(0, 200)}`);
        }

        const json = (await res.json()) as {
            content: { type: string; text: string }[];
            usage?: { input_tokens: number; output_tokens: number };
            model?: string;
        };
        const content = json.content?.find((c) => c.type === 'text')?.text ?? '';
        const usage: LLMUsage | undefined = json.usage
            ? { promptTokens: json.usage.input_tokens, completionTokens: json.usage.output_tokens, totalTokens: json.usage.input_tokens + json.usage.output_tokens }
            : undefined;
        return { content, usage, model: json.model ?? model };
    } finally {
        clearTimeout(timer);
    }
}

// ── Public client ──────────────────────────────────────────────────

export class LLMClient implements ILLMClient {
    private readonly provider: ProviderName;
    private readonly config: ProviderConfig;
    private readonly apiKey: string;
    private readonly defaultModel: string;
    private readonly defaultMaxTokens: number;
    private readonly defaultTimeoutMs: number;

    constructor() {
        this.provider = resolveProvider();
        this.config = PROVIDERS[this.provider];
        this.apiKey = envOr(this.config.keyEnv, '');
        this.defaultModel = envOr('AI_MODEL', this.config.defaultModel);
        this.defaultMaxTokens = parseInt(envOr('AI_MAX_TOKENS', '1024'), 10);
        this.defaultTimeoutMs = parseInt(envOr('AI_TIMEOUT_MS', '30000'), 10);

        if (this.apiKey) {
            log.info(`AI provider: ${this.provider}, model: ${this.defaultModel}`);
        } else {
            log.info(`AI disabled — no key for ${this.provider} (${this.config.keyEnv})`);
        }
    }

    isAvailable(): boolean {
        return this.apiKey.length > 0;
    }

    async complete(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
        if (!this.isAvailable()) {
            throw new Error(`LLM unavailable: no API key for provider "${this.provider}"`);
        }

        const model = options?.model ?? this.defaultModel;
        const maxTokens = options?.maxTokens ?? this.defaultMaxTokens;
        const temperature = options?.temperature ?? 0.7;
        const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
        const jsonMode = options?.jsonMode ?? false;
        const baseUrl = envOr('AI_BASE_URL', this.config.baseUrl);
        const start = Date.now();

        const result = this.config.dialect === 'anthropic'
            ? await completeAnthropic(baseUrl, this.apiKey, messages, model, maxTokens, temperature, timeoutMs)
            : await completeOpenAI(baseUrl, this.apiKey, messages, model, maxTokens, temperature, timeoutMs, jsonMode);

        const durationMs = Date.now() - start;
        log.info(
            `${this.provider}/${result.model} completed in ${durationMs}ms` +
            (result.usage ? ` (${result.usage.promptTokens}+${result.usage.completionTokens}=${result.usage.totalTokens} tokens)` : ''),
        );

        return { content: result.content, usage: result.usage, durationMs, provider: this.provider, model: result.model };
    }
}

// Singleton — reuse across agents within a run.
let _instance: LLMClient | undefined;
export function getLLMClient(): LLMClient {
    return (_instance ??= new LLMClient());
}

/** Gate used by CustomReporter to skip AI paths when no key is set. */
export function hasApiKey(): boolean {
    return getLLMClient().isAvailable();
}
