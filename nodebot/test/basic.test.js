/**
 * Basic tests for nodebot
 */
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const { FilesystemTools } = require('../tools/filesystem');
const { ShellTools } = require('../tools/shell');
const { WebTools } = require('../tools/web');

const execAsync = promisify(exec);

describe('nodebot basic functionality', () => {
    test('should have package.json with required dependencies', async () => {
        const pkg = await fs.readJson(path.join(__dirname, '../package.json'));

        expect(pkg.name).toBe('nodebot');
        expect(pkg.dependencies).toHaveProperty('openai');
        expect(pkg.dependencies).toHaveProperty('commander');
        expect(pkg.dependencies).toHaveProperty('chalk');
    });

    test('should create filesystem tools instance', () => {
        const workspace = '/tmp/test-workspace';
        const fsTools = new FilesystemTools(workspace);

        expect(fsTools.workspace).toBe(workspace);
    });

    test('should create shell tools instance', () => {
        const shellTools = new ShellTools();

        expect(shellTools.timeout).toBe(30000); // Default 30 seconds
    });

    test('should create web tools instance', () => {
        const webTools = new WebTools();

        expect(webTools.searchEngine).toBe('google'); // Default search engine
    });
});

// Additional tests could be added here for more comprehensive testing