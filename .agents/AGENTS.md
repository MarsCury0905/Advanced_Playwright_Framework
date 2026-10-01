# Advanced Playwright Framework — Agent Rules

These rules apply to **every AI coding agent** working on this repository:
GitHub Copilot, Claude, Gemini, Codex, Cursor, Windsurf, Devin, Kiro,
CommandCode, OpenCode, Aider, Continue, Cody, Tabnine, Amazon Q, and any other
code generation or AI pair-programming tool.

---

## 🚦 Mandatory Quality Gates

Before submitting, committing, or proposing any code change that touches `.ts`
files, you MUST run your output through **all four quality gates** in order.
A failure at any gate means you must fix the issue before proceeding.

### Gate Order

```
Gate 1: AI-Slop       → Was this generated, skimmed, and shipped?
Gate 2: Ponytail       → Does anything else in the repo already do this?
Gate 3: Over-Engineering → How many callers does this abstraction have?
Gate 4: Framework Patterns → Is this still part of this framework?
```

### Gate Skill Locations

| Gate | Skill File |
|------|-----------|
| 1. AI-Slop | `.agents/skills/ai-slop/SKILL.md` |
| 2. Ponytail Duplication | `.agents/skills/ponytail-duplication/SKILL.md` |
| 3. Over-Engineering | `.agents/skills/over-engineering/SKILL.md` |
| 4. Framework Patterns | `.agents/skills/framework-patterns/SKILL.md` |

### How to Apply the Gates

1. **Read** each skill file for the full checklist.
2. **Evaluate** your proposed changes against each gate's criteria.
3. **Report** your gate results using the verdict format from each skill.
4. **Fix** any ⚠️ REVIEW or 🚨 FAIL verdicts before finalizing the change.

### Gate Pass Criteria

- All 4 gates must return ✅ PASS or ⚠️ REVIEW (with justification).
- Any 🚨 verdict (SLOP, DUPLICATE, OVER-ENGINEERED, FOREIGN) is a **hard block**.
- ⚠️ verdicts require an inline comment explaining why the deviation is acceptable.

---

## 📐 Framework Patterns (Quick Reference)

These are the non-negotiable patterns. Violating them triggers Gate 4.

### Page Objects
- Extend `BasePage` from `@pages/BasePage`.
- Locators: `private readonly`, declared at class level.
- Use `this.el` (UtilElementLocator) for interactions, not raw `this.page`.
- Constructor calls `super(page, 'ClassName')`.

### Test Files
- UI tests import `{ test, expect }` from `@fixtures/test-base`.
- API tests import from `@fixtures/booker.fixture` or `@playwright/test`.
- Page objects are injected via fixtures, never constructed with `new`.
- File names: `kebab-case.spec.ts`.

### Logging
- Use `createLogger(scope)` from `@utils/Logger`. Never `console.log` in
  non-test files.

### Environment
- Use `EnvUtil.get(key, fallback)` or `envOr()` / `requireEnv()`.
- Never bare `process.env.KEY` without a fallback.

### API Tests
- Production tests use Tier 3: `BookingApi` via `booker.fixture`.
- All tiers separated by directory.

### AI Agents
- Use `createAgent()` from `src/ai/agentFactory.ts`.
- Define agents in `src/ai/agents/`.
- Every agent must have a `fallback` function.

### Path Aliases
- Always use `@api/*`, `@config/*`, `@fixtures/*`, `@pages/*`,
  `@testdata/*`, `@utils/*` for cross-directory imports.

### Test Data
- Use `buildBooking()` from `@testdata/booking.data` for bookings.
- Use `DataGenerator` from `@utils/DataGenerator` for generic fake data.
- Never `Math.random()` for test data.

---

## 🚫 Strictly Forbidden

1. **No `any` without justification.** If you must use `any`, add a comment
   explaining why a proper type isn't possible.
2. **No new npm dependencies** without checking Gate 2 (Ponytail).
3. **No new utility files** without checking Gate 2 (Ponytail).
4. **No raw LLM calls** — use `createAgent()`.
5. **No hardcoded URLs** — use `EnvUtil` or `playwright.config.ts` resolution.
6. **No `var`** — use `const` or `let`.
7. **No loose equality** — use `===` and `!==`.
8. **No dead code** — delete unused imports, functions, and variables.

---

## 📝 PR Checklist for AI Agents

Before proposing a PR, confirm:

- [ ] Gate 1 (AI-Slop): No zombie comments, hallucinated APIs, or confidence theater.
- [ ] Gate 2 (Ponytail): No duplication of existing utilities or unnecessary deps.
- [ ] Gate 3 (Over-Engineering): Every abstraction has ≥2 callers (or documented exception).
- [ ] Gate 4 (Framework Patterns): Follows POM, fixtures, logging, path aliases, and naming.
- [ ] ESLint passes: `npm run lint` exits with 0 errors.
- [ ] TypeScript compiles: `npm run typecheck` exits cleanly.
- [ ] Tests pass: affected test suites run green.
