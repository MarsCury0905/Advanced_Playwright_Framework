# AI Agent Instructions

This repository enforces **4 mandatory quality gates** on all AI-generated code.
Every AI coding agent (GitHub Copilot, Claude, Gemini, Codex, Cursor, Windsurf,
Devin, Kiro, CommandCode, OpenCode, Aider, Continue, Cody, Tabnine, Amazon Q,
and any other) MUST apply these gates before proposing changes.

## Quality Gates

| # | Gate | Question | Skill |
|---|------|----------|-------|
| 1 | **AI-Slop** | Was this generated, skimmed, and shipped? | `.agents/skills/ai-slop/SKILL.md` |
| 2 | **Ponytail** | Does anything else in the repo already do this? | `.agents/skills/ponytail-duplication/SKILL.md` |
| 3 | **Over-Engineering** | How many callers does this abstraction have? | `.agents/skills/over-engineering/SKILL.md` |
| 4 | **Framework Patterns** | Is this still part of this framework? | `.agents/skills/framework-patterns/SKILL.md` |

## Full Rules

See [`.agents/AGENTS.md`](.agents/AGENTS.md) for the complete rule set,
pattern reference, and PR checklist.
