/**
 * Spawn tool for nodebot
 * Used to create and manage child processes
 */
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SpawnTool {
    constructor(config = {}) {
        this.config = config;
        this.processes = new Map(); // Track spawned processes
    }

    /**
     * Spawn a new process
     */
    async spawnProcess(command, args = [], options = {}) {
        const id = this.generateId();

        // Default options
        const spawnOptions = {
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env },
            stdio: options.stdio || 'pipe',
            detached: options.detached || false,
            shell: options.shell || false
        };

        try {
            const child = spawn(command, args, spawnOptions);

            // Store process info
            const processInfo = {
                id,
                command,
                args,
                child,
                startedAt: new Date(),
                status: 'running',
                stdout: [],
                stderr: [],
                options: spawnOptions
            };

            // Handle stdout
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    processInfo.stdout.push(data.toString());
                });
            }

            // Handle stderr
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    processInfo.stderr.push(data.toString());
                });
            }

            // Handle process close
            child.on('close', (code) => {
                processInfo.status = 'closed';
                processInfo.exitCode = code;
                processInfo.finishedAt = new Date();
            });

            // Handle errors
            child.on('error', (error) => {
                processInfo.status = 'error';
                processInfo.error = error.message;
            });

            // Store the process
            this.processes.set(id, processInfo);

            return {
                id,
                pid: child.pid,
                command,
                args,
                startedAt: processInfo.startedAt,
                status: 'started'
            };
        } catch (error) {
            throw new Error(`Failed to spawn process: ${error.message}`);
        }
    }

    /**
     * Execute a command and wait for completion
     */
    async executeCommand(command, args = [], options = {}) {
        const cmdWithArgs = args.length > 0 ? `${command} ${args.join(' ')}` : command;

        const execOptions = {
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env },
            timeout: options.timeout || 0,
            maxBuffer: options.maxBuffer || 1024 * 1024 // 1MB default
        };

        try {
            const { stdout, stderr } = await exec(cmdWithArgs, execOptions);
            return {
                command: cmdWithArgs,
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                success: true
            };
        } catch (error) {
            return {
                command: cmdWithArgs,
                stdout: error.stdout ? error.stdout.toString() : '',
                stderr: error.stderr ? error.stderr.toString() : error.message,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Kill a spawned process
     */
    killProcess(id, signal = 'SIGTERM') {
        const processInfo = this.processes.get(id);
        if (!processInfo) {
            throw new Error(`Process with id ${id} not found`);
        }

        if (processInfo.child) {
            processInfo.child.kill(signal);
            processInfo.status = 'killed';
            return true;
        }

        return false;
    }

    /**
     * Get process information
     */
    getProcess(id) {
        return this.processes.get(id) || null;
    }

    /**
     * List all managed processes
     */
    listProcesses() {
        return Array.from(this.processes.values()).map(p => ({
            id: p.id,
            command: p.command,
            pid: p.child ? p.child.pid : null,
            status: p.status,
            startedAt: p.startedAt,
            finishedAt: p.finishedAt || null
        }));
    }

    /**
     * Wait for a process to complete
     */
    async waitForProcess(id, timeoutMs = 30000) {
        const processInfo = this.processes.get(id);
        if (!processInfo) {
            throw new Error(`Process with id ${id} not found`);
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout waiting for process ${id}`));
            }, timeoutMs);

            // If already finished
            if (processInfo.status !== 'running') {
                clearTimeout(timeout);
                resolve(processInfo);
                return;
            }

            // Wait for the process to close
            processInfo.child.once('close', () => {
                clearTimeout(timeout);
                resolve(processInfo);
            });
        });
    }

    /**
     * Spawn a long-running service
     */
    async spawnService(name, command, args = [], options = {}) {
        const serviceOptions = {
            ...options,
            stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout/stderr piped
            detached: true
        };

        const processInfo = await this.spawnProcess(command, args, serviceOptions);

        // Store as a named service
        if (!this.services) this.services = new Map();
        this.services.set(name, processInfo.id);

        return processInfo;
    }

    /**
     * Get a service by name
     */
    getService(name) {
        if (!this.services) return null;
        const id = this.services.get(name);
        return id ? this.getProcess(id) : null;
    }

    /**
     * Stop a service
     */
    stopService(name) {
        if (!this.services) return false;
        const id = this.services.get(name);
        if (id) {
            return this.killProcess(id);
        }
        return false;
    }

    /**
     * Generate a unique ID
     */
    generateId() {
        return `spawn_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    }

    /**
     * Cleanup all processes
     */
    async cleanup() {
        // Kill all tracked processes
        for (const [id, processInfo] of this.processes) {
            if (processInfo.status === 'running' && processInfo.child) {
                try {
                    processInfo.child.kill('SIGTERM');
                } catch (e) {
                    // Process might already be dead
                }
            }
        }

        this.processes.clear();
        if (this.services) {
            this.services.clear();
        }
    }
}

module.exports = { SpawnTool };