# Per-project cheatsheet

Stick this somewhere visible. It's all you need to remember.

## Start a new project

```bash
new-project my-app --next --supabase
cd ~/projects/my-app && claude --dangerously-skip-permissions
```

That's it. No login prompts, no token pasting — Supabase, Vercel, GitHub all
use your already-stored credentials.

## Open an existing project

```bash
cd ~/projects/my-app && claude --dangerously-skip-permissions
```

## Switch modes mid-session

| Need to...               | Type this              |
| ------------------------ | ---------------------- |
| Plan something big       | `/model opus`          |
| Get back to executing    | `/model sonnet`        |
| Plan-first (UI/design)   | Shift+Tab Shift+Tab    |
| See costs                | `/cost`                |
| Reset context            | `/clear`               |
| Compact long convo       | `/compact`             |
| List subagents           | `/agents`              |
| List MCP servers         | `/mcp`                 |
| Plugin management        | `/plugin`              |

## First prompt of a new project (template)

> Use the brainstorming skill to clarify what I want to build, then switch
> to /model opus and write a plan in `.claude/plans/v1.md`. The product is
> [DESCRIPTION]. Stack defaults are fine unless you flag a reason to change.

## When something feels wrong

```bash
# Subagents not showing up?
ls ~/.claude/agents/

# Hooks not firing?
cat ~/.claude/settings.json | jq .

# Gemini-bulk failing?
echo $GEMINI_KEY_1   # should print a key

# MCP not connected?
claude mcp list

# Plugin missing?
claude /plugin
```

## Shared accounts — already set, never re-enter

| Service   | Auth method       | How to verify          |
| --------- | ----------------- | ---------------------- |
| GitHub    | `gh auth login`   | `gh auth status`       |
| Supabase  | `supabase login`  | `supabase projects list` |
| Vercel    | `vercel login`    | `vercel whoami`        |
| Gemini    | API keys in zshrc | `echo $GEMINI_KEY_1`   |

If any of those returns "not authenticated", run the matching login command.
You only need to do it once per Mac.
