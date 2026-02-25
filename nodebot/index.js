#!/usr/bin/env node

/**
 * Entry point for nodebot - Personal AI Assistant
 */

const { program } = require('commander');
const { version } = require('./package.json');
const { agentCommand } = require('./commands/agent');
const { onboardCommand } = require('./commands/onboard');

program
    .name('nodebot')
    .description('Personal AI Assistant')
    .version(version);

program
    .command('agent')
    .alias('a')
    .description('Start the AI agent')
    .option('-m, --message <message>', 'Initial message to send to the agent')
    .option('-c, --config <path>', 'Path to config file', './.nodebot/config.json')
    .action(agentCommand);

program
    .command('onboard')
    .description('Initialize nodebot configuration and workspace')
    .action(onboardCommand);

program.parse();