/**
 * Web search and fetch tools
 */

import axios from 'axios';
import { Tool, ToolParameter } from './base.js';

export interface WebSearchConfig {
    apiKey: string;
    maxResults: number;
}

export class WebSearchTool implements Tool {
    name = 'web_search';
    description = 'Search the web for information';
    parameters: ToolParameter[] = [
        {
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: true
        },
        {
            name: 'max_results',
            type: 'number',
            description: 'Maximum number of results to return',
            required: false,
            default: 5
        }
    ];

    private apiKey?: string;
    private maxResults: number;

    constructor(config?: WebSearchConfig) {
        this.apiKey = config?.apiKey;
        this.maxResults = config?.maxResults || 5;
    }

    async execute(params: Record<string, any>): Promise<string> {
        const { query, max_results } = params;

        if (!query) {
            return 'Error: query is required';
        }

        const maxResults = max_results || this.maxResults;

        if (!this.apiKey) {
            return `Error: Web search requires an API key. Please configure it in your settings.`;
        }

        try {
            // Using Brave Search API as an example
            const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': this.apiKey
                },
                params: {
                    q: query,
                    count: maxResults
                }
            });

            if (response.data.web?.results) {
                const results = response.data.web.results;
                let output = `Search results for "${query}":\n\n`;

                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    output += `${i + 1}. ${result.title}\n`;
                    output += `   URL: ${result.url}\n`;
                    output += `   ${result.description}\n\n`;
                }

                return output;
            } else {
                return `No results found for "${query}"`;
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                return 'Error: Invalid API key for web search';
            } else if (error.response?.status === 429) {
                return 'Error: Rate limit exceeded for web search';
            } else {
                return `Error performing web search: ${error.message}`;
            }
        }
    }
}

export class WebFetchTool implements Tool {
    name = 'web_fetch';
    description = 'Fetch and extract content from a web page';
    parameters: ToolParameter[] = [
        {
            name: 'url',
            type: 'string',
            description: 'URL to fetch',
            required: true
        }
    ];

    async execute(params: Record<string, any>): Promise<string> {
        const { url } = params;

        if (!url) {
            return 'Error: url is required';
        }

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 30000, // 30 seconds
                maxContentLength: 1024 * 1024 * 5 // 5MB limit
            });

            // In a real implementation, this would use a proper HTML-to-text library
            // For now, we'll just return the raw HTML with a warning
            let content = response.data;

            // Simple HTML tag removal (very basic)
            content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
            content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            content = content.replace(/<[^>]*>/g, ' ');
            content = content.replace(/\s+/g, ' ').trim();

            // Limit content length
            const maxLength = 10000;
            if (content.length > maxLength) {
                content = content.substring(0, maxLength) + '... [content truncated]';
            }

            return `Content from ${url}:\n\n${content}`;
        } catch (error: any) {
            if (error.code === 'ENOTFOUND') {
                return `Error: Host not found for URL: ${url}`;
            } else if (error.response) {
                return `Error fetching URL: ${error.response.status} ${error.response.statusText}`;
            } else {
                return `Error fetching URL: ${error.message}`;
            }
        }
    }
}