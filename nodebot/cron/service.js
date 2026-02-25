/**
 * Cron service for nodebot
 */

class CronService {
    constructor() {
        this.jobs = new Map();
        this.runningJobs = new Map();
        this.jobHistory = new Map();
    }

    // Simple scheduler that supports common cron expressions
    addJob(jobId, cronExpression, taskFunction, options = {}) {
        // Parse simplified cron expressions like '* * * * *' or '0 9 * * *' 
        const job = {
            id: jobId,
            cronExpression,
            task: taskFunction,
            parsedExpression: this.parseCronExpression(cronExpression),
            options,
            createdAt: new Date(),
            lastRun: null,
            nextRun: this.getNextRunTime(cronExpression),
            isActive: true,
            runCount: 0
        };

        this.jobs.set(jobId, job);

        if (options.autoStart !== false) {
            this.startJob(jobId);
        }

        return job;
    }

    parseCronExpression(expression) {
        const parts = expression.split(/\s+/);
        if (parts.length !== 5) {
            throw new Error('Invalid cron expression. Expected format: minute hour day month weekday');
        }

        return {
            minute: parts[0],
            hour: parts[1],
            day: parts[2],
            month: parts[3],
            weekday: parts[4]
        };
    }

    getNextRunTime(cronExpression) {
        // This is a simplified implementation - for a production system,
        // you'd want to implement proper cron scheduling logic
        const now = new Date();
        const parts = cronExpression.split(/\s+/);

        // For now, return a simple delay based on the expression
        // A full implementation would calculate the actual next execution time
        // based on cron rules

        // For simplicity, let's implement a basic scheduler for common patterns
        const [minute, hour, day, month, weekday] = parts;

        // If all are *, run every minute
        if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
            return new Date(now.getTime() + 60000); // Next minute
        }

        // If minutes are *, run hourly at the top of the hour
        if (minute === '*') {
            const nextHour = new Date(now);
            nextHour.setHours(nextHour.getHours() + 1);
            nextHour.setMinutes(0, 0, 0);
            return nextHour;
        }

