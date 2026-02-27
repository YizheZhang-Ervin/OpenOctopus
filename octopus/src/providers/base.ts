/**
 * Base LLM provider interface
 */

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string;
    tool_calls?: LLMToolCall[];
    tool_call_id?: string;
    name?: string;
    reasoning_content?: string; // For thinking models
}

export interface LLMToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface LLMToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, {
                type: string;
                description: string;
                enum?: any[];
                default?: any;
            }>;
            required: string[];
        };
    };
}

export interface LLMResponse {
    content?: string;
    tool_calls?: LLMToolCall[];
    reasoning_content?: string;
}

export abstract class LLMProvider {
    protected apiKey: string;
    protected apiBase?: string;
    protected defaultModel: string;

    constructor(apiKey: string, defaultModel: string, apiBase?: string) {
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
        this.apiBase = apiBase;
    }

    /**
     * Get the default model for this provider
     */
    getDefaultModel(): string {
        return this.defaultModel;
    }

    /**
     * Chat completion method
     */
    abstract chat(params: {
        messages: LLMMessage[];
        tools?: LLMToolDefinition[];
        model?: string;
        temperature?: number;
        max_tokens?: number;
    }): Promise<LLMResponse>;
}