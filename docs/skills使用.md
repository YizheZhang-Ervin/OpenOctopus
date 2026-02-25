# Nanobot Skills Quick Reference

## ClawHub Skill
Search and install agent skills from ClawHub.

Usage:
```bash
# Search for skills
npx --yes clawhub@latest search "web scraping" --limit 5

# Install a skill
npx --yes clawhub@latest install <slug> --workdir ./.nanobot/workspace
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

## Skill Creator
Create new skills for nanobot.

Usage:
```bash
# Create a new skill
nanobot skill create "my-skill-name"
```