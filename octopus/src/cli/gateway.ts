/**
 * Gateway command - Start the octopus gateway server
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../config/loader.js';
import { GatewayServer } from '../gateway/server.js';

export const gatewayCommand = new Command('gateway')
    .description('Start the octopus gateway server')
    .option('-p, --port <port>', 'HTTP API port', '8000')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
        const config = await loadConfig();
        const httpPort = parseInt(options.port) || config.channels.httpApi.port;

        console.log(chalk.cyan(`🐙 Starting Octopus gateway...`));
        console.log(chalk.blue(`  HTTP API port: ${httpPort}`));
        console.log(chalk.blue(`  WebSocket port: ${config.gateway.port}`));

        if (!config.providers.custom.apiKey) {
            console.error(chalk.red('Error: No API key configured. Please configure Custom provider API key in ~/.octopus/config.json.'));
            process.exit(1);
        }

        if (options.verbose) {
            process.env.DEBUG = 'octopus:*';
        }

        const server = new GatewayServer(config, httpPort);

        try {
            await server.start();
        } catch (error) {
            console.error(chalk.red(`Failed to start gateway: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });