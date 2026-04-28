#!/usr/bin/env bash
# finalize.sh — finish the Claude setup that install.sh couldn't complete.
# Idempotent: safe to run multiple times.

set -uo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$*"; }
ok()   { printf "    \033[0;32m✓\033[0m %s\n" "$*"; }
warn() { printf "    \033[0;33m!\033[0m %s\n" "$*"; }

# 1) Gemini CLI via npm (brew tap was wrong)
say "Installing Gemini CLI via npm"
if command -v gemini >/dev/null 2>&1; then
  ok "gemini already on PATH ($(gemini --version 2>/dev/null | head -1))"
else
  npm install -g @google/gemini-cli && ok "gemini-cli installed" || warn "npm install failed"
fi

# 2) Install new-project helper + project template
say "Installing new-project helper and project template"
mkdir -p "$HOME/.claude/project-template" "$HOME/bin"
cp "$BUNDLE_DIR/bin/new-project" "$HOME/bin/new-project"
chmod +x "$HOME/bin/new-project"
cp "$BUNDLE_DIR/project-template/CLAUDE.md" "$HOME/.claude/project-template/CLAUDE.md"
ok "~/bin/new-project installed"
ok "~/.claude/project-template/CLAUDE.md installed"

# 3) Supabase MCP (if token already set)
say "Checking Supabase MCP"
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  if claude mcp list 2>/dev/null | grep -q '^supabase'; then
    ok "supabase MCP already registered"
  else
    claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase --access-token="$SUPABASE_ACCESS_TOKEN" \
      && ok "supabase MCP added"
  fi
else
  warn "SUPABASE_ACCESS_TOKEN not set yet."
  warn "Opening the token page in your browser. Create a token, copy it, then run:"
  echo
  echo "    echo 'export SUPABASE_ACCESS_TOKEN=\"sbp_paste_here\"' >> ~/.zshrc"
  echo "    source ~/.zshrc"
  echo "    bash $BUNDLE_DIR/finalize.sh    # re-run this script to register the MCP"
  echo
  open "https://supabase.com/dashboard/account/tokens" 2>/dev/null || true
fi

# 4) Reminders
say "Status"
[[ -n "${GEMINI_KEY_1:-}" ]] && ok "GEMINI_KEY_1 is set" || warn "GEMINI_KEY_1 not set — fill in ~/.zshrc"
[[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]] && ok "SUPABASE_ACCESS_TOKEN is set" || warn "SUPABASE_ACCESS_TOKEN not set"

cat <<'EOF'

Remaining manual steps (require you):
  • Fill GEMINI_KEY_1/2/3 in ~/.zshrc (https://aistudio.google.com/apikey)
  • Inside Claude Code, run these slash commands:
      /plugin marketplace add obra/superpowers
      /plugin install superpowers
      /plugin install frontend-design@anthropic

After both: source ~/.zshrc && new-project hello-claude --next
EOF
