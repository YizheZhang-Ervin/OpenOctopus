/**
 * Provider registry and factory
 */

import { LLMProvider } from './base.js';
import { OpenAIProvider } from './openai.js';

export interface ProviderSpec {
    name: string;
    keywords: string[];
    isGateway: boolean;
    isOAuth: boolean;
    defaultApiBase?: string;
    create: (apiKey: string, defaultModel: string, apiBase?: string) => LLMProvider;
}

export const PROVIDERS: ProviderSpec[] = [
    {
        name: 'custom',
        keywords: ['gpt', 'openai', 'custom', 'local'],
        isGateway: true,
        isOAuth: false,
        defaultApiBase: 'http://localhost:8000/v1',
        create: (apiKey, defaultModel, apiBase) => new OpenAIProvider(apiKey, defaultModel, apiBase)
    }
];

export function findByName(name: string): ProviderSpec | undefined {
    return PROVIDERS.find(spec => spec.name === name);
}

export function findByKeyword(model: string): ProviderSpec | undefined {
    const modelLower = model.toLowerCase();

    // Find by keyword (order follows PROVIDERS registry)
    for (const spec of PROVIDERS) {
        if (spec.keywords.some(keyword => modelLower.includes(keyword))) {
            return spec;
        }
    }

    return undefined;
}

export function createProvider(
    name: string,
    apiKey: string,
    defaultModel: string,
    apiBase?: string
): LLMProvider {
    const spec = findByName(name);
    if (!spec) {
        throw new Error(`Unknown provider: ${name}`);
    }

    return spec.create(apiKey, defaultModel, apiBase);
}