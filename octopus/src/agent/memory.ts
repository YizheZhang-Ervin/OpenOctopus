/**
 * Memory system for persistent agent memory
 */

import fs from 'fs-extra';
import path from 'path';

export class MemoryStore {
    private memoryDir: string;
    private memoryFile: string;
    private historyFile: string;

    constructor(workspace: string) {
        this.memoryDir = path.join(workspace, 'memory');
        this.memoryFile = path.join(this.memoryDir, 'MEMORY.md');
        this.historyFile = path.join(this.memoryDir, 'HISTORY.md');

        // Ensure memory directory exists
        fs.ensureDirSync(this.memoryDir);
    }

    /**
     * Read long-term memory from file
     */
    readLongTerm(): string {
        if (fs.existsSync(this.memoryFile)) {
            return fs.readFileSync(this.memoryFile, 'utf-8');
        }
        return '';
    }

    /**
     * Write long-term memory to file
     */
    writeLongTerm(content: string): void {
        fs.writeFileSync(this.memoryFile, content, 'utf-8');
    }

    /**
     * Append an entry to the history file
     */
    appendHistory(entry: string): void {
        fs.appendFileSync(this.historyFile, entry.trim() + '\n\n', 'utf-8');
    }

    /**
     * Get memory context for inclusion in prompts
     */
    getMemoryContext(): string {
        const longTerm = this.readLongTerm();
        return longTerm ? `## Long-term Memory\n${longTerm}` : '';
    }
}