/**
 * HTTP API channel for nodebot
 */
const express = require('express');
const cors = require('cors');

class HttpApiChannel {
    constructor(config = {}) {
        this.name = 'http_api';
        this.config = {
            port: config.port || process.env.HTTP_API_PORT || 3000,
            host: config.host || process.env.HTTP_API_HOST || 'localhost',
            endpoint: config.endpoint || '/webhook',
            corsOrigin: config.corsOrigin || '*'
        };
        this.app = null;
        this.server = null;
        this.enabled = true;
        this.connected = false;
        this.messageQueue = [];
        this.messageHandlers = [];
    }

    async connect() {
        try {
            this.app = express();
            this.app.use(cors({ origin: this.config.corsOrigin }));
            this.app.use(express.json({ limit: '10mb' }));
            this.app.use(express.urlencoded({ extended: true }));

            // POST endpoint for sending/receiving messages
            this.app.post(this.config.endpoint, async (req, res) => {
                try {
                    const message = req.body;

                    // Add to message queue
                    this.messageQueue.push({
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                        timestamp: new Date(),
                        ...message
                    });

                    // Notify handlers
                    for (const handler of this.messageHandlers) {
                        try {
                            await handler(message);
                        } catch (error) {
                            console.error('Error in message handler:', error);
                        }
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Message received',
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
                    });
                } catch (error) {
                    console.error('Error processing incoming message:', error);
                    res.status(500).json({ success: false, error: error.message });
                }
            });

            // GET endpoint for retrieving messages
            this.app.get(this.config.endpoint, (req, res) => {
                res.json({
                    messages: this.messageQueue,
                    count: this.messageQueue.length
                });
            });

            // Start server
            this.server = this.app.listen({
                port: this.config.port,
                host: this.config.host
            }, () => {
                console.log(`HTTP API channel listening at http://${this.config.host}:${this.config.port}${this.config.endpoint}`);
            });

            this.connected = true;
            return true;
        } catch (error) {
            console.error('Failed to connect HTTP API channel:', error.message);
            this.connected = false;
            throw error;
        }
    }

    async disconnect() {
        if (this.server) {
            this.server.close(() => {
                console.log('HTTP API channel server closed');
            });
        }
        this.connected = false;
        return true;
    }

    async sendMessage(message, options = {}) {
        // For HTTP API channel, we might want to store the message or forward it
        // This could be integrated with the webhook system
        const messageObj = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: new Date(),
            direction: 'outgoing',
            ...message
        };

        // Could implement outbound webhook calls here
        console.log('Outgoing message queued:', messageObj);
        return messageObj;
    }

    async receiveMessage() {
        if (this.messageQueue.length > 0) {
            return this.messageQueue.shift();
        }
        return null;
    }

    // Method to add message handlers
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    async isConnected() {
        return this.connected;
    }

    getMessageQueue() {
        return [...this.messageQueue];
    }

    clearMessageQueue() {
        this.messageQueue = [];
    }
}

module.exports = { HttpApiChannel };