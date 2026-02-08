const CommandBase = require('../CommandBase');

module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency',
    aliases: ['latency', 'p'],
    usage: 'ping',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            const start = Date.now();
            const statusMsg = await base.safeSend(channel, '🏓 Pinging...');
            const end = Date.now();
            
            if (!statusMsg) return;

            const latency = end - start;
            const apiLatency = Math.round(client.ws.ping);

            const pingEmbed = {
                title: '🏓 Pong!',
                color: latency < 200 ? 0x2ECC71 : latency < 500 ? 0xF1C40F : 0xE74C3C,
                fields: [
                    {
                        name: '📶 Bot Latency',
                        value: `\`${latency}ms\``,
                        inline: true
                    },
                    {
                        name: '🌐 API Latency',
                        value: `\`${apiLatency}ms\``,
                        inline: true
                    }
                ],
                timestamp: new Date()
            };

            // If we can edit (it's our own message), edit it. Otherwise send new.
            if (statusMsg.editable) {
                await statusMsg.edit({ content: ' ', embeds: [pingEmbed] });
            } else {
                await base.sendEmbed(channel, pingEmbed);
            }
        } catch (error) {
            console.error('Ping command error:', error);
            await base.sendError(channel, 'An error occurred while checking ping.');
        }
    }
};
