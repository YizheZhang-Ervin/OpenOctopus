/**
 * OpenAI-compatible LLM provider
 */

import axios from 'axios';
import { LLMProvider, LLMMessage, LLMToolDefinition, LLMResponse, LLMToolCall } from './base.js';

export class OpenAIProvider extends LLMProvider {
    private testMode: boolean;

    constructor(apiKey: string, defaultModel = 'gpt-4', apiBase = 'https://api.openai.com/v1', testMode = false) {
        super(apiKey, defaultModel, apiBase);
        this.testMode = testMode;
    }

    async chat(params: {
        messages: LLMMessage[];
        tools?: LLMToolDefinition[];
        model?: string;
        temperature?: number;
        max_tokens?: number;
    }): Promise<LLMResponse> {
        // Test mode - return a mock response
        if (this.testMode || this.apiKey === 'test-key') {
            return {
                content: "Hello! I'm Octopus, your AI assistant. I'm currently running in test mode, so I'm not connected to a real language model. In a real deployment, I would be able to help you with various tasks using my tools and skills."
            };
        }

        const {
            messages,
            tools,
            model = this.defaultModel,
            temperature = 0.7,
            max_tokens = 4096
        } = params;

        try {
            console.log(`${this.apiBase}/chat/completions`)
            const response = await axios.post(
                `${this.apiBase}/chat/completions`,
                {
                    model,
                    messages,
                    tools: tools && tools.length > 0 ? tools : undefined,
                    temperature,
                    max_tokens,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 2 minutes
                }
            );

            const choice = response.data.choices[0];
            const message = choice.message;

            return {
                content: message.content,
                tool_calls: message.tool_calls ? message.tool_calls.map((tc: any) => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments
                    }
                })) : undefined,
                reasoning_content: message.reasoning_content
            };
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    throw new Error('Invalid API key');
                } else if (status === 429) {
                    throw new Error('Rate limit exceeded');
                } else if (status === 400) {
                    throw new Error(`Bad request: ${data.error?.message || 'Unknown error'}`);
                } else if (status === 500) {
                    throw new Error('Server error');
                } else {
                    throw new Error(`HTTP ${status}: ${data.error?.message || 'Unknown error'}`);
                }
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout');
            } else {
                throw new Error(`Network error: ${error.message}`);
            }
        }
    }
}