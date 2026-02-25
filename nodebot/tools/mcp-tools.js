/**
 * Model Context Protocol (MCP) Tool for nodebot
 * Allows integration with external tools and services via MCP
 */

class MCPTaskTool {
    constructor(mcpClient) {
        this.name = 'performMCPTask';
        this.description = 'Perform a task using Model Context Protocol (MCP) integration';
        this.parameters = {
            properties: {
                toolName: {
                    type: "string",
                    description: "Name of the MCP tool to use"
                },
                parameters: {
                    type: "object",
                    description: "Parameters to pass to the MCP tool",
                    additionalProperties: true
                }
            },
            required: ["toolName"]
        };

        this.mcpClient = mcpClient;
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
            if (!this.mcpClient) {
                return {
                    success: false,
                    error: "MCP client not initialized"
                };
            }

            const { toolName, parameters = {} } = args;

            // Execute the MCP task
            const result = await this.mcpClient.callTool(toolName, parameters);

            return {
                success: true,
                toolName,
                result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                toolName: args.toolName
            };
        }
    }
}

class MCPListToolsTool {
    constructor(mcpClient) {
        this.name = 'listMCPTools';
        this.description = 'List available Model Context Protocol (MCP) tools';
        this.parameters = {
            properties: {
                category: {
                    type: "string",
                    description: "Filter tools by category (optional)"
                }
            },
            required: []
        };

        this.mcpClient = mcpClient;
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
            if (!this.mcpClient) {
                return {
                    success: false,
                    error: "MCP client not initialized",
                    tools: []
                };
            }

            const { category = null } = args;
            const tools = await this.mcpClient.listTools(category);

            return {
                success: true,
                tools,
                count: tools.length,
                category: category || 'all'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                tools: []
            };
        }
    }
}

module.exports = {
    MCPTaskTool,
    MCPListToolsTool
};