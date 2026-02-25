/**
 * Onboard / Setup command for nodebot
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

async function onboardCommand() {
    console.log(chalk.blue('┌─────────────────────────────────┐'));
    console.log(chalk.blue('│  🤖 nodebot is initializing │'));
    console.log(chalk.blue('└─────────────────────────────────┘'));

    // Create config directory - use project root directory
    const projectRoot = path.resolve(__dirname, '../..');  // Go up from nodebot/commands/ to project root
    const configDir = path.join(projectRoot, '.nodebot');
    await fs.ensureDir(configDir);

    const configPath = path.join(configDir, 'config.json');

    // Create default config if it doesn't exist
    if (!await fs.pathExists(configPath)) {
        const defaultConfig = {
            agents: {
                defaults: {
                    workspace: "./workspace",
                    model: "gpt-4o",
                    max_tokens: 4096,
                    temperature: 0.7,
                    max_tool_iterations: 20,
                    memory_window: 50
                }
            },
            channels: {
                email: {
                    enabled: false,
                    consent_granted: false,
                    imap_host: "",
                    imap_port: 993,
                    imap_username: "",
                    imap_password: "",
                    imap_mailbox: "INBOX",
                    imap_use_ssl: true,
                    smtp_host: "",
                    smtp_port: 587,
                    smtp_username: "",
                    smtp_password: "",
                    smtp_use_tls: true,
                    smtp_use_ssl: false,
                    from_address: "",
                    auto_reply_enabled: true,
                    poll_interval_seconds: 30,
                    mark_seen: true,
                    max_body_chars: 12000,
                    subject_prefix: "Re: ",
                    allow_from: []
                },
                http_api: {
                    enabled: true,
                    host: "0.0.0.0",
                    port: 8000,
                    allow_from: []
                }
            },
            providers: {
                custom: {
                    api_key: "",
                    api_base: null,
                    extra_headers: null
                }
            },
            gateway: {
                host: "0.0.0.0",
                port: 18790
            },
            tools: {
                web: {
                    search: {
                        api_key: "",
                        max_results: 5
                    }
                },
                exec: {
                    timeout: 60
                },
                restrict_to_workspace: false,
                mcp_servers: {}
            }
        };

        await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
        console.log(chalk.green(`✓ Config created at ${configPath}`));
    } else {
        console.log(chalk.yellow(`⚠ Config already exists at ${configPath}`));
    }

    // Create workspace using the new config structure
    const config = await fs.readJson(configPath);
    // If workspace is set to the default, create it in the .nodebot directory (same level as config)
    const workspacePath = config.agents?.defaults?.workspace || './workspace';
    const workspace = path.resolve(path.dirname(configPath), workspacePath);
    await fs.ensureDir(workspace);

    console.log(chalk.green(`✓ Workspace created at ${workspace}`));

    // Create default templates
    const templatesDir = path.join(workspace, 'templates');
    await fs.ensureDir(templatesDir);

    // Create a basic template
    const defaultTemplate = {
        name: 'basic-agent',
        description: 'Basic agent template',
        systemPrompt: 'You are nodebot, a helpful AI assistant implemented in Node.js.'
    };

    await fs.writeJson(path.join(templatesDir, 'basic.json'), defaultTemplate, { spaces: 2 });
    console.log(chalk.green('✓ Default templates created'));

    console.log('\n' + chalk.blue('🤖 nodebot is ready!'));
    console.log('\nNext steps:');
    console.log('  1. Add your API key to ' + chalk.cyan('./.nodebot/config.json'));
    console.log('  2. Chat: ' + chalk.cyan('node index.js agent -m "Hello!"'));
}

module.exports = { onboardCommand };