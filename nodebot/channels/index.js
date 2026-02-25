/**
 * Channels module for nodebot
 */
const { BaseChannel } = require('./base');
const { EmailChannel } = require('./email');
const { HttpApiChannel } = require('./http_api');
const { ChannelManager } = require('./manager');

module.exports = {
    BaseChannel,
    EmailChannel,
    HttpApiChannel,
    ChannelManager
};