/**
 * Message queue for handling inbound and outbound messages
 */

import EventEmitter from 'events';
import { InboundMessage, OutboundMessage, InboundMessageImpl, OutboundMessageImpl } from './events.js';

export class MessageBus extends EventEmitter {
    private inboundQueue: InboundMessage[] = [];
    private outboundQueue: OutboundMessage[] = [];
    private processing = false;

    /**
     * Publish an inbound message to the queue
     */
    async publishInbound(messageData: Omit<InboundMessage, 'sessionKey'>): Promise<void> {
        const message = new InboundMessageImpl(messageData);
        this.inboundQueue.push(message);
        this.emit('inbound', message);
    }

    /**
     * Publish an outbound message to the queue
     */
    async publishOutbound(messageData: OutboundMessage): Promise<void> {
        const message = new OutboundMessageImpl(messageData);
        this.outboundQueue.push(message);
        this.emit('outbound', message);
    }

    /**
     * Consume an inbound message from the queue
     */
    async consumeInbound(): Promise<InboundMessage | null> {
        if (this.inboundQueue.length === 0) {
            return null;
        }
        return this.inboundQueue.shift() || null;
    }

    /**
     * Consume an outbound message from the queue
     */
    async consumeOutbound(): Promise<OutboundMessage | null> {
        if (this.outboundQueue.length === 0) {
            return null;
        }
        return this.outboundQueue.shift() || null;
    }

    /**
     * Wait for an inbound message with timeout
     */
    async waitForInbound(timeoutMs = 1000): Promise<InboundMessage | null> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.off('inbound', onMessage);
                resolve(null);
            }, timeoutMs);

            const onMessage = (message: InboundMessage) => {
                clearTimeout(timeout);
                resolve(message);
            };

            // Check if there's already a message in the queue
            const existingMessage = this.inboundQueue.shift();
            if (existingMessage) {
                clearTimeout(timeout);
                resolve(existingMessage);
                return;
            }

            this.once('inbound', onMessage);
        });
    }

    /**
     * Get the current queue sizes
     */
    getQueueSizes(): { inbound: number; outbound: number } {
        return {
            inbound: this.inboundQueue.length,
            outbound: this.outboundQueue.length
        };
    }

    /**
     * Clear all messages from the queues
     */
    clear(): void {
        this.inboundQueue = [];
        this.outboundQueue = [];
    }
}