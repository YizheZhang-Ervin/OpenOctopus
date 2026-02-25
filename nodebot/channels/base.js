/**
 * Base channel class for nodebot
 */
class BaseChannel {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.enabled = true;
        this.connected = false;
    }

    async connect() {
        throw new Error('connect() method must be implemented by subclasses');
    }

    async disconnect() {
        throw new Error('disconnect() method must be implemented by subclasses');
    }

    async sendMessage(message, options = {}) {
        throw new Error('sendMessage() method must be implemented by subclasses');
    }

    async receiveMessage() {
        throw new Error('receiveMessage() method must be implemented by subclasses');
    }

    async isConnected() {
        return this.connected;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

module.exports = { BaseChannel };