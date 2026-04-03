# Principal Dev Framework

**Spec-Kit × GStack — Concise Reference**

Spec-Kit owns **definition** (what to build, why, how). GStack owns **delivery** (review, test, ship, reflect). Your CLAUDE.md connects them. Every specialist output gets a persistent file — not chat residue.

> **Status note:** The `gstack-ready` preset, `gstack-bridge` extension, and `/speckit.gstack-*` bridge commands described in the original design docs are **planned but not yet published**. This framework uses both tools side by side today, connected by CLAUDE.md workflow instructions and manual handoff. When the preset/extension ship, drop them in and the manual steps go away.

---

## Cycle at a Glance

```
DEFINE (Spec-Kit)          CHALLENGE (GStack)         BUILD + SHIP (Both)
─────────────────          ──────────────────         ─────────────────
/speckit.constitution      /plan-ceo-review           Per task in tasks.md:
/speckit.specify           /plan-eng-review             implement
/speckit.plan              /plan-design-review          /review
/speckit.tasks               (if UI)                   /qa
/speckit.analyze                                       /cso (if auth/data)
        │                         │                    /ship
        └── manual handoff: point GStack ──┘           /retro (weekly)
            at spec artifacts
```

**Exit gates:** Spec locked → Eng Review CLEARED → Task shipped with all delivery gates green.

---

## Artifact Map

All artifacts live in repo. Nothing important stays in chat.

| Artifact | Location | Written By |
|----------|----------|------------|
| Constitution | `.specify/memory/constitution.md` | `/speckit.constitution` |
| Spec | `.specify/specs/<branch>/spec.md` | `/speckit.specify` |
| Plan | `.specify/specs/<branch>/plan.md` | `/speckit.plan` |
| Tasks | `.specify/specs/<branch>/tasks.md` | `/speckit.tasks` |
| Analysis | `.specify/specs/<branch>/analyze.md` | `/speckit.analyze` |
| Design Doc | `~/.gstack/projects/<project>.md` | Manual (copy spec summary) |
| Product Review | `specs/<feature>/product-review.md` | `/plan-ceo-review` output |
| Engineering Review | `specs/<feature>/engineering-review.md` | `/plan-eng-review` output |
| Code Review | `specs/<feature>/code-review.md` | `/review` output |
| Security Review | `specs/<feature>/security-review.md` | `/cso` output |
| QA Report | `specs/<feature>/qa-report.md` | `/qa` output |
| Release Notes | `specs/<feature>/release-notes.md` | `/ship` output |
| Retro | `specs/<feature>/retro.md` | `/retro` output |

---

## Phase Details

### 1. Define (30 min – 2 hrs)

```bash
/speckit.constitution    # Principles, standards, constraints, GStack review matrix
/speckit.specify         # Problem, user outcomes, acceptance criteria, test dimensions
/speckit.plan            # Architecture, data model, failure modes, test plan, review gates
/speckit.tasks           # Ordered units with dependencies, complexity, delivery gate checkboxes
/speckit.analyze         # Cross-artifact consistency check (constitution conflicts = critical)
```

**Don't retrofit existing specs.** If Spec-Kit already generated your spec.md, plan.md, and tasks.md, move on to the Challenge phase. The acceptance criteria and architecture are already in your artifacts — they just may not be in a formal table format, and that's fine.

**One thing worth adding now:** delivery gate checkboxes in tasks.md, per task. These are what you'll actually check off during the build phase:
```
- [ ] code complete
- [ ] /review passed
- [ ] /qa passed
- [ ] /ship executed
```

For future features, ask Claude Code to include these sections when generating spec artifacts. The `gstack-ready` preset will automate this when it ships.

### 2. Challenge (30 min – 1 hr)

**Handoff (manual until bridge extension ships):**
Tell GStack to read your spec artifacts. In Claude Code, paste your spec summary or point the review commands at `.specify/specs/<branch>/spec.md` and `plan.md`. GStack's review skills will work with whatever context you give them — they don't require a design doc in `~/.gstack/projects/`, that's just the ideal.

```bash
/plan-ceo-review          # Is this the right thing to build? Scope decision.
/plan-eng-review          # Lock architecture, data flow, edge cases, test strategy
/plan-design-review       # UI changes only — 80-item audit, AI slop detection
```

Save review outputs to `specs/<feature>/product-review.md` and `engineering-review.md`.

**Exit criterion:** Eng Review Readiness Dashboard shows CLEARED.

### 3. Build (2–4 hrs per task)

