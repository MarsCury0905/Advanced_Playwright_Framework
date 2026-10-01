/**
 * Flaky Analyzer Agent — LLM-powered detection of flaky test patterns.
 *
 * Compares two build snapshots to detect tests whose status changed between
 * runs (pass→fail or fail→pass). The AI agent then categorizes each flaky
 * test by root pattern (timing, environment, data dependency, etc.) and
 * assigns a confidence score.
 *
 * Falls back to deterministic heuristics when no API key is configured.
 *
 * Flakiness detection strategies:
 *   1. Status Oscillation  — test passed in build A, failed in build B (or vice versa)
 *   2. Timing Sensitivity  — tests that fail intermittently due to race conditions or timeouts
 *   3. Environment Dependency — tests whose outcome varies with env, network, or parallelism
 *   4. Data Dependency      — tests relying on mutable shared state
 */

import { createAgent, type AgentResult } from '../agentFactory';

// ── Public types ────────────────────────────────────────────────────

export interface BuildSummary {
    runId: string;
    tests: Record<string, string>;
}

export type FlakyPattern =
    | 'timing-sensitivity'
    | 'environment-dependency'
    | 'data-dependency'
    | 'order-dependency'
    | 'resource-leak'
    | 'race-condition'
    | 'unknown';

export interface FlakyTestDetail {
    testName: string;
    prevStatus: string;
    currStatus: string;
    pattern: FlakyPattern;
    confidence: number;       // 0–100
    explanation: string;
    remediation: string;
}

export interface FlakyResult {
    flaky: string[];
    flakyDetails: FlakyTestDetail[];
    summary?: string;
    counts: {
        flaky: number;
        failing: number;
        total: number;
    };
}

// ── LLM Agent schema ────────────────────────────────────────────────

interface FlakyAnalysisInput {
    flakyTests: { name: string; prevStatus: string; currStatus: string }[];
    totalTests: number;
    failingCount: number;
}

interface FlakyAnalysisOutput {
    tests: {
        testName: string;
        pattern: FlakyPattern;
        confidence: number;
        explanation: string;
        remediation: string;
    }[];
    summary: string;
}

const flakyAnalysisSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'FlakyAnalysis',
    type: 'object',
    required: ['tests', 'summary'],
    additionalProperties: false,
    properties: {
        tests: {
            type: 'array',
            items: {
                type: 'object',
                required: ['testName', 'pattern', 'confidence', 'explanation', 'remediation'],
                additionalProperties: false,
                properties: {
                    testName: { type: 'string' },
                    pattern: {
                        type: 'string',
                        enum: [
                            'timing-sensitivity',
                            'environment-dependency',
                            'data-dependency',
                            'order-dependency',
                            'resource-leak',
                            'race-condition',
                            'unknown',
                        ],
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 100 },
                    explanation: { type: 'string', minLength: 10 },
                    remediation: { type: 'string', minLength: 10 },
                },
            },
        },
        summary: { type: 'string', minLength: 10 },
    },
};

