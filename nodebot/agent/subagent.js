/**
 * Subagent system for nodebot
 */
const { AgentLoop } = require('../commands/agent');

class SubAgent {
    constructor(parentAgent, config = {}) {
        this.parentAgent = parentAgent;
        this.id = config.id || this.generateId();
        this.config = { ...parentAgent.config, ...config };
        this.role = config.role || 'subagent';
        this.specialty = config.specialty || 'general';
        this.active = false;
        this.messageQueue = [];
    }

    async initialize() {
        // Create a new agent instance with the subagent's config
        this.agent = new AgentLoop(this.config);
        this.active = true;
    }

    async processTask(task, options = {}) {
        if (!this.active) {
            await this.initialize();
        }

        // Add any context from parent if needed
        if (options.includeParentContext) {
            // For now, just pass the task to the subagent
        }

        return await this.agent.processMessage(task);
    }

    async runSpecializedTask(task, specialty) {
        if (this.specialty !== specialty && specialty !== 'general') {
            throw new Error(`Subagent not specialized for ${specialty}, specializes in ${this.specialty}`);
        }

        return this.processTask(task);
    }

    async terminate() {
        this.active = false;
    }

    generateId() {
        return `subagent_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    }

    getStatus() {
        return {
            id: this.id,
            role: this.role,
            specialty: this.specialty,
            active: this.active,
            queueSize: this.messageQueue.length
        };
    }
}

class SubAgentManager {
    constructor(parentAgent) {
        this.parentAgent = parentAgent;
        this.subAgents = new Map();
    }

    createSubAgent(id, config = {}) {
        const subAgent = new SubAgent(this.parentAgent, { id, ...config });
        this.subAgents.set(id, subAgent);
        return subAgent;
    }

    getSubAgent(id) {
        return this.subAgents.get(id);
    }

    async runTaskOnSpecializedAgent(task, specialty) {
        // Find a subagent with the matching specialty
        for (const [id, subAgent] of this.subAgents) {
            if (subAgent.specialty === specialty || subAgent.specialty === 'general') {
                return await subAgent.processTask(task);
            }
        }

        // If no specialized agent found, create a temporary one
        const tempAgent = this.createSubAgent(`temp_${specialty}`, {
            specialty,
            role: `specialized_${specialty}`
        });

        try {
            const result = await tempAgent.processTask(task);
            await tempAgent.terminate();
            this.subAgents.delete(tempAgent.id);
            return result;
        } catch (error) {
            await tempAgent.terminate();
            this.subAgents.delete(tempAgent.id);
            throw error;
        }
    }

    async terminateAll() {
        for (const [id, subAgent] of this.subAgents) {
            await subAgent.terminate();
        }
        this.subAgents.clear();
    }

    listSubAgents() {
        return Array.from(this.subAgents.values()).map(agent => agent.getStatus());
    }

    async distributeTask(task, distributionMethod = 'round-robin') {
        const agents = Array.from(this.subAgents.values()).filter(agent => agent.active);

        if (agents.length === 0) {
            throw new Error('No active subagents available');
        }

        if (distributionMethod === 'round-robin') {
            // Simple round-robin distribution
            const agentIndex = this.calculateRoundRobinIndex(task);
            const selectedAgent = agents[agentIndex % agents.length];
            return await selectedAgent.processTask(task);
        } else if (distributionMethod === 'specialty') {
            // Distribute based on specialty matching
            for (const agent of agents) {
                if (task.includes(agent.specialty) || agent.specialty === 'general') {
                    return await agent.processTask(task);
                }
            }
            // If no specialty match, use first general agent
            const generalAgent = agents.find(agent => agent.specialty === 'general');
            if (generalAgent) {
                return await generalAgent.processTask(task);
            }
            // Otherwise use first available
            return await agents[0].processTask(task);
        }

        throw new Error(`Unknown distribution method: ${distributionMethod}`);
    }

    calculateRoundRobinIndex(task) {
        // Simple hash of task to determine agent index
        let hash = 0;
        for (let i = 0; i < task.length; i++) {
            const char = task.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

module.exports = { SubAgent, SubAgentManager };