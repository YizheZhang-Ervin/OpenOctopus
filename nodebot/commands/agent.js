/**
 * Agent command for nodebot
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const OpenAI = require('openai');
const inquirer = require('inquirer').default;
const { FilesystemTools } = require('../tools/filesystem');
const { ShellTools } = require('../tools/shell');
const { WebTools } = require('../tools/web');
const { ToolRegistry } = require('../tools/registry');
const { SkillsLoader } = require('../skills/skills');
const { SessionManager } = require('../session/manager');
const { HeartbeatService } = require('../heartbeat/service');
const { ServiceBus } = require('../bus');
const { CronService } = require('../cron/service');
const { defaultRegistry: providerRegistry } = require('../providers');
const { Memory } = require('../agent/memory');
const { Context } = require('../agent/context');
const { SubAgentManager } = require('../agent/subagent');
const { ChannelManager } = require('../channels');
const { deepMerge, generateId } = require('../utils');
const { ConfigSchema } = require('../config/schema');

class AgentLoop {
    constructor(config) {
        this.config = config;
        // Resolve workspace path - use project root (parent directory) for .nodebot folder
        const workspacePath = config.agents?.defaults?.workspace || '../.nodebot/workspace';
        this.workspace = path.resolve(__dirname, '..', workspacePath);
        this.model = config.agents?.defaults?.model || 'gpt-4o';
        this.temperature = config.agents?.defaults?.temperature || 0.7;
        this.maxTokens = config.agents?.defaults?.max_tokens || 4096;

        // Initialize tool registry
        this.toolRegistry = new ToolRegistry();

        // Register tools based on config
        if (true) { // Enable read-file by default with new config structure
            const readFileTool = new (class extends require('../tools/registry').BaseTool {
                constructor() {
                    super('readFile', 'Read the contents of a file', {
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Path to the file to read"
                            }
                        },
                        required: ["filePath"]
                    });
                }

                async execute(args) {
                    const fsTools = new FilesystemTools(this.workspace);
                    return await fsTools.readFile(args.filePath);
                }
            })();
            this.toolRegistry.registerTool(readFileTool);
        }

        if (true) { // Enable write-file by default with new config structure
            const writeFileTool = new (class extends require('../tools/registry').BaseTool {
                constructor(workspace) {
                    super('writeFile', 'Write content to a file', {
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Path to the file to write"
                            },
                            content: {
                                type: "string",
                                description: "Content to write to the file"
                            }
                        },
                        required: ["filePath", "content"]
                    });
                    this.workspace = workspace;
                }

                async execute(args) {
                    const fsTools = new FilesystemTools(this.workspace);
                    return await fsTools.writeFile(args.filePath, args.content);
                }
            })(this.workspace);
            this.toolRegistry.registerTool(writeFileTool);
        }

        if (true) { // Enable exec by default with new config structure
            const execTool = new (class extends require('../tools/registry').BaseTool {
                constructor(shellConfig) {
                    super('executeCommand', 'Execute a shell command', {
                        properties: {
                            command: {
                                type: "string",
                                description: "Command to execute"
                            }
                        },
                        required: ["command"]
                    });
                    this.shellTools = new ShellTools(shellConfig);
                }

                async execute(args) {
                    return await this.shellTools.executeCommand(args.command);
                }
            })(this.config.tools?.exec || {}); // Using exec config from new structure with fallback
            this.toolRegistry.registerTool(execTool);
        }

        if (true) { // Enable web-search by default with new config structure
            const webSearchTool = new (class extends require('../tools/registry').BaseTool {
                constructor(webConfig) {
                    super('webSearch', 'Perform a web search', {
                        properties: {
                            query: {
                                type: "string",
                                description: "Search query"
                            }
                        },
                        required: ["query"]
                    });
                    this.webTools = new WebTools(webConfig);
                }

                async execute(args) {
                    return await this.webTools.webSearch(args.query);
                }
            })(this.config.tools?.web?.search || {}); // Using web search config from new structure with fallback
            this.toolRegistry.registerTool(webSearchTool);
        }

        if (true) { // Enable web-fetch by default with new config structure
            const webFetchTool = new (class extends require('../tools/registry').BaseTool {
                constructor(webConfig) {
                    super('webFetch', 'Fetch content from a web page', {
                        properties: {
                            url: {
                                type: "string",
                                description: "URL to fetch"
                            }
                        },
                        required: ["url"]
                    });
                    this.webTools = new WebTools(webConfig);
                }

                async execute(args) {
                    return await this.webTools.webFetch(args.url);
                }
            })(this.config.tools?.web?.search || {}); // Using web search config from new structure with fallback
            this.toolRegistry.registerTool(webFetchTool);
        }

        // Initialize skills loader
        this.skillsLoader = new SkillsLoader(this.workspace);

        // Conversation history
        this.messages = [
            {
                role: 'system',
                content: config.agents?.defaults?.systemPrompt || 'You are nodebot, a helpful AI assistant implemented in Node.js. You have access to various tools including filesystem operations, shell commands, and web search. When using tools, respond in JSON format with the tool name and parameters.'
            }
        ];

        // Initialize new services
        this.sessionManager = new SessionManager(this.workspace);
        this.heartbeatService = new HeartbeatService();
        this.serviceBus = new ServiceBus();
        this.cronService = new CronService();
        this.memory = new Memory(this.workspace);
        this.context = new Context(this);
        this.subAgentManager = new SubAgentManager(this);
        this.channelManager = new ChannelManager();

        // Initialize provider
        this.provider = null;
    }

    async initializeServices() {
        // Validate configuration with warnings
        const validation = ConfigSchema.validateWithWarnings(this.config);
        if (!validation.valid) {
            console.error(chalk.red('Configuration validation failed:'));
            validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
            throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }

        // Show warnings
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.warn(chalk.yellow(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ${warning}`)));
        }

        // Initialize session manager
        await this.sessionManager.init();

        // Initialize memory system
        await this.memory.init();

        // Register heartbeat checks for critical services
        this.heartbeatService.registerService('provider', async () => {
            if (!this.provider) {
                return { healthy: false, error: 'No provider initialized' };
            }
            const isValid = await this.provider.validateConfig();
            return { healthy: isValid };
        });

        this.heartbeatService.registerService('filesystem-tools', async () => {
            // Simple check to see if workspace is accessible
            try {
                await fs.access(this.workspace);
                return { healthy: true };
            } catch (error) {
                return { healthy: false, error: error.message };
            }
        });

        this.heartbeatService.registerService('memory-system', async () => {
            try {
                // Try to save a test memory
                await this.memory.saveMemory('health-check', { status: 'ok', timestamp: Date.now() });
                return { healthy: true };
            } catch (error) {
                return { healthy: false, error: error.message };
            }
        });

        // Start heartbeat monitoring
        this.heartbeatService.startMonitoring();

        // Subscribe to important events
        this.serviceBus.subscribe('agent.message.processed', (data) => {
            console.log(chalk.gray(`Message processed at ${data.timestamp}`));
        });

        this.serviceBus.subscribe('agent.tool.used', (data) => {
            console.log(chalk.gray(`Tool used: ${data.toolName} at ${data.timestamp}`));
        });

        // Add initial system message to context
        this.context.addMessage('system', this.config.agents?.defaults?.systemPrompt || 'You are nodebot, a helpful AI assistant implemented in Node.js.', { tags: ['system'] });

        // Initialize MCP (Message Control Protocol) using the service bus
        const { MCP } = require('../tools/mcp-client');
        this.mcp = new MCP(this.serviceBus);

        // Register default channels if available in config
        if (this.config.channels) {
            await this.setupChannels(this.config.channels);

            // Register message tool if channels are available
            const { MessageTool } = require('../tools/message');
            const messageTool = new MessageTool(this);
            this.registerTool(messageTool);
        }

        // Register MCP tools if MCP client is available
        if (this.mcp) {
            const { MCPTaskTool, MCPListToolsTool } = require('../tools/mcp-tools');
            const mcpTaskTool = new MCPTaskTool(this.mcp);
            const mcpListToolsTool = new MCPListToolsTool(this.mcp);
            this.registerTool(mcpTaskTool);
            this.registerTool(mcpListToolsTool);
        }

        // Register enhanced web search tool
        const { EnhancedWebSearchTool } = require('../tools/enhanced-web-search');
        const enhancedWebSearchTool = new EnhancedWebSearchTool(this.config);
        this.registerTool(enhancedWebSearchTool);

        // Register advanced file system tool
        const { AdvancedFileSystemTool } = require('../tools/advanced-filesystem');
        const advancedFileSystemTool = new AdvancedFileSystemTool(this.workspace);
        this.registerTool(advancedFileSystemTool);
    }

    async setupChannels(channelsConfig) {
        for (const [channelName, channelConfig] of Object.entries(channelsConfig)) {
            try {
                if (channelName === 'email') {
                    const { EmailChannel } = require('../channels/email');
                    const emailChannel = new EmailChannel(channelConfig);
                    this.channelManager.registerChannel('email', emailChannel);
                } else if (channelName === 'http_api') {
                    const { HttpApiChannel } = require('../channels/http_api');
                    const httpChannel = new HttpApiChannel(channelConfig);
                    this.channelManager.registerChannel('http_api', httpChannel);
                }
                // Additional channels can be added here

                console.log(chalk.green(`Channel '${channelName}' registered successfully`));
            } catch (error) {
                console.error(chalk.red(`Failed to register channel '${channelName}':`), error.message);
            }
        }

        // Connect all channels
        await this.channelManager.connectAll();
    }

    async processMessage(userMessage) {
        // Ensure services are initialized
        if (!this.servicesInitialized) {
            await this.initializeServices();
            this.servicesInitialized = true;
        }

        // Initialize provider if not already done
        if (!this.provider) {
            const openaiApiKey = (this.config.apiKeys?.openai || process.env.OPENAI_API_KEY) || this.config.providers?.custom?.api_key;
            const openrouterApiKey = this.config.apiKeys?.openrouter || process.env.OPENROUTER_API_KEY;

            if (openrouterApiKey) {
                this.provider = await providerRegistry.createProvider('openrouter', {
                    apiKey: openrouterApiKey,
                    defaultModel: this.config.agents?.defaults?.model || 'openai/gpt-4o',
                    temperature: this.config.agents?.defaults?.temperature,
                    maxTokens: this.config.agents?.defaults?.max_tokens
                });
            } else if (openaiApiKey) {
                this.provider = await providerRegistry.createProvider('openai', {
                    apiKey: openaiApiKey,
                    defaultModel: this.config.agents?.defaults?.model || 'gpt-4o',
                    temperature: this.config.agents?.defaults?.temperature,
                    max_tokens: this.config.agents?.defaults?.max_tokens
                });
            } else {
                throw new Error('No API key found. Please set either OpenAI or OpenRouter API key in config or environment variables.');
            }
        }

        // Get available skills and add them to system message if not already present
        const skillsContent = await this.skillsLoader.loadSkillsForContext(
            (await this.skillsLoader.listSkills()).map(skill => skill.name)
        );

        // Update system message to include skills if we have them
        if (skillsContent && this.messages[0].role === 'system') {
            const baseSystemPrompt = this.messages[0].content;
            this.messages[0].content = `${baseSystemPrompt}\n\nAvailable skills:\n${skillsContent}`;
        }

        // Add user message to context
        this.context.addMessage('user', userMessage, { tags: ['input'] });

        // Add to session if session tracking is enabled
        if (this.currentSessionId) {
            this.sessionManager.addMessageToSession(this.currentSessionId, {
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            });
        }

        try {
            // Get recent messages from context for the API call
            const contextMessages = this.context.getRecentMessages(15).map(ctxMsg => ({
                role: ctxMsg.role,
                content: ctxMsg.content
            }));

            // Prepare the call options
            const callOptions = {
                model: this.config.agents?.defaults?.model || 'gpt-4o',
                temperature: this.config.agents?.defaults?.temperature || 0.7,
                maxTokens: this.config.agents?.defaults?.max_tokens || 4096,
                // Enable function calling if tools are available
                ...(Object.keys(this.tools).length > 0 ? {
                    tools: this.getAvailableTools(),
                    tool_choice: "auto"
                } : {})
            };

            // Call the provider
            const response = await this.provider.chatCompletion(contextMessages, callOptions);

            let fullResponse = '';

            // Process the response
            for (const choice of response.choices) {
                const message = choice.message;

                // Handle tool calls if present
                if (message.tool_calls && message.tool_calls.length > 0) {
                    // Add assistant message with tool calls to context
                    this.context.addMessage('assistant', JSON.stringify(message), {
                        tool_calls: message.tool_calls,
                        tags: ['response', 'tool-call']
                    });

                    // Execute each tool call
                    for (const toolCall of message.tool_calls) {
                        const functionName = toolCall.function.name;
                        const functionArgs = JSON.parse(toolCall.function.arguments);

                        console.log(chalk.yellow(`Using tool: ${functionName}`));

                        // Emit event through service bus
                        this.serviceBus.publish('agent.tool.used', {
                            toolName: functionName,
                            args: functionArgs,
                            timestamp: new Date().toISOString()
                        });

                        try {
                            const toolResult = await this.toolRegistry.executeTool(functionName, functionArgs);

                            // Add tool result to context
                            this.context.addMessage('tool', JSON.stringify(toolResult), {
                                tool_call_id: toolCall.id,
                                tags: ['tool-result']
                            });

                            console.log(chalk.gray(`Tool result: ${JSON.stringify(toolResult, null, 2)}`));
                        } catch (error) {
                            console.error(chalk.red(`Error executing tool ${functionName}:`), error.message);

                            this.context.addMessage('tool', JSON.stringify({ error: error.message }), {
                                tool_call_id: toolCall.id,
                                tags: ['tool-error']
                            });
                        }
                    }

                    // Get updated context messages for the follow-up call
                    const updatedContextMessages = this.context.getRecentMessages(15).map(ctxMsg => ({
                        role: ctxMsg.role,
                        content: ctxMsg.content
                    }));

                    // Make another API call to get the final response after tool execution
                    const secondResponse = await this.provider.chatCompletion(updatedContextMessages, {
                        model: this.config.agents?.defaults?.model || 'gpt-4o',
                        temperature: this.config.agents?.defaults?.temperature || 0.7,
                        maxTokens: this.config.agents?.defaults?.max_tokens || 4096
                    });

                    const finalMessage = secondResponse.choices[0].message;
                    this.context.addMessage('assistant', finalMessage.content, { tags: ['final-response'] });
                    fullResponse = finalMessage.content;
                } else {
                    // No tool calls, just return the content
                    this.context.addMessage('assistant', message.content, { tags: ['response'] });
                    fullResponse = message.content;
                }
            }

            // Emit event through service bus
            this.serviceBus.publish('agent.message.processed', {
                response: fullResponse,
                timestamp: new Date().toISOString()
            });

            return fullResponse || 'No response generated.';
        } catch (error) {
            console.error(chalk.red('Error calling AI provider:'), error.message);
            return 'Sorry, I encountered an error processing your request.';
        }
    }

    getAvailableTools() {
        return this.toolRegistry.getAvailableTools();
    }

    async runInteractive() {
        console.log(chalk.blue('nodebot - Interactive Mode'));
        console.log(chalk.gray('Type "exit" to quit, "new-session" to start a new session\n'));

        // Create a new session for this interaction
        this.currentSessionId = `session_${Date.now()}`;
        this.sessionManager.createSession(this.currentSessionId, {
            type: 'interactive',
            startedAt: new Date()
        });

        while (true) {
            try {
                const userInputResponse = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'userInput',
                        message: chalk.cyan('You: '),
                        prefix: ''
                    }
                ]);
                const userInput = userInputResponse.userInput;

                if (userInput.toLowerCase().trim() === 'exit' || userInput.toLowerCase().trim() === 'quit') {
                    console.log(chalk.blue('Goodbye!'));

                    // End the session
                    if (this.currentSessionId) {
                        this.sessionManager.endSession(this.currentSessionId);
                        this.currentSessionId = null;
                    }

                    break;
                }

                // Check for special commands
                if (userInput.toLowerCase().trim() === 'new-session') {
                    // End the current session
                    if (this.currentSessionId) {
                        this.sessionManager.endSession(this.currentSessionId);
                    }

                    // Create a new session
                    this.currentSessionId = `session_${Date.now()}`;
                    this.sessionManager.createSession(this.currentSessionId, {
                        type: 'interactive',
                        startedAt: new Date()
                    });

                    console.log(chalk.yellow('New session started.\n'));
                    continue;
                }

                const response = await this.processMessage(userInput);
                console.log(chalk.green('\nnodebot: ') + response + '\n');
            } catch (error) {
                console.error(chalk.red('Error:'), error.message);
            }
        }
    }

    // Method to get current session info
    getCurrentSessionInfo() {
        if (!this.currentSessionId) {
            return null;
        }
        return this.sessionManager.getSession(this.currentSessionId);
    }

    // Method to list active sessions
    listActiveSessions() {
        return this.sessionManager.listActiveSessions();
    }

    // Method to get heartbeat status
    getHeartbeatStatus() {
        return this.heartbeatService.getStatus();
    }

    // Method to add a scheduled job
    addScheduledJob(jobId, cronExpression, taskFunction, options = {}) {
        return this.cronService.addJob(jobId, cronExpression, taskFunction, options);
    }

    // Method to get service bus instance
    getServiceBus() {
        return this.serviceBus;
    }

    // Methods for context management
    getContext() {
        return this.context;
    }

    // Methods for memory management
    getMemory() {
        return this.memory;
    }

    // Methods for subagent management
    getSubAgentManager() {
        return this.subAgentManager;
    }

    // Method to run a task with a subagent
    async runWithSubAgent(task, specialty = 'general') {
        return await this.subAgentManager.runTaskOnSpecializedAgent(task, specialty);
    }

    // Method to register a new tool
    registerTool(tool) {
        return this.toolRegistry.registerTool(tool);
    }

    // Method to get tool registry
    getToolRegistry() {
        return this.toolRegistry;
    }

    // Methods for channel management
    getChannelManager() {
        return this.channelManager;
    }

    async sendMessageViaChannel(message, channelName, options = {}) {
        return await this.channelManager.sendMessage(message, channelName, options);
    }

    async broadcastMessageViaChannels(message, options = {}) {
        return await this.channelManager.broadcastMessage(message, options);
    }

    // Method to access MCP
    getMCP() {
        return this.mcp;
    }

    // Method to send MCP message
    async sendMCPMessage(type, payload, options = {}) {
        return await this.mcp.send(type, payload, options);
    }

    // Method to make MCP request
    async makeMCPRequest(type, payload, options = {}) {
        return await this.mcp.request(type, payload, options);
    }

    // Method to subscribe to MCP messages
    subscribeToMCP(type, handler, options = {}) {
        return this.mcp.subscribe(type, handler, options);
    }
}

async function agentCommand(options) {
    let config;
    // Resolve config path relative to project root when it's a relative path
    let configPath = options.config.replace('~', require('os').homedir());

    // If the path is relative (doesn't start with / on Unix or C:\ on Windows), resolve it from project root
    if (!path.isAbsolute(configPath)) {
        const projectRoot = path.resolve(__dirname, '../..'); // Go up from commands/ to project root
        configPath = path.resolve(projectRoot, configPath);
    }

    try {
        if (await fs.pathExists(configPath)) {
            config = await fs.readJson(configPath);
        } else {
            console.error(chalk.red(`Config file not found: ${configPath}`));
            console.log(chalk.yellow('Run `node index.js onboard` to initialize configuration'));
            return;
        }
    } catch (error) {
        console.error(chalk.red('Error reading config:'), error.message);
        return;
    }

    const agent = new AgentLoop(config);

    if (options.message) {
        // Single message mode
        const response = await agent.processMessage(options.message);
        console.log(chalk.green('nodebot: ') + response);
    } else {
        // Interactive mode
        await agent.runInteractive();
    }
}

module.exports = { agentCommand };