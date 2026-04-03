#!/usr/bin/env bash
# promote-commands.sh
# Converts .claude/commands/*.md files into .claude/skills/*/SKILL.md
# so Claude Code discovers them. Run once after `specify init`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REPO_ROOT=$(get_repo_root)
COMMANDS_DIR="$REPO_ROOT/.claude/commands"
SKILLS_DIR="$REPO_ROOT/.claude/skills"

if [ ! -d "$COMMANDS_DIR" ]; then
  echo "No .claude/commands/ directory found. Nothing to promote."
  exit 0
fi

count=0
for cmd_file in "$COMMANDS_DIR"/*.md; do
  [ -f "$cmd_file" ] || continue

  basename="$(basename "$cmd_file" .md)"
  skill_name="${basename//./-}"

  skill_dir="$SKILLS_DIR/$skill_name"
  skill_file="$skill_dir/SKILL.md"

  if [ -f "$skill_file" ] && [ "$skill_file" -nt "$cmd_file" ]; then
    echo "  skip  $skill_name (up to date)"
    continue
  fi

  mkdir -p "$skill_dir"
  cp "$cmd_file" "$skill_file"
  echo "  +  $basename -> skills/$skill_name/SKILL.md"
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "All commands already promoted. Nothing to do."
else
  echo ""
  echo "Promoted $count command(s). Restart Claude Code to pick them up."
  echo "Invoke with: /speckit-constitution, /speckit-specify, etc."
fi