        // Otherwise, schedule for the next occurrence (simplified)
        // In a real implementation, you would calculate the exact time based on the cron pattern
        return new Date(now.getTime() + 60000); // Default to 1 minute
    }

    startJob(jobId) {
        if (!this.jobs.has(jobId)) {
            throw new Error(`Job ${jobId} does not exist`);
        }

        const job = this.jobs.get(jobId);
        if (job.isActive) {
            return; // Already running
        }

        job.isActive = true;

        // Clear any existing timer for this job
        if (this.runningJobs.has(jobId)) {
            clearTimeout(this.runningJobs.get(jobId));
        }

        const runJob = async () => {
            if (!job.isActive) {
                return;
            }

            try {
                const startTime = new Date();
                job.lastRun = startTime;
                job.runCount++;

                console.log(`Running scheduled job: ${jobId} at ${startTime.toISOString()}`);

                const result = await job.task();

                // Record job history
                if (!this.jobHistory.has(jobId)) {
                    this.jobHistory.set(jobId, []);
                }
                this.jobHistory.get(jobId).push({
                    id: this.generateId(),
                    jobId,
                    startTime,
                    endTime: new Date(),
                    success: true,
                    result,
                    duration: Date.now() - startTime.getTime()
                });

                // Keep only last 50 executions
                if (this.jobHistory.get(jobId).length > 50) {
                    this.jobHistory.get(jobId).shift();
                }

                console.log(`Completed scheduled job: ${jobId}, took ${Date.now() - startTime.getTime()}ms`);
            } catch (error) {
                console.error(`Failed to run scheduled job: ${jobId}`, error);

                // Record failure in history
                if (!this.jobHistory.has(jobId)) {
                    this.jobHistory.set(jobId, []);
                }
                this.jobHistory.get(jobId).push({
                    id: this.generateId(),
                    jobId,
                    startTime: new Date(),
                    endTime: new Date(),
                    success: false,
                    error: error.message,
                    duration: 0
                });

                // Keep only last 50 executions
                if (this.jobHistory.get(jobId).length > 50) {
                    this.jobHistory.get(jobId).shift();
                }
            }

            if (job.isActive) {
                // Schedule next run
                job.nextRun = this.getNextRunTime(job.cronExpression);
                const delay = Math.max(job.nextRun.getTime() - Date.now(), 1000); // At least 1 second delay
                const timerId = setTimeout(runJob, delay);
                this.runningJobs.set(jobId, timerId);
            }
        };

        // Calculate initial delay
        const now = new Date();
        const initialDelay = Math.max(job.nextRun.getTime() - now.getTime(), 1000); // At least 1 second

        const timerId = setTimeout(runJob, initialDelay);
        this.runningJobs.set(jobId, timerId);
    }

    stopJob(jobId) {
        if (this.runningJobs.has(jobId)) {
            clearTimeout(this.runningJobs.get(jobId));
            this.runningJobs.delete(jobId);
        }

        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId).isActive = false;
        }
    }

    removeJob(jobId) {
        this.stopJob(jobId);
        this.jobs.delete(jobId);
        this.jobHistory.delete(jobId);
    }

    listJobs() {
        return Array.from(this.jobs.values()).map(job => ({
            id: job.id,
            cronExpression: job.cronExpression,
            isActive: job.isActive,
            createdAt: job.createdAt,
            lastRun: job.lastRun,
            nextRun: job.nextRun,
            runCount: job.runCount
        }));
    }

    getJobHistory(jobId) {
        return this.jobHistory.get(jobId) || [];
    }

    getJob(jobId) {
        return this.jobs.get(jobId);
    }

    runJobNow(jobId) {
        if (!this.jobs.has(jobId)) {
            throw new Error(`Job ${jobId} does not exist`);
        }

        const job = this.jobs.get(jobId);
        return job.task();
    }

    // Convenience methods for common schedules
    addIntervalJob(jobId, intervalMs, taskFunction, options = {}) {
        // Convert interval to a simple repeating job
        const job = {
            id: jobId,
            intervalMs,
            task: taskFunction,
            options,
            createdAt: new Date(),
            lastRun: null,
            nextRun: new Date(Date.now() + intervalMs),
            isActive: true,
            runCount: 0
        };

        this.jobs.set(jobId, job);

        if (options.autoStart !== false) {
            this.startIntervalJob(jobId);
        }

        return job;
    }

    startIntervalJob(jobId) {
        if (!this.jobs.has(jobId)) {
            throw new Error(`Job ${jobId} does not exist`);
        }

        const job = this.jobs.get(jobId);
        if (job.intervalMs === undefined) {
            throw new Error(`Job ${jobId} is not an interval job`);
        }

        job.isActive = true;

        // Clear any existing timer for this job
        if (this.runningJobs.has(jobId)) {
            clearTimeout(this.runningJobs.get(jobId));
        }

        const runJob = async () => {
            if (!job.isActive) {
                return;
            }

            try {
                const startTime = new Date();
                job.lastRun = startTime;
                job.runCount++;

                console.log(`Running interval job: ${jobId} at ${startTime.toISOString()}`);

                const result = await job.task();

                // Record job history
                if (!this.jobHistory.has(jobId)) {
                    this.jobHistory.set(jobId, []);
                }
                this.jobHistory.get(jobId).push({
                    id: this.generateId(),
                    jobId,
                    startTime,
                    endTime: new Date(),
                    success: true,
                    result,
                    duration: Date.now() - startTime.getTime()
                });

                // Keep only last 50 executions
                if (this.jobHistory.get(jobId).length > 50) {
                    this.jobHistory.get(jobId).shift();
                }

                console.log(`Completed interval job: ${jobId}, took ${Date.now() - startTime.getTime()}ms`);
            } catch (error) {
                console.error(`Failed to run interval job: ${jobId}`, error);

                // Record failure in history
                if (!this.jobHistory.has(jobId)) {
                    this.jobHistory.set(jobId, []);
                }
                this.jobHistory.get(jobId).push({
                    id: this.generateId(),
                    jobId,
                    startTime: new Date(),
                    endTime: new Date(),
                    success: false,
                    error: error.message,
                    duration: 0
                });

                // Keep only last 50 executions
                if (this.jobHistory.get(jobId).length > 50) {
                    this.jobHistory.get(jobId).shift();
                }
            }

            if (job.isActive) {
                // Schedule next run
                job.nextRun = new Date(Date.now() + job.intervalMs);
                const timerId = setTimeout(runJob, job.intervalMs);
                this.runningJobs.set(jobId, timerId);
            }
        };

        // Start the interval
        const timerId = setTimeout(runJob, job.intervalMs);
        this.runningJobs.set(jobId, timerId);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    shutdown() {
        // Stop all running jobs
        for (const jobId of this.runningJobs.keys()) {
            this.stopJob(jobId);
        }
    }
}

module.exports = { CronService };