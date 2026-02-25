/**
 * Memory system for nodebot
 */
const fs = require('fs-extra');
const path = require('path');

class Memory {
    constructor(workspace) {
        this.workspace = workspace;
        this.memoryDir = path.join(workspace, 'memory');
        this.memories = new Map();
    }

    async init() {
        await fs.ensureDir(this.memoryDir);
        await this.loadMemories();
    }

    async loadMemories() {
        const memoryFiles = await fs.readdir(this.memoryDir);

        for (const file of memoryFiles) {
            if (file.endsWith('.json')) {
                const filePath = path.join(this.memoryDir, file);
                const memoryData = await fs.readJson(filePath);
                this.memories.set(file.replace('.json', ''), memoryData);
            }
        }
    }

    async saveMemory(key, data) {
        const memoryPath = path.join(this.memoryDir, `${key}.json`);
        const memoryEntry = {
            key,
            data,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: data.tags || []
        };

        this.memories.set(key, memoryEntry);
        await fs.writeJson(memoryPath, memoryEntry, { spaces: 2 });
    }

    getMemory(key) {
        return this.memories.get(key) || null;
    }

    getAllMemories() {
        return Array.from(this.memories.values());
    }

    searchMemories(query, tags = []) {
        const memories = this.getAllMemories();

        return memories.filter(memory => {
            // Check if query matches in data or key
            const matchesQuery = !query ||
                JSON.stringify(memory.data).toLowerCase().includes(query.toLowerCase()) ||
                memory.key.toLowerCase().includes(query.toLowerCase());

            // Check if all required tags are present
            const matchesTags = tags.length === 0 ||
                tags.every(tag => memory.tags.includes(tag));

            return matchesQuery && matchesTags;
        });
    }

    async updateMemory(key, data) {
        const existing = this.getMemory(key);
        if (existing) {
            existing.data = { ...existing.data, ...data };
            existing.updatedAt = new Date();
            await this.saveMemory(key, existing.data);
            return existing;
        }
        return null;
    }

    async deleteMemory(key) {
        const memoryPath = path.join(this.memoryDir, `${key}.json`);
        this.memories.delete(key);

        if (await fs.pathExists(memoryPath)) {
            await fs.remove(memoryPath);
        }
    }

    async clearMemories() {
        this.memories.clear();
        await fs.emptyDir(this.memoryDir);
    }

    getMemoriesByTag(tag) {
        return this.getAllMemories().filter(memory => memory.tags.includes(tag));
    }
}

module.exports = { Memory };