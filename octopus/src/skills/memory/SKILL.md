---
name: memory
description: Manage long-term memory and conversation history
always: true
---

# Memory Skill

This skill allows you to manage Octopus's long-term memory and conversation history.

## Memory Files

- `memory/MEMORY.md` - Long-term facts about the user, preferences, and important information
- `memory/HISTORY.md` - Grep-searchable log of past conversations and events

## Commands

### Remembering Information

To remember important information for future reference:

```bash
# Add a fact to long-term memory
echo "## User Preferences\n\nThe user prefers concise answers" >> memory/MEMORY.md

# Add a project note
echo "## Project: Octopus\n\n- User is building an AI assistant\n- Focus on Node.js implementation" >> memory/MEMORY.md
```

### Searching Memory

To search past conversations:

```bash
# Search history for a specific topic
grep -i "github" memory/HISTORY.md

# Search for recent conversations about a specific topic
grep -A 5 -B 5 "error" memory/HISTORY.md | tail -n 20
```

### Memory Consolidation

Octopus automatically consolidates conversations into memory, but you can manually trigger it:

1. Review recent conversations in `memory/HISTORY.md`
2. Extract important facts and add them to `memory/MEMORY.md`
3. Organize information with clear sections and headers

## Best Practices

- Use clear section headers in `MEMORY.md`
- Include dates for time-sensitive information
- Keep `MEMORY.md` focused on facts, not conversations
- Use descriptive commit messages when updating memory
- Regularly review and organize memory content

## Memory Structure

### MEMORY.md Structure

```markdown
# Long-term Memory

## User Information
- Name, role, background
- Contact information
- Personal preferences

## Project Context
- Current projects and goals
- Technical decisions made
- Important links and resources

## Preferences
- Communication style
- Work habits
- Tool preferences
```

### HISTORY.md Format

Each entry includes:
- Timestamp
- Role (user/assistant)
- Tools used (if any)
- Content summary

This format makes it easy to grep for specific topics or tools used.