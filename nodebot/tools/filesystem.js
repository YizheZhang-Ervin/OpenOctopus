/**
 * File system tools for nodebot
 */
const fs = require('fs-extra');
const path = require('path');

class FilesystemTools {
    constructor(workspace) {
        this.workspace = workspace;
    }

    /**
     * Read a file
     */
    async readFile(filePath) {
        try {
            // Ensure the file is within the workspace
            const resolvedPath = path.resolve(this.workspace, filePath);
            if (!resolvedPath.startsWith(this.workspace)) {
                throw new Error('Access denied: file outside workspace');
            }

            const content = await fs.readFile(resolvedPath, 'utf8');
            return {
                success: true,
                content: content,
                path: resolvedPath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write a file
     */
    async writeFile(filePath, content) {
        try {
            // Ensure the file is within the workspace
            const resolvedPath = path.resolve(this.workspace, filePath);
            if (!resolvedPath.startsWith(this.workspace)) {
                throw new Error('Access denied: file outside workspace');
            }

            // Create directory if it doesn't exist
            await fs.ensureDir(path.dirname(resolvedPath));

            await fs.writeFile(resolvedPath, content, 'utf8');
            return {
                success: true,
                path: resolvedPath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List directory contents
     */
    async listDirectory(dirPath = '.') {
        try {
            // Ensure the directory is within the workspace
            const resolvedPath = path.resolve(this.workspace, dirPath);
            if (!resolvedPath.startsWith(this.workspace)) {
                throw new Error('Access denied: directory outside workspace');
            }

            const items = await fs.readdir(resolvedPath);
            return {
                success: true,
                items: items,
                path: resolvedPath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Edit a file (append, prepend, or replace content)
     */
    async editFile(filePath, operation, content) {
        try {
            const resolvedPath = path.resolve(this.workspace, filePath);
            if (!resolvedPath.startsWith(this.workspace)) {
                throw new Error('Access denied: file outside workspace');
            }

            let currentContent = '';
            if (await fs.pathExists(resolvedPath)) {
                currentContent = await fs.readFile(resolvedPath, 'utf8');
            }

            let newContent = currentContent;

            switch (operation) {
                case 'append':
                    newContent = currentContent + content;
                    break;
                case 'prepend':
                    newContent = content + currentContent;
                    break;
                case 'replace':
                    newContent = content;
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}. Use 'append', 'prepend', or 'replace'.`);
            }

            await fs.writeFile(resolvedPath, newContent, 'utf8');
            return {
                success: true,
                path: resolvedPath,
                operation: operation
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = { FilesystemTools };