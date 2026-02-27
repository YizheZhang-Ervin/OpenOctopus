/**
 * Skills loader for agent capabilities
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export interface SkillInfo {
    name: string;
    path: string;
    source: 'workspace' | 'builtin';
    description?: string;
    available?: boolean;
    requires?: string;
}

export interface SkillMetadata {
    name?: string;
    description?: string;
    always?: boolean;
    requires?: {
        bins?: string[];
        env?: string[];
    };
    metadata?: string;
}

export class SkillsLoader {
    private workspace: string;
    private workspaceSkills: string;
    private builtinSkills: string;

    constructor(workspace: string, builtinSkillsDir?: string) {
        this.workspace = workspace;
        this.workspaceSkills = path.join(workspace, 'skills');
        this.builtinSkills = builtinSkillsDir || path.join(process.cwd(), 'src', 'skills');
    }

    /**
     * List all available skills
     */
    async listSkills(filterUnavailable = true): Promise<SkillInfo[]> {
        const skills: SkillInfo[] = [];

        // Workspace skills (highest priority)
        if (await fs.pathExists(this.workspaceSkills)) {
            const allItems = await glob('*', { cwd: this.workspaceSkills });
            const skillDirs = allItems.filter(item => {
                const fullPath = path.join(this.workspaceSkills, item);
                return fs.statSync(fullPath).isDirectory();
            });

            for (const skillDir of skillDirs) {
                const skillFile = path.join(this.workspaceSkills, skillDir, 'SKILL.md');
                if (await fs.pathExists(skillFile)) {
                    skills.push({
                        name: skillDir,
                        path: skillFile,
                        source: 'workspace'
                    });
                }
            }
        }

        // Built-in skills
        if (await fs.pathExists(this.builtinSkills)) {
            const allItems = await glob('*', { cwd: this.builtinSkills });
            const skillDirs = allItems.filter(item => {
                const fullPath = path.join(this.builtinSkills, item);
                return fs.statSync(fullPath).isDirectory();
            });

            for (const skillDir of skillDirs) {
                const skillFile = path.join(this.builtinSkills, skillDir, 'SKILL.md');
                if (
                    await fs.pathExists(skillFile) &&
                    !skills.some(s => s.name === skillDir)
                ) {
                    skills.push({
                        name: skillDir,
                        path: skillFile,
                        source: 'builtin'
                    });
                }
            }
        }

        // Filter by requirements
        if (filterUnavailable) {
            return skills.filter(s => this.checkRequirements(this.getSkillMeta(s.name)));
        }
        return skills;
    }

    /**
     * Load a skill by name
     */
    async loadSkill(name: string): Promise<string | null> {
        // Check workspace first
        const workspaceSkill = path.join(this.workspaceSkills, name, 'SKILL.md');
        if (await fs.pathExists(workspaceSkill)) {
            return fs.readFileSync(workspaceSkill, 'utf-8');
        }

        // Check built-in
        const builtinSkill = path.join(this.builtinSkills, name, 'SKILL.md');
        if (await fs.pathExists(builtinSkill)) {
            return fs.readFileSync(builtinSkill, 'utf-8');
        }

        return null;
    }

    /**
     * Load specific skills for inclusion in agent context
     */
    async loadSkillsForContext(skillNames: string[]): Promise<string> {
        const parts: string[] = [];
        for (const name of skillNames) {
            const content = await this.loadSkill(name);
            if (content) {
                const strippedContent = this.stripFrontmatter(content);
                parts.push(`### Skill: ${name}\n\n${strippedContent}`);
            }
        }

        return parts.join('\n\n---\n\n');
    }

    /**
     * Build a summary of all skills
     */
    async buildSkillsSummary(): Promise<string> {
        const allSkills = await this.listSkills(false);
        if (!allSkills.length) {
            return '';
        }

        const escapeXml = (s: string): string => {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        const lines = ['<skills>'];
        for (const skill of allSkills) {
            const name = escapeXml(skill.name);
            const skillPath = skill.path;
            const desc = escapeXml(this.getSkillDescription(skill.name));
            const skillMeta = this.getSkillMeta(skill.name);
            const available = this.checkRequirements(skillMeta);

            lines.push(`  <skill available="${available.toString()}">`);
            lines.push(`    <name>${name}</name>`);
            lines.push(`    <description>${desc}</description>`);
            lines.push(`    <location>${skillPath}</location>`);

            // Show missing requirements for unavailable skills
            if (!available) {
                const missing = this.getMissingRequirements(skillMeta);
                if (missing) {
                    lines.push(`    <requires>${escapeXml(missing)}</requires>`);
                }
            }

            lines.push(`  </skill>`);
        }
        lines.push('</skills>');

        return lines.join('\n');
    }

    /**
     * Get skills marked as always=true that meet requirements
     */
    async getAlwaysSkills(): Promise<string[]> {
        const result: string[] = [];
        const skills = await this.listSkills(true);

        for (const skill of skills) {
            const meta = await this.getSkillMetadata(skill.name);
            const skillMeta = this.parseOctopusMetadata(meta?.metadata || '');

            if (skillMeta.always || meta?.always) {
                result.push(skill.name);
            }
        }

        return result;
    }

    /**
     * Get metadata from a skill's frontmatter
     */
    async getSkillMetadata(name: string): Promise<SkillMetadata | null> {
        const content = await this.loadSkill(name);
        if (!content) {
            return null;
        }

        if (content.startsWith('---')) {
            const match = content.match(/^---\n(.*?)\n---/s);
            if (match) {
                // Simple YAML parsing
                const metadata: SkillMetadata = {};
                for (const line of match[1].split('\n')) {
                    if (line.includes(':')) {
                        const [key, value] = line.split(':', 1);
                        const trimmedKey = key.trim();
                        const trimmedValue = value.trim().replace(/^["']|["']$/g, '');

                        // Type assertion to handle dynamic property assignment
                        (metadata as any)[trimmedKey] = trimmedValue;
                    }
                }
                return metadata;
            }
        }

        return null;
    }

    private getSkillDescription(name: string): string {
        // For now, just return the name
        // In a real implementation, this would extract from metadata
        return name;
    }

    private stripFrontmatter(content: string): string {
        if (content.startsWith('---')) {
            const match = content.match(/^---\n.*?\n---\n/s);
            if (match) {
                return content.substring(match[0].length).trim();
            }
        }
        return content;
    }

    private parseOctopusMetadata(raw: string): SkillMetadata {
        try {
            const data = JSON.parse(raw);
            return data.octopus || data.nanobot || data.openclaw || {};
        } catch (e) {
            return {};
        }
    }

    checkRequirements(skillMeta: SkillMetadata): boolean {
        const requires = skillMeta.requires || {};

        // Check binary requirements
        if (requires.bins) {
            for (const bin of requires.bins) {
                // In a real implementation, this would check if the binary exists
                // For now, we'll assume all binaries are available
            }
        }

        // Check environment variable requirements
        if (requires.env) {
            for (const env of requires.env) {
                if (!process.env[env]) {
                    return false;
                }
            }
        }

        return true;
    }

    private getMissingRequirements(skillMeta: SkillMetadata): string {
        const missing: string[] = [];
        const requires = skillMeta.requires || {};

        if (requires.bins) {
            for (const bin of requires.bins) {
                // In a real implementation, this would check if the binary exists
                // For now, we'll assume all binaries are available
            }
        }

        if (requires.env) {
            for (const env of requires.env) {
                if (!process.env[env]) {
                    missing.push(`ENV: ${env}`);
                }
            }
        }

        return missing.join(', ');
    }

    getSkillMeta(name: string): SkillMetadata {
        // This is a simplified version
        // In a real implementation, this would cache metadata
        return {};
    }

    /**
     * Extract skill description from content
     */
    _getSkillDescription(content: string): string {
        if (!content) return '';

        // Extract description from frontmatter or first paragraph
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const descMatch = frontmatter.match(/description:\s*["']([^"']+)["']/);
            if (descMatch) {
                return descMatch[1];
            }
        }

        // Fallback to first paragraph
        const afterFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        const firstParagraph = afterFrontmatter.split('\n\n')[0];
        return firstParagraph.replace(/^#\s+/, '').trim();
    }
}