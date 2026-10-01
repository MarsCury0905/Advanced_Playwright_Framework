/**
 * Self-Heal Agent — AI-powered locator repair suggestions.
 *
 * When a Playwright locator fails (element not found), this agent:
 *   1. Extracts the failed selector from the error
 *   2. Scrapes the live page DOM to find similar elements
 *   3. Uses the LLM to suggest alternative selectors
 *   4. Verifies each suggestion against the live page
 *   5. Returns a HealReport with verified and rejected candidates
 *
 * The report is attached to testInfo as 'self-heal' so the
 * CustomReporter renders it in the 🩹 Self-Heal tab.
 */

import { createAgent, type AgentResult } from '../agentFactory';
import type { Page } from '@playwright/test';
import type { HealCandidate, HealReport } from '../../utils/selfHeal';
import { createLogger } from '../../utils/Logger';

const log = createLogger('SelfHealAgent');

// ── Types ──────────────────────────────────────────────────────────

interface SelfHealInput {
    failedSelector: string;
    intent: string;
    pageUrl: string;
    domSnippet: string;
}

interface SelfHealOutput {
    candidates: {
        selector: string;
        strategy: string;
        reasoning: string;
    }[];
}

// ── LLM Schema ─────────────────────────────────────────────────────

const selfHealSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'SelfHealSuggestions',
    type: 'object',
    required: ['candidates'],
    additionalProperties: false,
    properties: {
        candidates: {
            type: 'array',
            items: {
                type: 'object',
                required: ['selector', 'strategy', 'reasoning'],
                additionalProperties: false,
                properties: {
                    selector: { type: 'string', minLength: 1 },
                    strategy: {
                        type: 'string',
                        enum: [
                            'data-test-attribute',
                            'aria-role',
                            'css-class',
                            'text-content',
                            'xpath',
                            'id-attribute',
                            'tag-hierarchy',
                            'placeholder',
                            'nth-child',
                        ],
                    },
                    reasoning: { type: 'string', minLength: 10 },
                },
            },
            minItems: 1,
            maxItems: 6,
        },
    },
};

// ── Agent ───────────────────────────────────────────────────────────

const selfHealLlm = createAgent<SelfHealInput, SelfHealOutput>({
    name: 'SelfHealAgent',
    systemPrompt: `You are an expert Playwright test engineer specializing in locator repair.

A test failed because a CSS/data-test selector did not match any element on the page.
You are given:
  - The FAILED SELECTOR that was used in the test
  - The INTENT of what the selector was supposed to find
  - The PAGE URL
  - A DOM SNIPPET showing the relevant portion of the page

Your job is to suggest up to 6 alternative Playwright-compatible CSS selectors that would find the intended element.

Prioritize selectors in this order:
1. data-test attributes (most reliable for testing)
2. ARIA roles / accessible names
3. ID attributes
4. CSS class-based selectors
5. Text content selectors
6. Structural/hierarchical selectors

IMPORTANT RULES:
- Each selector must be a valid CSS selector or Playwright locator string
- Prefer [data-test="..."] attributes if they exist in the DOM
- Look for data attributes that are SIMILAR to the failed one (typos, different naming conventions)
- Consider the semantic meaning of the element
- Return ONLY valid JSON matching the schema. No markdown.`,
    userPrompt: (input) => {
        return `A Playwright test locator failed:

FAILED SELECTOR: ${input.failedSelector}
INTENT: ${input.intent}
PAGE URL: ${input.pageUrl}

DOM SNIPPET (relevant section):
${input.domSnippet.slice(0, 3000)}

Suggest alternative selectors that would find the intended element.`;
    },
    schema: selfHealSchema,
    fallback: (input): SelfHealOutput => {
        // Heuristic fallback: generate suggestions based on the failed selector pattern
        return generateHeuristicCandidates(input);
    },
    options: { temperature: 0.2, maxTokens: 512 },
});

// ── Heuristic fallback ─────────────────────────────────────────────

