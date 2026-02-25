/**
 * Skills loader for nodebot agent capabilities
 * Enhanced with features from nanobot skills system
 */
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class SkillsLoader {
    constructor(workspace) {
        this.workspace = workspace;
        this.workspaceSkills = path.join(workspace, 'skills');
        this.builtinSkills = path.join(__dirname, '..', 'skills'); // Skills in nodebot root
    }

    /**
     * List all available skills with availability checking
     */
    async listSkills(filterUnavailable = true) {
        const skills = [];

        // Look for skills in both workspace and builtin directories
        const dirsToCheck = [this.builtinSkills];

        // Add workspace skills if they exist
        if (await fs.pathExists(this.workspaceSkills)) {
            dirsToCheck.unshift(this.workspaceSkills); // Prioritize workspace skills
        }

        for (const dir of dirsToCheck) {
            if (await fs.pathExists(dir)) {
                const skillDirs = await fs.readdir(dir);

                for (const skillDir of skillDirs) {
                    const skillPath = path.join(dir, skillDir);
                    const stat = await fs.stat(skillPath);

                    if (stat.isDirectory()) {
                        const skillFile = path.join(skillPath, 'SKILL.md');
                        if (await fs.pathExists(skillFile)) {
                            // Check if this skill is already added (to avoid duplicates)
                            const existingSkillIndex = skills.findIndex(s => s.name === skillDir);

                            if (existingSkillIndex === -1) {
                                const skillInfo = {
                                    name: skillDir,
                                    path: skillFile,
                                    source: dir === this.workspaceSkills ? 'workspace' : 'builtin'
                                };

                                // If filtering, check if skill is available
                                if (filterUnavailable) {
                                    const isAvailable = await this.checkRequirements(skillDir);
                                    if (isAvailable) {
                                        skills.push(skillInfo);
                                    }
                                } else {
                                    skills.push(skillInfo);
                                }
                            } else {
                                // Update existing skill if it's in workspace (higher priority)
                                if (dir === this.workspaceSkills) {
                                    const isAvailable = await this.checkRequirements(skillDir);
                                    if (!filterUnavailable || isAvailable) {
                                        skills[existingSkillIndex] = {
                                            name: skillDir,
                                            path: skillFile,
                                            source: 'workspace'
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return skills;
    }

    /**
     * Check if a command exists in the system
     */
    commandExists(command) {
        try {
            // Try different approaches for different platforms
            const isWindows = process.platform === 'win32';
            if (isWindows) {
                execSync(`where ${command}`, { stdio: 'pipe' });
            } else {
                execSync(`command -v ${command}`, { stdio: 'pipe' });
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Check if a skill meets its requirements (bins, env vars)
     */
    async checkRequirements(skillName) {
        const meta = await this.getSkillMetadata(skillName) || {};
        const skillMeta = this.parseNanobotMetadata(meta.metadata || {});
        const requires = skillMeta.requires || meta.requires || {};

        // Check required binaries
        const bins = requires.bins || [];
        for (const bin of bins) {
            if (!this.commandExists(bin)) {
                return false;
            }
        }

        // Check required environment variables
        const envVars = requires.env || [];
        for (const envVar of envVars) {
            if (!process.env[envVar]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get missing requirements for a skill (for error reporting)
     */
    async getMissingRequirements(skillName) {
        const meta = await this.getSkillMetadata(skillName) || {};
        const skillMeta = this.parseNanobotMetadata(meta.metadata || {});
        const requires = skillMeta.requires || meta.requires || {};

        const missing = [];

        // Check missing binaries
        const bins = requires.bins || [];
        for (const bin of bins) {
            if (!this.commandExists(bin)) {
                missing.push(`CLI: ${bin}`);
            }
        }

        // Check missing environment variables
        const envVars = requires.env || [];
        for (const envVar of envVars) {
            if (!process.env[envVar]) {
                missing.push(`ENV: ${envVar}`);
            }
        }

        return missing.join(', ');
    }

    /**
     * Build a summary of all skills (name, description, path, availability)
     */
    async buildSkillsSummary() {
        const allSkills = await this.listSkills(false); // Don't filter unavailable
        if (allSkills.length === 0) {
            return '';
        }

        const escapeXml = (s) => {
            return s.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const lines = ['<skills>'];

        for (const s of allSkills) {
            const name = escapeXml(s.name);
            const pathStr = s.path;
            const desc = escapeXml(await this.getSkillDescription(s.name));
            const available = await this.checkRequirements(s.name);

            lines.push(`  <skill available="${String(available).toLowerCase()}">`);
            lines.push(`    <name>${name}</name>`);
            lines.push(`    <description>${desc}</description>`);
            lines.push(`    <location>${pathStr}</location>`);

            // Show missing requirements for unavailable skills
            if (!available) {
                const missing = await this.getMissingRequirements(s.name);
                if (missing) {
                    lines.push(`    <requires>${escapeXml(missing)}</requires>`);
                }
            }

            lines.push('  </skill>');
        }

        lines.push('</skills>');

        return lines.join('\n');
    }

    /**
     * Get the description of a skill from its frontmatter
     */
    async getSkillDescription(name) {
        const meta = await this.getSkillMetadata(name);
        if (meta && meta.description) {
            return meta.description;
        }
        return name; // Fallback to skill name
    }

    /**
     * Parse skill metadata JSON from frontmatter (supports nanobot and openclaw keys)
     */
    parseNanobotMetadata(raw) {
        try {
            const data = JSON.parse(raw);
            return typeof data === 'object' && data ?
                (data.nanobot || data.openclaw || {}) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Get skill metadata from frontmatter
     */
    async getSkillMetadata(name) {
        const content = await this.loadSkill(name);
        if (!content) {
            return null;
        }

        // Extract frontmatter
        if (content.startsWith('---')) {
            const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
            if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1];

                // Try to parse as JSON first (for nanobot-style metadata)
                try {
                    return JSON.parse(frontmatter);
                } catch (e) {
                    // Fall back to simple YAML-like parsing
                    const metadata = {};
                    for (const line of frontmatter.split('\n')) {
                        if (line.includes(':')) {
                            const [key, ...valueParts] = line.split(':');
                            const keyStr = key.trim();
                            let valueStr = valueParts.join(':').trim();

                            // Remove quotes if present
                            if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
                                (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
                                valueStr = valueStr.slice(1, -1);
                            }

                            metadata[keyStr] = valueStr;
                        }
                    }
                    return metadata;
                }
            }
        }

        return null;
    }

    /**
     * Get skills marked as always=true that meet requirements
     */
    async getAlwaysSkills() {
        const result = [];
        const skills = await this.listSkills(true); // Only available skills

        for (const s of skills) {
            const meta = await this.getSkillMetadata(s.name) || {};
            const skillMeta = this.parseNanobotMetadata(meta.metadata || {});

            if (skillMeta.always || meta.always) {
                result.push(s.name);
            }
        }

        return result;
    }

    /**
     * Load a specific skill by name
     */
    async loadSkill(name) {
        // First check workspace skills
        const workspaceSkillPath = path.join(this.workspaceSkills, name, 'SKILL.md');
        if (await fs.pathExists(workspaceSkillPath)) {
            return await fs.readFile(workspaceSkillPath, 'utf8');
        }

        // Then check builtin skills
        const builtinSkillPath = path.join(this.builtinSkills, name, 'SKILL.md');
        if (await fs.pathExists(builtinSkillPath)) {
            return await fs.readFile(builtinSkillPath, 'utf8');
        }

        return null;
    }

    /**
     * Load specific skills for inclusion in agent context
     */
    async loadSkillsForContext(skillNames) {
        const parts = [];

        for (const name of skillNames) {
            const content = await this.loadSkill(name);
            if (content) {
                // Remove frontmatter if present
                const contentWithoutFrontmatter = this.stripFrontmatter(content);
                parts.push(`### Skill: ${name}\n\n${contentWithoutFrontmatter}`);
            }
        }

        return parts.length > 0 ? parts.join('\n\n---\n\n') : '';
    }

    /**
     * Strip YAML frontmatter from content
     */
    stripFrontmatter(content) {
        // Look for YAML frontmatter pattern
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = content.match(frontmatterRegex);

        if (match) {
            // Return content without frontmatter
            return content.substring(match[0].length);
        }

        return content;
    }
}

module.exports = { SkillsLoader };