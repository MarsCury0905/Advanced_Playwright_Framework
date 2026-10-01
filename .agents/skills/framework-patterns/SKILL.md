---
name: framework-patterns
description: >
  Quality Gate 4 — Framework Patterns Enforcer. Validates that new code follows
  the established patterns, conventions, and architectural decisions of this
  Advanced Playwright Framework. Trigger on every code change that adds or
  modifies files under src/.
---

# 🎭 Gate 4: Framework Patterns — Is This Still Part of This Framework?

> **Question this gate answers:** *Does this code follow the established patterns
> of this Playwright test automation framework?*

You are the **framework consistency gate** for the **Advanced Playwright Framework**.
Your job is to ensure every contribution respects the architectural decisions,
naming conventions, directory layout, and coding patterns that make this framework
cohesive.

---

## When to Trigger

Run this gate on **every PR diff** or **every code change** that adds or modifies
files under `src/`, `tests/`, or the project root config files.

---

## Framework Canon — The Patterns That Define This Project

### 1. Page Object Model

Every UI page MUST follow this structure:

```typescript
// ✅ CORRECT pattern
import { Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';  // MUST use path alias

export class MyPage extends BasePage {
    // Locators are private readonly, declared at class level
    private readonly submitBtn = this.page.locator('#submit');
    private readonly nameInput = this.page.locator('[data-test="name"]');

    constructor(page: Page) {
        super(page, 'MyPage');  // scope = class name for logging
    }

    // Public methods expose page actions
    async fillName(name: string): Promise<void> {
        await this.el.fill(this.nameInput, name);
    }
}
```

**Violations:**
- ❌ Page object that does NOT extend `BasePage`.
- ❌ Using `this.page.fill()` instead of `this.el.fill()` (bypass `UtilElementLocator`).
- ❌ Public locator fields (locators should be `private readonly`).
- ❌ Constructor that doesn't call `super(page, 'ClassName')`.
- ❌ Page objects placed outside `src/pages/`.

### 2. Test Fixtures — Not Manual Construction

Tests MUST use the fixture system, never construct page objects manually:

```typescript
// ✅ CORRECT — fixtures inject page objects
import { test, expect } from '@fixtures/test-base';

test('checkout flow', async ({ loginPage, cartPage }) => {
    // loginPage and cartPage are already constructed
});

// ❌ WRONG — manual construction
import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';

test('checkout flow', async ({ page }) => {
    const loginPage = new LoginPage(page);  // DON'T DO THIS
});
```

**UI tests** → import from `@fixtures/test-base`
**API tests** → import from `@fixtures/booker.fixture` OR `@playwright/test`
**AI tests** → import from `@fixtures/booker.fixture` OR `@playwright/test`

### 3. Logging — Winston via createLogger(scope)

All logging MUST use the framework's Winston logger:

```typescript
// ✅ CORRECT
import { createLogger } from '@utils/Logger';
const log = createLogger('BookingApi');
log.info('Created booking');

// ❌ WRONG
console.log('Created booking');
```

**Exception:** Test files (`*.spec.ts`) may use `console.log` for quick debugging
during development, but production utilities and pages must use the logger.

### 4. Environment & Config

```typescript
// ✅ CORRECT — use the centralized config
import { EnvUtil } from '@utils/EnvUtil';
const apiUrl = EnvUtil.get('API_BASE_URL', 'https://restful-booker.herokuapp.com');

// ✅ ALSO CORRECT — use the config helpers
import { envOr, requireEnv } from '@config/env';

// ❌ WRONG — direct process.env without fallback
const apiUrl = process.env.API_BASE_URL;  // No fallback, no centralization
```

### 5. API Test Architecture — The 3 Tiers

New API tests must fit into the established tier system:

| Tier | Directory | Pattern | When to Use |
|------|-----------|---------|-------------|
| **Raw** | `01_restfulBooker_raw/` | Direct `request.get/post/put/delete` | Learning, debugging, one-off investigations |
| **Helper** | `02_ResfulBooker_apiHelper/` | `ApiHelper.get/post/put/delete` | Reusable request dispatching with retries |
| **Fixture** | `03_restfulbooker-fixture-e2e-api/` | `BookingApi` via `booker.fixture` | Production-grade E2E API tests |

- New production API tests → **Tier 3** (fixture-based).
- Don't mix tiers within a single spec file.

### 6. Test Data — Faker via DataGenerator / buildBooking()