function generateHeuristicCandidates(input: SelfHealInput): SelfHealOutput {
    const candidates: SelfHealOutput['candidates'] = [];
    const failed = input.failedSelector;
    const dom = input.domSnippet;

    // Strategy 1: Find all data-test attributes in the DOM and suggest similar ones
    const dataTestRegex = /data-test="([^"]+)"/g;
    let match: RegExpExecArray | null;
    const allDataTests: string[] = [];
    while ((match = dataTestRegex.exec(dom)) !== null) {
        allDataTests.push(match[1]);
    }

    // Extract the failed data-test value if it's a data-test selector
    const failedDataTest = failed.match(/data-test="([^"]+)"/)?.[1];
    if (failedDataTest) {
        // Find similar data-test attributes using keyword overlap
        const failedWords = failedDataTest.toLowerCase().split(/[-_]/);

        for (const dt of allDataTests) {
            const dtWords = dt.toLowerCase().split(/[-_]/);
            const commonWords = failedWords.filter(w => dtWords.some(dw => dw.includes(w) || w.includes(dw)));

            if (commonWords.length > 0 && dt !== failedDataTest) {
                candidates.push({
                    selector: `[data-test="${dt}"]`,
                    strategy: 'data-test-attribute',
                    reasoning: `Found data-test="${dt}" which shares keywords "${commonWords.join(', ')}" with the failed selector's "${failedDataTest}". This is likely the correct attribute.`,
                });
            }
        }
    }

    // Strategy 2: Look for elements with matching IDs
    const idRegex = /id="([^"]+)"/g;
    while ((match = idRegex.exec(dom)) !== null) {
        const idVal = match[1];
        if (failedDataTest && idVal.toLowerCase().includes(failedDataTest.split('-')[0]?.toLowerCase() ?? '')) {
            candidates.push({
                selector: `#${idVal}`,
                strategy: 'id-attribute',
                reasoning: `Found element with id="${idVal}" which relates to the failed selector's intent.`,
            });
        }
    }

    // Strategy 3: Look for ARIA roles
    const ariaRegex = /aria-label="([^"]+)"/g;
    while ((match = ariaRegex.exec(dom)) !== null) {
        const ariaLabel = match[1];
        const intentWords = input.intent.toLowerCase().split(/\s+/);
        const ariaWords = ariaLabel.toLowerCase().split(/\s+/);
        const overlap = intentWords.filter(w => ariaWords.some(aw => aw.includes(w)));
        if (overlap.length > 0) {
            candidates.push({
                selector: `[aria-label="${ariaLabel}"]`,
                strategy: 'aria-role',
                reasoning: `Found aria-label="${ariaLabel}" matching the intent "${input.intent}".`,
            });
        }
    }

    // Strategy 4: Look for class-based selectors with semantic meaning
    const classRegex = /class="([^"]+)"/g;
    while ((match = classRegex.exec(dom)) !== null) {
        const classes = match[1].split(/\s+/);
        for (const cls of classes) {
            if (
                failedDataTest &&
                cls.toLowerCase().includes('cart') &&
                input.intent.toLowerCase().includes('cart') &&
                candidates.length < 6
            ) {
                candidates.push({
                    selector: `.${cls}`,
                    strategy: 'css-class',
                    reasoning: `Found class "${cls}" related to cart functionality matching the intent.`,
                });
                break;
            }
        }
    }

    // If we still have no candidates, suggest all data-test attributes as fallback
    if (candidates.length === 0) {
        for (const dt of allDataTests.slice(0, 4)) {
            candidates.push({
                selector: `[data-test="${dt}"]`,
                strategy: 'data-test-attribute',
                reasoning: `Available data-test attribute in the DOM. Review if this is the intended element.`,
            });
        }
    }

    return { candidates: candidates.slice(0, 6) };
}

// ── DOM scraping utility ───────────────────────────────────────────

