/**
 * Email channel for nodebot
 */

class EmailChannel {
    constructor(config = {}) {
        this.name = 'email';
        this.config = {
            host: config.host || process.env.EMAIL_HOST,
            port: config.port || process.env.EMAIL_PORT || 587,
            secure: config.secure || false,
            auth: {
                user: config.user || process.env.EMAIL_USER,
                pass: config.pass || process.env.EMAIL_PASS,
            },
            from: config.from || process.env.EMAIL_FROM
        };
        this.transporter = null;
        this.enabled = !!(this.config.host && this.config.auth.user && this.config.auth.pass && this.config.from);
        this.connected = false;
        this.nodemailer = null;
    }

    async connect() {
        if (!this.enabled) {
            throw new Error('Email channel not properly configured');
        }

        try {
            // Dynamically load nodemailer
            if (!this.nodemailer) {
                this.nodemailer = require('nodemailer');
            }

            this.transporter = this.nodemailer.createTransporter({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: this.config.auth
            });

            // Test connection
            await this.transporter.verify();
            this.connected = true;
            console.log('Email channel connected successfully');
            return true;
        } catch (error) {
            console.error('Failed to connect to email channel:', error.message);
            this.connected = false;
            throw error;
        }
    }

    async disconnect() {
        this.connected = false;
        this.transporter = null;
        console.log('Email channel disconnected');
        return true;
    }

    async sendMessage(message, options = {}) {
        if (!this.connected || !this.transporter) {
            await this.connect();
        }

        const mailOptions = {
            from: this.config.from,
            to: options.to || this.config.defaultRecipients,
            subject: options.subject || 'nodebot message',
            text: message.text || message,
            html: message.html || null
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Failed to send email:', error.message);
            throw error;
        }
    }

    // Email channel doesn't typically receive messages actively
    async receiveMessage() {
        throw new Error('Email channel does not support receiving messages directly. Use polling or webhook separately.');
    }

    async isConnected() {
        return this.connected;
    }
}

module.exports = { EmailChannel };