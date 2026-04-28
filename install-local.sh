#!/usr/bin/env bash
# Claude personal setup — one-shot installer.
# Run from the bundle folder:  bash install.sh
#
# What this does:
#   1. Copies bundle files into ~/.claude/ and ~/bin/
#   2. Adds Gemini key placeholders to ~/.zshrc
#   3. Installs CLI tools (gh, supabase, vercel, gemini-cli) via brew, runs logins
#   5. Adds MCP servers (supabase, github)
# What it CAN'T do (you do these manually after):
#   4. Plugin installs — happen inside Claude Code via slash commands
#   2b. Filling in your actual Gemini API keys

set -uo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ZSHRC="$HOME/.zshrc"
TS=$(date +%s)

say() { printf "\n\033[1;36m==>\033[0m %s\n" "$*"; }
ok()  { printf "    \033[0;32m✓\033[0m %s\n" "$*"; }
warn(){ printf "    \033[0;33m!\033[0m %s\n" "$*"; }
ask() {
  local prompt="$1"
  local yn
  read -r -p "    $prompt [Y/n] " yn
  [[ "${yn:-Y}" =~ ^[Yy]?$ ]]
}

# ─────────────────────────────────────────────────────────────────────
# STEP 1 — copy bundle
# ─────────────────────────────────────────────────────────────────────
say "Step 1/5: Copying bundle into ~/.claude/ and ~/bin/"

mkdir -p "$HOME/.claude/agents" "$HOME/bin"

for f in CLAUDE.md settings.json; do
  if [[ -f "$HOME/.claude/$f" ]]; then
    cp "$HOME/.claude/$f" "$HOME/.claude/${f}.bak.${TS}"
    warn "backed up existing ~/.claude/$f to ~/.claude/${f}.bak.${TS}"
  fi
  cp "$BUNDLE_DIR/$f" "$HOME/.claude/$f"
  ok "installed ~/.claude/$f"
done

cp "$BUNDLE_DIR/agents/"*.md "$HOME/.claude/agents/"
ok "installed $(ls "$BUNDLE_DIR/agents/" | wc -l | tr -d ' ') subagent files into ~/.claude/agents/"

cp "$BUNDLE_DIR/bin/gemini-rotate" "$HOME/bin/gemini-rotate"
chmod +x "$HOME/bin/gemini-rotate"
ok "installed ~/bin/gemini-rotate"

if ! echo "$PATH" | tr ':' '\n' | grep -qx "$HOME/bin"; then
  if ! grep -q 'HOME/bin:\$PATH' "$ZSHRC" 2>/dev/null; then
    echo 'export PATH="$HOME/bin:$PATH"' >> "$ZSHRC"
    ok "added ~/bin to PATH in ~/.zshrc"
  fi
else
  ok "~/bin already on PATH"
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 2 — Gemini key placeholders
# ─────────────────────────────────────────────────────────────────────
say "Step 2/5: Gemini key placeholders in ~/.zshrc"

if grep -q 'GEMINI_KEY_1' "$ZSHRC" 2>/dev/null; then
  ok "GEMINI_KEY_1 already present in ~/.zshrc"
else
  cat >> "$ZSHRC" <<'EOF'

# Claude setup — Gemini keys
# Get free keys at https://aistudio.google.com/apikey
# Use 3 different Google accounts to multiply the free-tier quota.
export GEMINI_KEY_1=""
export GEMINI_KEY_2=""
export GEMINI_KEY_3=""
EOF
  ok "added GEMINI_KEY_1/2/3 placeholders to ~/.zshrc"
  warn "edit ~/.zshrc and fill in your keys before using gemini-bulk subagent"
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 3 — CLI tools + interactive logins
# ─────────────────────────────────────────────────────────────────────
say "Step 3/5: Installing CLI tools and authenticating"

if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew not found. Install from https://brew.sh and re-run this script."
  warn "Skipping CLI installs."
