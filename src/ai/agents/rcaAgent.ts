/**
 * RCA Agent — AI-powered Root Cause Analysis for failed Playwright tests.
 *
 * Analyzes failure error messages, stack traces, test file locations, and
 * test names to determine:
 *   1. Severity  (Critical / High / Medium / Low)
 *   2. Priority  (P0 / P1 / P2 / P3)
 *   3. Root Cause — a concise explanation of WHY the test failed
 *   4. Category  — the type of failure (selector, assertion, network, etc.)
 *   5. Fixes     — concrete, actionable steps to resolve the issue
 *
 * Falls back to deterministic heuristic classification when no LLM key is set.
 */

import { createAgent, type AgentResult } from '../agentFactory';

// ── Public types ────────────────────────────────────────────────────

export type FailureCategory =
    | 'selector-not-found'
    | 'assertion-mismatch'
    | 'timeout'
    | 'navigation-error'
    | 'network-error'
    | 'authentication-failure'
    | 'data-integrity'
    | 'race-condition'
    | 'environment-config'
    | 'unknown';

export interface RcaVerdict {
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    category: FailureCategory;
    rootCause: string;
    impact: string;
    fixes: string[];
    confidence: number;     // 0–100
}

export interface RcaInput {
    title: string;
    file: string;
    error: string;
    stack?: string;
}

// ── LLM schema ──────────────────────────────────────────────────────

const rcaVerdictSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'RcaVerdict',
    type: 'object',
    required: ['severity', 'priority', 'category', 'rootCause', 'impact', 'fixes', 'confidence'],
    additionalProperties: false,
    properties: {
        severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
        priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
        category: {
            type: 'string',
            enum: [
                'selector-not-found',
                'assertion-mismatch',
                'timeout',
                'navigation-error',
                'network-error',
                'authentication-failure',
                'data-integrity',
                'race-condition',
                'environment-config',
                'unknown',
            ],
        },
        rootCause: { type: 'string', minLength: 10 },
        impact: { type: 'string', minLength: 10 },
        fixes: {
            type: 'array',
            items: { type: 'string', minLength: 5 },
            minItems: 1,
            maxItems: 5,
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
    },
};

// ── Agent creation ──────────────────────────────────────────────────

const rcaAgent = createAgent<RcaInput, RcaVerdict>({
    name: 'RCA-Agent',
    systemPrompt: `You are an expert Playwright test automation engineer performing Root Cause Analysis (RCA) on failed test cases.

Given a test failure (title, file, error message, optional stack trace), determine:

1. **Severity** — based on the scope of impact:
   - Critical: Core user journey broken (login, checkout, payment). Production blocker.
   - High: Major feature broken (cart, search, navigation). Significant user impact.
   - Medium: Minor feature issue (sorting, filtering, cosmetic). Limited user impact.
   - Low: Edge case or non-functional issue (logging, analytics, accessibility). Minimal impact.

2. **Priority** — based on urgency to fix:
   - P0: Fix immediately, blocks release or production. Must be fixed in current sprint.
   - P1: Fix soon, important feature affected. Should be fixed this sprint.
   - P2: Fix in next sprint, non-critical but notable.
   - P3: Fix when convenient, low-impact improvement.

3. **Category** — classify the failure type:
   - selector-not-found: Locator doesn't match any element (wrong selector, page structure changed)
   - assertion-mismatch: Element exists but value/text/attribute doesn't match expected
   - timeout: Operation exceeded time limit (slow page, element never appeared)
   - navigation-error: Page failed to load, wrong URL, redirect issue
   - network-error: API call failed, CORS, server error
   - authentication-failure: Login failed, session expired, invalid credentials
   - data-integrity: Wrong data, missing fields, schema violation
   - race-condition: Timing issue, element state changed mid-test
   - environment-config: Wrong base URL, missing env vars, CI setup issue
   - unknown: Insufficient information to classify

4. **Root Cause** — one clear sentence explaining WHY it failed.

5. **Impact** — what user/business impact this failure represents.

6. **Fixes** — 1 to 5 concrete, actionable steps to fix the issue.

7. **Confidence** — 0-100, how confident you are in your analysis.

IMPORTANT: Analyze the ERROR MESSAGE carefully. Look for Playwright-specific patterns:
- "Timeout ... waiting for selector" → selector-not-found or timeout
- "expect(received).toBe(expected)" → assertion-mismatch
- "page.goto: net::ERR_" → navigation-error or network-error
- "locator.click: Target closed" → race-condition
- "Error: page.fill: Element is not visible" → timing issue or selector

Return ONLY valid JSON matching the schema. No markdown, no explanation.`,
    userPrompt: (input) => {
        let prompt = `Analyze this Playwright test failure:\n\nTest: ${input.title}\nFile: ${input.file}\nError: ${input.error}`;
        if (input.stack) {
            prompt += `\n\nStack Trace (first 500 chars):\n${input.stack.slice(0, 500)}`;
        }
        return prompt;
    },
    schema: rcaVerdictSchema,
    fallback: (input): RcaVerdict => {
        // Deterministic heuristic fallback
        return classifyFailureHeuristic(input);
    },
    options: { temperature: 0.2, maxTokens: 512 },
});

// ── Heuristic classifier (fallback) ────────────────────────────────