```bash
git checkout -b feature/<NNN>-<description>

# For each task:
# 1. Implement (use /speckit.implement or code directly)
# 2. Review
/review                   # Staff engineer persona, auto-fixes minor issues
# 3. QA
/qa                       # Real Chromium browser, tests spec acceptance criteria
# 4. Security (if task touches auth/payments/user data)
/cso                      # OWASP Top 10 + STRIDE
# 5. Ship
/ship                     # Sync, test, audit coverage, update docs, open PR
# 6. Mark delivery gates complete in tasks.md
```

Save findings: `code-review.md`, `qa-report.md`, `security-review.md`, `release-notes.md`.

### 4. Reflect (15 min weekly)

```bash
/retro                    # Velocity, shipping streaks, test health, growth opportunities
```

Save to `specs/<feature>/retro.md`. Compare velocity against tasks.md estimates.

---

## Setup

### One-time setup (your machine)

Prerequisites: Node >= 22, Python 3.10+, `uv`, `git`, `bun`, `unzip`

```bash
# Bun (required by GStack)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Spec-Kit
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.4.2

# GStack (global copy — you'll copy into each repo)
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

### New project

The key insight: `main` holds the scaffold + constitution. All feature work lives on branches that Spec-Kit creates automatically when you run `/speckit.specify`.

```bash
# 1. Scaffold locally
mkdir my-project && cd my-project
specify init . --ai claude --here

# 2. Add GStack locally (NOT committed — too many vendored files)
mkdir -p .claude/skills && cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git
cd .claude/skills/gstack && ./setup && cd ../../..

# 3. Gitignore the skills directory
echo -e "\n# Claude Code skills (vendored/generated — each dev runs setup locally)\n.claude/skills/" >> .gitignore

# 4. Add CLAUDE.md snippet (see below) and review file dirs
mkdir -p specs docs/architecture docs/decisions

# 5. Write your constitution (this is project-level, stays on main)
claude                    # Start Claude Code session (needed before slash commands)
/speckit.constitution

# 6. Exit Claude Code, then first commit + push — clean baseline for all future branches
git init && git add -A
git commit -m "project scaffold: spec-kit + gstack + constitution"
# Create GitHub repo, then:
git remote add origin git@github.com:you/my-project.git
git push -u origin main

# 7. Start first feature — run claude, then spec-kit auto-creates the branch
claude                    # Start Claude Code session (needed before slash commands)
/speckit.specify "Build the auth foundation"
# You're now on a feature branch with spec artifacts
/speckit.plan
/speckit.tasks
/speckit.analyze
```

### Existing project WITH old Spec-Kit (no GStack yet)

Your `.specify/` folder and specs already exist. You're adding GStack delivery tooling.

```bash
cd existing-project

# 1. Add GStack locally (NOT committed)
mkdir -p .claude/skills && cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git
cd .claude/skills/gstack && ./setup && cd ../../..
echo -e "\n# Claude Code skills (vendored/generated)\n.claude/skills/" >> .gitignore

# 2. Add CLAUDE.md snippet (see below)

# 3. Create review file dirs for current/next feature
mkdir -p specs/<current-feature>

# 4. Commit CLAUDE.md and .gitignore changes to main
git add -A && git commit -m "add gstack workflow (CLAUDE.md, .gitignore, review dirs)"

# 5. For your NEXT feature, the full cycle applies automatically.
#    Start a Claude Code session (claude) before running slash commands.
#    For your CURRENT in-progress feature:
#    - Point GStack at your existing spec artifacts in the challenge phase
#    - Start using /review, /qa, /cso, /ship on remaining tasks

# NOTE: Old specs won't have acceptance criteria tables, delivery gate
# checkboxes, etc. You don't need to retrofit them. If a current spec
# is thin, re-run /speckit.specify on the feature branch to flesh it out.
```

### Existing project WITHOUT Spec-Kit (no GStack either)

You have a repo with code but no formal spec workflow. You're adding both tools.

```bash
cd existing-project

# 1. Initialize Spec-Kit in current repo
specify init . --ai claude --here --force

# 2. Add GStack locally (NOT committed)
mkdir -p .claude/skills && cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git
cd .claude/skills/gstack && ./setup && cd ../../..
echo -e "\n# Claude Code skills (vendored/generated)\n.claude/skills/" >> .gitignore

# 3. Add CLAUDE.md snippet (see below)
mkdir -p specs docs/architecture docs/decisions

# 4. Write your constitution (captures existing project principles)
#    Start Claude Code first — slash commands run inside it
claude
/speckit.constitution

# 5. Commit tooling to main
git add -A && git commit -m "add spec-kit + gstack framework"

