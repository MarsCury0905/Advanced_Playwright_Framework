# 🎭 Advanced Playwright Framework

A production-grade, enterprise-ready **Playwright + TypeScript** test automation framework featuring the **Page Object Model (POM)**, AI-powered failure analysis, custom HTML reporting with historical trends, and multi-environment support.

> Built on top of [The Testing Academy](https://thetestingacademy.com)'s TTACart demo application.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Page Object Model** | Abstract `BasePage` with reusable locator utilities (`UtilElementLocator`) |
| **Multi-Environment** | Dynamically resolve base URLs for `qa`, `dev`, `stg`, `prod`, and `api` targets |
| **AI-Powered RCA** | Root Cause Analysis agent that triages failures by severity and priority |
| **Flaky Test Detector** | Compares consecutive builds to surface tests that flip between pass/fail |
| **Custom HTML Reporter** | Rich, self-contained HTML reports with trend history, traces, and video recordings |
| **Faker Data Generator** | Centralised test-data factory backed by `@faker-js/faker` with `.env` overrides |
| **Winston Logging** | Scoped, colourised console + file logging (`logs/combined.log`) |
| **Self-Heal Types** | Type definitions for locator repair / healing suggestions in reports |
| **CI/CD Ready** | GitHub Actions workflow for Playwright on every push / PR |

---

## 📁 Project Structure

```
├── .env.example               # Environment variable template
├── .github/
│   └── workflows/
│       └── playwright.yml     # CI pipeline
├── .vscode/
│   └── settings.json          # VS Code / Playwright plugin config
├── docs/                      # Documentation (future use)
├── logs/                      # Runtime log output (gitignored)
│   └── combined.log
├── playwright.config.ts       # Playwright configuration
├── reports/
│   └── runs/                  # JSON run metadata
├── rules/                     # Custom rule definitions (future use)
├── src/
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── flakyAnalyzer.ts   # Flaky test detection logic
│   │   │   └── rcaAgent.ts        # Root Cause Analysis agent
│   │   └── config/
│   │       └── providers.ts       # AI provider key detection
│   ├── api/                       # API helpers (future use)
│   ├── config/
│   │   └── env.ts                 # envOr / requireEnv helpers
│   ├── fixtures/                  # Playwright fixtures (future use)
│   ├── pages/
│   │   ├── BasePage.ts            # Abstract base Page Object
│   │   └── LoginPage.ts           # TTACart login Page Object
│   ├── testdata/                  # External test data files (future use)
│   ├── tests/
│   │   ├── aiTest/                # AI-related test specs (future use)
│   │   ├── apisTests/             # API test specs (future use)
│   │   └── loginPage.spec.ts      # UI login test
│   └── utils/
│       ├── CustomReporter.ts      # HTML report generator
│       ├── DataGenerator.ts       # Faker-backed data factory
│       ├── Logger.ts              # Winston logger with scoped children
│       ├── UtilElementLocator.ts  # Reusable element interaction wrapper
│       └── selfHeal.ts            # Self-healing locator type definitions
├── tests/                         # Legacy / additional test specs
│   └── loginPage.spec.ts
├── tsconfig.json
└── tta-report/                    # Generated TTA HTML reports (gitignored)
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

# 4. Create your local .env from the template
cp .env.example .env
# Edit .env and set your values
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run with Playwright UI mode
npm run test:ui

# Run with debugger
npm run test:debug

# Run Chromium project only
npm run test:chromium

# Launch code generator
npm run codegen

# View the HTML report
npm run test:report
```

### Running Specific Projects

The framework defines three Playwright projects:

| Project | Test Dir | Description |
|---|---|---|
| `chromium` | `src/tests/` (excl. `apisTests/`, `aiTest/`) | UI tests in Chromium |
| `api` | `src/tests/apisTests/` | API-only tests (no browser) |
| `ai` | `src/tests/aiTest/` | AI-powered tests (extended timeout) |

```bash
# Run only the API project
npx playwright test --project=api

# Run only the AI project
npx playwright test --project=ai
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` → `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `TTA_ENV` | `qa` | Active environment: `qa`, `dev`, `stg`, `prod`, `api` |
| `BASE_URL` | `https://app.thetestingacademy.com` | Overrides all environment resolution |
| `LOG_LEVEL` | `info` | Winston log level: `error`, `warn`, `info`, `debug` |
| `ATTACH_SCREENSHOTS` | `false` | Attach screenshots on failure |
| `OPENAI_API_KEY` | — | Enables AI-powered RCA (optional) |
| `GEMINI_API_KEY` | — | Alternative AI provider (optional) |
| `ANTHROPIC_API_KEY` | — | Alternative AI provider (optional) |

### Multi-Environment Support

The `playwright.config.ts` dynamically resolves `baseURL` based on `TTA_ENV`:

```bash
TTA_ENV=stg npx playwright test           # → https://stage.thetestingacademy.com
TTA_ENV=prod npx playwright test          # → https://app.thetestingacademy.com
TTA_ENV=dev npx playwright test           # → http://localhost:3000
```

---

## 🏗️ Architecture

### Page Object Model

```
BasePage (abstract)
├── page: Page           — Playwright page handle
├── el: UtilElementLocator — Action wrapper (click, fill, wait…)
├── log: Logger          — Scoped Winston logger
└── goto(path)           — Navigation with load-state wait

LoginPage extends BasePage
├── open()
├── loginAs(user, pass)
└── waitForLoginButtonHidden()
```

### UtilElementLocator

A fluent wrapper around Playwright's `Locator` API that accepts both CSS selectors and Locator objects (`Flex` type). Provides:

- **Mouse**: `click`, `doubleClick`, `rightClick`, `hover`
- **Input**: `fill`, `type`, `clear`, `pressSequentially`
- **Read**: `getText`, `getInnerText`, `getAllTexts`, `getAttr`, `getValue`
- **State**: `isVisible`, `isEnabled`, `isChecked`, `count`
- **Waits**: `waitForVisible`, `waitForHidden`, `waitForPageLoad`
- **Select**: `selectByText`, `selectByValue`, `selectByIndex`

### AI Agents

- **`rcaAgent`** — Analyses a test failure and returns a `RcaVerdict` with severity, priority, root cause summary, and suggested fixes.
- **`flakyAnalyzer`** — Compares two `BuildSummary` objects and flags tests whose status changed between runs.

---

## 📊 Reporting

The framework ships with a **Custom HTML Reporter** (`src/utils/CustomReporter.ts`) that generates rich, self-contained HTML reports with:

- ✅ Pass / ❌ Fail / ⏭️ Skip counts
- 🎥 Embedded video recordings
- 🔍 Trace file links
- 📈 Historical trend charts across multiple runs
- 🤖 AI-generated root cause analysis (when an API key is configured)

Reports are saved to `tta-report/` and run metadata to `reports/runs/`.

---

## 🔄 CI/CD

The included GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on:
- **Push** to `main` / `master`
- **Pull requests** targeting `main` / `master`

It installs dependencies, downloads Playwright browsers, executes all tests, and uploads the HTML report as a build artifact (retained for 30 days).

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | Browser automation & testing |
| [TypeScript](https://www.typescriptlang.org) | Type-safe language |
| [@faker-js/faker](https://fakerjs.dev) | Realistic test data generation |
| [Winston](https://github.com/winstonjs/winston) | Structured logging |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable loading |
| [AJV](https://ajv.js.org) | JSON Schema validation (API tests) |
| [Allure](https://docs.qameta.io/allure/) | Optional Allure reporting |
| [xlsx](https://sheetjs.com) | Excel file parsing for data-driven tests |

---

## 📝 License

ISC

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <sub>Built with ❤️ using Playwright + TypeScript</sub>
</p>
