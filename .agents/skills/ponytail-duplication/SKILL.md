---
name: ponytail-duplication
description: >
  Quality Gate 2 — Ponytail Duplication Gate. Checks whether any new code
  duplicates functionality that already exists elsewhere in the framework.
  Trigger on every code change that adds new functions, classes, or utilities.
---

# ♻️ Gate 2: Ponytail — Does Something Else Already Do This?

> **Question this gate answers:** *Does anything else in the repo already record / do / handle this?*

You are the **duplication gate** for the **Advanced Playwright Framework**.
Before any new code lands, you verify that it doesn't re-invent something the
framework already provides.

---

## When to Trigger

Run this gate on **every PR diff** or **every code change** that:
- Adds a **new file** under `src/`.
- Adds a **new exported function, class, or constant** to an existing file.
- Adds a **new npm dependency** to `package.json`.

---

## The Duplication Ladder

For each new piece of code, climb this ladder. Stop at the first rung that holds:

### Rung 1 — Does this framework already have it?

Check these canonical locations before writing anything new:

| Need | Existing Solution | Location |
|------|-------------------|----------|
| HTTP requests | `ApiHelper` (generic) or `BookingApi` (typed) | `@utils/ApiHelper.ts`, `@api/BookingApi.ts` |
| Logging | `createLogger(scope)` via Winston | `@utils/Logger.ts` |
| Environment variables | `EnvUtil.get(key, fallback)` | `@utils/EnvUtil.ts` |
| Env helpers | `envOr()`, `requireEnv()` | `@config/env.ts` |
| Credentials | `getCredentials()` | `@config/credentials.ts` |
| Test data generation | `DataGenerator` (Faker-backed) | `@utils/DataGenerator.ts` |
| Booking test data | `buildBooking()`, `buildBookingDates()` | `@testdata/booking.data.ts` |
| JSON schema validation | `SchemaValidator.validate()` | `@utils/SchemaValidator.ts` |
| Element interactions | `UtilElementLocator` (fluent wrapper) | `@utils/UtilElementLocator.ts` |
| Page Object base | `BasePage` (abstract, with `el`, `log`, `goto`) | `@pages/BasePage.ts` |
| UI test fixtures | `test-base` (all page objects injected) | `@fixtures/test-base.ts` |
| API test fixtures | `booker.fixture` (`bookingApi`, `bookerToken`) | `@fixtures/booker.fixture.ts` |
| Screenshots per step | `visualStep(page, name, fn)` | `@utils/visualStep.ts` |
| Custom reporting | `CustomReporter` (HTML + trends) | `@utils/CustomReporter.ts` |
| Self-healing locators | `selfHeal` types | `@utils/selfHeal.ts` |
| AI agent creation | `createAgent(def)` via `agentFactory` | `src/ai/agentFactory.ts` |
| LLM client access | `getLLMClient()` | `src/ai/LLMClient.ts` |
| Root cause analysis | `rcaAgent` | `src/ai/agents/rcaAgent.ts` |
| Flaky test detection | `flakyAnalyzer` | `src/ai/agents/flakyAnalyzer.ts` |

### Rung 2 — Does an installed dependency already do it?

Check `package.json` devDependencies before adding a new one:

| Already Installed | Covers |
|-------------------|--------|
| `@playwright/test` | Browser automation, API requests, assertions, fixtures, test runner |
| `@faker-js/faker` | All fake data (names, dates, addresses, etc.) |
| `ajv` + `ajv-formats` | JSON schema validation with format support |
| `jsonpath-plus` | Deep JSON querying, filtering, recursive descent |
| `winston` | Logging (console + file, scoped, leveled) |
| `dotenv` | `.env` file loading |
| `csv-parse` | CSV data parsing |
| `xlsx` | Excel file parsing |
| `allure-playwright` | Allure reporting integration |

### Rung 3 — Does Node.js / TypeScript already do it?

- `fs/promises` for file I/O — don't add `fs-extra`.
- `path.resolve()` / `path.join()` — don't add `upath`.
- `URL` / `URLSearchParams` — don't add `query-string`.
- `crypto.randomUUID()` — don't add `uuid`.
- `structuredClone()` — don't add `lodash.clonedeep`.

### Rung 4 — Can you delete instead of add?

If the new code replaces an existing utility, **delete the old one** and update
all callers. Two versions of the same thing is worse than either alone.

---

## Verdict Format

For every new addition in the diff:

| Verdict | Meaning |
|---------|---------|
| ✅ **PASS** | Genuinely new capability. Nothing in the repo does this. |
| ♻️ **DUPLICATE** | This already exists. Cite the existing file and export name. |
| 📦 **UNNECESSARY_DEP** | A new dependency was added for something the project or Node.js already covers. |
| 🔀 **SPLIT** | This belongs in an existing file, not a new one. Suggest which file. |

For each finding:

```
<new-file>:<line> — [DUPLICATE] — already provided by <existing-file>#<export>
```

### Example

```
src/utils/HttpClient.ts:1 — [DUPLICATE] — already provided by @utils/ApiHelper.ts#ApiHelper
package.json:25 — [UNNECESSARY_DEP] — `uuid` added but crypto.randomUUID() covers this
src/helpers/envReader.ts:1 — [DUPLICATE] — already provided by @utils/EnvUtil.ts#EnvUtil.get()
```

---

## Non-Negotiable Rules

1. **Duplication is not DRY theater.** Two 3-line functions that do different
   things are NOT duplicates just because they both call `page.click()`.
   Duplication means *same responsibility, same inputs, same outputs*.
2. **Wrappers around wrappers are duplication.** If `ApiHelper` already wraps
   `request.post()`, a new `HttpService` that wraps `ApiHelper` is duplication.
3. **Test helpers are exempt** if they're local to one spec file and under 10 lines.
4. **New Page Objects are NOT duplication** — each page is a distinct concern.
   But a new `BasePage2` is duplication of `BasePage`.
