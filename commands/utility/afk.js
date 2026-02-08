const CommandBase = require('../CommandBase');

// Store AFK status
let afkStatus = {
    isAfk: false,
    reason: '',
    since: null
};

module.exports = {
    name: 'afk',
    description: 'Set yourself as AFK with an optional reason',
    aliases: ['away'],
    usage: 'afk [reason]',
    cooldown: 5000,

    init(client) {
        // Listen for mentions to respond with AFK status
        client.on('messageCreate', async (message) => {
            if (!afkStatus.isAfk || message.author.bot) return;
            
            // If someone mentions the user
            if (message.mentions.users.has(client.user.id)) {
                const duration = Math.floor((Date.now() - afkStatus.since) / 1000);
                const minutes = Math.floor(duration / 60);
                const hours = Math.floor(minutes / 60);
                
                let timeStr = '';
                if (hours > 0) {
                    timeStr = `${hours}h ${minutes % 60}m`;
                } else if (minutes > 0) {
                    timeStr = `${minutes}m`;
                } else {
                    timeStr = `${duration}s`;
                }
                
                const afkMsg = afkStatus.reason 
                    ? `I'm currently AFK: ${afkStatus.reason} (${timeStr} ago)`
                    : `I'm currently AFK (${timeStr} ago)`;
                
                try {
                    await message.channel.send(afkMsg);
                } catch (e) {
                    console.error('AFK auto-reply error:', e);
                }
            }
            
            // If the AFK user sends a message, remove AFK
            if (message.author.id === client.user.id && !message.content.startsWith('!afk')) {
                afkStatus.isAfk = false;
            }
        });
    },

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (afkStatus.isAfk) {
            afkStatus.isAfk = false;
            return base.sendSuccess(channel, 'Welcome back! Your AFK status has been removed.');
        }

        const reason = args.join(' ') || 'No reason provided';
        afkStatus = {
            isAfk: true,
            reason: reason,
            since: Date.now()
        };

        await base.sendSuccess(channel, `You are now AFK: ${reason}`);
    }
};
