/**
 * Context management for nodebot
 */
class Context {
    constructor(agent) {
        this.agent = agent;
        this.contextWindow = [];
        this.maxContextSize = 20; // Maximum number of messages to keep in context
        this.contextTags = new Map(); // Tag to message mapping
    }

    addMessage(role, content, metadata = {}) {
        const message = {
            role,
            content,
            timestamp: new Date(),
            id: this.generateId(),
            ...metadata
        };

        this.contextWindow.push(message);

        // Apply tags if provided
        if (metadata.tags) {
            for (const tag of metadata.tags) {
                if (!this.contextTags.has(tag)) {
                    this.contextTags.set(tag, []);
                }
                this.contextTags.get(tag).push(message.id);
            }
        }

        // Trim context window if needed
        if (this.contextWindow.length > this.maxContextSize) {
            // Remove the oldest message
            const removedMessage = this.contextWindow.shift();

            // Update tags if the removed message had any
            if (removedMessage.tags) {
                for (const tag of removedMessage.tags) {
                    const taggedMessages = this.contextTags.get(tag) || [];
                    const index = taggedMessages.indexOf(removedMessage.id);
                    if (index !== -1) {
                        taggedMessages.splice(index, 1);
                        if (taggedMessages.length === 0) {
                            this.contextTags.delete(tag);
                        }
                    }
                }
            }
        }

        return message.id;
    }

    getRecentMessages(count = 10) {
        return this.contextWindow.slice(-count);
    }

    getMessagesByTag(tag) {
        const messageIds = this.contextTags.get(tag) || [];
        return this.contextWindow.filter(msg => messageIds.includes(msg.id));
    }

    getAllMessages() {
        return [...this.contextWindow];
    }

    clearContext() {
        this.contextWindow = [];
        this.contextTags.clear();
    }

    getContextSummary() {
        return {
            messageCount: this.contextWindow.length,
            oldestMessage: this.contextWindow.length > 0 ? this.contextWindow[0].timestamp : null,
            newestMessage: this.contextWindow.length > 0 ? this.contextWindow[this.contextWindow.length - 1].timestamp : null,
            tags: Array.from(this.contextTags.keys()),
            tagCounts: Array.from(this.contextTags.entries()).reduce((acc, [tag, messages]) => {
                acc[tag] = messages.length;
                return acc;
            }, {})
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Method to serialize context for saving
    serialize() {
        return {
            contextWindow: this.contextWindow,
            maxContextSize: this.maxContextSize,
            contextTags: Object.fromEntries(this.contextTags)
        };
    }

    // Method to deserialize context from saved data
    deserialize(data) {
        this.contextWindow = data.contextWindow || [];
        this.maxContextSize = data.maxContextSize || 20;
        this.contextTags = new Map(Object.entries(data.contextTags || {}));
    }
}

module.exports = { Context };