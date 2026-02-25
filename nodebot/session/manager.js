/**
 * Session management for nodebot
 */
const fs = require('fs-extra');
const path = require('path');

class SessionManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.sessionsDir = path.join(workspace, 'sessions');
        this.sessions = new Map();
    }

    async init() {
        await fs.ensureDir(this.sessionsDir);
    }

    createSession(sessionId, userData = {}) {
        const session = {
            id: sessionId,
            createdAt: new Date(),
            lastAccessed: new Date(),
            userData,
            messages: [],
            active: true
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessed = new Date();
            return session;
        }
        return null;
    }

    addMessageToSession(sessionId, message) {
        const session = this.getSession(sessionId);
        if (session) {
            session.messages.push({
                ...message,
                timestamp: new Date()
            });
            return true;
        }
        return false;
    }

    async saveSession(sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
            const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
            await fs.writeJson(sessionPath, session, { spaces: 2 });
            return true;
        }
        return false;
    }

    async loadSession(sessionId) {
        const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
        if (await fs.pathExists(sessionPath)) {
            const sessionData = await fs.readJson(sessionPath);
            this.sessions.set(sessionId, sessionData);
            return sessionData;
        }
        return null;
    }

    endSession(sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
            session.active = false;
            session.endedAt = new Date();
            this.saveSession(sessionId);
        }
        return this.sessions.delete(sessionId);
    }

    listActiveSessions() {
        return Array.from(this.sessions.values())
            .filter(session => session.active)
            .map(session => ({
                id: session.id,
                createdAt: session.createdAt,
                lastAccessed: session.lastAccessed,
                messageCount: session.messages.length
            }));
    }

    cleanupInactiveSessions(maxAgeMinutes = 60) {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);

        for (const [sessionId, session] of this.sessions) {
            if (session.lastAccessed < cutoffTime) {
                this.endSession(sessionId);
            }
        }
    }
}

module.exports = { SessionManager };