/**
 * Scrapes the live page for a focused DOM snippet around where the
 * intended element SHOULD be. Looks for the broader section of the page
 * that contains elements related to the intent.
 */
async function scrapeDomSnippet(page: Page, failedSelector: string, intent: string): Promise<string> {
    try {
        // Get a broader snippet: all elements with data-test attributes, plus
        // elements near where the failed selector might have been.
        const snippet = await page.evaluate(
            ({ selector, intentHint }) => {
                const results: string[] = [];

                // Collect all elements with data-test attributes
                const dataTestElements = document.querySelectorAll('[data-test]');
                dataTestElements.forEach((el) => {
                    const tag = el.tagName.toLowerCase();
                    const attrs: string[] = [];
                    for (const attr of el.attributes) {
                        attrs.push(`${attr.name}="${attr.value}"`);
                    }
                    const text = el.textContent?.trim().slice(0, 50) || '';
                    results.push(`<${tag} ${attrs.join(' ')}>${text}</${tag}>`);
                });

                // Also collect elements related to the intent keywords
                const intentWords = intentHint.toLowerCase().split(/\s+/);
                const allElements = document.querySelectorAll('*');
                let related = 0;
                allElements.forEach((el) => {
                    if (related >= 10) return;
                    const attrStr = Array.from(el.attributes)
                        .map((a) => `${a.name}="${a.value}"`)
                        .join(' ');
                    const lowerAttrs = attrStr.toLowerCase();
                    const matchesIntent = intentWords.some(
                        (w) => w.length > 2 && (lowerAttrs.includes(w) || (el.textContent?.toLowerCase().includes(w) ?? false)),
                    );
                    if (matchesIntent && !el.hasAttribute('data-test')) {
                        const tag = el.tagName.toLowerCase();
                        const text = el.textContent?.trim().slice(0, 50) || '';
                        results.push(`<!-- intent-match --> <${tag} ${attrStr}>${text}</${tag}>`);
                        related++;
                    }
                });

                return results.join('\n');
            },
            { selector: failedSelector, intentHint: intent },
        );
        return snippet;
    } catch (e) {
        log.warn(`DOM scraping failed: ${(e as Error).message}`);
        return '<!-- DOM scraping failed -->';
    }
}

/**
 * Extracts the selector string from a Playwright error message.
 * e.g. "locator('[data-test=\"cart-badge-counter\"]')" → '[data-test="cart-badge-counter"]'
 */
