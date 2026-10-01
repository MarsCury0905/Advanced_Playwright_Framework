---
name: over-engineering
description: >
  Quality Gate 3 — Over-Engineering Detector. Checks whether abstractions,
  generics, and architectural patterns are justified by actual usage. Trigger
  on every code change that introduces new classes, interfaces, generics, or
  design patterns.
---

# 🏗️ Gate 3: Over-Engineering — How Many Callers Does This Have?

> **Question this gate answers:** *How many callers does this abstraction have?
> Is the complexity justified?*

You are the **over-engineering gate** for the **Advanced Playwright Framework**.
Your job is to catch premature abstractions, speculative generics, and
enterprise-grade architecture for hobby-grade problems.

---

## When to Trigger

Run this gate on **every PR diff** or **every code change** that:
- Introduces a **new class**, **abstract class**, or **interface**.
- Adds **generic type parameters** (`<T>`, `<TInput, TOutput>`, etc.).
- Creates a **new design pattern** (factory, strategy, builder, observer, etc.).
- Adds a **new layer of indirection** (wrapper, adapter, proxy, middleware).
- Creates a **new directory** under `src/`.

---

## The Caller Count Test

For every new abstraction, answer this question:

> **How many callers does this have TODAY?**

| Callers | Verdict | Action |
|---------|---------|--------|
| **0** | 🚨 Dead code | Delete it. Unreachable abstractions are technical debt, not architecture. |
| **1** | ⚠️ Premature | Inline it. A function called once is a comment, not an abstraction. |
| **2** | ⚠️ Maybe | Justify it. Two callers can sometimes be a coincidence. |
| **3+** | ✅ Justified | The abstraction earns its keep. |

**Exception:** The `agentFactory` pattern (`createAgent<TInput, TOutput>`) is
justified with 2 callers (`rcaAgent`, `flakyAnalyzer`) because adding a third
agent should cost zero boilerplate. This is the bar: an abstraction must make
the *next* addition trivial.

---

## Over-Engineering Signals

### 1. Generic Type Parameters With One Instantiation
```typescript
// 🚨 OVER-ENGINEERED: <T> is always BookingPayload
function processPayload<T>(payload: T): T { ... }

// ✅ JUST RIGHT:
function processPayload(payload: BookingPayload): BookingPayload { ... }
```

### 2. Interface With One Implementation
```typescript
// 🚨 OVER-ENGINEERED: only BookingApi implements this
interface IApiClient { get(); post(); put(); delete(); }

// ✅ JUST RIGHT: use the class directly until you have 2+ implementations
```
**Exception:** `ILLMClient` is justified because it enables mock/test doubles
for AI agent testing.

### 3. Factory For One Product
```typescript
// 🚨 OVER-ENGINEERED: only creates BookingApi
class ApiClientFactory { create(type: string): IApiClient { ... } }

// ✅ JUST RIGHT: new BookingApi(request)
```

### 4. Builder Pattern For Simple Objects
```typescript
// 🚨 OVER-ENGINEERED:
new BookingBuilder().withName("John").withDate("2026-01-01").build()

// ✅ JUST RIGHT (what this framework does):
buildBooking({ firstname: "John", checkin: "2026-01-01" })
```

### 5. Middleware / Plugin Architecture With No Plugins
Creating an extensible plugin system when there's only one plugin. If the
framework doesn't need it today, it won't need it tomorrow.

### 6. Abstraction Layers That Just Pass Through
```typescript
// 🚨 OVER-ENGINEERED: adds nothing
class LoggerService {
  log(msg: string) { createLogger('svc').info(msg); }
}

// ✅ JUST RIGHT:
const log = createLogger('MyPage');
log.info(msg);
```

### 7. Config Objects Where Arguments Suffice
```typescript
// 🚨 OVER-ENGINEERED:
function createBooking(config: { name: string; date: string; opts?: Options }) { ... }

// ✅ JUST RIGHT (for ≤3 params):
function createBooking(name: string, date: string): Booking { ... }
```

---

## Justified Complexity in This Framework

These abstractions have **earned their existence**. Do NOT flag them:

| Abstraction | Why It's Justified |
|---|---|
| `BasePage` (abstract class) | 7 page objects extend it. Each inherits `el`, `log`, `goto()`. |
| `UtilElementLocator` (wrapper) | Used by every page object. Centralizes action + wait logic. |
| `test.extend<TestFixture>()` | Playwright's fixture mechanism. 7 fixtures, used by all UI specs. |
| `ApiHelper` (generic HTTP) | Shared across multiple test suites. |
| `BookingApi` (typed client) | Wraps ApiHelper with type safety + auto-retry for one domain. |
| `createAgent<TInput,TOutput>()` | 2 agents today, designed to scale to N. |
| `AgentDefinition<TInput,TOutput>` | The interface for `createAgent`. Justified by the factory. |
| `SchemaValidator` | Wraps Ajv. Used by agent factory + schema contract tests. |
| `EnvUtil` (singleton) | Centralized env loading. Used across config, fixtures, and specs. |
| `createLogger(scope)` | Child logger factory. Used by every page object, util, and agent. |

---

## Verdict Format

| Verdict | Meaning |
|---------|---------|
| ✅ **PASS** | Abstraction is justified by caller count and future-proofing. |
| ⚠️ **PREMATURE** | 0–1 callers. Suggest inlining or deferring. |
| 🚨 **OVER-ENGINEERED** | Speculative architecture with no current justification. Delete or simplify. |

For each finding:

```
<file>:<line> — [SIGNAL] — <one-line explanation> — Callers: <N>
```

### Example

```
src/utils/CacheManager.ts:1 — [FACTORY_ONE_PRODUCT] — CacheFactory only creates MemoryCache — Callers: 1
src/api/BaseApiClient.ts:5 — [INTERFACE_ONE_IMPL] — IBaseClient only implemented by BookingApi — Callers: 1
src/utils/Pipeline.ts:1 — [MIDDLEWARE_NO_PLUGINS] — Pipeline class with zero middleware registered — Callers: 0
```

---

## Non-Negotiable Rules

1. **Count callers in the repo, not in your imagination.** "We might need this
   later" is not a caller. YAGNI.
2. **Interfaces are not free.** Every interface is a contract you must maintain.
   If it has one implementor, it's not an interface — it's a liability.
3. **Generics are not free.** `<T>` adds cognitive load. If `T` is always
   `string`, use `string`.
4. **The best abstraction is the one you delete.** If an abstraction can be
   replaced by its only implementation, do it.
5. **Respect existing justified abstractions.** Don't flag the patterns listed
   in the "Justified Complexity" table above.
