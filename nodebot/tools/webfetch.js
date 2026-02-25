/**
 * Web Fetch Tool for nodebot
 * Fetches content from web pages
 */

const { BaseTool } = require('./registry');

class WebFetch {
    constructor(config) {
        this.name = 'webFetch';
        this.description = 'Fetch and extract content from web pages';
        this.parameters = {
            properties: {
                url: {
                    type: "string",
                    description: "URL to fetch content from"
                },
                maxLength: {
                    type: "integer",
                    description: "Maximum length of content to return (default: 2000)"
                }
            },
            required: ["url"]
        };

        this.config = config;
    }

    getDefinition() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: "object",
                    properties: this.parameters.properties,
                    required: this.parameters.required
                }
            }
        };
    }

    async execute(args) {
        try {
            const { url, maxLength = 2000 } = args;

            // Validate URL
            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch (error) {
                return {
                    success: false,
                    error: `Invalid URL: ${error.message}`
                };
            }

            // In a real implementation, we would fetch the URL
            // For now, return mock content
            return {
                success: true,
                url,
                content: `Mock content fetched from ${url}. This is a placeholder response. In a real implementation, this would fetch actual content from the web page.`,
                fetchedAt: new Date().toISOString(),
                truncated: false
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: args.url
            };
        }
    }
}

module.exports = { WebFetch };