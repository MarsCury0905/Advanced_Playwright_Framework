/**
 * Cucumber → TTA Custom Reporter formatter.
 *
 * Collects scenario results during a Cucumber run and feeds them into
 * the existing CustomTTAReporter.renderExternalRun() to produce the
 * same rich HTML report that Playwright tests get.
 */

import { Formatter } from '@cucumber/cucumber';
import type { TestCaseAttempt } from '@cucumber/cucumber/lib/formatter/helpers/event_data_collector';
import type { TestData, StepData, SuiteStats } from '../../utils/CustomReporter';

// Duration helper: Cucumber gives { seconds, nanos }.
function durationMs(d?: { seconds: number; nanos: number }): number {
  if (!d) return 0;
  return Number(d.seconds) * 1000 + Math.round(Number(d.nanos) / 1_000_000);
}

function mapStatus(s: string): 'passed' | 'failed' | 'skipped' {
  if (s === 'PASSED') return 'passed';
  if (s === 'FAILED') return 'failed';
  return 'skipped'; // UNDEFINED, PENDING, AMBIGUOUS, SKIPPED → skipped
}

export default class TTACucumberFormatter extends Formatter {
  private tests: TestData[] = [];
  private stats: SuiteStats = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
  private startTime = new Date();

  constructor(options: ConstructorParameters<typeof Formatter>[0]) {
    super(options);

    options.eventBroadcaster.on('envelope', (envelope: Record<string, unknown>) => {
      if (envelope.testCaseFinished) {
        this.onTestCaseFinished(envelope.testCaseFinished as { testCaseStartedId: string });
      }

      if (envelope.testRunFinished) {
        this.onRunFinished();
      }
    });
  }

  private onTestCaseFinished(ev: { testCaseStartedId: string }): void {
    const attempt: TestCaseAttempt = this.eventDataCollector.getTestCaseAttempt(ev.testCaseStartedId);
    const pickle = attempt.pickle;
    const tags = pickle.tags?.map((t: { name: string }) => t.name) ?? [];

    // Map each test step to StepData.
    const testSteps = attempt.testCase?.testSteps ?? [];
    const steps: StepData[] = [];

    for (const ts of testSteps) {
      const result = attempt.stepResults[ts.id];
      if (!result) continue;

      // Steps with a pickleStepId are Gherkin steps; others are hooks.
      const pickleStep = ts.pickleStepId
        ? pickle.steps?.find((ps: { id: string }) => ps.id === ts.pickleStepId)
        : undefined;
      const title = pickleStep ? pickleStep.text : (ts.pickleStepId ? 'Step' : 'Hook');

      steps.push({
        title,
        category: ts.pickleStepId ? 'test.step' : 'hook',
        duration: durationMs(result.duration as { seconds: number; nanos: number }),
        status: mapStatus(result.status as string),
        error: result.message ?? undefined,
        startTime: new Date().toLocaleTimeString(),
        stepIndex: steps.length,
      });
    }

    const scenarioStatus = mapStatus(
      (attempt.worstTestStepResult?.status as string) ?? 'SKIPPED',
    );
    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

    const testData: TestData = {
      id: pickle.id ?? `cucumber-${this.stats.total}`,
      title: pickle.name,
      fullTitle: `${pickle.uri} › ${pickle.name}`,
      file: pickle.uri ?? '',
      describePath: [pickle.uri ?? ''],
      location: `${pickle.uri}`,
      duration: totalDuration,
      status: scenarioStatus,
      retry: 0,
      screenshots: [],
      steps: steps.filter((s) => s.category === 'test.step'), // show Gherkin steps only
      logs: [],
      error: steps.find((s) => s.status === 'failed')?.error,
      tags,
    };

    this.tests.push(testData);
    this.stats.total++;
    this.stats[scenarioStatus]++;
  }

  private async onRunFinished(): Promise<void> {
    const endTime = new Date();

    // Lazy-import to avoid circular issues and keep the formatter light.
    const { default: CustomTTAReporter } = await import('../../utils/CustomReporter');
    const reporter = new CustomTTAReporter();

    const runId = [
      endTime.getFullYear(),
      String(endTime.getMonth() + 1).padStart(2, '0'),
      String(endTime.getDate()).padStart(2, '0'),
      '_',
      String(endTime.getHours()).padStart(2, '0'),
      String(endTime.getMinutes()).padStart(2, '0'),
      String(endTime.getSeconds()).padStart(2, '0'),
    ].join('');

    const reportPath = await reporter.renderExternalRun({
      runId,
      startTime: this.startTime,
      endTime,
      tests: this.tests,
      stats: this.stats,
      meta: { browser: 'chromium', workers: 1 },
    });

    this.log(`\n📊 TTA Report: ${reportPath}\n`);
  }
}
