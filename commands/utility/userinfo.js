const CommandBase = require('../CommandBase');

module.exports = {
    name: 'userinfo',
    description: 'Displays detailed information about a user.',
    aliases: ['whois', 'ui', 'user'],
    usage: 'userinfo [@user|id]',
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

            const member = message.guild ? await message.guild.members.fetch(targetUser.id).catch(() => null) : null;

            const userInfo = {
                title: `👤 User Information: ${targetUser.tag}`,
                thumbnail: { url: targetUser.displayAvatarURL({ dynamic: true, size: 512 }) },
                color: member ? member.displayColor : 0x5865F2,
                fields: [
                    {
                        name: '🆔 ID',
                        value: `\`${targetUser.id}\``,
                        inline: true
                    },
                    {
                        name: '🤖 Bot',
                        value: targetUser.bot ? 'Yes' : 'No',
                        inline: true
                    },
                    {
                        name: '📅 Account Created',
                        value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
                        inline: true
                    }
                ],
                footer: { text: `Requested by ${message.author.tag}` },
                timestamp: new Date()
            };

            if (member) {
                userInfo.fields.push(
                    {
                        name: '📥 Joined Server',
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: '🎭 Highest Role',
                        value: member.roles.highest.name,
                        inline: true
                    },
                    {
                        name: '🎨 Display Color',
                        value: member.displayHexColor.toUpperCase(),
                        inline: true
                    }
                );

                const roles = member.roles.cache
                    .filter(r => r.id !== message.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(r => r.toString());
                
                if (roles.length > 0) {
                    const rolesList = roles.length > 10 
                        ? roles.slice(0, 10).join(', ') + ` and ${roles.length - 10} more...`
                        : roles.join(', ');
                    userInfo.fields.push({
                        name: `🏷️ Roles [${roles.length}]`,
                        value: rolesList,
                        inline: false
                    });
                }
            }

            await base.sendEmbed(channel, userInfo);
        } catch (error) {
            console.error('UserInfo command error:', error);
            await base.sendError(channel, 'Failed to fetch user information.');
        }
    }
};
