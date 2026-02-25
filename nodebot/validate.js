/**
 * Validation script for nodebot
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function validate() {
    console.log('🔍 Validating nodebot structure...\n');

    try {
        // Test loading main modules
        console.log('✅ Testing index.js...');
        const main = require('./index.js');
        console.log('✅ Main module loaded successfully\n');

        // Test loading commands
        console.log('✅ Testing commands...');
        const { agentCommand } = require('./commands/agent.js');
        const { onboardCommand } = require('./commands/onboard.js');
        console.log('✅ Commands loaded successfully\n');

        // Test loading tools
        console.log('✅ Testing tools...');
        const { FilesystemTools } = require('./tools/filesystem.js');
        const { ShellTools } = require('./tools/shell.js');
        const { WebTools } = require('./tools/web.js');
        console.log('✅ Tools loaded successfully\n');

        // Test creating instances
        console.log('✅ Testing tool instantiation...');
        const fsTools = new FilesystemTools('/tmp');
        const shellTools = new ShellTools();
        const webTools = new WebTools();
        console.log('✅ Tool instances created successfully\n');

        // Test package.json
        console.log('✅ Testing package.json...');
        const pkg = require('./package.json');
        if (!pkg.name || !pkg.dependencies) {
            throw new Error('Invalid package.json');
        }
        console.log(`✅ Package validated: ${pkg.name}\n`);

        console.log('🎉 All validations passed! nodebot is ready to use.');
        console.log('\nTo use nodebot:');
        console.log('1. Run `npm install` to install dependencies');
        console.log('2. Run `node index.js onboard` to initialize configuration');
        console.log('3. Add your OpenAI API key to ./.nodebot/config.json');
        console.log('4. Run `node index.js agent` to start the assistant');

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

validate();