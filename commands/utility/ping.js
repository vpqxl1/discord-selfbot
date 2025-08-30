const CommandBase = require('../CommandBase');

module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    aliases: ['pong', 'latency'],
    cooldown: 5000,
    
    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        const sent = await base.safeSend(channel, '🏓 Pinging...');
        if (!sent) return;
        
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        await sent.edit(`🏓 Pong!\n• Bot Latency: ${latency}ms\n• API Latency: ${apiLatency}ms`);
    }
};
