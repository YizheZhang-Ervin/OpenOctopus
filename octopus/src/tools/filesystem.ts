/**
 * Filesystem tools for reading, writing, and managing files
 */

import fs from 'fs-extra';
import path from 'path';
import { Tool, ToolParameter } from './base.js';

export class ReadFileTool implements Tool {
    name = 'read_file';
    description = 'Read the contents of a file';
    parameters: ToolParameter[] = [
        {
            name: 'file_path',
            type: 'string',
            description: 'Path to the file to read',
            required: true
        },
        {
            name: 'start_line',
            type: 'number',
            description: 'Line number to start reading from (1-based)',
            required: false,
            default: 1
        },
        {
            name: 'max_lines',
            type: 'number',
            description: 'Maximum number of lines to read',
            required: false,
            default: 1000
        }
    ];

    private allowedDir?: string;

    constructor(allowedDir?: string) {
        this.allowedDir = allowedDir ? path.resolve(allowedDir) : undefined;
    }

    async execute(params: Record<string, any>): Promise<string> {
        const { file_path, start_line = 1, max_lines = 1000 } = params;

        if (!file_path) {
            return 'Error: file_path is required';
        }

        const resolvedPath = path.resolve(file_path);

        // Check if file is within allowed directory if specified
        if (this.allowedDir && !resolvedPath.startsWith(this.allowedDir)) {
            return `Error: Access denied. File path is outside allowed directory: ${this.allowedDir}`;
        }

        try {
            if (!fs.existsSync(resolvedPath)) {
                return `Error: File not found: ${resolvedPath}`;
            }

            if (!fs.statSync(resolvedPath).isFile()) {
                return `Error: Path is not a file: ${resolvedPath}`;
            }

            const content = fs.readFileSync(resolvedPath, 'utf-8');
            const lines = content.split('\n');

            const startIdx = Math.max(0, start_line - 1);
            const endIdx = Math.min(lines.length, startIdx + max_lines);

            const selectedLines = lines.slice(startIdx, endIdx);

            // Add line numbers
            const numberedLines = selectedLines.map((line, idx) =>
                `${(startIdx + idx + 1).toString().padStart(4)}: ${line}`
            ).join('\n');

            return numberedLines;
        } catch (error) {
            return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

export class WriteFileTool implements Tool {
    name = 'write_file';
    description = 'Write content to a file, overwriting if it exists';
    parameters: ToolParameter[] = [
        {
            name: 'file_path',
            type: 'string',
            description: 'Path to the file to write',
            required: true
        },
        {
            name: 'content',
            type: 'string',
            description: 'Content to write to the file',
            required: true
        }
    ];

    private allowedDir?: string;

    constructor(allowedDir?: string) {
        this.allowedDir = allowedDir ? path.resolve(allowedDir) : undefined;
    }

    async execute(params: Record<string, any>): Promise<string> {
        const { file_path, content } = params;

        if (!file_path) {
            return 'Error: file_path is required';
        }

        if (content === undefined) {
            return 'Error: content is required';
        }

        const resolvedPath = path.resolve(file_path);

        // Check if file is within allowed directory if specified
        if (this.allowedDir && !resolvedPath.startsWith(this.allowedDir)) {
            return `Error: Access denied. File path is outside allowed directory: ${this.allowedDir}`;
        }

        try {
            // Ensure directory exists
            await fs.ensureDir(path.dirname(resolvedPath));

            // Write file
            await fs.writeFile(resolvedPath, content, 'utf-8');

            return `Successfully wrote to ${resolvedPath}`;
        } catch (error) {
            return `Error writing file: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

export class ListDirTool implements Tool {
    name = 'list_dir';
    description = 'List files and directories in a given path';
    parameters: ToolParameter[] = [
        {
            name: 'dir_path',
            type: 'string',
            description: 'Path to the directory to list',
            required: true
        },
        {
            name: 'recursive',
            type: 'boolean',
            description: 'Whether to list recursively',
            required: false,
            default: false
        }
    ];

    private allowedDir?: string;

    constructor(allowedDir?: string) {
        this.allowedDir = allowedDir ? path.resolve(allowedDir) : undefined;
    }

    async execute(params: Record<string, any>): Promise<string> {
        const { dir_path, recursive = false } = params;

        if (!dir_path) {
            return 'Error: dir_path is required';
        }

        const resolvedPath = path.resolve(dir_path);

        // Check if directory is within allowed directory if specified
        if (this.allowedDir && !resolvedPath.startsWith(this.allowedDir)) {
            return `Error: Access denied. Directory path is outside allowed directory: ${this.allowedDir}`;
        }

        try {
            if (!fs.existsSync(resolvedPath)) {
                return `Error: Directory not found: ${resolvedPath}`;
            }

            if (!fs.statSync(resolvedPath).isDirectory()) {
                return `Error: Path is not a directory: ${resolvedPath}`;
            }

            if (recursive) {
                return this.listRecursive(resolvedPath);
            } else {
                return this.listSingle(resolvedPath);
            }
        } catch (error) {
            return `Error listing directory: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private listSingle(dirPath: string): string {
        const items = fs.readdirSync(dirPath);
        const result: string[] = [];

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            const type = stats.isDirectory() ? 'DIR' : 'FILE';
            result.push(`${type}: ${item}`);
        }

        return result.join('\n');
    }

    private listRecursive(dirPath: string, prefix = ''): string {
        const items = fs.readdirSync(dirPath);
        const result: string[] = [];

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            const type = stats.isDirectory() ? 'DIR' : 'FILE';
            result.push(`${prefix}${type}: ${item}`);

            if (stats.isDirectory()) {
                result.push(this.listRecursive(itemPath, prefix + '  '));
            }
        }

        return result.join('\n');
    }
}