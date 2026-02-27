/**
 * Onboard command - Initialize octopus configuration and workspace
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, getConfigPath, getWorkspacePath } from '../config/loader.js';
import { Config } from '../config/schema.js';

export const onboardCommand = new Command('onboard')
    .description('Initialize octopus configuration and workspace')
    .action(async () => {
        console.log(chalk.cyan('🐙 Octopus Setup'));

        const configPath = getConfigPath();

        if (await fs.pathExists(configPath)) {
            console.log(chalk.yellow(`Config already exists at ${configPath}`));
            console.log('  y = overwrite with defaults (existing values will be lost)');
            console.log('  N = refresh config, keeping existing values and adding new fields');

            // In a real implementation, this would prompt the user
            // For now, we'll just skip refreshing the config to avoid validation errors
            console.log(chalk.yellow(`✓ Skipping config refresh (existing values preserved)`));
        } else {
            await saveConfig({} as Config);
            console.log(chalk.green(`✓ Created config at ${configPath}`));
        }

        // Create workspace
        const workspace = getWorkspacePath();

        if (!await fs.pathExists(workspace)) {
            await fs.ensureDir(workspace);
            console.log(chalk.green(`✓ Created workspace at ${workspace}`));
        }

        // Create default bootstrap files
        await createWorkspaceTemplates(workspace);

        console.log(`\n${chalk.cyan('🐙 Octopus is ready!')}`);
        console.log('\nNext steps:');
        console.log('  1. Add your API key to ' + chalk.cyan('~/.octopus/config.json'));
        console.log('  2. Chat: ' + chalk.cyan('npm start agent -m "Hello!"'));
    });

async function createWorkspaceTemplates(workspace: string): Promise<void> {
    const templates = {
        'AGENTS.md': `# Agent Instructions

You are a helpful AI assistant. Be concise, accurate, and friendly.

## Guidelines

- Always explain what you're doing before taking actions
- Ask for clarification when the request is ambiguous
- Use tools to help accomplish tasks
- Remember important information in memory/MEMORY.md; past events are logged in memory/HISTORY.md
`,
        'SOUL.md': `# Soul

I am octopus, a lightweight AI assistant.

## Personality

- Helpful and friendly
- Concise and to the point
- Curious and eager to learn

## Values

- Accuracy over speed
- User privacy and safety
- Transparency in actions
`,
        'USER.md': `# User

Information about the user goes here.

## Preferences

- Communication style: (casual/formal)
- Timezone: (your timezone)
- Language: (your preferred language)
`
    };

    for (const [filename, content] of Object.entries(templates)) {
        const filePath = path.join(workspace, filename);
        if (!await fs.pathExists(filePath)) {
            await fs.writeFile(filePath, content);
            console.log(`  ${chalk.dim(`Created ${filename}`)}`);
        }
    }

    // Create memory directory and MEMORY.md
    const memoryDir = path.join(workspace, 'memory');
    await fs.ensureDir(memoryDir);

    const memoryFile = path.join(memoryDir, 'MEMORY.md');
    if (!await fs.pathExists(memoryFile)) {
        await fs.writeFile(memoryFile, `# Long-term Memory

This file stores important information that should persist across sessions.

## User Information

(Important facts about the user)

## Preferences

(User preferences learned over time)

## Important Notes

(Things to remember)
`);
        console.log(`  ${chalk.dim('Created memory/MEMORY.md')}`);
    }

    const historyFile = path.join(memoryDir, 'HISTORY.md');
    if (!await fs.pathExists(historyFile)) {
        await fs.writeFile(historyFile, '');
        console.log(`  ${chalk.dim('Created memory/HISTORY.md')}`);
    }

    // Create skills directory for custom user skills
    const skillsDir = path.join(workspace, 'skills');
    await fs.ensureDir(skillsDir);
}