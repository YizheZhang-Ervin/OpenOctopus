---
name: summarize
description: Summarize text content and conversations
---

# Summarize Skill

This skill helps you summarize text content, conversations, and documents efficiently.

## Usage

### Summarizing Files

```bash
# Summarize a text file
read_file file_path="document.txt" | "Please summarize this document in 3-5 bullet points"

# Summarize a conversation log
read_file file_path="memory/HISTORY.md" | "Extract the key topics and decisions from this conversation"

# Summarize with specific focus
read_file file_path="report.txt" | "Summarize this report focusing on the main findings and recommendations"
```

### Conversation Summaries

```bash
# Summarize recent conversation
grep -A 20 -B 5 "topic" memory/HISTORY.md | "What are the key points discussed about this topic?"

# Daily summary
grep "$(date +%Y-%m-%d)" memory/HISTORY.md | "Summarize today's conversations and activities"

# Project-specific summary
grep -i "project name" memory/HISTORY.md | "Summarize all discussions about this project"
```

### Different Summary Types

```bash
# Executive summary (high-level)
read_file file_path="document.txt" | "Provide a 2-3 sentence executive summary"

# Detailed summary with key points
read_file file_path="document.txt" | "Provide a detailed summary with the main points, conclusions, and action items"

# Technical summary
read_file file_path="technical_doc.txt" | "Summarize the technical aspects, implementation details, and requirements"

# Meeting summary
read_file file_path="meeting_notes.txt" | "Extract the meeting attendees, topics discussed, decisions made, and action items"
```

### Custom Summaries

```bash
# Word-limited summary
read_file file_path="article.txt" | "Summarize this article in exactly 100 words"

# Bullet-point summary
read_file file_path="document.txt" | "Summarize this document using bullet points for the main ideas"

# Question-based summary
read_file file_path="document.txt" | "From this document, what are the answers to: 1) What is the problem? 2) What is the proposed solution? 3) What are the next steps?"
```

## Best Practices

1. **Be specific about summary length** - Specify word count or format
2. **Identify the purpose** - Is it for quick reference, detailed analysis, or decision-making?
3. **Specify focus areas** - Highlight what aspects are most important
4. **Consider the audience** - Technical vs. non-technical summary
5. **Preserve key details** - Don't lose important information in summarization

## Examples

```bash
# Research paper summary
read_file file_path="research_paper.pdf" | "Summarize this research paper including the methodology, key findings, and implications"

# Code review summary
read_file file_path="code_changes.md" | "Summarize these code changes, including the files modified and the purpose of each change"

# Email thread summary
read_file file_path="email_thread.txt" | "Summarize this email thread, highlighting the main question, responses, and final resolution"
```

## Saving Summaries

```bash
# Save a summary to memory
read_file file_path="document.txt" | "Summarize this document" | write_file file_path="memory/summaries/document_summary.md"

# Add to long-term memory
read_file file_path="project_notes.txt" | "Extract key project information" >> memory/MEMORY.md
```