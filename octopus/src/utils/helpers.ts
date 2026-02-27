/**
 * Utility functions
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Ensure a directory exists
 */
export function ensureDir(dirPath: string): string {
    fs.ensureDirSync(dirPath);
    return dirPath;
}

/**
 * Get the current timestamp in ISO format
 */
export function now(): string {
    return new Date().toISOString();
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

/**
 * Sleep for the specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (i === maxRetries) {
                break;
            }

            const delay = baseDelay * Math.pow(2, i);
            await sleep(delay);
        }
    }

    throw lastError!;
}

/**
 * Sanitize a string for use in filenames
 */
export function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Truncate a string to the specified length
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Check if a value is empty or null/undefined
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        return value.trim() === '';
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
}