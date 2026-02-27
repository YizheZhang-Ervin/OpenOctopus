/**
 * Gateway server for handling HTTP API and WebSocket connections
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import chalk from 'chalk';
import { MessageBus } from '../bus/queue.js';
import { AgentLoop } from '../agent/loop.js';
import { Config } from '../config/schema.js';

export class GatewayServer {
    private app: express.Application;
    private httpServer: any;
    private wsServer: any;
    private wss: WebSocketServer;
    private agent: AgentLoop;
    private bus: MessageBus;
    private config: Config;
    private httpPort: number;
    private wsPort: number;

    constructor(config: Config, httpPort?: number) {
        this.config = config;
        this.httpPort = httpPort || config.channels.httpApi.port;
        this.wsPort = config.gateway.port;
        this.app = express();
        this.httpServer = createServer(this.app);
        this.wsServer = createServer();
        this.wss = new WebSocketServer({ server: this.wsServer });
        this.bus = new MessageBus();
        this.agent = new AgentLoop(config);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }

    private setupRoutes(): void {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Chat endpoint
        this.app.post('/api/chat', async (req, res) => {
            try {
                const { message, session_id = 'http:default', timeout = 30 } = req.body;

                if (!message) {
                    return res.status(400).json({
                        success: false,
                        error: 'Message is required',
                        session_id: session_id
                    });
                }

                const response = await this.agent.processDirect(
                    message,
                    session_id,
                    'http_api',
                    session_id
                );

                res.json({
                    success: true,
                    response: response,
                    session_id: session_id
                });
            } catch (error) {
                console.error('Chat error:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    session_id: req.body.session_id || 'http:default'
                });
            }
        });

        // Get session history
        this.app.get('/api/sessions/:sessionId/history', (req, res) => {
            try {
                const { sessionId } = req.params;
                // In a real implementation, this would fetch from the session manager
                res.json({ messages: [] });
            } catch (error) {
                console.error('Session history error:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Get skills list
        this.app.get('/api/skills', async (req, res) => {
            try {
                // Import here to avoid circular imports
                const { SkillsLoader } = await import('../agent/skills.js');

                // Create skills loader
                const skillsLoader = new SkillsLoader(this.config.agents.defaults.workspace);

                // Get list of available skills
                const skills = await skillsLoader.listSkills(false);

                // Enhance skills with metadata
                const enhancedSkills = [];
                for (const skill of skills) {
                    const content = await skillsLoader.loadSkill(skill.name);
                    const metadata = skillsLoader.getSkillMeta(skill.name);
                    const description = skillsLoader._getSkillDescription(content || '');

                    enhancedSkills.push({
                        name: skill.name,
                        description,
                        source: skill.source,
                        path: skill.path,
                        available: skillsLoader.checkRequirements(metadata),
                        requires: metadata?.requires || {},
                        always: metadata?.always || false
                    });
                }

                res.json({
                    skills: enhancedSkills,
                    total_count: enhancedSkills.length
                });
            } catch (error) {
                console.error('Skills list error:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Get status
        this.app.get('/api/status', (req, res) => {
            try {
                res.json({
                    status: 'running',
                    channel: 'gateway',
                    connected: true,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Status error:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log(chalk.blue('WebSocket client connected'));

            ws.on('message', async (message: string) => {
                try {
                    const data = JSON.parse(message);
                    const { type, payload } = data;

                    if (type === 'chat') {
                        const { message, session_id = 'ws:default' } = payload;

                        if (!message) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                payload: { message: 'Message is required' }
                            }));
                            return;
                        }

                        // Send thinking indicator
                        ws.send(JSON.stringify({
                            type: 'thinking',
                            payload: { thinking: true }
                        }));

                        try {
                            const response = await this.agent.processDirect(
                                message,
                                session_id,
                                'websocket',
                                session_id
                            );

                            // Send response
                            ws.send(JSON.stringify({
                                type: 'response',
                                payload: { message: response }
                            }));
                        } catch (error) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                payload: {
                                    message: error instanceof Error ? error.message : 'Unknown error'
                                }
                            }));
                        }
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        payload: {
                            message: error instanceof Error ? error.message : 'Unknown error'
                        }
                    }));
                }
            });

            ws.on('close', () => {
                console.log(chalk.blue('WebSocket client disconnected'));
            });

            ws.on('error', (error) => {
                console.error(chalk.red('WebSocket error:'), error);
            });
        });
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            let httpStarted = false;
            let wsStarted = false;
            const checkBothStarted = () => {
                if (httpStarted && wsStarted) {
                    resolve();
                }
            };

            // Start HTTP API server
            this.httpServer.listen(this.httpPort, () => {
                console.log(chalk.green(`Octopus HTTP API server running on port ${this.httpPort}`));
                console.log(chalk.blue(`  HTTP API: http://localhost:${this.httpPort}`));
                httpStarted = true;
                checkBothStarted();
            });

            // Start WebSocket server
            this.wsServer.listen(this.wsPort, () => {
                console.log(chalk.green(`Octopus WebSocket server running on port ${this.wsPort}`));
                console.log(chalk.blue(`  WebSocket: ws://localhost:${this.wsPort}`));
                wsStarted = true;
                checkBothStarted();
            });

            // Handle errors
            this.httpServer.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(chalk.red(`HTTP API port ${this.httpPort} is already in use`));
                    reject(new Error(`HTTP API port ${this.httpPort} is already in use`));
                } else {
                    console.error(chalk.red('HTTP API server error:'), error);
                    reject(error);
                }
            });

            this.wsServer.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(chalk.red(`WebSocket port ${this.wsPort} is already in use`));
                    reject(new Error(`WebSocket port ${this.wsPort} is already in use`));
                } else {
                    console.error(chalk.red('WebSocket server error:'), error);
                    reject(error);
                }
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            let httpStopped = false;
            let wsStopped = false;
            const checkBothStopped = () => {
                if (httpStopped && wsStopped) {
                    console.log(chalk.blue('Gateway servers stopped'));
                    resolve();
                }
            };

            this.httpServer.close(() => {
                console.log(chalk.blue('HTTP API server stopped'));
                httpStopped = true;
                checkBothStopped();
            });

            this.wsServer.close(() => {
                console.log(chalk.blue('WebSocket server stopped'));
                wsStopped = true;
                checkBothStopped();
            });
        });
    }
}