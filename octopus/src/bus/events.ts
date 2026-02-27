/**
 * Event types for the message bus
 */

export interface InboundMessage {
    channel: string; // telegram, discord, slack, whatsapp, http_api
    senderId: string; // User identifier
    chatId: string; // Chat/channel identifier
    content: string; // Message text
    timestamp: Date;
    media?: string[]; // Media URLs
    metadata?: Record<string, any>; // Channel-specific data

    get sessionKey(): string; // Unique key for session identification
}

export interface OutboundMessage {
    channel: string;
    chatId: string;
    content: string;
    replyTo?: string;
    media?: string[];
    metadata?: Record<string, any>;
}

export class InboundMessageImpl implements InboundMessage {
    channel: string;
    senderId: string;
    chatId: string;
    content: string;
    timestamp: Date;
    media?: string[];
    metadata?: Record<string, any>;

    constructor(data: Omit<InboundMessage, 'sessionKey'>) {
        this.channel = data.channel;
        this.senderId = data.senderId;
        this.chatId = data.chatId;
        this.content = data.content;
        this.timestamp = data.timestamp || new Date();
        this.media = data.media;
        this.metadata = data.metadata;
    }

    get sessionKey(): string {
        return `${this.channel}:${this.chatId}`;
    }
}

export class OutboundMessageImpl implements OutboundMessage {
    channel: string;
    chatId: string;
    content: string;
    replyTo?: string;
    media?: string[];
    metadata?: Record<string, any>;

    constructor(data: OutboundMessage) {
        this.channel = data.channel;
        this.chatId = data.chatId;
        this.content = data.content;
        this.replyTo = data.replyTo;
        this.media = data.media;
        this.metadata = data.metadata;
    }
}