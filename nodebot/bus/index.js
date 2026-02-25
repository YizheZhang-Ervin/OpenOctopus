/**
 * Service bus for nodebot
 */
class ServiceBus {
    constructor() {
        this.subscribers = new Map(); // event -> [callbacks]
        this.channels = new Map();    // channel -> [subscribers]
        this.queues = new Map();      // queueName -> [messages]
        this.events = [];             // Recent events for replay
        this.maxEventHistory = 100;
    }

    subscribe(event, callback, options = {}) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }

        const subscriberInfo = {
            callback,
            id: this.generateId(),
            options,
            subscribedAt: new Date()
        };

        this.subscribers.get(event).push(subscriberInfo);

        // Add to channel if specified
        if (options.channel) {
            if (!this.channels.has(options.channel)) {
                this.channels.set(options.channel, []);
            }
            this.channels.get(options.channel).push(subscriberInfo.id);
        }

        return subscriberInfo.id;
    }

    unsubscribe(subscriberId) {
        for (const [event, subscribers] of this.subscribers) {
            const index = subscribers.findIndex(sub => sub.id === subscriberId);
            if (index !== -1) {
                subscribers.splice(index, 1);

                // Clean up empty event arrays
                if (subscribers.length === 0) {
                    this.subscribers.delete(event);
                }
                return true;
            }
        }
        return false;
    }

    publish(event, data, options = {}) {
        const eventData = {
            event,
            data,
            timestamp: new Date(),
            id: this.generateId(),
            options
        };

        // Add to recent events history
        this.events.push(eventData);
        if (this.events.length > this.maxEventHistory) {
            this.events.shift();
        }

        // Publish to specific channel if specified
        if (options.channel) {
            return this.publishToChannel(options.channel, eventData);
        }

        // Publish to all subscribers of this event
        const subscribers = this.subscribers.get(event) || [];
        const results = [];

        for (const subscriber of subscribers) {
            try {
                const result = subscriber.callback(eventData);
                results.push(result);
            } catch (error) {
                console.error(`Error in subscriber for event ${event}:`, error);
            }
        }

        return results;
    }

    publishToChannel(channel, eventData) {
        const channelSubscribers = this.channels.get(channel) || [];
        const results = [];

        for (const eventId of channelSubscribers) {
            for (const [event, subscribers] of this.subscribers) {
                const subscriber = subscribers.find(sub => sub.id === eventId);
                if (subscriber) {
                    try {
                        const result = subscriber.callback(eventData);
                        results.push(result);
                    } catch (error) {
                        console.error(`Error in channel subscriber for event ${eventData.event}:`, error);
                    }
                }
            }
        }

        return results;
    }

    addToQueue(queueName, message) {
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
        }

        const queueMessage = {
            id: this.generateId(),
            message,
            timestamp: new Date(),
            processed: false
        };

        this.queues.get(queueName).push(queueMessage);
        return queueMessage.id;
    }

    getNextFromQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue || queue.length === 0) {
            return null;
        }

        // Find first unprocessed message
        for (let i = 0; i < queue.length; i++) {
            if (!queue[i].processed) {
                queue[i].processed = true;
                return queue[i];
            }
        }

        return null;
    }

    getQueueLength(queueName) {
        const queue = this.queues.get(queueName);
        return queue ? queue.length : 0;
    }

    replayEvents(since) {
        if (since) {
            return this.events.filter(event => event.timestamp > since);
        }
        return [...this.events];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    listSubscribers(event) {
        return this.subscribers.get(event) || [];
    }

    listChannels() {
        return Array.from(this.channels.keys());
    }

    clearQueue(queueName) {
        if (this.queues.has(queueName)) {
            this.queues.set(queueName, []);
            return true;
        }
        return false;
    }
}

module.exports = { ServiceBus };