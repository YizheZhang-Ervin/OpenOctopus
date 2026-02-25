/**
 * Shell execution tools for nodebot
 */
const { exec } = require('child_process');
const util = require('util');
const chalk = require('chalk');

const execPromise = util.promisify(exec);

class ShellTools {
    constructor(config = {}) {
        this.allowedCommands = config.allowedCommands || [
            'ls', 'dir', 'pwd', 'echo', 'cat', 'grep', 'find', 'ps', 'top', 'df', 'du'
        ];
        this.timeout = config.timeout || 30000; // 30 seconds default timeout
    }

    /**
     * Execute a shell command
     */
    async executeCommand(command) {
        try {
            // Basic command validation to prevent dangerous operations
            if (this.isDangerousCommand(command)) {
                throw new Error('Command contains dangerous operations');
            }

            console.log(chalk.yellow(`Executing command: ${command}`));

            const { stdout, stderr } = await execPromise(command, {
                timeout: this.timeout
            });

            return {
                success: true,
                stdout: stdout,
                stderr: stderr,
                command: command
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: command
            };
        }
    }

    /**
     * Check if a command contains potentially dangerous operations
     */
    isDangerousCommand(command) {
        const dangerousPatterns = [
            /rm\s+-rf/,           // Force delete
            /mv\s+.*\s+\/tmp/,    // Moving files to temp (potential data loss)
            /chmod\s+777/,       // Setting world-writable permissions
            /chown\s+root/,      // Changing ownership to root
            /dd\s+/,             // Direct disk access
            /\|\s*rm/,           // Pipe to rm
            /;\s*rm/,            // Semicolon followed by rm
            /&&\s*rm/,           // And followed by rm
            /\$\(\s*rm/,         // Command substitution with rm
            /`.*rm.*`/,          // Backtick command execution with rm
        ];

        const lowerCmd = command.toLowerCase();
        return dangerousPatterns.some(pattern => pattern.test(lowerCmd));
    }
}

module.exports = { ShellTools };