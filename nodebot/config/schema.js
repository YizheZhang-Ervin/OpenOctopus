/**
 * Configuration schema for nodebot
 */
class ConfigSchema {
    static validate(config) {
        const errors = [];

        // Validate agents section
        if (config.agents) {
            if (typeof config.agents !== 'object') {
                errors.push('agents must be an object');
            } else {
                if (config.agents.defaults) {
                    if (typeof config.agents.defaults !== 'object') {
                        errors.push('agents.defaults must be an object');
                    } else {
                        if (config.agents.defaults.workspace && typeof config.agents.defaults.workspace !== 'string') {
                            errors.push('agents.defaults.workspace must be a string');
                        }
                        if (config.agents.defaults.model && typeof config.agents.defaults.model !== 'string') {
                            errors.push('agents.defaults.model must be a string');
                        }
                        if (config.agents.defaults.max_tokens !== undefined &&
                            (typeof config.agents.defaults.max_tokens !== 'number' || config.agents.defaults.max_tokens <= 0)) {
                            errors.push('agents.defaults.max_tokens must be a positive number');
                        }
                        if (config.agents.defaults.temperature !== undefined &&
                            (typeof config.agents.defaults.temperature !== 'number' ||
                                config.agents.defaults.temperature < 0 || config.agents.defaults.temperature > 2)) {
                            errors.push('agents.defaults.temperature must be a number between 0 and 2');
                        }
                        if (config.agents.defaults.max_tool_iterations !== undefined &&
                            (typeof config.agents.defaults.max_tool_iterations !== 'number' || config.agents.defaults.max_tool_iterations <= 0)) {
                            errors.push('agents.defaults.max_tool_iterations must be a positive number');
                        }
                        if (config.agents.defaults.memory_window !== undefined &&
                            (typeof config.agents.defaults.memory_window !== 'number' || config.agents.defaults.memory_window <= 0)) {
                            errors.push('agents.defaults.memory_window must be a positive number');
                        }
                        if (config.agents.defaults.systemPrompt && typeof config.agents.defaults.systemPrompt !== 'string') {
                            errors.push('agents.defaults.systemPrompt must be a string');
                        }
                    }
                }
            }
        }

        // Validate channels section
        if (config.channels) {
            if (typeof config.channels !== 'object') {
                errors.push('channels must be an object');
            } else {
                // Validate email channel
                if (config.channels.email) {
                    if (typeof config.channels.email !== 'object') {
                        errors.push('channels.email must be an object');
                    } else {
                        if (config.channels.email.enabled !== undefined && typeof config.channels.email.enabled !== 'boolean') {
                            errors.push('channels.email.enabled must be a boolean');
                        }
                        if (config.channels.email.consent_granted !== undefined && typeof config.channels.email.consent_granted !== 'boolean') {
                            errors.push('channels.email.consent_granted must be a boolean');
                        }
                        if (config.channels.email.imap_host && typeof config.channels.email.imap_host !== 'string') {
                            errors.push('channels.email.imap_host must be a string');
                        }
                        if (config.channels.email.imap_port !== undefined &&
                            (typeof config.channels.email.imap_port !== 'number' || config.channels.email.imap_port <= 0)) {
                            errors.push('channels.email.imap_port must be a positive number');
                        }
                        if (config.channels.email.imap_username && typeof config.channels.email.imap_username !== 'string') {
                            errors.push('channels.email.imap_username must be a string');
                        }
                        if (config.channels.email.imap_password && typeof config.channels.email.imap_password !== 'string') {
                            errors.push('channels.email.imap_password must be a string');
                        }
                        if (config.channels.email.imap_mailbox && typeof config.channels.email.imap_mailbox !== 'string') {
                            errors.push('channels.email.imap_mailbox must be a string');
                        }
                        if (config.channels.email.imap_use_ssl !== undefined && typeof config.channels.email.imap_use_ssl !== 'boolean') {
                            errors.push('channels.email.imap_use_ssl must be a boolean');
                        }
                        if (config.channels.email.smtp_host && typeof config.channels.email.smtp_host !== 'string') {
                            errors.push('channels.email.smtp_host must be a string');
                        }
                        if (config.channels.email.smtp_port !== undefined &&
                            (typeof config.channels.email.smtp_port !== 'number' || config.channels.email.smtp_port <= 0)) {
                            errors.push('channels.email.smtp_port must be a positive number');
                        }
                        if (config.channels.email.smtp_username && typeof config.channels.email.smtp_username !== 'string') {
                            errors.push('channels.email.smtp_username must be a string');
                        }
                        if (config.channels.email.smtp_password && typeof config.channels.email.smtp_password !== 'string') {
                            errors.push('channels.email.smtp_password must be a string');
                        }
                        if (config.channels.email.smtp_use_tls !== undefined && typeof config.channels.email.smtp_use_tls !== 'boolean') {
                            errors.push('channels.email.smtp_use_tls must be a boolean');
                        }
                        if (config.channels.email.smtp_use_ssl !== undefined && typeof config.channels.email.smtp_use_ssl !== 'boolean') {
                            errors.push('channels.email.smtp_use_ssl must be a boolean');
                        }
                        if (config.channels.email.from_address && typeof config.channels.email.from_address !== 'string') {
                            errors.push('channels.email.from_address must be a string');
                        }
                        if (config.channels.email.auto_reply_enabled !== undefined && typeof config.channels.email.auto_reply_enabled !== 'boolean') {
                            errors.push('channels.email.auto_reply_enabled must be a boolean');
                        }
                        if (config.channels.email.poll_interval_seconds !== undefined &&
                            (typeof config.channels.email.poll_interval_seconds !== 'number' || config.channels.email.poll_interval_seconds <= 0)) {
                            errors.push('channels.email.poll_interval_seconds must be a positive number');
                        }
                        if (config.channels.email.mark_seen !== undefined && typeof config.channels.email.mark_seen !== 'boolean') {
                            errors.push('channels.email.mark_seen must be a boolean');
                        }
                        if (config.channels.email.max_body_chars !== undefined &&
                            (typeof config.channels.email.max_body_chars !== 'number' || config.channels.email.max_body_chars <= 0)) {
                            errors.push('channels.email.max_body_chars must be a positive number');
                        }
                        if (config.channels.email.subject_prefix && typeof config.channels.email.subject_prefix !== 'string') {
                            errors.push('channels.email.subject_prefix must be a string');
                        }
                        if (config.channels.email.allow_from && !Array.isArray(config.channels.email.allow_from)) {
                            errors.push('channels.email.allow_from must be an array');
                        }
                    }
                }

                // Validate http_api channel
                if (config.channels.http_api) {
                    if (typeof config.channels.http_api !== 'object') {
                        errors.push('channels.http_api must be an object');
                    } else {
                        if (config.channels.http_api.enabled !== undefined && typeof config.channels.http_api.enabled !== 'boolean') {
                            errors.push('channels.http_api.enabled must be a boolean');
                        }
                        if (config.channels.http_api.host && typeof config.channels.http_api.host !== 'string') {
                            errors.push('channels.http_api.host must be a string');
                        }
                        if (config.channels.http_api.port !== undefined &&
                            (typeof config.channels.http_api.port !== 'number' || config.channels.http_api.port <= 0)) {
                            errors.push('channels.http_api.port must be a positive number');
                        }
                        if (config.channels.http_api.allow_from && !Array.isArray(config.channels.http_api.allow_from)) {
                            errors.push('channels.http_api.allow_from must be an array');
                        }
                    }
                }
            }
        }

        // Validate providers section
        if (config.providers) {
            if (typeof config.providers !== 'object') {
                errors.push('providers must be an object');
            } else {
                if (config.providers.custom) {
                    if (typeof config.providers.custom !== 'object') {
                        errors.push('providers.custom must be an object');
                    } else {
                        if (config.providers.custom.api_key && typeof config.providers.custom.api_key !== 'string') {
                            errors.push('providers.custom.api_key must be a string');
                        }
                        if (config.providers.custom.api_base !== null && config.providers.custom.api_base !== undefined &&
                            typeof config.providers.custom.api_base !== 'string') {
                            errors.push('providers.custom.api_base must be a string or null');
                        }
                        if (config.providers.custom.extra_headers !== null && config.providers.custom.extra_headers !== undefined &&
                            typeof config.providers.custom.extra_headers !== 'object') {
                            errors.push('providers.custom.extra_headers must be an object or null');
                        }
                    }
                }

                // Validate other providers
                const providerTypes = ['openai', 'anthropic', 'openrouter', 'gemini', 'deepseek'];
                for (const providerType of providerTypes) {
                    if (config.providers[providerType]) {
                        if (typeof config.providers[providerType] !== 'object') {
                            errors.push(`providers.${providerType} must be an object`);
                        } else {
                            if (config.providers[providerType].api_key && typeof config.providers[providerType].api_key !== 'string') {
                                errors.push(`providers.${providerType}.api_key must be a string`);
                            }
                            if (config.providers[providerType].api_base !== null && config.providers[providerType].api_base !== undefined &&
                                typeof config.providers[providerType].api_base !== 'string') {
                                errors.push(`providers.${providerType}.api_base must be a string or null`);
                            }
                        }
                    }
                }
            }
        }

        // Validate gateway section
        if (config.gateway) {
            if (typeof config.gateway !== 'object') {
                errors.push('gateway must be an object');
            } else {
                if (config.gateway.host && typeof config.gateway.host !== 'string') {
                    errors.push('gateway.host must be a string');
                }
                if (config.gateway.port !== undefined &&
                    (typeof config.gateway.port !== 'number' || config.gateway.port <= 0)) {
                    errors.push('gateway.port must be a positive number');
                }
            }
        }

        // Validate tools section
        if (config.tools) {
            if (typeof config.tools !== 'object') {
                errors.push('tools must be an object');
            } else {
                if (config.tools.web) {
                    if (typeof config.tools.web !== 'object') {
                        errors.push('tools.web must be an object');
                    } else {
                        if (config.tools.web.search) {
                            if (typeof config.tools.web.search !== 'object') {
                                errors.push('tools.web.search must be an object');
                            } else {
                                if (config.tools.web.search.api_key && typeof config.tools.web.search.api_key !== 'string') {
                                    errors.push('tools.web.search.api_key must be a string');
                                }
                                if (config.tools.web.search.max_results !== undefined &&
                                    (typeof config.tools.web.search.max_results !== 'number' || config.tools.web.search.max_results <= 0)) {
                                    errors.push('tools.web.search.max_results must be a positive number');
                                }
                            }
                        }
                    }
                }

                if (config.tools.exec) {
                    if (typeof config.tools.exec !== 'object') {
                        errors.push('tools.exec must be an object');
                    } else {
                        if (config.tools.exec.timeout !== undefined &&
                            (typeof config.tools.exec.timeout !== 'number' || config.tools.exec.timeout <= 0)) {
                            errors.push('tools.exec.timeout must be a positive number');
                        }
                    }
                }

                if (config.tools.restrict_to_workspace !== undefined && typeof config.tools.restrict_to_workspace !== 'boolean') {
                    errors.push('tools.restrict_to_workspace must be a boolean');
                }

                if (config.tools.mcp_servers && typeof config.tools.mcp_servers !== 'object') {
                    errors.push('tools.mcp_servers must be an object');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings: [] // Ã¦Â·Â»Ã¥Å Â Ã¨Â­Â¦Ã¥â€˜Å Ã¦â€¢Â°Ã§Â»â€žÃ¯Â¼Å’Ã¤Â»Â¥Ã¤Â¾Â¿Ã¦Å“ÂªÃ¦ÂÂ¥Ã¦â€°Â©Ã¥Â±â€¢
        };
    }

    static validateWithWarnings(config) {
        const result = this.validate(config);

        // Ã¦Â·Â»Ã¥Å Â Ã©Â¢ÂÃ¥Â¤â€“Ã§Å¡â€žÃ¨Â­Â¦Ã¥â€˜Å Ã¦Â£â‚¬Ã¦Å¸Â¥
        const warnings = [];

        // Ã¦Â£â‚¬Ã¦Å¸Â¥Ã¦ËœÂ¯Ã¥ÂÂ¦Ã§Â¼ÂºÃ¥Â°â€˜ API Ã¥Â¯â€ Ã©â€™Â¥
        if (!config.providers?.custom?.api_key) {
            warnings.push('No API key found in providers.custom.api_key. LLM functionality will be limited.');
        }

        // Ã¦Â£â‚¬Ã¦Å¸Â¥Ã¥Â·Â¥Ã¥â€¦Â·Ã©â€¦ÂÃ§Â½Â®
        if (!config.tools?.web?.search?.api_key) {
            warnings.push('Web search API key not configured. Web search functionality will be limited.');
        }

        result.warnings = warnings;
        return result;
    }

    static getDefaultConfig() {
        return {
            agents: {
                defaults: {
                    workspace: "./workspace",
                    model: "gpt-4o",
                    max_tokens: 4096,
                    temperature: 0.7,
                    max_tool_iterations: 20,
                    memory_window: 50
                }
            },
            channels: {
                email: {
                    enabled: false,
                    consent_granted: false,
                    imap_host: "",
                    imap_port: 993,
                    imap_username: "",
                    imap_password: "",
                    imap_mailbox: "INBOX",
                    imap_use_ssl: true,
                    smtp_host: "",
                    smtp_port: 587,
                    smtp_username: "",
                    smtp_password: "",
                    smtp_use_tls: true,
                    smtp_use_ssl: false,
                    from_address: "",
                    auto_reply_enabled: true,
                    poll_interval_seconds: 30,
                    mark_seen: true,
                    max_body_chars: 12000,
                    subject_prefix: "Re: ",
                    allow_from: []
                },
                http_api: {
                    enabled: true,
                    host: "0.0.0.0",
                    port: 8000,
                    allow_from: []
                }
            },
            providers: {
                custom: {
                    api_key: "",
                    api_base: null,
                    extra_headers: null
                },
                openai: {
                    api_key: "",
                    api_base: null
                },
                anthropic: {
                    api_key: "",
                    api_base: null
                },
                openrouter: {
                    api_key: "",
                    api_base: null
                },
                gemini: {
                    api_key: "",
                    api_base: null
                },
                deepseek: {
                    api_key: "",
                    api_base: null
                }
            },
            gateway: {
                host: "0.0.0.0",
                port: 18790
            },
            tools: {
                web: {
                    search: {
                        api_key: "",
                        max_results: 5
                    }
                },
                exec: {
                    timeout: 60
                },
                restrict_to_workspace: false,
                mcp_servers: {}
            }
        };
    }
}

module.exports = { ConfigSchema };