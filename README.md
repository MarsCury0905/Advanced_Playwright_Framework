# 🎭 Advanced Playwright Framework

A production-grade, enterprise-ready **Playwright + TypeScript** test automation framework featuring the **Page Object Model (POM)**, custom test fixtures, end-to-end API automation with auto-healing tokens, JSONPath querying, AI-powered failure analysis, custom HTML reporting with historical trends, and multi-environment support.

> Built on top of [The Testing Academy](https://thetestingacademy.com)'s TTACart demo application and [Restful-Booker](https://restful-booker.herokuapp.com) API platform.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Page Object Model** | Modular, encapsulated page objects extending abstract `BasePage` with `UtilElementLocator` |
| **Custom Test Fixtures** | Dependency-injected page objects (`@fixtures/test-base`) and API clients (`@fixtures/booker.fixture`) |
| **API Testing Suite** | Multi-tier API architecture (Raw Playwright requests, reusable `ApiHelper`, and type-safe `BookingApi` client) |
| **Auth & Token Recovery** | Managed token lifecycle that automatically handles re-authentication and retries on expired sessions |
| **JSONPath Plus Querying** | Advanced querying, filtering, slicing, and recursive descent on complex API responses |
| **E2E Checkout Flow** | Complete user journey testing from login to inventory, cart, checkout steps, and order completion |
| **Visual Step Reporting** | Step-by-step reporting with automatic screenshot capture per step (`visualStep`) |
| **Multi-Environment** | Dynamically resolve base URLs for `qa`, `dev`, `stg`, `prod`, and `api` targets |
| **AI-Powered RCA** | Root Cause Analysis agent that triages failures by severity, category, and suggested fixes |
| **Flaky Test Detector** | Compares consecutive test runs to detect flaky tests that flip between pass and fail |
| **Custom HTML Reporter** | Rich, self-contained HTML reports with trend history, traces, and video recordings |
| **Faker Data Factory** | Centralized test data generation via `@faker-js/faker` with deterministic offset capabilities |
| **Winston Logging** | Scoped, colorized console + file logging (`logs/combined.log`) with adjustable levels |
| **CI/CD Ready** | GitHub Actions pipeline executing tests and publishing artifacts on push and PR |
| **ESLint Integration** | TypeScript-aware static analysis with flat config, TS 7.0-compatible via side-by-side TS 6 shim |
| **AI Quality Gates** | 4 mandatory gates (AI-Slop, Duplication, Over-Engineering, Framework Patterns) enforced on all AI coding agents |

---

## 📁 Project Structure

```
├── .env.example                               # Environment variable template
├── eslint.config.mjs                          # ESLint flat config (TypeScript-aware rules)
├── eslint-ts6-shim.cjs                        # Module shim for TS 7.0 ↔ TS 6 linting compat
├── AGENTS.md                                  # Root AI agent instructions (points to .agents/)
├── .cursorrules                               # Cursor AI agent instructions
├── .agents/
│   ├── AGENTS.md                              # Master quality gate enforcement rules
│   ├── rules/
│   │   └── ponytail.md                        # Ponytail lazy-senior-dev rules
│   └── skills/
│       ├── ai-slop/SKILL.md                   # Gate 1: AI-Slop detector
│       ├── ponytail-duplication/SKILL.md       # Gate 2: Duplication gate
│       ├── over-engineering/SKILL.md           # Gate 3: Over-engineering detector
│       └── framework-patterns/SKILL.md        # Gate 4: Framework patterns enforcer
├── .github/
│   ├── copilot-instructions.md                # GitHub Copilot agent instructions
│   └── workflows/
│       └── playwright.yml                     # CI/CD pipeline
├── .vscode/
│   └── settings.json                          # VS Code / Playwright extension settings
├── docs/                                      # Documentation
├── logs/                                      # Runtime execution logs (gitignored)
│   └── combined.log
├── playwright.config.ts                       # Playwright test runner configuration
├── reports/
│   └── runs/                                  # JSON run execution metadata
├── rules/                                     # Custom guidelines and rules
│   └── ponytail.md                            # Ponytail lazy senior dev ruleset
├── src/
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── flakyAnalyzer.ts               # Flaky test detection logic
│   │   │   └── rcaAgent.ts                    # AI Root Cause Analysis agent
│   │   └── config/
│   │       └── providers.ts                   # AI provider key detection
│   ├── api/
│   │   └── BookingApi.ts                      # Restful-Booker API client with token auto-refresh
│   ├── config/
│   │   ├── credentials.ts                     # Centralized credentials configuration
│   │   └── env.ts                             # Environment variable helpers (envOr, requireEnv)
│   ├── fixtures/
│   │   ├── booker.fixture.ts                  # Restful-Booker API fixtures (bookingApi, bookerToken)
│   │   └── test-base.ts                       # Extended test base with all TTACart page fixtures
│   ├── pages/
│   │   ├── BasePage.ts                        # Abstract base Page Object with locator utilities
│   │   ├── CartPage.ts                        # TTACart shopping cart Page Object
│   │   ├── CheckOutCompletePage.ts            # TTACart order confirmation Page Object
│   │   ├── CheckOutPageOne.ts                 # TTACart checkout guest info Page Object
│   │   ├── CheckOutPageTwo.ts                 # TTACart checkout review & payment Page Object
│   │   ├── InventryPage.ts                    # TTACart product catalog Page Object
│   │   ├── ItemDetailPage.ts                  # TTACart product detail Page Object
│   │   └── LoginPage.ts                       # TTACart login Page Object
│   ├── testdata/
│   │   ├── booking.data.ts                    # Booking payload generator & test data factories
│   │   └── schemas/                           # JSON schemas for contract validation
│   │       └── create-booking.schema.json
│   ├── tests/
│   │   ├── aiTest/                            # AI-powered test specs
│   │   ├── apisTests/                         # Comprehensive API test suite
│   │   │   ├── 01_restfulBooker_raw/          # Raw Playwright APIRequestContext tests
│   │   │   │   ├── 01_Basic_ping.spec.ts      # Health check / ping test
│   │   │   │   ├── 02_Post_Operation.spec.ts  # POST /booking creation
│   │   │   │   ├── 03_Put_Operation.spec.ts   # PUT /booking update with auth
│   │   │   │   ├── 04_NewContext_api.spec.ts  # Isolated APIRequestContext tests
│   │   │   │   └── 05_Crud.spec.ts            # Complete CRUD lifecycle test
│   │   │   ├── 02_ResfulBooker_apiHelper/     # Tests using the generic ApiHelper wrapper
│   │   │   │   ├── create-booking.spec.ts     # Booking creation with helper
│   │   │   │   └── update-booking.spec.ts     # Booking update with helper
│   │   │   ├── 03_restfulbooker-fixture-e2e-api/ # Production-grade fixture-based tests
│   │   │   │   ├── booking_crud.e2e.spec.ts   # E2E CRUD with BookingApi fixture
│   │   │   │   ├── booking-crud-end-to-end.ponytail.spec.ts # End-to-end booking flow
│   │   │   │   └── booking_negative.spec.ts   # Negative tests (auth 403, 404, invalid payload)
│   │   │   ├── 04_jsonPath_plus/              # Deep JSON querying with JSONPath Plus
│   │   │   │   ├── jsonPath-queries.spec.ts   # Real-world query & filter assertions
│   │   │   │   ├── jsonpath-cheatsheet.md     # Complete JSONPath syntax cheatsheet
│   │   │   │   └── store.json                 # Reference dataset for queries
│   │   │   └── 05_ajv_json_schema/            # JSON Schema validation with Ajv
│   │   │       └── create-booking-json-schema.spec.ts # Schema contract test
│   │   ├── e2e/                               # Full E2E UI test journeys
│   │   │   ├── e2e-checkout.spec.ts           # E2E checkout journey with fixtures
│   │   │   └── e2e-checkout-steps.spec.ts     # Step-by-step visual E2E checkout
│   │   └── login/
│   │       └── loginPage.spec.ts              # TTACart UI authentication tests
│   └── utils/
│       ├── ApiHelper.ts                       # Generic HTTP client (retry, methods, parsing)
│       ├── CustomReporter.ts                  # HTML report generator with historical trends
│       ├── DataGenerator.ts                   # Faker-backed test data factory
│       ├── EnvUtil.ts                         # Singleton environment loader & accessor
│       ├── KBlogger.md                        # Winston logger documentation & usage guide
│       ├── Logger.ts                          # Winston logger with scoped child loggers
│       ├── SchemaValidator.ts                 # Runtime JSON Schema validator via Ajv
│       ├── UtilElementLocator.ts              # Fluent interaction wrapper around Locator
│       ├── selfHeal.ts                        # Self-healing locator type definitions
│       └── visualStep.ts                      # Visual step wrapper with screenshot capture
├── tests/                                     # Legacy test specifications
│   └── loginPage.spec.ts
├── tsconfig.json                              # TypeScript compiler configuration & path aliases
└── tta-report/                                # Generated custom HTML reports (gitignored)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MarsCury0905/Advanced_Playwright_Framework.git
cd Advanced_Playwright_Framework

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps

# 4. Create your local .env file from the template
cp .env.example .env
# Edit .env and configure your environment variables
```

---

## 🧪 Running Tests

### Standard NPM Scripts

```bash
# Run all tests across all projects
npm test

# Run UI tests in headed browser mode
npm run test:headed

# Run with Playwright interactive UI Mode
npm run test:ui

# Run with Playwright inspector / debugger
npm run test:debug

# Run Chromium UI project only
npm run test:chromium

# Launch Playwright code generator
npm run codegen

# View the default Playwright HTML report
npm run test:report
```

### Running Specific Projects & Suites

The framework defines three configured Playwright projects in `playwright.config.ts`:

| Project | Test Directory | Description |
|---|---|---|
| `chromium` | `src/tests/` (excl. `apisTests/`, `aiTest/`) | UI tests running in Chromium with maximized viewport |
| `api` | `src/tests/apisTests/` | Pure HTTP API tests (headless, no browser launched) |
| `ai` | `src/tests/aiTest/` | AI-powered tests with extended timeouts (180s) |

```bash
# Run all API tests (no browser launched)
npx playwright test --project=api

# Run E2E UI checkout suite
npx playwright test src/tests/e2e/

# Run JSONPath query test suite
npx playwright test src/tests/apisTests/04_jsonPath_plus/

# Run fixture-based Booker API tests
npx playwright test src/tests/apisTests/03_restfulbooker-fixture-e2e-api/

# Run tests by tag
npx playwright test --grep "@P0"
npx playwright test --grep "@Regression"
```

---

## ⚙️ Configuration

### Environment Variables

Configure your local `.env` file (based on `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `TTA_ENV` | `qa` | Active environment target: `qa`, `dev`, `stg`, `prod`, `api` |
| `BASE_URL` | `https://app.thetestingacademy.com` | Primary UI base URL override |
| `API_BASE_URL` | `https://restful-booker.herokuapp.com` | Base URL for Restful-Booker API tests |
| `STANDARD_USER` | `standard_user` | TTACart test username |
| `TTA_SECRET` | `tta_secret` | TTACart test password |
| `ATTACH_SCREENSHOTS` | `false` | Capture screenshots on step / test failure |
| `LOG_LEVEL` | `info` | Winston logging level (`error`, `warn`, `info`, `http`, `debug`, `silly`) |
| `OPENAI_API_KEY` | — | OpenAI API key for AI-driven RCA (optional) |
| `GEMINI_API_KEY` | — | Gemini API key for AI-driven RCA (optional) |
| `ANTHROPIC_API_KEY` | — | Anthropic API key for AI-driven RCA (optional) |

### Multi-Environment Target Resolution

The `playwright.config.ts` dynamically resolves `baseURL` based on `TTA_ENV`:

```bash
TTA_ENV=qa   npx playwright test       # → https://app.thetestingacademy.com
TTA_ENV=stg  npx playwright test       # → https://stage.thetestingacademy.com
TTA_ENV=prod npx playwright test       # → https://app.thetestingacademy.com
TTA_ENV=dev  npx playwright test       # → http://localhost:3000
TTA_ENV=api  npx playwright test       # → https://restful-booker.herokuapp.com
```

---

## 🏗️ Architecture

### 1. Page Object Model with Custom Fixtures

Rather than manually constructing page objects in each test via `new LoginPage(page)`, the framework leverages Playwright fixtures in `@fixtures/test-base`:

```typescript
import { test, expect } from '@fixtures/test-base';

test('Should complete checkout', async ({ inventoryPage, cartPage, checkoutStepOnePage }) => {
    await inventoryPage.open();
    await inventoryPage.addToCart('test-allthethings-tshirt-red');
    await cartPage.open();
    expect(await cartPage.rowCount()).toBe(1);
    await cartPage.checkout();
});
```

### 2. Multi-Tier API Architecture

The framework accommodates multiple levels of API testing maturity:

1. **Level 1 — Raw Requests (`01_restfulBooker_raw/`)**: Direct Playwright `request` calls demonstrating HTTP fundamentals (headers, status, payloads).
2. **Level 2 — Generic Helper (`02_ResfulBooker_apiHelper/`)**: Uses `ApiHelper` for centralized request dispatching, retries, and status verification.
3. **Level 3 — Type-Safe Service Client (`03_restfulbooker-fixture-e2e-api/`)**: `BookingApi` client with typed interfaces (`Booking`, `BookingDates`), CRUD methods, and automatic token re-minting on `403 Forbidden` responses.
4. **Level 4 — Fixture Integration (`booker.fixture.ts`)**: Injects `bookingApi` and `bookerToken` directly into test parameters.

```typescript
import { test, expect } from '@fixtures/booker.fixture';
import { buildBooking } from '@testdata/booking.data';

test('Create and verify booking', async ({ bookingApi }) => {
    const payload = buildBooking({ firstname: 'John', lastname: 'Doe' });
    const response = await bookingApi.createBooking(payload);
    expect(response.booking.firstname).toBe('John');
});
```

### 3. JSONPath Plus Querying

Query complex JSON payloads without brittle nested object indexing:

```typescript
import { JSONPath } from 'jsonpath-plus';

// Recursive descent to extract all prices across the document
const prices = JSONPath({ path: '$..totalprice', json: responseBody });

// Filter items where booking ID is positive
const active = JSONPath({ path: '$[?(@.bookingid > 0)]', json: bookingList });
```

### 4. Visual Step Reporting (`visualStep.ts`)

Enhances standard `test.step` with automatic per-step screenshot capture attached directly into the custom HTML report when `ATTACH_SCREENSHOTS=true`:

```typescript
await visualStep(page, 'Add product to cart', async () => {
    await inventoryPage.addToCart('tta-backpack');
});
```

### 5. UtilElementLocator

A resilient wrapper around Playwright's `Locator` API that supports CSS selectors, XPath, and Locator instances:
- **Actions**: `click`, `doubleClick`, `rightClick`, `hover`
- **Text & Input**: `fill`, `type`, `clear`, `pressSequentially`, `getText`, `getValue`
- **Verifications**: `isVisible`, `isEnabled`, `isChecked`, `count`
- **Explicit Waits**: `waitForVisible`, `waitForHidden`, `waitForPageLoad`

### 6. AI-Powered RCA & Flaky Detection

- **`rcaAgent`**: Automatically analyzes failed test stack traces and error messages, returning an actionable verdict with root-cause categorization, severity, and suggested remediations.
- **`flakyAnalyzer`**: Analyzes consecutive test run summaries in `reports/runs/` to flag unstable tests that fluctuate between pass and fail states.

---

## 📊 Reporting

The framework includes a **Custom HTML Reporter** (`src/utils/CustomReporter.ts`):
- ✅ Pass / ❌ Fail / ⏭️ Skip statistics
- 🎥 Embedded failure video recordings
- 🔍 Playwright trace links for debugging
- 📈 Historical execution trends across test runs
- 📸 Step-by-step visual screenshots
- 🤖 Integrated AI root cause analysis summaries

Reports are output to `tta-report/` and run histories are saved to `reports/runs/`.

---

## 🔄 CI/CD

The included GitHub Actions workflow (`.github/workflows/playwright.yml`) triggers on:
- **Pushes** to `main`
- **Pull Requests** targeting `main`

The pipeline installs dependencies, provisions Playwright browser binaries with system dependencies, executes tests in headless mode, and archives the HTML report as a 30-day downloadable artifact.

---

## 🔍 Linting (ESLint)

The framework includes **ESLint v10** with **typescript-eslint** for static code analysis across all TypeScript source and test files.

### Installation

ESLint and its dependencies are included in the project's `devDependencies`. After cloning, they are installed automatically with:

```bash
npm install
```

If you need to install the linting packages manually (e.g., adding to an existing project):

```bash
npm install --save-dev eslint @eslint/js typescript-eslint globals @typescript-eslint/parser typescript-6@npm:typescript@6.0.x --legacy-peer-deps
```

> **⚠️ TypeScript 7.0 Compatibility Note:**
> TypeScript 7.0 is a Go-based rewrite and does not expose the Node.js programmatic API that `typescript-eslint` requires. This project uses a **side-by-side TypeScript 6** installation (`typescript-6` alias) with a module resolution shim (`eslint-ts6-shim.cjs`) to redirect `require("typescript")` to TS 6 only during linting. Your project's build and runtime continue to use TypeScript 7.0.

### Configuration

ESLint uses the **flat config** format (`eslint.config.mjs`). Key configuration:

| Setting | Value |
|---|---|
| Config format | ESLint flat config (v9+) |
| Config file | `eslint.config.mjs` |
| TypeScript parser | `@typescript-eslint/parser` |
| Rule presets | `@eslint/js` recommended + `typescript-eslint` recommended |
| TS 7.0 shim | `eslint-ts6-shim.cjs` (auto-loaded via npm scripts) |

**Enabled rules include:**

- `prefer-const` / `no-var` — enforce modern variable declarations
- `eqeqeq` — require strict equality (`===` / `!==`)
- `no-console` — warn on console statements (disabled in test files)
- `@typescript-eslint/no-explicit-any` — warn on `any` usage (disabled in test files)
- `@typescript-eslint/no-unused-vars` — warn on unused variables (ignoring `_` prefixed)
- `no-duplicate-imports` — prevent duplicate import statements
- `curly` — require curly braces for multi-line blocks

**Ignored paths:** `node_modules/`, `dist/`, `playwright-report/`, `test-results/`, `tta-report/`, `reports/`, `logs/`

### Usage

```bash
# Run ESLint across the entire project
npm run lint

# Run ESLint and auto-fix fixable issues
npm run lint:fix

# Run TypeScript type checking (tsc --noEmit)
npm run typecheck

# Run both typecheck + ESLint in sequence
npm run lint:all
```

---

## 🚦 AI Quality Gates

This framework enforces **4 mandatory quality gates** on all AI-generated code contributions. These gates ensure that code produced by **GitHub Copilot, Claude, Gemini, Codex, Cursor, Windsurf, Devin, Kiro, CommandCode, OpenCode, Aider, Continue, Cody, Tabnine, Amazon Q**, or any other AI coding agent meets the project's quality standards.

### The 4 Gates

| # | Gate | Question It Answers | Skill Location |
|---|------|---------------------|----------------|
| 1 | **🚨 AI-Slop** | Was this generated, skimmed, and shipped? | `.agents/skills/ai-slop/SKILL.md` |
| 2 | **♻️ Ponytail** | Does anything else in the repo already do this? | `.agents/skills/ponytail-duplication/SKILL.md` |
| 3 | **🏗️ Over-Engineering** | How many callers does this abstraction have? | `.agents/skills/over-engineering/SKILL.md` |
| 4 | **🎭 Framework Patterns** | Is this still part of this framework? | `.agents/skills/framework-patterns/SKILL.md` |

### How It Works

1. AI agents auto-discover rules via `AGENTS.md` (root), `.agents/AGENTS.md`, `.cursorrules`, or `.github/copilot-instructions.md`.
2. Before proposing any code change, the agent must evaluate the diff against all 4 gates **in order**.
3. Each gate produces a verdict: **✅ PASS**, **⚠️ REVIEW** (with justification), or **🚨 FAIL** (hard block).
4. A 🚨 verdict at any gate means the code must be fixed before it can land.

### Gate Details

**Gate 1 — AI-Slop:** Detects zombie comments, hallucinated APIs, copy-paste artifacts, confidence-theater assertions (`expect(true).toBe(true)`), and dead flexibility (generics with only one instantiation).

**Gate 2 — Ponytail Duplication:** Contains a full lookup table of 20+ existing utilities in this framework. Catches re-invention of `ApiHelper`, `EnvUtil`, `createLogger`, `DataGenerator`, and similar. Also flags unnecessary npm dependencies when Node.js built-ins suffice.

**Gate 3 — Over-Engineering:** Applies the caller-count test: 0 callers = dead code, 1 caller = inline it, 2 = justify it, 3+ = keep it. Includes a whitelist of 10 justified abstractions specific to this framework (e.g., `BasePage`, `createAgent`, `UtilElementLocator`).

**Gate 4 — Framework Patterns:** Validates 11 canonical patterns: Page Object Model (extend `BasePage`), fixture injection (not `new PageObject(page)`), Winston logging, `EnvUtil` for config, API test tiers, path aliases, agent factory, file naming, and more.

### Enforcement Files

| File | AI Tool Coverage |
|------|------------------|
| `AGENTS.md` | Gemini, Claude, generic agents |
| `.agents/AGENTS.md` | Antigravity, `.agents/` convention tools |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.cursorrules` | Cursor AI |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | Modern end-to-end browser and API automation |
| [TypeScript](https://www.typescriptlang.org) | Type-safe development and path aliasing |
| [jsonpath-plus](https://github.com/JSONPath-Plus/JSONPath) | Flexible JSONPath querying on API payloads |
| [AJV](https://ajv.js.org) | JSON schema validation for API contracts |
| [@faker-js/faker](https://fakerjs.dev) | Realistic test data generation |
| [Winston](https://github.com/winstonjs/winston) | Configurable, leveled logging with scoped contexts |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [Allure Playwright](https://docs.qameta.io/allure/) | Enterprise test reporting support |
| [xlsx](https://sheetjs.com) & [csv-parse](https://csv.js.org/parse/) | Data-driven test file parsing |
| [ESLint](https://eslint.org) + [typescript-eslint](https://typescript-eslint.io) | TypeScript-aware static analysis and code quality |

---

## 📝 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  <sub>Built with ❤️ using Playwright + TypeScript</sub>
</p>