function extractSelectorFromError(error: string): string | null {
    // Pattern: locator('...')
    const locatorMatch = error.match(/locator\(['"](.+?)['"]\)/);
    if (locatorMatch) return locatorMatch[1];

    // Pattern: [data-test="..."]
    const dataTestMatch = error.match(/\[data-test="([^"]+)"\]/);
    if (dataTestMatch) return `[data-test="${dataTestMatch[1]}"]`;

    // Pattern: waiting for selector "..."
    const selectorMatch = error.match(/waiting for (?:selector|locator) ['"](.+?)['"]/);
    if (selectorMatch) return selectorMatch[1];

    return null;
}

/**
 * Infers the intent of a selector from its name.
 * e.g. 'cart-badge-counter' → 'cart badge counter element'
 */
function inferIntent(selector: string): string {
    const dataTest = selector.match(/data-test="([^"]+)"/)?.[1];
    if (dataTest) {
        return dataTest.replace(/[-_]/g, ' ') + ' element';
    }
    // For CSS selectors, clean up
    return selector.replace(/[[\]"'=.#>+~:]/g, ' ').trim() + ' element';
}

// ── Verification against live page ─────────────────────────────────

/**
 * Verifies each candidate selector against the live page.
 * Returns verified candidates (exactly one match) and rejected ones.
 */
async function verifyCandidates(
    page: Page,
    candidates: SelfHealOutput['candidates'],
): Promise<{ verified: HealCandidate[]; rejected: Array<{ selector: string; reason: string }> }> {
    const verified: HealCandidate[] = [];
    const rejected: Array<{ selector: string; reason: string }> = [];

    for (const c of candidates) {
        try {
            const locator = page.locator(c.selector);
            const count = await locator.count();

            if (count === 0) {
                rejected.push({ selector: c.selector, reason: 'No elements found' });
                continue;
            }

            if (count > 1) {
                // Still useful but note the ambiguity
                const isVisible = await locator.first().isVisible().catch(() => false);
                verified.push({
                    selector: c.selector,
                    strategy: c.strategy,
                    matchCount: count,
                    visible: isVisible,
                    reasoning: `${c.reasoning} (matched ${count} elements — may need refinement)`,
                });
                continue;
            }

            // Exactly one match — ideal
            const isVisible = await locator.isVisible().catch(() => false);
            verified.push({
                selector: c.selector,
                strategy: c.strategy,
                matchCount: 1,
                visible: isVisible,
                reasoning: c.reasoning,
            });
        } catch (e) {
            rejected.push({ selector: c.selector, reason: `Invalid selector: ${(e as Error).message.slice(0, 80)}` });
        }
    }

    return { verified, rejected };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Analyzes a locator failure and suggests alternative selectors.
 *
 * Call this when a Playwright locator times out or doesn't find an element.
 * The method:
 *   1. Extracts the failed selector from the error
 *   2. Scrapes the page DOM for context
 *   3. Calls the AI agent for suggestions
 *   4. Verifies each suggestion against the live page
 *   5. Returns a HealReport ready to attach to testInfo
 *
 * @param page     — the Playwright Page (must still be open)
 * @param error    — the error message (from Playwright assertion/locator failure)
 * @param selector — the failed selector (if known; extracted from error otherwise)
 * @param intent   — human-readable intent (e.g. "cart badge counter")
 */
export async function healLocator(
    page: Page,
    error: string,
    selector?: string,
    intent?: string,
): Promise<HealReport> {
    const failedSelector = selector || extractSelectorFromError(error) || 'unknown';
    const resolvedIntent = intent || inferIntent(failedSelector);

    log.info(`🩹 Self-heal: analyzing failed selector "${failedSelector}" (${resolvedIntent})`);

    try {
        // Scrape the live page DOM
        const domSnippet = await scrapeDomSnippet(page, failedSelector, resolvedIntent);
        const pageUrl = page.url();

        // Call the AI agent
        const result: AgentResult<SelfHealOutput> = await selfHealLlm({
            failedSelector,
            intent: resolvedIntent,
            pageUrl,
            domSnippet,
        });

        const agentCandidates = result.data.candidates;
        log.info(`🩹 Self-heal: agent returned ${agentCandidates.length} candidate(s) (${result.isFallback ? 'heuristic' : 'AI-powered'})`);

        // Verify candidates against the live page
        const { verified, rejected } = await verifyCandidates(page, agentCandidates);

        log.info(`🩹 Self-heal: ${verified.length} verified, ${rejected.length} rejected`);

        return {
            failedSelector,
            intent: resolvedIntent,
            verified,
            rejected,
        };
    } catch (e) {
        log.warn(`🩹 Self-heal agent error: ${(e as Error).message}`);
        return {
            failedSelector,
            intent: resolvedIntent,
            verified: [],
            rejected: [],
            unavailableReason: (e as Error).message,
        };
    }
}

/**
 * Determines whether an error looks like a locator/selector failure
 * (as opposed to an assertion mismatch, timeout on a network call, etc.).
 */
export function isLocatorFailure(error: string): boolean {
    const lower = error.toLowerCase();
    return (
        lower.includes('waiting for selector') ||
        lower.includes('waiting for locator') ||
        lower.includes('element(s) not found') ||
        lower.includes('no element matches') ||
        lower.includes('locator resolved to') ||
        lower.includes('element is not attached') ||
        lower.includes('element is not visible') ||
        (lower.includes('timeout') && lower.includes('locator'))
    );
}
