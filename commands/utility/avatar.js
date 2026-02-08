const CommandBase = require("../CommandBase");

module.exports = {
    name: 'avatar',
    description: 'Displays the avatar of a user',
    aliases: ['av', 'pfp'],
    usage: 'avatar [@user|id]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        let targetUser;

        try {
            if (args.length > 0) {
                const id = args[0].replace(/[<@!>]/g, '');
                targetUser = await client.users.fetch(id).catch(() => null);
            }

            if (!targetUser) {
                if (message.mentions && message.mentions.users && message.mentions.users.size > 0) {
                    targetUser = message.mentions.users.first();
                } else {
                    targetUser = message.author;
                }
            }

            const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

            const avatarEmbed = {
                title: `🖼️ Avatar of ${targetUser.tag}`,
                url: avatarUrl,
                color: 0x5865F2,
                image: { url: avatarUrl },
                footer: { text: `ID: ${targetUser.id}` }
            };

            await base.sendEmbed(channel, avatarEmbed);
        } catch (error) {
            console.error('Avatar command error:', error);
            await base.sendError(channel, 'Failed to fetch user avatar.');
        }
    }
};
