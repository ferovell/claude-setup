# Claude personal setup

Opinionated configuration for using Claude Code as a non-developer building
prototypes: Sonnet orchestrator + sonnet-coder + gemini-bulk + designer +
reviewer subagents, hooks for safety, and a one-shot project bootstrap.

## Install on a new Mac

```bash
# 1. Bootstrap (downloads files, installs CLAUDE.md, hooks, agents, brew tools, runs logins)
curl -fsSL https://raw.githubusercontent.com/ferovell/claude-setup/main/install.sh | bash

# 2. Finish the parts the bootstrap can't fully automate
bash <(curl -fsSL https://raw.githubusercontent.com/ferovell/claude-setup/main/finalize.sh)
```

After both, three manual steps:
1. Fill GEMINI_KEY_1/2/3 in `~/.zshrc` (free keys at <https://aistudio.google.com/apikey>)
2. Get a Supabase token at <https://supabase.com/dashboard/account/tokens>, add to `~/.zshrc`, re-run `finalize.sh`
3. Inside Claude Code: `/plugin install superpowers` + `/plugin install frontend-design@anthropic`

## Daily use

```bash
# new project
new-project my-app --next --supabase
cd ~/projects/my-app && claude --dangerously-skip-permissions

# existing project
cd ~/projects/my-app && claude --dangerously-skip-permissions
```

## Layout

- `files/CLAUDE.md` — user-global orchestrator rules
- `files/settings.json` — hooks (auto-format, block dangerous bash, notifications)
- `files/agents/` — 5 subagents (orchestrator, sonnet-coder, gemini-bulk, designer, reviewer)
- `files/bin/gemini-rotate` — multi-account Gemini API key rotation
- `files/bin/new-project` — project bootstrap
- `files/project-template/CLAUDE.md` — per-project template
- `files/LAUNCH.md` — daily-use reference
- `files/CREDENTIALS.md` — auth/secrets guide

## License

Personal use. No warranty.
