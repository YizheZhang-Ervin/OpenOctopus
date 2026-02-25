/**
 * Advanced File System Tools for nodebot
 * Enhanced file operations with safety checks and advanced features
 */

const { BaseTool } = require('./registry');
const fs = require('fs-extra');
const path = require('path');

class AdvancedFileSystemTool extends BaseTool {
    constructor(workspace) {
        super('advancedFileSystemOperation', 'Perform advanced file system operations with safety checks', {
            properties: {
                operation: {
                    type: "string",
                    description: "File operation to perform",
                    enum: ["read", "write", "append", "delete", "list", "search", "copy", "move", "mkdir", "stat"]
                },
                filePath: {
                    type: "string",
                    description: "Path to the file or directory"
                },
                content: {
                    type: "string",
                    description: "Content to write or append (for write/append operations)"
                },
                destinationPath: {
                    type: "string",
                    description: "Destination path (for copy/move operations)"
                },
                recursive: {
                    type: "boolean",
                    description: "Whether to perform operation recursively (for delete, list operations)"
                },
                pattern: {
                    type: "string",
                    description: "Pattern to search for (for search operations)"
                },
                options: {
                    type: "object",
                    description: "Additional options for the operation",
                    properties: {
                        encoding: {
                            type: "string",
                            description: "File encoding (default: utf8)"
                        },
                        overwrite: {
                            type: "boolean",
                            description: "Whether to overwrite existing files (default: false)"
                        },
                        maxSize: {
                            type: "integer",
                            description: "Maximum file size to read (in bytes)"
                        }
                    }
                }
            },
            required: ["operation", "filePath"]
        });

        this.workspace = workspace;
    }