# 6. Retrofit: describe what you've already built
#    This creates a feature branch and captures current state as spec artifacts.
claude                    # (if not already in a session)
/speckit.specify "Describe current system: <what it does today>"
/speckit.plan    # Capture existing architecture decisions post-hoc
/speckit.tasks   # Break down remaining/next work

# 7. From here, use the full cycle for all new work.
#    The spec now serves as living documentation of what exists
#    AND the plan for what comes next.
```

---

## CLAUDE.md Snippet

Drop this into your project root:

```markdown
## spec-kit + gstack

Spec-Kit for definition, GStack for delivery.

### Workflow
1. Define: /speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.analyze
2. Challenge: Point /plan-ceo-review and /plan-eng-review at spec artifacts
3. Build per task: implement → /review → /qa → /cso (if applicable) → /ship
4. Reflect: /retro
5. After /ship: save review outputs to specs/<feature>/ and update spec if needed

### Artifacts
- Specs: .specify/specs/<branch>/
- Constitution: .specify/memory/constitution.md
- Review files: specs/<feature>/*.md (product-review, engineering-review, code-review, etc.)

### GStack skills
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark,
/browse, /qa, /qa-only, /design-review, /cso, /retro, /investigate,
/document-release, /codex, /autoplan, /careful, /freeze, /guard, /unfreeze

### Handoff convention
When running GStack review/QA skills, always provide spec context:
"Review this against the acceptance criteria in .specify/specs/<branch>/spec.md"
```

---

## GStack Integration Matrix

Reference during execution to engage the right specialist:

| Role | Command | When | Gate |
|------|---------|------|------|
| CEO | `/plan-ceo-review` | Before design lock | Scope decision made |
| Eng Manager | `/plan-eng-review` | Before coding | Architecture locked, test matrix defined |
| Designer | `/plan-design-review` | UI changes | Design approved, no AI slop |
| Staff Engineer | `/review` | Before `/ship` | No critical findings |
| QA Lead | `/qa` | After implementation | All spec flows pass in real browser |
| Security Officer | `/cso` | Auth/data/payments | OWASP + STRIDE pass |
| Release Engineer | `/ship` | Final gate | Tests pass, coverage target met, docs updated |

---

## File Structure

```
project-root/
├── .specify/
│   ├── memory/constitution.md
│   └── specs/feature/NNN-name/
│       ├── spec.md, plan.md, tasks.md, analyze.md
├── .claude/
│   ├── skills/gstack/           # LOCAL ONLY — gitignored, each dev runs setup
│   └── commands/                # Slash commands from spec-kit (committed)
├── specs/
│   └── NNN-feature-name/       # Persistent review artifacts
│       ├── product-review.md
│       ├── engineering-review.md
│       ├── code-review.md
│       ├── security-review.md
│       ├── qa-report.md
│       ├── release-notes.md
│       └── retro.md
├── .gitignore                   # Includes .claude/skills/
├── CLAUDE.md
├── src/
└── tests/
```

---

## Troubleshooting

**Spec drift** — After each `/ship`, update the relevant spec section. Run `/speckit.analyze` periodically.

**Review churn** — Front-load with `/plan-eng-review`. Lock architecture before coding. Most churn = undecided design, not bugs.

**GStack reviews lack context** — Always tell GStack where the spec is: "Review against .specify/specs/<branch>/spec.md". Put this in your CLAUDE.md so the agent does it automatically.

**Slash commands not found in Claude Code** — Spec-Kit puts commands in `.claude/commands/*.md` but Claude Code may not discover them. If `/speckit.specify` etc. don't work, run the promote script to convert them into skills that Claude Code recognizes:

```bash
bash .specify/scripts/bash/promote-commands.sh
```

This copies each `.claude/commands/speckit.foo.md` into `.claude/skills/speckit-foo/SKILL.md`. Restart Claude Code after running it. Save this script at `.specify/scripts/bash/promote-commands.sh`:

```bash
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
```

**WSL Chromium issues** — GStack's `/qa` and `/browse` need Playwright Chromium. If setup fails, install system deps: `sudo apt install -y libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2t64 libxshmfence1`

---

## Key Metrics

| Metric | Target |
|--------|--------|
| Spec-to-first-task shipped | Hours, not days |
| Review cycles per task | 1–2 (not 3–5) |
| Test coverage | 85%+ (100% on auth/payments) |
| Spec flow coverage by QA | 100% of acceptance criteria |
| Post-ship bugs per sprint | 0–1 |

**The real metric:** Confidence at ship time. By `/ship`, code has been specified, planned, challenged, reviewed, browser-tested, and security-audited.
