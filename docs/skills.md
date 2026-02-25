# Nanobot Skills Quick Reference

## GitHub Skill
Interact with GitHub using the `gh` CLI.

Install GitHub CLI:
```bash
# macOS
brew install gh

# Ubuntu/Debian
apt install gh
```

Usage examples:
```bash
# Check CI status on a PR
gh pr checks 55 --repo owner/repo

# List recent workflow runs
gh run list --repo owner/repo --limit 10

# View a run
gh run view <run-id> --repo owner/repo
```

## Weather Skill
Get current weather and forecasts (no API key required).

Usage:
```bash
# Quick weather
curl -s "wttr.in/London?format=3"

# Compact format
curl -s "wttr.in/London?format=%l:+%c+%t+%h+%w"

# Full forecast
curl -s "wttr.in/London?T"
```

## ClawHub Skill
Search and install agent skills from ClawHub.

Usage:
```bash
# Search for skills
npx --yes clawhub@latest search "web scraping" --limit 5

# Install a skill
npx --yes clawhub@latest install <slug> --workdir ~/.nanobot/workspace
```

## Cron Skill
Schedule automated tasks using cron expressions.

Usage:
```bash
# Add a job
nanobot cron add --name "daily" --message "Good morning!" --cron "0 9 * * *"
nanobot cron add --name "hourly" --message "Check status" --every 3600

# List jobs
nanobot cron list

# Remove a job
nanobot cron remove <job_id>
```

## Memory Skill
Persistent memory management for nanobot.

Usage:
```bash
# Save information to memory
nanobot memory save "key" "value"

# Retrieve from memory
nanobot memory get "key"

# List all memories
nanobot memory list
```

## Summarize Skill
Summarize documents, web pages, or text content.

Usage:
```bash
# Summarize a URL
nanobot summarize url "https://example.com/article"

# Summarize a file
nanobot summarize file "/path/to/document.txt"

# Summarize text
nanobot summarize text "Paste your long text here..."
```

## TMUX Skill
Terminal multiplexer management.

Usage:
```bash
# Create a new session
tmux new-session -d -s mysession

# List sessions
tmux list-sessions

# Attach to session
tmux attach-session -t mysession

# Kill session
tmux kill-session -t mysession
```

## Skill Creator
Create new skills for nanobot.

Usage:
```bash
# Create a new skill
nanobot skill create "my-skill-name"
```