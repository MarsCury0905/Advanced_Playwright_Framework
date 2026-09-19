/**
 * selfHeal — type definitions for the Self-Heal locator repair feature.
 * Full implementation attaches healed locator suggestions to the test report.
 */

export interface HealCandidate {
    selector: string;
    strategy: string;
    matchCount: number;
    visible: boolean;
    reasoning: string;
}

export interface HealReport {
    failedSelector: string;
    intent: string;
    verified: HealCandidate[];
    rejected: Array<{ selector: string; reason: string }>;
    unavailableReason?: string;
}
