#!/usr/bin/env node

/**
 * Development server for Octopus
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the development server
const child = spawn('tsx', [join(__dirname, '..', 'src', 'index.ts')], {
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    process.exit(code || 0);
});