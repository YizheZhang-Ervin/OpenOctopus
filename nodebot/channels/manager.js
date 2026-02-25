/**
 * Channel manager for nodebot
 */
class ChannelManager {
    constructor() {
        this.channels = new Map();
        this.defaultChannel = null;
    }

    registerChannel(name, channel) {
        this.channels.set(name, channel);

        if (this.channels.size === 1) {
            this.defaultChannel = name;
        }

        return true;
    }

    getChannel(name) {
        return this.channels.get(name);
    }

    async connectChannel(name) {
        const channel = this.getChannel(name);
        if (!channel) {
            throw new Error(`Channel ${name} not found`);
        }
        return await channel.connect();
    }

    async connectAll() {
        const results = {};
        for (const [name, channel] of this.channels) {
            try {
                results[name] = await channel.connect();
            } catch (error) {
                console.error(`Failed to connect channel ${name}:`, error.message);
                results[name] = false;
            }
        }
        return results;
    }

    async sendMessage(message, channelName = null, options = {}) {
        const targetChannelName = channelName || this.defaultChannel;

        if (!targetChannelName) {
            throw new Error('No channel specified and no default channel set');
        }

        const channel = this.getChannel(targetChannelName);
        if (!channel) {
            throw new Error(`Channel ${targetChannelName} not found`);
        }

        return await channel.sendMessage(message, options);
    }

    async broadcastMessage(message, options = {}) {
        const results = {};
        for (const [name, channel] of this.channels) {
            try {
                if (channel.isConnected()) {
                    results[name] = await channel.sendMessage(message, options);
                }
            } catch (error) {
                console.error(`Failed to send message via channel ${name}:`, error.message);
                results[name] = null;
            }
        }
        return results;
    }

    async receiveMessage(channelName = null) {
        const targetChannelName = channelName || this.defaultChannel;

        if (!targetChannelName) {
            throw new Error('No channel specified and no default channel set');
        }

        const channel = this.getChannel(targetChannelName);
        if (!channel) {
            throw new Error(`Channel ${targetChannelName} not found`);
        }

        return await channel.receiveMessage();
    }

    listChannels() {
        return Array.from(this.channels.keys());
    }

    setDefaultChannel(name) {
        if (!this.channels.has(name)) {
            throw new Error(`Channel ${name} does not exist`);
        }
        this.defaultChannel = name;
    }

    getDefaultChannel() {
        return this.defaultChannel;
    }

    async disconnectChannel(name) {
        const channel = this.getChannel(name);
        if (!channel) {
            throw new Error(`Channel ${name} not found`);
        }
        return await channel.disconnect();
    }

    async disconnectAll() {
        const results = {};
        for (const [name, channel] of this.channels) {
            try {
                results[name] = await channel.disconnect();
            } catch (error) {
                console.error(`Failed to disconnect channel ${name}:`, error.message);
                results[name] = false;
            }
        }
        return results;
    }
}

module.exports = { ChannelManager };