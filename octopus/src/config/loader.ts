/**
 * Configuration loader and utilities
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { configSchema, Config, getDefaultConfig } from './schema.js';

export function getConfigPath(): string {
    return path.join(os.homedir(), '.octopus', 'config.json');
}

export function getDataDir(): string {
    return path.join(os.homedir(), '.octopus');
}

export async function loadConfig(): Promise<Config> {
    const configPath = getConfigPath();

    if (!await fs.pathExists(configPath)) {
        return getDefaultConfig();
    }

    try {
        const configData = await fs.readJson(configPath);
        const { error, value } = configSchema.validate(configData);

        if (error) {
            console.warn(`Configuration validation warning: ${error.message}`);
            // Return default config with partial overrides from user config
            return { ...getDefaultConfig(), ...value };
        }

        return value as Config;
    } catch (err) {
        console.error(`Error loading configuration: ${err}`);
        return getDefaultConfig();
    }
}

export async function saveConfig(config: Config): Promise<void> {
    const configPath = getConfigPath();
    await fs.ensureDir(path.dirname(configPath));

    const { error, value } = configSchema.validate(config);
    if (error) {
        throw new Error(`Invalid configuration: ${error.message}`);
    }

    await fs.writeJson(configPath, value, { spaces: 2 });
}

export function getWorkspacePath(config?: Config): string {
    const workspace = config?.agents.defaults.workspace || getDefaultConfig().agents.defaults.workspace;

    // If workspace is a relative path, resolve it relative to the current working directory
    if (path.isAbsolute(workspace)) {
        return workspace;
    } else if (workspace.startsWith('~/')) {
        return workspace.replace('~', os.homedir());
    } else {
        return path.resolve(process.cwd(), workspace);
    }
}