/**
 * Base tool interface and registry
 */

export interface Tool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    execute: (params: Record<string, any>) => Promise<string>;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: any;
    enum?: any[];
}

export interface ToolDefinition {
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

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    /**
     * Register a tool
     */
    register(tool: Tool): void {
        this.tools.set(tool.name, tool);
    }

    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    /**
     * Get all registered tools
     */
    getAll(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tool definitions for OpenAI API
     */
    getDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: tool.parameters.reduce((acc, param) => {
                        acc[param.name] = {
                            type: param.type,
                            description: param.description
                        };

                        if (param.enum) {
                            acc[param.name].enum = param.enum;
                        }

                        if (param.default !== undefined) {
                            acc[param.name].default = param.default;
                        }

                        return acc;
                    }, {} as Record<string, any>),
                    required: tool.parameters.filter(p => p.required).map(p => p.name)
                }
            }
        }));
    }

    /**
     * Execute a tool by name with parameters
     */
    async execute(name: string, params: Record<string, any>): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        try {
            return await tool.execute(params);
        } catch (error) {
            return `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}