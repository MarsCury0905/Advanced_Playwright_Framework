/**
 * Flaky Analyzer — stub implementation.
 * Compares two build snapshots to detect flaky tests.
 */

export interface BuildSummary {
    runId: string;
    tests: Record<string, string>;
}

export interface FlakyResult {
    flaky: string[];
    summary?: string;
    counts: {
        flaky: number;
        failing: number;
        total: number;
    };
}

export async function analyzeFlaky(
    prev: BuildSummary,
    curr: BuildSummary,
    hasLlm: boolean,
): Promise<FlakyResult> {
    const flaky: string[] = [];
    let failing = 0;

    for (const [title, currStatus] of Object.entries(curr.tests)) {
        const prevStatus = prev.tests[title];
        if (prevStatus && prevStatus !== currStatus) {
            flaky.push(title);
        }
        if (currStatus === 'failed' || currStatus === 'timedOut') {
            failing++;
        }
    }

    const summary = hasLlm
        ? undefined
        : flaky.length > 0
            ? `${flaky.length} test(s) changed status between builds — review for environment or timing issues.`
            : 'No flaky tests detected between these two builds.';

    return {
        flaky,
        summary,
        counts: { flaky: flaky.length, failing, total: Object.keys(curr.tests).length },
    };
}