const analyzeFlakyAgent = createAgent<FlakyAnalysisInput, FlakyAnalysisOutput>({
    name: 'FlakyAnalyzer',
    systemPrompt: `You are a senior QA engineer specializing in flaky test analysis for Playwright end-to-end tests.

You receive a list of tests whose status changed between two consecutive CI builds. Your job is to:
1. Identify the most likely PATTERN causing flakiness for each test.
2. Assign a CONFIDENCE score (0–100) based on how certain you are.
3. Provide a concise EXPLANATION of why the test is flaky.
4. Suggest a concrete REMEDIATION to stabilize the test.

Pattern definitions:
- timing-sensitivity: Test relies on hard waits, animations, or setTimeout that may vary.
- environment-dependency: Test depends on network, third-party services, or CI environment differences.
- data-dependency: Test relies on mutable or shared data that changes between runs.
- order-dependency: Test outcome changes depending on which tests ran before it.
- resource-leak: Memory leaks, unclosed handles, or zombie processes affect later tests.
- race-condition: Multiple async operations without proper synchronization.
- unknown: Insufficient information to classify.

Analyze the test NAMES for clues (e.g. "checkout" suggests timing/data, "login" suggests environment).
Return ONLY valid JSON matching the provided schema.`,
    userPrompt: (input) => {
        const testList = input.flakyTests
            .map((t) => `  - "${t.name}" changed from ${t.prevStatus} → ${t.currStatus}`)
            .join('\n');
        return `Analyze these ${input.flakyTests.length} flaky tests (out of ${input.totalTests} total, ${input.failingCount} currently failing):\n${testList}`;
    },
    schema: flakyAnalysisSchema,
    fallback: (input): FlakyAnalysisOutput => {
        // Deterministic heuristic fallback
        const tests = input.flakyTests.map((t) => {
            let pattern: FlakyPattern = 'unknown';
            let confidence = 50;
            const nameLower = t.name.toLowerCase();

            if (nameLower.includes('timeout') || nameLower.includes('wait') || nameLower.includes('animation')) {
                pattern = 'timing-sensitivity';
                confidence = 75;
            } else if (nameLower.includes('api') || nameLower.includes('network') || nameLower.includes('fetch')) {
                pattern = 'environment-dependency';
                confidence = 70;
            } else if (nameLower.includes('cart') || nameLower.includes('checkout') || nameLower.includes('order')) {
                pattern = 'race-condition';
                confidence = 65;
            } else if (nameLower.includes('login') || nameLower.includes('auth')) {
                pattern = 'timing-sensitivity';
                confidence = 60;
            } else if (nameLower.includes('data') || nameLower.includes('create') || nameLower.includes('delete')) {
                pattern = 'data-dependency';
                confidence = 65;
            }

            return {
                testName: t.name,
                pattern,
                confidence,
                explanation: `Test changed from ${t.prevStatus} to ${t.currStatus} between builds — likely ${pattern.replace(/-/g, ' ')}.`,
                remediation: getRemediationForPattern(pattern),
            };
        });

        const summary =
            input.flakyTests.length > 0
                ? `${input.flakyTests.length} test(s) changed status between builds. Review for timing, environment, or data issues. ${input.failingCount} test(s) are currently failing.`
                : 'No flaky tests detected between these two builds.';

        return { tests, summary };
    },
    options: { temperature: 0.3, maxTokens: 1024 },
});

function getRemediationForPattern(pattern: FlakyPattern): string {
    switch (pattern) {
        case 'timing-sensitivity':
            return 'Replace hard waits with Playwright auto-waiting locators (e.g. `await expect(locator).toBeVisible()`). Use `waitForLoadState` after navigation.';
        case 'environment-dependency':
            return 'Mock external services with `page.route()`. Use environment variables for configuration. Add retry logic for network calls.';
        case 'data-dependency':
            return 'Isolate test data per test run. Use unique identifiers (UUID/timestamp). Clean up test data in afterEach hooks.';
        case 'order-dependency':
            return 'Ensure each test is self-contained. Move shared setup to beforeEach. Avoid global mutable state.';
        case 'resource-leak':
            return 'Close all browser contexts and pages in afterEach. Verify no hanging promises or event listeners.';
        case 'race-condition':
            return 'Add proper `await` for all async operations. Use Playwright auto-waiting assertions. Avoid parallel writes to shared resources.';
        default:
            return 'Review the test for non-deterministic behavior. Enable Playwright tracing to capture the exact failure sequence.';
    }
}

// ── Public API ──────────────────────────────────────────────────────

export async function analyzeFlaky(
    prev: BuildSummary,
    curr: BuildSummary,
    hasLlm: boolean,
): Promise<FlakyResult> {
    const flaky: string[] = [];
    const flakyInput: FlakyAnalysisInput['flakyTests'] = [];
    let failing = 0;

    for (const [title, currStatus] of Object.entries(curr.tests)) {
        const prevStatus = prev.tests[title];
        if (prevStatus && prevStatus !== currStatus) {
            flaky.push(title);
            flakyInput.push({ name: title, prevStatus, currStatus });
        }
        if (currStatus === 'failed' || currStatus === 'timedOut') {
            failing++;
        }
    }

    // If there are flaky tests, run the AI agent for detailed analysis
    let flakyDetails: FlakyTestDetail[] = [];
    let summary: string | undefined;

    if (flakyInput.length > 0) {
        const result: AgentResult<FlakyAnalysisOutput> = await analyzeFlakyAgent({
            flakyTests: flakyInput,
            totalTests: Object.keys(curr.tests).length,
            failingCount: failing,
        });

        flakyDetails = result.data.tests.map((t, i) => ({
            testName: t.testName,
            prevStatus: flakyInput[i]?.prevStatus ?? 'unknown',
            currStatus: flakyInput[i]?.currStatus ?? 'unknown',
            pattern: t.pattern,
            confidence: t.confidence,
            explanation: t.explanation,
            remediation: t.remediation,
        }));
        summary = result.data.summary;
    } else {
        summary = 'No flaky tests detected between these two builds — all statuses were consistent.';
    }

    return {
        flaky,
        flakyDetails,
        summary,
        counts: { flaky: flaky.length, failing, total: Object.keys(curr.tests).length },
    };
}
