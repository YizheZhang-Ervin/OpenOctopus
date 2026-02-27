/**
 * Context builder for assembling agent prompts
 */

import fs from 'fs-extra';
import path from 'path';
import { platform, release } from 'os';
import { MemoryStore } from './memory.js';
import { SkillsLoader } from './skills.js';

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    name?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export class ContextBuilder {
    private workspace: string;
    private memory: MemoryStore;
    private skills: SkillsLoader;
    private readonly BOOTSTRAP_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'IDENTITY.md'];

    constructor(workspace: string) {
        this.workspace = workspace;
        this.memory = new MemoryStore(workspace);
        this.skills = new SkillsLoader(workspace);
    }

    /**
     * Build the system prompt from bootstrap files, memory, and skills
     */
    async buildSystemPrompt(skillNames?: string[]): Promise<string> {
        const parts: string[] = [];

        // Core identity
        parts.push(this.getIdentity());

        // Bootstrap files
        const bootstrap = this.loadBootstrapFiles();
        if (bootstrap) {
            parts.push(bootstrap);
        }

        // Memory context
        const memory = this.memory.getMemoryContext();
        if (memory) {
            parts.push(memory);
        }

        // Skills - progressive loading
        // 1. Always-loaded skills: include full content
        const alwaysSkills = await this.skills.getAlwaysSkills();
        if (alwaysSkills.length > 0) {
            const alwaysContent = await this.skills.loadSkillsForContext(alwaysSkills);
            if (alwaysContent) {
                parts.push(`# Active Skills\n\n${alwaysContent}`);
            }
        }

        // 2. Available skills: only show summary
        const skillsSummary = await this.skills.buildSkillsSummary();
        if (skillsSummary) {
            parts.push(`# Skills

The following skills extend your capabilities. To use a skill, read its SKILL.md file using the read_file tool.
Skills with available="false" need dependencies installed first - you can try installing them with apt/brew.

${skillsSummary}`);
        }

        return parts.join('\n\n---\n\n');
    }

    /**
     * Build the complete message list for an LLM call
     */
    async buildMessages(
        history: Message[],
        currentMessage: string,
        skillNames?: string[],
        media?: string[],
        channel?: string,
        chatId?: string
    ): Promise<Message[]> {
        const messages: Message[] = [];

        // System prompt
        let systemPrompt = await this.buildSystemPrompt(skillNames);
        if (channel && chatId) {
            systemPrompt += `\n\n## Current Session\nChannel: ${channel}\nChat ID: ${chatId}`;
        }
        messages.push({ role: 'system', content: systemPrompt });

        // History
        messages.push(...history);

        // Current message (with optional image attachments)
        const userContent = this.buildUserContent(currentMessage, media);
        if (typeof userContent === 'string') {
            messages.push({ role: 'user', content: userContent });
        } else {
            // Handle array content (e.g., with images)
            messages.push({ role: 'user', content: JSON.stringify(userContent) });
        }

        return messages;
    }

    /**
     * Add a tool result to the message list
     */
    addToolResult(
        messages: Message[],
        toolCallId: string,
        toolName: string,
        result: string
    ): Message[] {
        messages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            name: toolName,
            content: result
        });
        return messages;
    }

    /**
     * Add an assistant message to the message list
     */
    addAssistantMessage(
        messages: Message[],
        content?: string,
        toolCalls?: ToolCall[],
        reasoningContent?: string
    ): Message[] {
        const msg: Message = { role: 'assistant' };

        // Omit empty content — some backends reject empty text blocks
        if (content) {
            msg.content = content;
        }

        if (toolCalls) {
            msg.tool_calls = toolCalls;
        }

        // Include reasoning content when provided (required by some thinking models)
        if (reasoningContent) {
            (msg as any).reasoning_content = reasoningContent;
        }

        messages.push(msg);
        return messages;
    }

    private getIdentity(): string {
        const now = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'long',
            timeZoneName: 'short'
        });

        const system = platform();
        const osRelease = release();
        const runtime = `${system} ${osRelease}, Node.js ${process.version}`;
        const workspacePath = path.resolve(this.workspace);

        return `# octopus 🐙

You are octopus, a helpful AI assistant. You have access to tools that allow you to:
- Read, write, and edit files
- Execute shell commands
- Search the web and fetch web pages
- Send messages to users on chat channels
- Spawn subagents for complex background tasks

## Current Time
${now}

## Runtime
${runtime}

## Workspace
Your workspace is at: ${workspacePath}
- Long-term memory: ${workspacePath}/memory/MEMORY.md
- History log: ${workspacePath}/memory/HISTORY.md (grep-searchable)
- Custom skills: ${workspacePath}/skills/{{skill-name}}/SKILL.md

IMPORTANT: When responding to direct questions or conversations, reply directly with your text response.
Only use the 'message' tool when you need to send a message to a specific chat channel (like WhatsApp).
For normal conversation, just respond with text - do not call the message tool.

Always be helpful, accurate, and concise. When using tools, think step by step: what you know, what you need, and why you chose this tool.
When remembering something important, write to ${workspacePath}/memory/MEMORY.md
To recall past events, grep ${workspacePath}/memory/HISTORY.md`;
    }

    private loadBootstrapFiles(): string {
        const parts: string[] = [];

        for (const filename of this.BOOTSTRAP_FILES) {
            const filePath = path.join(this.workspace, filename);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                parts.push(`## ${filename}\n\n${content}`);
            }
        }

        return parts.join('\n\n');
    }

    private buildUserContent(text: string, media?: string[]): string | any[] {
        if (!media || media.length === 0) {
            return text;
        }

        const images: any[] = [];
        for (const mediaPath of media) {
            const p = path.resolve(mediaPath);
            if (!fs.existsSync(p)) {
                continue;
            }

            // In a real implementation, this would detect MIME type and convert to base64
            // For now, we'll just include the path
            images.push({
                type: 'image_url',
                image_url: {
                    url: `file://${p}`
                }
            });
        }

        if (images.length === 0) {
            return text;
        }

        return [...images, { type: 'text', text: text }];
    }
}