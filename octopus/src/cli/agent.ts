/**
 * Agent command - Interact with the agent directly
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { loadConfig } from '../config/loader.js';
import { AgentLoop } from '../agent/loop.js';

// Simple markdown renderer (fallback)
function renderMarkdown(text: string): string {
    // Simple markdown rendering - just return the text as-is for now
    // In a real implementation, you might use a more sophisticated renderer
    return text;
}

export const agentCommand = new Command('agent')
    .description('Interact with the agent directly')
    .option('-m, --message <message>', 'Message to send to the agent')
    .option('-s, --session <session>', 'Session ID', 'cli:direct')
    .option('--markdown', 'Render assistant output as Markdown', true)
    .option('--no-markdown', 'Do not render assistant output as Markdown')
    .option('--logs', 'Show octopus runtime logs during chat', false)
    .option('--no-logs', 'Do not show octopus runtime logs during chat')
    .action(async (options) => {
        const config = await loadConfig();

        if (!config.providers.custom.apiKey) {
            console.error(chalk.red('Error: No API key configured. Please configure Custom provider API key in ~/.octopus/config.json.'));
            process.exit(1);
        }

        const agent = new AgentLoop(config);

        if (options.message) {
            // Single message mode
            const spinner = ora('🐙 Octopus is thinking...').start();

            try {
                const response = await agent.processDirect(
                    options.message,
                    options.session
                );

                spinner.stop();

                if (options.markdown) {
                    console.log(chalk.cyan('🐙 Octopus'));
                    console.log(renderMarkdown(response));
                } else {
                    console.log(chalk.cyan('🐙 Octopus'));
                    console.log(response);
                }
            } catch (error) {
                spinner.stop();
                console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
                process.exit(1);
            }

            // Exit after single message
            process.exit(0);
        } else {
            // Interactive mode
            console.log(chalk.cyan('🐙 Interactive mode (type "exit" or press Ctrl+C to quit)\n'));

            while (true) {
                try {
                    const { message } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'message',
                            message: chalk.blue('You:'),
                            validate: (input) => input.trim() !== '' || 'Please enter a message'
                        }
                    ]);

                    if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
                        console.log(chalk.cyan('\nGoodbye!'));
                        break;
                    }

                    const spinner = ora('🐙 Octopus is thinking...').start();

                    try {
                        const response = await agent.processDirect(message, options.session);

                        spinner.stop();

                        console.log('');
                        console.log(chalk.cyan('🐙 Octopus'));

                        if (options.markdown) {
                            console.log(renderMarkdown(response));
                        } else {
                            console.log(response);
                        }

                        console.log('');
                    } catch (error) {
                        spinner.stop();
                        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
                    }
                } catch (error) {
                    if (error instanceof Error && error.name === 'PromptForceClose') {
                        console.log(chalk.cyan('\nGoodbye!'));
                        break;
                    }
                    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
                }
            }
        }
    });