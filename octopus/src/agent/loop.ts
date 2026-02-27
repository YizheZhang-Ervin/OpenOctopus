/**
 * Agent loop: the core processing engine
 */

import { ContextBuilder, Message } from './context.js';
import { MessageBus } from '../bus/queue.js';
import { ToolRegistry } from '../tools/base.js';
import { ReadFileTool, WriteFileTool, ListDirTool } from '../tools/filesystem.js';
import { ExecTool } from '../tools/shell.js';
import { WebSearchTool, WebFetchTool } from '../tools/web.js';
import { LLMProvider, LLMToolCall } from '../providers/base.js';
import { createProvider } from '../providers/registry.js';
import { SessionManager } from '../session/manager.js';
import { Config } from '../config/schema.js';
import { InboundMessage, OutboundMessage } from '../bus/events.js';

export class AgentLoop {
    private bus: MessageBus;
    private provider: LLMProvider;
    private workspace: string;
    private model: string;
    private maxIterations: number;
    private temperature: number;
    private maxTokens: number;
    private memoryWindow: number;
    private braveApiKey?: string;
    private restrictToWorkspace: boolean;
    private config: Config;

    private context: ContextBuilder;
    private sessions: SessionManager;
    private tools: ToolRegistry;

    constructor(config: Config) {
        this.config = config;
        this.bus = new MessageBus();
        this.workspace = config.agents.defaults.workspace;
        this.model = config.agents.defaults.model;
        this.maxIterations = config.agents.defaults.maxToolIterations;
        this.temperature = config.agents.defaults.temperature;
        this.maxTokens = config.agents.defaults.maxTokens;
        this.memoryWindow = config.agents.defaults.memoryWindow;
        this.braveApiKey = config.tools.web.search.apiKey;
        this.restrictToWorkspace = config.tools.restrictToWorkspace;

        // Create LLM provider
        let providerName = 'custom';
        let providerConfig = this.config.providers.custom;

        if (!providerConfig.apiKey) {
            throw new Error(`No API key configured for Custom provider. Please configure Custom provider API key.`);
        }

        const apiBase = this.getApiBase();
        this.provider = createProvider(providerName, providerConfig.apiKey, this.model, apiBase);

        // Initialize components
        this.context = new ContextBuilder(this.workspace);
        this.sessions = new SessionManager(this.workspace);
        this.tools = new ToolRegistry();

        this.registerDefaultTools();
    }



    private getProviderConfig(providerName: string): any {
        return this.config.providers.custom;
    }

    private getApiBase(): string | undefined {
        return this.config.providers.custom.apiBase;
    }

    private registerDefaultTools(): void {
        // File tools (restrict to workspace if configured)
        const allowedDir = this.restrictToWorkspace ? this.workspace : undefined;

        this.tools.register(new ReadFileTool(allowedDir));
        this.tools.register(new WriteFileTool(allowedDir));
        this.tools.register(new ListDirTool(allowedDir));

        // Shell tool
        this.tools.register(new ExecTool({
            workingDir: this.workspace,
            timeout: 60000, // 60 seconds
            restrictToWorkspace: this.restrictToWorkspace
        }));

        // Web tools
        this.tools.register(new WebSearchTool({
            apiKey: this.braveApiKey || '',
            maxResults: 5
        }));
        this.tools.register(new WebFetchTool());
    }

    /**
     * Process a message directly (for CLI usage)
     */
    async processDirect(
        content: string,
        sessionKey = 'cli:direct',
        channel = 'cli',
        chatId = 'direct'
    ): Promise<string> {
        const session = this.sessions.getOrCreate(sessionKey);

        const initialMessages = await this.context.buildMessages(
            session.getHistory(this.memoryWindow),
            content,
            undefined,
            undefined,
            channel,
            chatId
        );

        let finalContent = await this.runAgentLoop(initialMessages);

        if (finalContent === null) {
            finalContent = "I've completed processing but have no response to give.";
        }

        session.addMessage('user', content);
        session.addMessage('assistant', finalContent);
        await this.sessions.save(session);

        return finalContent;
    }

    private async runAgentLoop(initialMessages: Message[]): Promise<string | null> {
        let messages = [...initialMessages];
        let iteration = 0;
        let finalContent: string | null = null;

        while (iteration < this.maxIterations) {
            iteration++;

            const response = await this.provider.chat({
                messages,
                tools: this.tools.getDefinitions(),
                model: this.model,
                temperature: this.temperature,
                max_tokens: this.maxTokens
            });

            if (response.tool_calls && response.tool_calls.length > 0) {
                const toolCallDicts = response.tool_calls.map(tc => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments
                    }
                }));

                messages = this.context.addAssistantMessage(
                    messages,
                    response.content,
                    toolCallDicts,
                    response.reasoning_content
                );

                for (const toolCall of response.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    const result = await this.tools.execute(toolCall.function.name, args);

                    messages = this.context.addToolResult(
                        messages,
                        toolCall.id,
                        toolCall.function.name,
                        result
                    );
                }

                messages.push({ role: 'user', content: 'Reflect on the results and decide next steps.' });
            } else {
                finalContent = response.content || null;
                break;
            }
        }

        return finalContent;
    }
}