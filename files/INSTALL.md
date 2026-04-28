# Claude personal setup — install guide

This bundle gives you a Sonnet-orchestrator → Sonnet/Gemini-worker hierarchy that
works across all your projects, plus a plan-first design mode and full-bypass code
mode.

## What's in the bundle

```
CLAUDE.md                      → ~/.claude/CLAUDE.md          (user-global rules)
settings.json                  → ~/.claude/settings.json      (hooks)
agents/orchestrator.md         → ~/.claude/agents/orchestrator.md
agents/sonnet-coder.md         → ~/.claude/agents/sonnet-coder.md
agents/gemini-bulk.md          → ~/.claude/agents/gemini-bulk.md
agents/designer.md             → ~/.claude/agents/designer.md
agents/reviewer.md             → ~/.claude/agents/reviewer.md
bin/gemini-rotate              → ~/bin/gemini-rotate          (chmod +x)
project-template/CLAUDE.md     → copy into each new project's .claude/CLAUDE.md
CREDENTIALS.md                 → reference guide for one-time auth setup
```

User-level files in `~/.claude/` apply to every project. Project-level files in
`./.claude/` override or extend them.

## One-time install

```bash
# 1. agents, hooks, and global rules
mkdir -p ~/.claude/agents ~/bin
cp CLAUDE.md ~/.claude/CLAUDE.md
cp settings.json ~/.claude/settings.json
cp agents/*.md ~/.claude/agents/
cp bin/gemini-rotate ~/bin/gemini-rotate
chmod +x ~/bin/gemini-rotate

# 1b. install plugins and skills (run these INSIDE Claude Code, not in shell)
#   /plugin marketplace add obra/superpowers
#   /plugin install superpowers
#   /plugin install frontend-design@anthropic
#   /plugin install firecrawl@firecrawl       (only if you do web scraping)

# 2. add ~/bin to PATH if not already
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc

# 3. set Gemini API keys (get free ones from https://aistudio.google.com/apikey
#    using up to 3 different Google accounts)
echo 'export GEMINI_KEY_1="AIza..."' >> ~/.zshrc
echo 'export GEMINI_KEY_2="AIza..."' >> ~/.zshrc
echo 'export GEMINI_KEY_3="AIza..."' >> ~/.zshrc

# 4. reload shell
source ~/.zshrc
```

## Per-project setup

```bash
cd my-new-project
mkdir -p .claude
cp ~/path/to/this/bundle/project-template/CLAUDE.md .claude/CLAUDE.md
# edit .claude/CLAUDE.md to fill in the project-specific section at the bottom
git init && git add .claude && git commit -m "claude config"
```

## Daily use

```bash
# Code work — full bypass inside a worktree
git worktree add ../my-project-claude
cd ../my-project-claude
claude --dangerously-skip-permissions

# Design / UI / interaction work — plan first
cd my-project
claude
# then press Shift+Tab twice to enter plan mode
```

## How the agents talk to each other

```
You ──▶ orchestrator (Sonnet)
            │
            ├── delegates code  ──▶ sonnet-coder
            ├── delegates SQL/  ──▶ gemini-bulk  (uses gemini-rotate)
            │   bulk/search
            ├── delegates UI    ──▶ designer  (plan only, no code)
            └── delegates QA    ──▶ reviewer  (after coder finishes)
```

Orchestrator never edits code itself. If it tries, the rules in CLAUDE.md tell it
to stop and re-delegate.
