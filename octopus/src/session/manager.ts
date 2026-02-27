/**
 * Session management for conversations
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SessionMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: string;
    tools_used?: string[];
}

export class Session {
    key: string;
    messages: SessionMessage[] = [];
    lastConsolidated = 0;

    constructor(key?: string) {
        this.key = key || uuidv4();
    }

    addMessage(role: SessionMessage['role'], content: string, tools_used?: string[]): void {
        this.messages.push({
            role,
            content,
            timestamp: new Date().toISOString(),
            tools_used
        });
    }

    getHistory(maxMessages?: number): SessionMessage[] {
        if (maxMessages && maxMessages < this.messages.length) {
            return this.messages.slice(-maxMessages);
        }
        return this.messages;
    }

    clear(): void {
        this.messages = [];
        this.lastConsolidated = 0;
    }
}

export class SessionManager {
    private sessionsDir: string;
    private sessions: Map<string, Session> = new Map();

    constructor(workspace: string) {
        this.sessionsDir = path.join(workspace, '.sessions');
        fs.ensureDirSync(this.sessionsDir);
    }

    getOrCreate(key: string): Session {
        let session = this.sessions.get(key);

        if (!session) {
            session = this.loadSession(key) || new Session(key);
            this.sessions.set(key, session);
        }

        return session;
    }

    async save(session: Session): Promise<void> {
        const sessionFile = path.join(this.sessionsDir, `${session.key}.json`);
        await fs.writeJson(sessionFile, session, { spaces: 2 });
    }

    invalidate(key: string): void {
        this.sessions.delete(key);
    }

    private loadSession(key: string): Session | null {
        try {
            const sessionFile = path.join(this.sessionsDir, `${key}.json`);
            if (fs.existsSync(sessionFile)) {
                const data = fs.readJsonSync(sessionFile);
                const session = new Session(key);
                Object.assign(session, data);
                return session;
            }
        } catch (error) {
            console.error(`Error loading session ${key}:`, error);
        }
        return null;
    }
}