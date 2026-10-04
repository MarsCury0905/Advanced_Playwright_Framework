import { BeforeAll, AfterAll, Before, After, AfterStep, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { Browser, chromium } from 'playwright';
import { CucumberWorld, BASE_URL } from './world';

// Playwright operations timeout
setDefaultTimeout(60_000);

let browser: Browser;

BeforeAll(async function () {
  const isHeaded = process.env.HEADED === '1' || process.env.HEADED === 'true';
  browser = await chromium.launch({ headless: !isHeaded });
});

AfterAll(async function () {
  await browser?.close();
});

Before(async function (this: CucumberWorld) {
  this.context = await browser.newContext({ baseURL: BASE_URL });
  this.page = await this.context.newPage();
  this.initPages();
});

/**
 * Runs after each step — if the step fails, take a screenshot and attach to the report
 */
AfterStep(async function (this: CucumberWorld, step) {
  if (step.result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }
});

/**
 * After each scenario — close page & context
 */
After(async function (this: CucumberWorld) {
  await this.page?.close();
  await this.context?.close();
});
