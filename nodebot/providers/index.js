/**
 * Base provider class for nodebot
 */
class BaseProvider {
    constructor(config = {}) {
        this.config = config;
        this.name = 'base';
        this.supportedModels = [];
    }

    async initialize() {
        // Initialize provider connection
    }

    async chatCompletion(messages, options = {}) {
        throw new Error('chatCompletion method must be implemented by subclasses');
    }

    async validateConfig() {
        return true;
    }

    getName() {
        return this.name;
    }

    getSupportedModels() {
        return this.supportedModels;
    }
}

/**
 * OpenAI Provider
 */
const OpenAI = require('openai');

class OpenAIProvider extends BaseProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'openai';
        this.supportedModels = [
            'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
            'gpt-4o-mini', 'gpt-4-vision-preview'
        ];

        const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.client = new OpenAI({ apiKey });
    }

    async chatCompletion(messages, options = {}) {
        const params = {
            model: options.model || this.config.defaultModel || 'gpt-4o',
            messages: messages,
            temperature: options.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: options.maxTokens || this.config.maxTokens,
        };

        // Add any additional parameters
        if (options.tools) {
            params.tools = options.tools;
        }
        if (options.tool_choice) {
            params.tool_choice = options.tool_choice;
        }

        const response = await this.client.chat.completions.create(params);
        return response;
    }

    async validateConfig() {
        try {
            // Test the API key by making a simple request
            await this.client.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }
}

/**
 * OpenRouter Provider
 */
class OpenRouterProvider extends BaseProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'openrouter';
        this.supportedModels = [
            'openai/gpt-4o', 'openai/gpt-4-turbo', 'openai/gpt-3.5-turbo',
            'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus',
            'google/gemini-pro', 'mistralai/mistral-large'
        ];

        const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        // Use the OpenAI-compatible API for OpenRouter
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
        });
    }

    async chatCompletion(messages, options = {}) {
        const params = {
            model: options.model || this.config.defaultModel || 'openai/gpt-4o',
            messages: messages,
            temperature: options.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: options.maxTokens || this.config.maxTokens,
        };

        // Add any additional parameters
        if (options.tools) {
            params.tools = options.tools;
        }
        if (options.tool_choice) {
            params.tool_choice = options.tool_choice;
        }

        const response = await this.client.chat.completions.create(params);
        return response;
    }

    async validateConfig() {
        try {
            // Test the API key by making a simple request
            await this.client.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Provider registry and factory
 */
class ProviderRegistry {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = null;
    }

    registerProvider(name, providerClass) {
        this.providers.set(name, providerClass);
    }

    async createProvider(providerName, config = {}) {
        const ProviderClass = this.providers.get(providerName);
        if (!ProviderClass) {
            throw new Error(`Provider '${providerName}' is not registered`);
        }

        const provider = new ProviderClass(config);

        if (this.providers.size === 1 && !this.defaultProvider) {
            this.defaultProvider = providerName;
        }

        return provider;
    }

    getProviderNames() {
        return Array.from(this.providers.keys());
    }

    getDefaultProvider() {
        return this.defaultProvider;
    }

    setDefaultProvider(providerName) {
        if (!this.providers.has(providerName)) {
            throw new Error(`Provider '${providerName}' is not registered`);
        }
        this.defaultProvider = providerName;
    }
}

// Create default registry with built-in providers
const defaultRegistry = new ProviderRegistry();
defaultRegistry.registerProvider('openai', OpenAIProvider);
defaultRegistry.registerProvider('openrouter', OpenRouterProvider);

module.exports = {
    BaseProvider,
    OpenAIProvider,
    OpenRouterProvider,
    ProviderRegistry,
    defaultRegistry
};