    async execute(args) {
        try {
            const { operation, filePath, content, destinationPath, recursive = false, pattern, options = {} } = args;

            // Security: Ensure the path is within workspace
            const resolvedPath = this.resolvePath(filePath);
            const resolvedDestPath = destinationPath ? this.resolvePath(destinationPath) : null;

            // Validate path is within workspace
            if (!this.isPathInWorkspace(resolvedPath)) {
                return {
                    success: false,
                    error: `Path '${filePath}' is outside workspace directory`,
                    attemptedPath: resolvedPath
                };
            }

            switch (operation) {
                case 'read':
                    return await this.readFile(resolvedPath, options);

                case 'write':
                    return await this.writeFile(resolvedPath, content, options);

                case 'append':
                    return await this.appendFile(resolvedPath, content, options);

                case 'delete':
                    return await this.deleteFile(resolvedPath, recursive);

                case 'list':
                    return await this.listFiles(resolvedPath, recursive);

                case 'search':
                    return await this.searchInFiles(resolvedPath, pattern, recursive);

                case 'copy':
                    if (!resolvedDestPath) {
                        return { success: false, error: 'destinationPath is required for copy operation' };
                    }
                    return await this.copyFile(resolvedPath, resolvedDestPath);

                case 'move':
                    if (!resolvedDestPath) {
                        return { success: false, error: 'destinationPath is required for move operation' };
                    }
                    return await this.moveFile(resolvedPath, resolvedDestPath);

                case 'mkdir':
                    return await this.makeDirectory(resolvedPath);

                case 'stat':
                    return await this.getFileStats(resolvedPath);

                default:
                    return {
                        success: false,
                        error: `Unsupported operation: ${operation}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                operation: args.operation,
                filePath: args.filePath
            };
        }
    }

    resolvePath(inputPath) {
        // Resolve the path relative to workspace
        return path.resolve(this.workspace, inputPath);
    }

    isPathInWorkspace(testPath) {
        const workspaceResolved = path.resolve(this.workspace);
        const testPathResolved = path.resolve(testPath);

        // Check if test path starts with workspace path
        return testPathResolved.startsWith(workspaceResolved);
    }

    async readFile(filePath, options = {}) {
        const encoding = options.encoding || 'utf8';
        const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default limit

        // Check file size first
        const stats = await fs.stat(filePath);
        if (stats.size > maxSize) {
            return {
                success: false,
                error: `File size (${stats.size} bytes) exceeds maximum allowed size (${maxSize} bytes)`
            };
        }

        const content = await fs.readFile(filePath, encoding);
        return {
            success: true,
            operation: 'read',
            filePath,
            content,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
        };
    }

    async writeFile(filePath, content, options = {}) {
        const overwrite = options.overwrite !== undefined ? options.overwrite : false;

        // Check if file exists and overwrite is not allowed
        if (!overwrite && await fs.pathExists(filePath)) {
            return {
                success: false,
                error: `File already exists at '${filePath}'. Use overwrite option to replace it.`
            };
        }

        await fs.outputFile(filePath, content, { encoding: options.encoding || 'utf8' });

        return {
            success: true,
            operation: 'write',
            filePath,
            size: Buffer.byteLength(content, options.encoding || 'utf8'),
            overwritten: overwrite
        };
    }

    async appendFile(filePath, content, options = {}) {
        await fs.appendFile(filePath, content, options.encoding || 'utf8');

        return {
            success: true,
            operation: 'append',
            filePath,
            appendedSize: Buffer.byteLength(content, options.encoding || 'utf8')
        };
    }

    async deleteFile(filePath, recursive = false) {
        if (await fs.pathExists(filePath)) {
            if ((await fs.stat(filePath)).isDirectory()) {
                if (recursive) {
                    await fs.remove(filePath);
                } else {
                    // Only allow deletion of empty directories
                    const files = await fs.readdir(filePath);
                    if (files.length > 0) {
                        return {
                            success: false,
                            error: `Directory '${filePath}' is not empty. Use recursive option to delete non-empty directories.`
                        };
                    }
                    await fs.rmdir(filePath);
                }
            } else {
                await fs.unlink(filePath);
            }

            return {
                success: true,
                operation: 'delete',
                filePath,
                wasRecursive: recursive
            };
        } else {
            return {
                success: false,
                error: `File or directory does not exist: ${filePath}`
            };
        }
    }

    async listFiles(dirPath, recursive = false) {
        if (!await fs.pathExists(dirPath)) {
            return {
                success: false,
                error: `Directory does not exist: ${dirPath}`
            };
        }

        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
            return {
                success: false,
                error: `Path is not a directory: ${dirPath}`
            };
        }

        let files = [];
        if (recursive) {
            const walk = async (currentPath) => {
                const items = await fs.readdir(currentPath);
                for (const item of items) {
                    const fullPath = path.join(currentPath, item);
                    const itemStats = await fs.stat(fullPath);

                    files.push({
                        name: item,
                        path: path.relative(this.workspace, fullPath),
                        isDirectory: itemStats.isDirectory(),
                        size: itemStats.size,
                        lastModified: itemStats.mtime.toISOString()
                    });

                    if (itemStats.isDirectory()) {
                        await walk(fullPath);
                    }
                }
            };

            await walk(dirPath);
        } else {
            const items = await fs.readdir(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const itemStats = await fs.stat(fullPath);

                files.push({
                    name: item,
                    path: path.relative(this.workspace, fullPath),
                    isDirectory: itemStats.isDirectory(),
                    size: itemStats.size,
                    lastModified: itemStats.mtime.toISOString()
                });
            }
        }

        return {
            success: true,
            operation: 'list',
            directory: path.relative(this.workspace, dirPath),
            files,
            count: files.length
        };
    }

    async searchInFiles(dirPath, pattern, recursive = false) {
        if (!pattern) {
            return {
                success: false,
                error: 'Pattern is required for search operation'
            };
        }

        const regex = new RegExp(pattern, 'gi');
        const matches = [];

        const searchInFile = async (filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const fileMatches = [];
                let match;

                while ((match = regex.exec(content)) !== null) {
                    // Find the line number and context
                    const contentBefore = content.substring(0, match.index);
                    const lineNumber = contentBefore.split('\n').length;
                    const start = Math.max(0, match.index - 50);
                    const end = Math.min(content.length, match.index + match[0].length + 50);
                    const context = content.substring(start, end);

                    fileMatches.push({
                        match: match[0],
                        index: match.index,
                        lineNumber,
                        context
                    });
                }

                if (fileMatches.length > 0) {
                    matches.push({
                        filePath: path.relative(this.workspace, filePath),
                        matches: fileMatches,
                        count: fileMatches.length
                    });
                }
            } catch (error) {
                // Skip binary files or unreadable files
            }
        };

        if (recursive) {
            const walk = async (currentPath) => {
                const items = await fs.readdir(currentPath);
                for (const item of items) {
                    const fullPath = path.join(currentPath, item);
                    const itemStats = await fs.stat(fullPath);

                    if (itemStats.isDirectory()) {
                        await walk(fullPath);
                    } else {
                        await searchInFile(fullPath);
                    }
                }
            };

            await walk(dirPath);
        } else {
            const items = await fs.readdir(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const itemStats = await fs.stat(fullPath);

                if (!itemStats.isDirectory()) {
                    await searchInFile(fullPath);
                }
            }
        }

        return {
            success: true,
            operation: 'search',
            directory: path.relative(this.workspace, dirPath),
            pattern,
            matches,
            totalMatches: matches.reduce((sum, fileMatch) => sum + fileMatch.count, 0),
            filesMatched: matches.length
        };
    }

    async copyFile(srcPath, destPath) {
        if (!await fs.pathExists(srcPath)) {
            return {
                success: false,
                error: `Source file does not exist: ${srcPath}`
            };
        }

        // Ensure destination directory exists
        await fs.ensureDir(path.dirname(destPath));

        await fs.copy(srcPath, destPath);

        return {
            success: true,
            operation: 'copy',
            source: path.relative(this.workspace, srcPath),
            destination: path.relative(this.workspace, destPath)
        };
    }

    async moveFile(srcPath, destPath) {
        if (!await fs.pathExists(srcPath)) {
            return {
                success: false,
                error: `Source file does not exist: ${srcPath}`
            };
        }

        // Ensure destination directory exists
        await fs.ensureDir(path.dirname(destPath));

        await fs.move(srcPath, destPath);

        return {
            success: true,
            operation: 'move',
            source: path.relative(this.workspace, srcPath),
            destination: path.relative(this.workspace, destPath)
        };
    }

    async makeDirectory(dirPath) {
        await fs.ensureDir(dirPath);

        return {
            success: true,
            operation: 'mkdir',
            directory: path.relative(this.workspace, dirPath)
        };
    }

    async getFileStats(filePath) {
        if (!await fs.pathExists(filePath)) {
            return {
                success: false,
                error: `File does not exist: ${filePath}`
            };
        }

        const stats = await fs.stat(filePath);

        return {
            success: true,
            operation: 'stat',
            filePath: path.relative(this.workspace, filePath),
            stats: {
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                modifiedAt: stats.mtime.toISOString(),
                accessedAt: stats.atime.toISOString(),
                permissions: stats.mode
            }
        };
    }
}

module.exports = { AdvancedFileSystemTool };