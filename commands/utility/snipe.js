const CommandBase = require('../CommandBase');

// Store deleted messages per channel
const deletedMessages = new Map();

module.exports = {
    name: 'snipe',
    description: 'Shows the last deleted message in the channel',
    aliases: ['s'],
    usage: 'snipe',
    cooldown: 3000,

    init(client) {
        client.on('messageDelete', (message) => {
            if (!message.author || message.author.bot) return;
            
            deletedMessages.set(message.channel.id, {
                content: message.content,
                author: message.author,
                deletedAt: new Date(),
                attachments: message.attachments.map(a => a.url)
            });
            
            // Clear after 5 minutes
            setTimeout(() => {
                deletedMessages.delete(message.channel.id);
            }, 300000);
        });
    },

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        const deleted = deletedMessages.get(channel.id);
        
        if (!deleted) {
            return base.sendWarning(channel, 'No recently deleted messages found in this channel.');
        }

        const snipeEmbed = {
            title: '🎯 Sniped Message',
            description: deleted.content || '*No content*',
            color: 0xE74C3C,
            author: {
                name: deleted.author.tag,
                icon_url: deleted.author.displayAvatarURL()
            },
            footer: {
                text: `Deleted ${Math.floor((Date.now() - deleted.deletedAt.getTime()) / 1000)}s ago`
            }
        };

        if (deleted.attachments.length > 0) {
            snipeEmbed.fields = [{
                name: '📎 Attachments',
                value: deleted.attachments.join('\n')
            }];
        }

        await base.sendEmbed(channel, snipeEmbed);
    }
};
