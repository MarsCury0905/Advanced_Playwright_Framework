# Copilot Instructions — Advanced Playwright Framework

This repository enforces **4 mandatory quality gates** on all AI-generated code.
You MUST read and apply these gates before proposing any code change.

## Mandatory Reading

Before writing any code, read these files in order:

1. `.agents/AGENTS.md` — Full rules and PR checklist
2. `.agents/skills/ai-slop/SKILL.md` — Gate 1: AI Slop detection
3. `.agents/skills/ponytail-duplication/SKILL.md` — Gate 2: Duplication check
4. `.agents/skills/over-engineering/SKILL.md` — Gate 3: Abstraction justification
5. `.agents/skills/framework-patterns/SKILL.md` — Gate 4: Framework consistency

## Quick Rules

- Page Objects extend `BasePage`, use `this.el` for interactions.
- UI tests use fixtures from `@fixtures/test-base`, never `new PageObject(page)`.
- Logging via `createLogger(scope)` from `@utils/Logger`, never `console.log`.
- Environment via `EnvUtil.get()`, never bare `process.env`.
- Path aliases (`@pages/*`, `@utils/*`, etc.) are mandatory for cross-dir imports.
- AI agents use `createAgent()` from `src/ai/agentFactory.ts`.
- Check existing utilities before writing new ones (see Gate 2 for the full list).