function classifyFailureHeuristic(input: RcaInput): RcaVerdict {
    const error = (input.error || '').toLowerCase();
    const title = (input.title || '').toLowerCase();
    const stack = (input.stack || '').toLowerCase();
    const combined = `${error} ${title} ${stack}`;

    let category: FailureCategory = 'unknown';
    let severity: RcaVerdict['severity'] = 'Medium';
    let priority: RcaVerdict['priority'] = 'P2';
    let rootCause: string;
    let impact: string;
    let confidence = 50;
    const fixes: string[] = [];

    // ── Selector not found ──
    if (
        combined.includes('waiting for selector') ||
        combined.includes('waiting for locator') ||
        combined.includes('locator resolved to') ||
        combined.includes('no element matches') ||
        combined.includes('element is not attached')
    ) {
        category = 'selector-not-found';
        confidence = 85;
        rootCause = `A locator failed to find a matching element on the page. The selector may be incorrect, or the page structure may have changed.`;
        impact = 'Test cannot interact with the target element, blocking the entire test flow.';
        fixes.push(
            'Verify the selector matches an element in the current DOM using Playwright Inspector.',
            'Use more resilient selectors like data-test attributes or accessible roles.',
            'Check if the page has been redesigned or if a deployment changed the DOM structure.',
        );
    }

    // ── Assertion mismatch ──
    else if (
        combined.includes('expect(received)') ||
        combined.includes('expected') && combined.includes('received') ||
        combined.includes('tobe(') ||
        combined.includes('tohavetext') ||
        combined.includes('tocontaintext') ||
        combined.includes('assertion failed')
    ) {
        category = 'assertion-mismatch';
        confidence = 80;
        rootCause = `An assertion failed because the actual value did not match the expected value.`;
        impact = 'The application may be producing incorrect output or the expected value is outdated.';
        fixes.push(
            'Compare the expected value against the actual application behavior.',
            'Check if the application logic or data has changed since the test was written.',
            'Update the expected value if the new behavior is correct.',
        );
    }

    // ── Timeout ──
    else if (
        combined.includes('timeout') ||
        combined.includes('exceeded') ||
        combined.includes('timed out')
    ) {
        category = 'timeout';
        confidence = 75;
        rootCause = `The operation exceeded the allowed time limit, possibly due to a slow page load, unresolved network request, or an element that never appeared.`;
        impact = 'The test cannot complete its operation within the expected timeframe.';
        fixes.push(
            'Increase the timeout for slow operations using { timeout: N } option.',
            'Use `waitForLoadState("networkidle")` for pages with many API calls.',
            'Check if the server is responding slowly or if there are hanging requests.',
        );
    }

    // ── Navigation error ──
    else if (
        combined.includes('net::err_') ||
        combined.includes('page.goto') ||
        combined.includes('navigation failed') ||
        combined.includes('name not resolved')
    ) {
        category = 'navigation-error';
        severity = 'High';
        priority = 'P1';
        confidence = 80;
        rootCause = `Page navigation failed, likely due to a broken URL, DNS resolution failure, or the server being unreachable.`;
        impact = 'The application is not accessible, which would affect all users.';
        fixes.push(
            'Verify the base URL is correct and the server is running.',
            'Check network connectivity and DNS resolution.',
            'Ensure environment variables (BASE_URL, etc.) are correctly configured.',
        );
    }

    // ── Authentication failure ──
    else if (
        combined.includes('login') ||
        combined.includes('auth') ||
        combined.includes('credential') ||
        combined.includes('password') ||
        combined.includes('unauthorized') ||
        combined.includes('403') ||
        combined.includes('401')
    ) {
        category = 'authentication-failure';
        severity = 'Critical';
        priority = 'P0';
        confidence = 70;
        rootCause = `Authentication failed, possibly due to invalid credentials, expired session, or a broken login flow.`;
        impact = 'Users cannot access the application, a critical user journey is blocked.';
        fixes.push(
            'Verify test credentials are valid and not expired.',
            'Check if the login page or authentication API has changed.',
            'Ensure environment variables for credentials are properly set.',
        );
    }

    // ── Race condition ──
    else if (
        combined.includes('target closed') ||
        combined.includes('execution context was destroyed') ||
        combined.includes('detached') ||
        combined.includes('stale')
    ) {
        category = 'race-condition';
        confidence = 65;
        rootCause = `A race condition caused the test to interact with an element that was removed or a page that navigated away during the operation.`;
        impact = 'Test is non-deterministic and may pass or fail depending on timing.';
        fixes.push(
            'Add proper await before interacting with dynamic elements.',
            'Use `expect(locator).toBeVisible()` before clicking.',
            'Avoid interacting with elements during page transitions.',
        );
    }

    // ── Default unknown ──
    else {
        rootCause = `Test failed with: ${input.error.slice(0, 150)}`;
        impact = 'The affected test case is no longer validating its intended functionality.';
        fixes.push(
            'Review the full error message and stack trace for clues.',
            'Enable Playwright tracing (`trace: "on"`) to capture the exact failure sequence.',
            'Check whether the base URL / environment variables are correctly set.',
        );
    }

    // ── Severity/priority escalation based on test name ──
    if (title.includes('checkout') || title.includes('payment') || title.includes('order')) {
        severity = severity === 'Low' ? 'High' : severity === 'Medium' ? 'High' : severity;
        priority = priority === 'P3' ? 'P1' : priority === 'P2' ? 'P1' : priority;
    }
    if (title.includes('login') || title.includes('auth') || title.includes('sign')) {
        severity = 'Critical';
        priority = 'P0';
    }

    return { severity, priority, category, rootCause, impact, fixes, confidence };
}

// ── Public API ──────────────────────────────────────────────────────

export async function analyzeFailure(input: RcaInput): Promise<RcaVerdict> {
    const result: AgentResult<RcaVerdict> = await rcaAgent(input);
    return result.data;
}
