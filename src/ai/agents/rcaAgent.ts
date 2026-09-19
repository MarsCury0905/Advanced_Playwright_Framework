/**
 * RCA Agent — stub implementation.
 * Replace with a real LLM call when an API key is configured.
 */

export interface RcaVerdict {
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    rootCause: string;
    fixes: string[];
}

export interface RcaInput {
    title: string;
    file: string;
    error: string;
    stack?: string;
}

export async function analyzeFailure(input: RcaInput): Promise<RcaVerdict> {
    // Stub: returns a basic verdict without calling any LLM.
    return {
        severity: 'Medium',
        priority: 'P2',
        rootCause: `Test failed with: ${input.error.slice(0, 120)}`,
        fixes: [
            'Review the selector and ensure the element exists on the page.',
            'Check whether the base URL / environment variables are correctly set.',
            'Enable trace recording and inspect the Playwright trace for more detail.',
        ],
    };
}
