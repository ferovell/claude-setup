# Launch guide — how to actually use the setup every day

After the one-time install, you don't reload anything. Claude Code reads
`~/.claude/` on every launch automatically. This guide covers the routines
you'll actually run.

---

## Daily session — existing project

```bash
cd ~/projects/my-app
claude --dangerously-skip-permissions    # code work, fully autonomous
# OR
claude                                   # design / planning work, asks permission
```

What happens automatically when you hit enter:

1. Claude Code loads `~/.claude/CLAUDE.md` (orchestrator rules)
2. Claude Code loads `<project>/.claude/CLAUDE.md` (project context)
3. The `SessionStart` hook prints active plan + git status
4. Hooks register: prettier on Edit, block dangerous Bash, etc.
5. Plugins activate: Superpowers skills become callable
6. Subagents are available (orchestrator delegates to them via Task)
7. MCP servers connect: supabase, github

You just type your request. The orchestrator pattern kicks in.

---

## Brand-new project

```bash
new-project my-app                       # blank with .claude/ scaffolding
new-project my-app --next                # + Next.js app
new-project my-app --next --supabase     # + Next.js + Supabase init

cd ~/projects/my-app
claude --dangerously-skip-permissions
```

`new-project` does: mkdir, git init, copies the project template CLAUDE.md
(filled in with the project name), creates `.env.example` and `.gitignore`
with safe defaults, optionally scaffolds Next.js / Supabase, makes the
initial commit.

---

## When to switch modes

```
WHAT YOU'RE DOING                       MODE / COMMAND
─────────────────────────────────────   ─────────────────────────────────
New project, big architectural call     /model opus           (planner)
Implementing the plan, daily work       /model sonnet         (orchestrator)
UI / design / interaction work          plain `claude`        (asks permission)
Code grind, bug fixes, features         claude --dangerously-skip-permissions
Trying something risky                  git worktree add ../scratch
Run-away cost worry                     /cost                 (shows usage)
```

---

## What runs automatically (you don't trigger these)

| Trigger                          | What happens                                  |
| -------------------------------- | --------------------------------------------- |
| You start a session              | Plans + git status printed (SessionStart hook) |
| Claude edits a `.ts/.tsx/.js` file | Prettier reformats + tsc checks the file    |
| Claude edits a `.py` file        | black reformats                               |
| Claude tries `rm -rf /` etc.     | Blocked (PreToolUse hook) — won't even run    |
| Claude tries to edit `.env.production` | Blocked                                |
| Claude finishes a turn           | macOS notification + sound                    |
| You submit a prompt              | Logged to `~/.claude/logs/prompts.log`        |
| New feature request              | Brainstorming skill auto-triggers (Superpowers) |
| Bug hunt                         | Systematic-debugging skill auto-triggers      |

---

## Slash commands worth memorizing

```
/model opus            switch to Opus (planner mode)
/model sonnet          switch back to Sonnet (orchestrator mode)
/agents                browse/edit your subagents
/mcp                   list connected MCP servers
/plugin                plugin management
/cost                  see token spend for the session
/clear                 reset conversation context
/init                  generate a CLAUDE.md from the current codebase
/compact               summarize conversation to free up context
Shift+Tab Shift+Tab    enter plan mode
```

---

## A typical end-to-end project

```
1. Idea forms in your head
        │
        ▼
   new-project rosy-app --next --supabase
        │
        ▼
   cd rosy-app && claude
        │
        ▼
   /model opus
   "Brainstorm with me, then write a plan for X."
        │  Opus produces .claude/plans/v1.md
        ▼
   /model sonnet
        │  Sonnet orchestrator reads the plan, delegates
        │  to sonnet-coder, gemini-bulk, designer, reviewer
        ▼
   Code lands. Hooks auto-format. Reviewer agent checks diff.
        │
        ▼
   git push, vercel deploy   (you do these — or ask Claude to)
        │
        ▼
   Next session: cd rosy-app && claude --dangerously-skip-permissions
        │
        ▼
   "Let's add feature Y."
        │  Sonnet orchestrator picks up where you left off,
        │  plans + delegates without needing Opus again
        ▼
   Repeat.
```

---

## Common gotchas

- **"Claude is just writing code instead of delegating"** — your
  `~/.claude/CLAUDE.md` should fix this. If it doesn't, check the file is
  actually there: `cat ~/.claude/CLAUDE.md | head`. If it's not, re-run the
  installer.
- **Hooks not firing** — verify `~/.claude/settings.json` exists and is valid
  JSON: `cat ~/.claude/settings.json | jq .` (install jq if needed:
  `brew install jq`).
- **Subagents not appearing** — `claude /agents` should list them. If empty,
  `ls ~/.claude/agents/` to confirm files are there.
- **Gemini-bulk failing** — `echo $GEMINI_KEY_1` should print a key. If
  empty, edit `~/.zshrc` and `source` it.
- **Plugin not active** — `claude /plugin` to see installed plugins. If
  Superpowers is missing, run the install slash commands again.

---

## When a project graduates from prototype to "real"

Things to add at that point (not before):

- TDD skill from Superpowers — re-enable in project's `.claude/CLAUDE.md`
- Stricter `reviewer` agent
- Proper CI hooks (GitHub Actions, not just local)
- Branch-protection on main
- Real env separation (staging + production Supabase)
- Move secrets from `~/.zshrc` to 1Password CLI

For prototypes — don't bother. Velocity beats discipline.