```typescript
// ✅ CORRECT — use the factory
import { buildBooking } from '@testdata/booking.data';
const booking = buildBooking({ firstname: 'John' });

// ✅ CORRECT — use DataGenerator for generic data
import { DataGenerator } from '@utils/DataGenerator';
const name = DataGenerator.fullName();

// ❌ WRONG — inline random data without the factory
const booking = {
    firstname: 'Test' + Math.random(),  // Use Faker, not Math.random()
    ...
};
```

### 7. Path Aliases — Always Use Them

This project defines path aliases in `tsconfig.json`. Always use them:

| Alias | Maps To |
|-------|---------|
| `@api/*` | `./src/api/*` |
| `@config/*` | `./src/config/*` |
| `@fixtures/*` | `./src/fixtures/*` |
| `@pages/*` | `./src/pages/*` |
| `@testdata/*` | `./src/testdata/*` |
| `@utils/*` | `./src/utils/*` |

```typescript
// ✅ CORRECT
import { LoginPage } from '@pages/LoginPage';

// ❌ WRONG — relative path when alias exists
import { LoginPage } from '../../pages/LoginPage';
```

**Exception:** Files within the same directory may use relative imports
(e.g., `./LLMClient` within `src/ai/`).

### 8. AI Agent Pattern — Use agentFactory

New AI agents MUST use the `createAgent()` factory:

```typescript
// ✅ CORRECT — use the factory pattern
import { createAgent, AgentDefinition } from '../agentFactory';

const myAgentDef: AgentDefinition<MyInput, MyOutput> = {
    name: 'my-agent',
    systemPrompt: '...',
    userPrompt: (input) => '...',
    schema: mySchema,
    fallback: (input, reason) => defaultOutput,
};

export const analyzeMyThing = createAgent(myAgentDef);
```

- Agent definitions go in `src/ai/agents/`.
- Schemas are inline JSON Schema objects (validated by `SchemaValidator`).
- Every agent MUST have a `fallback` function.

### 9. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Page Objects | `PascalCase.ts` | `LoginPage.ts`, `CartPage.ts` |
| Utilities | `PascalCase.ts` | `ApiHelper.ts`, `Logger.ts` |
| Test specs | `kebab-case.spec.ts` | `e2e-checkout.spec.ts` |
| Test data | `kebab-case.data.ts` | `booking.data.ts` |
| Fixtures | `kebab-case.fixture.ts` | `booker.fixture.ts` |
| JSON Schemas | `kebab-case.schema.json` | `create-booking.schema.json` |
| Config | `camelCase.ts` | `credentials.ts`, `env.ts` |

### 10. Playwright Config Alignment

New test projects must be registered in `playwright.config.ts` with:
- A `name` matching the directory convention.
- Correct `testDir` pointing to the spec location.
- Appropriate `testIgnore` patterns if needed.
- Proper `baseURL` resolution.

### 11. Reporting & Visual Steps

E2E tests that need step-by-step reporting MUST use `visualStep`:

```typescript
import { visualStep } from '@utils/visualStep';

await visualStep(page, 'Login as standard user', async () => {
    await loginPage.login('standard_user', 'tta_secret');
});
```

---

## Verdict Format

| Verdict | Meaning |
|---------|---------|
| ✅ **PASS** | Code follows all framework patterns. |
| ⚠️ **DRIFT** | Minor pattern deviation. Easy to fix. |
| 🚨 **FOREIGN** | Code doesn't belong in this framework — wrong patterns, wrong location, wrong conventions. |

For each finding:

```
<file>:<line> — [PATTERN_NAME] — <what's wrong> → <what it should be>
```

### Example

```
src/pages/NewPage.ts:5 — [PAGE_OBJECT] — does not extend BasePage → must extend BasePage
src/tests/e2e/login.spec.ts:8 — [FIXTURE] — constructs LoginPage manually → use { loginPage } fixture
src/utils/NewHelper.ts:3 — [LOGGING] — uses console.log → use createLogger('NewHelper')
src/api/NewClient.ts:1 — [PATH_ALIAS] — uses relative import ../../utils/Logger → use @utils/Logger
```

---

## Non-Negotiable Rules

1. **Every Page Object extends BasePage.** No exceptions.
2. **Every utility uses createLogger, not console.** No exceptions (except specs).
3. **UI tests use fixtures.** Manual `new PageObject(page)` in test bodies is banned.
4. **Path aliases are mandatory** for cross-directory imports.
5. **New AI agents use createAgent().** Don't raw-dog LLM API calls.
6. **Test files end in `.spec.ts`.** Not `.test.ts`, not `.e2e.ts`.
7. **Respect the directory structure.** Pages in `pages/`, utils in `utils/`,
   fixtures in `fixtures/`, tests in `tests/`. Don't invent new top-level dirs
   without justification.
