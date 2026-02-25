/**
 * Heartbeat service for nodebot
 */
class HeartbeatService {
    constructor() {
        this.services = new Map();
        this.status = 'unknown';
        this.lastHeartbeat = null;
        this.intervalId = null;
        this.callbacks = [];
    }

    registerService(serviceName, healthCheckFn) {
        this.services.set(serviceName, {
            name: serviceName,
            healthCheck: healthCheckFn,
            lastCheck: null,
            status: 'unknown',
            details: null
        });
    }

    async checkHealth() {
        const results = {};
        let overallHealthy = true;

        for (const [serviceName, service] of this.services) {
            try {
                const health = await service.healthCheck();
                service.lastCheck = new Date();
                service.status = health.healthy ? 'healthy' : 'unhealthy';
                service.details = health;

                results[serviceName] = {
                    healthy: health.healthy,
                    details: health,
                    lastCheck: service.lastCheck
                };

                if (!health.healthy) {
                    overallHealthy = false;
                }
            } catch (error) {
                service.lastCheck = new Date();
                service.status = 'error';
                service.details = { error: error.message };

                results[serviceName] = {
                    healthy: false,
                    details: { error: error.message },
                    lastCheck: service.lastCheck
                };

                overallHealthy = false;
            }
        }

        this.status = overallHealthy ? 'healthy' : 'unhealthy';
        this.lastHeartbeat = new Date();

        // Notify callbacks
        for (const callback of this.callbacks) {
            callback(this.getStatus());
        }

        return {
            timestamp: this.lastHeartbeat,
            overallStatus: this.status,
            services: results
        };
    }

    getStatus() {
        return {
            status: this.status,
            lastHeartbeat: this.lastHeartbeat,
            serviceCount: this.services.size,
            services: Array.from(this.services.values()).map(service => ({
                name: service.name,
                status: service.status,
                lastCheck: service.lastCheck,
                details: service.details
            }))
        };
    }

    startMonitoring(intervalMs = 30000) { // Default to 30 seconds
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            this.checkHealth().catch(error => {
                console.error('Heartbeat check failed:', error);
            });
        }, intervalMs);

        // Perform initial check
        this.checkHealth().catch(error => {
            console.error('Initial heartbeat check failed:', error);
        });

        return this.intervalId;
    }

    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    onStatusChange(callback) {
        this.callbacks.push(callback);
    }

    removeStatusCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }
}

module.exports = { HeartbeatService };