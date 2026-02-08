const CommandBase = require('../CommandBase');

module.exports = {
    name: 'embed',
    description: 'Create a custom embed message',
    aliases: ['emb'],
    usage: 'embed <title> | <description> | [color_hex]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide embed content.\nFormat: `!embed Title | Description | #color`\nExample: `!embed Hello | This is a test | #5865F2`');
        }

        const content = args.join(' ');
        const parts = content.split('|').map(p => p.trim());
        
        if (parts.length < 2) {
            return base.sendError(channel, 'Please provide at least a title and description separated by `|`');
        }

        const title = parts[0];
        const description = parts[1];
        let color = 0x5865F2; // Default Discord blurple

        if (parts.length >= 3) {
            const colorHex = parts[2].replace('#', '');
            if (/^[0-9A-F]{6}$/i.test(colorHex)) {
                color = parseInt(colorHex, 16);
            }
        }

        const customEmbed = {
            title: title,
            description: description,
            color: color,
            footer: { text: `Created by ${message.author.tag}` },
            timestamp: new Date()
        };

        try {
            await base.sendEmbed(channel, customEmbed);
            // Delete the command message if possible
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        } catch (error) {
            console.error('Embed command error:', error);
            await base.sendError(channel, 'Failed to create embed.');
        }
    }
};
