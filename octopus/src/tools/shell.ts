/**
 * Shell execution tool
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Tool, ToolParameter } from './base.js';

const execAsync = promisify(exec);

export interface ExecToolConfig {
    timeout: number;
}

export class ExecTool implements Tool {
    name = 'exec';
    description = 'Execute shell commands';
    parameters: ToolParameter[] = [
        {
            name: 'command',
            type: 'string',
            description: 'Command to execute',
            required: true
        },
        {
            name: 'cwd',
            type: 'string',
            description: 'Working directory for the command',
            required: false
        }
    ];

    private workingDir: string;
    private timeout: number;
    private restrictToWorkspace: boolean;

    constructor(options: {
        workingDir?: string;
        timeout?: number;
        restrictToWorkspace?: boolean;
    } = {}) {
        this.workingDir = options.workingDir || process.cwd();
        this.timeout = options.timeout || 60000; // Default 60 seconds
        this.restrictToWorkspace = options.restrictToWorkspace || false;
    }

    async execute(params: Record<string, any>): Promise<string> {
        const { command, cwd } = params;

        if (!command) {
            return 'Error: command is required';
        }

        let workingDir = cwd || this.workingDir;

        // If restricting to workspace, ensure the command doesn't try to escape
        if (this.restrictToWorkspace) {
            workingDir = path.resolve(workingDir);
            if (!workingDir.startsWith(path.resolve(this.workingDir))) {
                return `Error: Working directory is outside the restricted workspace: ${this.workingDir}`;
            }
        }

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDir,
                timeout: this.timeout,
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            });

            let result = '';
            if (stdout) {
                result += `STDOUT:\n${stdout}`;
            }
            if (stderr) {
                result += `${result ? '\n' : ''}STDERR:\n${stderr}`;
            }

            return result || 'Command executed successfully with no output';
        } catch (error: any) {
            let result = `Command failed with exit code ${error.code}\n`;

            if (error.stdout) {
                result += `STDOUT:\n${error.stdout}\n`;
            }

            if (error.stderr) {
                result += `STDERR:\n${error.stderr}`;
            }

            return result;
        }
    }
}