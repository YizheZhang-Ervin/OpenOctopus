#!/usr/bin/env node

/**
 * Octopus - A lightweight AI agent framework
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { onboardCommand } from './cli/onboard.js';
import { gatewayCommand } from './cli/gateway.js';
import { agentCommand } from './cli/agent.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
    .name('octopus')
    .description('🐙 Octopus - Personal AI Assistant')
    .version(version);

program.addCommand(onboardCommand);
program.addCommand(gatewayCommand);
program.addCommand(agentCommand);

program.parse();