else
  for spec in "gh" "supabase/tap/supabase" "vercel-cli" "google-gemini/tap/gemini-cli"; do
    name="${spec##*/}"
    if brew list "$name" >/dev/null 2>&1; then
      ok "$name already installed"
    else
      printf "    installing %s ...\n" "$name"
      brew install "$spec" >/dev/null 2>&1 && ok "$name installed" || warn "$name install failed (continuing)"
    fi
  done
fi

# Logins — only run if user wants and the tool is present
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    ok "gh already authenticated"
  elif ask "Run 'gh auth login' now?"; then
    gh auth login
  fi
fi

if command -v supabase >/dev/null 2>&1; then
  if supabase projects list >/dev/null 2>&1; then
    ok "supabase already authenticated"
  elif ask "Run 'supabase login' now?"; then
    supabase login
  fi
fi

if command -v vercel >/dev/null 2>&1; then
  if vercel whoami >/dev/null 2>&1; then
    ok "vercel already authenticated"
  elif ask "Run 'vercel login' now?"; then
    vercel login
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 4 — plugins (manual, inside Claude Code)
# ─────────────────────────────────────────────────────────────────────
say "Step 4/5: Plugins — these must be installed INSIDE Claude Code"

cat <<'EOF'
    Open Claude Code (desktop app or run 'claude' in a terminal), then run:

        /plugin marketplace add obra/superpowers
        /plugin install superpowers
        /plugin install frontend-design@anthropic

    These slash commands can only run inside the Claude Code session itself.
EOF

# ─────────────────────────────────────────────────────────────────────
# STEP 5 — MCP servers
# ─────────────────────────────────────────────────────────────────────
say "Step 5/5: Adding MCP servers (user-scoped, all projects inherit)"

if ! command -v claude >/dev/null 2>&1; then
  warn "'claude' CLI not on PATH. Install Claude Code, then run:"
  cat <<'EOF'
        claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase --access-token=$SUPABASE_ACCESS_TOKEN
        claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token) -- npx -y @modelcontextprotocol/server-github
EOF
else
  # supabase MCP — needs an access token
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    warn "SUPABASE_ACCESS_TOKEN not set — skipping supabase MCP."
    warn "Get a token at https://supabase.com/dashboard/account/tokens, add to ~/.zshrc, then run:"
    printf "        claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase --access-token=\$SUPABASE_ACCESS_TOKEN\n"
  else
    if claude mcp list 2>/dev/null | grep -q '^supabase'; then
      ok "supabase MCP already registered"
    else
      claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase --access-token="$SUPABASE_ACCESS_TOKEN" \
        && ok "supabase MCP added" || warn "supabase MCP add failed"
    fi
  fi

  # github MCP — uses gh's stored token
  if claude mcp list 2>/dev/null | grep -q '^github'; then
    ok "github MCP already registered"
  else
    GH_TOKEN=""
    command -v gh >/dev/null 2>&1 && GH_TOKEN=$(gh auth token 2>/dev/null || true)
    if [[ -n "$GH_TOKEN" ]]; then
      claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN="$GH_TOKEN" -- npx -y @modelcontextprotocol/server-github \
        && ok "github MCP added (using gh's token)" || warn "github MCP add failed"
    else
      warn "no GitHub token available — run 'gh auth login' first, then re-run this script."
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────
say "Done."

cat <<EOF

Remaining manual bits:
  • Fill in GEMINI_KEY_1/2/3 in ~/.zshrc (get from https://aistudio.google.com/apikey)
  • Reload your shell:  source ~/.zshrc
  • Run the 3 plugin commands inside Claude Code (shown above)

Smoke test:
  mkdir -p ~/projects/claude-smoke && cd ~/projects/claude-smoke
  git init -q
  mkdir -p .claude
  cp "$BUNDLE_DIR/project-template/CLAUDE.md" .claude/CLAUDE.md
  claude

Then prompt: "Build me a Next.js page that shows the current time. Brainstorm first."
You should see: orchestrator delegates instead of coding, brainstorming skill
fires, prettier auto-formats edits, desktop notification on stop.
EOF
