/**
 * Configuration schema and validation
 */

import Joi from 'joi';
import path from 'path';
import os from 'os';

// Base configuration schema
const emailConfigSchema = Joi.object({
    enabled: Joi.boolean().default(false),
    consentGranted: Joi.boolean().default(false),
    imapHost: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    imapPort: Joi.number().default(993),
    imapUsername: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    imapPassword: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    imapMailbox: Joi.string().default('INBOX'),
    imapUseSsl: Joi.boolean().default(true),
    smtpHost: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    smtpPort: Joi.number().default(587),
    smtpUsername: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    smtpPassword: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    smtpUseTls: Joi.boolean().default(true),
    smtpUseSsl: Joi.boolean().default(false),
    fromAddress: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().default('')
    }),
    autoReplyEnabled: Joi.boolean().default(true),
    pollIntervalSeconds: Joi.number().default(30),
    markSeen: Joi.boolean().default(true),
    maxBodyChars: Joi.number().default(12000),
    subjectPrefix: Joi.string().default('Re: '),
    allowFrom: Joi.array().items(Joi.string()).default([])
});

const httpApiConfigSchema = Joi.object({
    enabled: Joi.boolean().default(false),
    host: Joi.string().default('0.0.0.0'),
    port: Joi.number().default(8000),
    allowFrom: Joi.array().items(Joi.string()).default([])
});

const channelsConfigSchema = Joi.object({
    email: emailConfigSchema.default(),
    httpApi: httpApiConfigSchema.default()
});

const agentDefaultsSchema = Joi.object({
    workspace: Joi.string().default('~/.octopus/workspace'),
    model: Joi.string().default('gpt-4'),
    maxTokens: Joi.number().default(8192),
    temperature: Joi.number().default(0.7),
    maxToolIterations: Joi.number().default(20),
    memoryWindow: Joi.number().default(50)
});

const agentsConfigSchema = Joi.object({
    defaults: agentDefaultsSchema.default()
});

const providerConfigSchema = Joi.object({
    apiKey: Joi.string().default(''),
    apiBase: Joi.string().default(''),
    extraHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

const providersConfigSchema = Joi.object({
    custom: providerConfigSchema.default()
});

const gatewayConfigSchema = Joi.object({
    host: Joi.string().default('0.0.0.0'),
    port: Joi.number().default(18790)
});

const webSearchConfigSchema = Joi.object({
    apiKey: Joi.string().default(''),
    maxResults: Joi.number().default(5)
});

const webToolsConfigSchema = Joi.object({
    search: webSearchConfigSchema.default()
});

const execToolConfigSchema = Joi.object({
    timeout: Joi.number().default(60)
});

const mcpServerConfigSchema = Joi.object({
    command: Joi.string().default(''),
    args: Joi.array().items(Joi.string()).default([]),
    env: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    url: Joi.string().default('')
});

const toolsConfigSchema = Joi.object({
    web: webToolsConfigSchema.default(),
    exec: execToolConfigSchema.default(),
    restrictToWorkspace: Joi.boolean().default(false),
    mcpServers: Joi.object().pattern(Joi.string(), mcpServerConfigSchema).default({})
});

// Root configuration schema
export const configSchema = Joi.object({
    agents: agentsConfigSchema.default(),
    channels: channelsConfigSchema.default(),
    providers: providersConfigSchema.default(),
    gateway: gatewayConfigSchema.default(),
    tools: toolsConfigSchema.default()
});

export interface EmailConfig {
    enabled: boolean;
    consentGranted: boolean;
    imapHost: string;
    imapPort: number;
    imapUsername: string;
    imapPassword: string;
    imapMailbox: string;
    imapUseSsl: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpUseTls: boolean;
    smtpUseSsl: boolean;
    fromAddress: string;
    autoReplyEnabled: boolean;
    pollIntervalSeconds: number;
    markSeen: boolean;
    maxBodyChars: number;
    subjectPrefix: string;
    allowFrom: string[];
}

export interface HttpApiConfig {
    enabled: boolean;
    host: string;
    port: number;
    allowFrom: string[];
}

export interface ChannelsConfig {
    email: EmailConfig;
    httpApi: HttpApiConfig;
}

export interface AgentDefaults {
    workspace: string;
    model: string;
    maxTokens: number;
    temperature: number;
    maxToolIterations: number;
    memoryWindow: number;
}

export interface AgentsConfig {
    defaults: AgentDefaults;
}

export interface ProviderConfig {
    apiKey: string;
    apiBase?: string;
    extraHeaders?: Record<string, string>;
}

export interface ProvidersConfig {
    custom: ProviderConfig;
}

export interface GatewayConfig {
    host: string;
    port: number;
}

export interface WebSearchConfig {
    apiKey: string;
    maxResults: number;
}

export interface WebToolsConfig {
    search: WebSearchConfig;
}

export interface ExecToolConfig {
    timeout: number;
}

export interface MCPServerConfig {
    command: string;
    args: string[];
    env: Record<string, string>;
    url: string;
}

export interface ToolsConfig {
    web: WebToolsConfig;
    exec: ExecToolConfig;
    restrictToWorkspace: boolean;
    mcpServers: Record<string, MCPServerConfig>;
}

export interface Config {
    agents: AgentsConfig;
    channels: ChannelsConfig;
    providers: ProvidersConfig;
    gateway: GatewayConfig;
    tools: ToolsConfig;
}

export function getDefaultConfig(): Config {
    return {
        agents: {
            defaults: {
                workspace: path.join(os.homedir(), '.octopus', 'workspace'),
                model: 'gpt-4',
                maxTokens: 8192,
                temperature: 0.7,
                maxToolIterations: 20,
                memoryWindow: 50
            }
        },
        channels: {
            email: {
                enabled: false,
                consentGranted: false,
                imapHost: '',
                imapPort: 993,
                imapUsername: '',
                imapPassword: '',
                imapMailbox: 'INBOX',
                imapUseSsl: true,
                smtpHost: '',
                smtpPort: 587,
                smtpUsername: '',
                smtpPassword: '',
                smtpUseTls: true,
                smtpUseSsl: false,
                fromAddress: '',
                autoReplyEnabled: true,
                pollIntervalSeconds: 30,
                markSeen: true,
                maxBodyChars: 12000,
                subjectPrefix: 'Re: ',
                allowFrom: []
            },
            httpApi: {
                enabled: false,
                host: '0.0.0.0',
                port: 8000,
                allowFrom: []
            }
        },
        providers: {
            custom: {
                apiKey: '',
                apiBase: undefined,
                extraHeaders: undefined
            }
        },
        gateway: {
            host: '0.0.0.0',
            port: 18790
        },
        tools: {
            web: {
                search: {
                    apiKey: '',
                    maxResults: 5
                }
            },
            exec: {
                timeout: 60
            },
            restrictToWorkspace: false,
            mcpServers: {}
        }
    };
}