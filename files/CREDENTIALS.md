# Credentials — set once, every project inherits

The goal: when you start a new project, you do not type or paste any credentials.
Everything is logged in once at the OS level and inherited automatically.

## One-time logins (CLI auth)

```bash
# GitHub
brew install gh && gh auth login

# Supabase
brew install supabase/tap/supabase && supabase login

# Vercel (for deploys)
brew install vercel-cli && vercel login

# Gemini CLI (for the gemini-bulk subagent)
brew install google-gemini/tap/gemini-cli
# then either: `gemini /auth` for OAuth (1k Pro req/day per Google account)
# or set GEMINI_API_KEY env vars (handled by the gemini-rotate script)
```

After these, `gh repo create`, `supabase init`, `vercel deploy` all work
without re-auth.

## Shared environment variables (~/.zshrc)

For things you'll reuse across many projects (API keys, tokens). Put them in
`~/.zshrc` so every shell — including the one Claude Code runs commands in —
inherits them.

```bash
# Gemini key rotation
export GEMINI_KEY_1="AIza..."
export GEMINI_KEY_2="AIza..."
export GEMINI_KEY_3="AIza..."

# Supabase access (account-level, for CLI; per-project URLs go in .env.local)
export SUPABASE_ACCESS_TOKEN="sbp_..."

# Other things you reuse
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export RESEND_API_KEY="re_..."
```

Reload after editing: `source ~/.zshrc`.

## Per-project secrets — the .env pattern

Some secrets are project-specific (each Supabase project has its own URL and
anon key). Keep them in `.env.local` per project, never commit them, and let
the agents read from them.

Standard layout for a new project:

```
.env.local          # NEVER commit. Project-specific secrets.
.env.example        # Commit this. Lists required vars with empty values.
.gitignore          # Must include `.env.local` and `.env*.local`
```

When you start a new project, copy `.env.example` to `.env.local` and fill it
in once. Subagents can read `.env.local` but should never write secrets to a
file that gets committed.

## MCP servers — configured globally

MCP servers (Supabase, GitHub, Linear, etc.) are configured once in
`~/.claude.json`. Every project inherits them. Add new ones with:

```bash
claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase --access-token=$SUPABASE_ACCESS_TOKEN
claude mcp add github   -s user -- npx -y @modelcontextprotocol/server-github
claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem ~/projects
```

The `-s user` flag means user-scoped (global). Use `-s project` for
project-only servers.

## 1Password CLI (optional but worth it)

If you keep secrets in 1Password, wire it up so secrets never sit in plain text
in `~/.zshrc`:

```bash
brew install 1password-cli && op signin

# In ~/.zshrc instead of plain values:
export GEMINI_KEY_1="$(op read 'op://Personal/Gemini Key 1/credential')"
export OPENAI_API_KEY="$(op read 'op://Personal/OpenAI/credential')"
```

## Quick check — does my new project have everything?

When starting a new project, run:

```bash
gh auth status && supabase projects list && echo "${GEMINI_KEY_1:0:8}..." \
  && claude mcp list
```

If any of those fail, that's your missing piece.
