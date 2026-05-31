# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repo. For product and visual-design context, read `PRODUCT.md` (strategy, users, principles) and `DESIGN.md` (the UC visual system) at the repo root before design work.

## Request a code review after every major change

After every **major** code change, request a second-opinion review from an external coding-agent CLI before treating the work as done. Treat as major: a new feature or page, a refactor spanning multiple files, data / schema / crawler changes, or anything touching the build, CI, or deploy config. Skip it for trivial edits (typos, comments, one-line copy tweaks).

Pick the tool by **what is installed** (check with `command -v`). Prefer an engine **different from the one that wrote the change** so the review is a real cross-check; since Claude Code is usually the author here, reach for Antigravity or Codex first.

| Tool            | Installed check     | Read-only review command                                  |
| --------------- | ------------------- | --------------------------------------------------------- |
| Antigravity CLI | `command -v agy`    | `agy -p "<review prompt>" --dangerously-skip-permissions` |
| Codex CLI       | `command -v codex`  | `codex exec --sandbox read-only "<review prompt>"`        |
| Claude Code     | `command -v claude` | `claude -p "<review prompt>" --permission-mode plan`      |

How to run it:

- **Keep the review read-only.** Codex's `--sandbox read-only` and Claude's `--permission-mode plan` enforce read-only at the tool level, so prefer those. Antigravity's `--dangerously-skip-permissions` is all-or-nothing, so the prompt itself MUST say "read-only review, do not modify, create, or delete any files."
- **Point it at the diff**, not the whole repo: stage first, then have the reviewer run `git diff --cached` (or `git diff main...HEAD` for the branch).
- **Write a focused prompt**: name what changed, point at the diff, and ask for concrete findings (correctness bugs, security, consistency with existing patterns, accessibility) with `file:line` and a severity, ordered worst-first.
- **Run non-interactively** (these are print/exec modes) and capture stdout. For long reviews, run in the background.
- **Surface the findings to the user** and fix real issues before committing.

> Want this enforced automatically instead of by convention? A `Stop` or `PostToolUse` hook in `.claude/settings.json` could trigger the review without relying on the agent to remember; ask and it can be set up via the `update-config` skill.
