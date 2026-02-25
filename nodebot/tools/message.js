/**
 * Message tool for nodebot
 * Allows sending messages through various channels
 */
const { BaseTool } = require('./registry');

class MessageTool {
    constructor(agent) {
        this.name = 'sendMessage';
        this.description = 'Send a message through communication channels';
        this.parameters = {
            properties: {
                channel: {
                    type: "string",
                    description: "The channel to send the message through (email, http_api, etc.)"
                },
                content: {
                    type: "string",
                    description: "The content of the message to send"
                },
                options: {
                    type: "object",
                    description: "Additional options for the message",
                    properties: {
                        subject: {
                            type: "string",
                            description: "Subject for email messages"
                        },
                        recipient: {
                            type: "string",
                            description: "Recipient for the message"
                        }
                    }
                }
            },
            required: ["channel", "content"]
        };

        this.agent = agent;
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
            const { channel, content, options = {} } = args;

            // Prepare message
            const message = {
                text: content,
                timestamp: new Date().toISOString()
            };

            // Send through the specified channel
            const result = await this.agent.sendMessageViaChannel(message, channel, options);

            return {
                success: true,
                channelId: channel,
                messageId: result.messageId || 'unknown',
                sentAt: result.sentAt || new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                channelId: args.channel
            };
        }
    }
}

module.exports = { MessageTool };