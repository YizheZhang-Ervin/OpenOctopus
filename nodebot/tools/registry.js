/**
 * Base tool class for nodebot
 */
class BaseTool {
    constructor(name, description, parameters = {}) {
        this.name = name;
        this.description = description;
        this.parameters = parameters;
        this.required = parameters.required || [];
    }

    async execute(args) {
        throw new Error(`${this.name} tool execute method must be implemented by subclasses`);
    }

    getDefinition() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: "object",
                    properties: this.parameters.properties || {},
                    required: this.required
                }
            }
        };
    }
}

/**
 * Tool registry for managing available tools
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    registerTool(tool) {
        // Check if tool is compatible (has required methods and properties)
        const isCompatible = tool &&
            typeof tool.name === 'string' &&
            typeof tool.description === 'string' &&
            typeof tool.getDefinition === 'function' &&
            typeof tool.execute === 'function';

        if (!(tool instanceof BaseTool) && !isCompatible) {
            throw new Error('Tool must be an instance of BaseTool or have compatible interface (name, description, getDefinition, execute)');
        }
        this.tools.set(tool.name, tool);
    }

    getTool(name) {
        return this.tools.get(name);
    }

    getAvailableTools() {
        return Array.from(this.tools.values()).map(tool => tool.getDefinition());
    }

    async executeTool(name, args) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        return await tool.execute(args);
    }

    listTools() {
        return Array.from(this.tools.keys());
    }

    removeTool(name) {
        return this.tools.delete(name);
    }
}

const { MCP } = require('./mcp');
const { SpawnTool } = require('./spawn');
const { MessageTool } = require('./message');

module.exports = {
    BaseTool,
    ToolRegistry,
    MCP,
    SpawnTool,
    MessageTool
};