module.exports = {
    name: 'backup-channels',
    description: 'Export the guild channels (name, type, topic, position, parent) and roles & permissions to a JSON file.',
    /**
     * Executes the backup-channels command.
     *
     * Usage: !backup-channels
     *
     * @param {Channel} channel The channel where the command was executed.
     * @param {Message} message The message object for the command.
     * @param {Client} client The client or bot instance.
     * @param {String[]} args The arguments passed with the command.
     */
    async execute(channel, message, client, args) {
        const fs = require('fs');
        try {
            if (!message.guild) {
                return message.channel.send('This command must be used inside a guild.').catch(console.error);
            }

            const guild = message.guild;

            // Backup roles
            const roles = guild.roles.cache
                .sort((a, b) => a.position - b.position)
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    color: r.hexColor,
                    hoist: r.hoist,
                    position: r.position,
                    permissions: r.permissions ? (r.permissions.bitfield ? r.permissions.bitfield.toString() : String(r.permissions)) : "0",
                    mentionable: r.mentionable
                }));

            // Backup channels with safe handling for permissionOverwrites
            const channels = guild.channels.cache
                .sort((a, b) => a.position - b.position)
                .map(ch => {
                    const overwritesCollection = ch.permissionOverwrites ? (ch.permissionOverwrites.cache || ch.permissionOverwrites) : null;
                    const permissionOverwrites = overwritesCollection
                        ? Array.from(overwritesCollection.values()).map(po => ({
                            id: po.id,
                            type: po.type,
                            allow: po.allow ? (po.allow.bitfield ? po.allow.bitfield.toString() : String(po.allow)) : "0",
                            deny: po.deny ? (po.deny.bitfield ? po.deny.bitfield.toString() : String(po.deny)) : "0"
                        }))
                        : [];

                    return {
                        id: ch.id,
                        name: ch.name,
                        type: ch.type,
                        topic: ch.topic || null,
                        nsfw: ch.nsfw || false,
                        position: ch.position,
                        parentId: ch.parentId || null,
                        rateLimitPerUser: ch.rateLimitPerUser || 0,
                        bitrate: ch.bitrate || null,
                        userLimit: ch.userLimit || null,
                        permissionOverwrites
                    };
                });

            const backup = {
                guildId: guild.id,
                guildName: guild.name,
                timestamp: new Date().toISOString(),
                roles,
                channels
            };

            try { fs.mkdirSync('./backups', { recursive: true }); } catch (e) {}
            const path = `./backups/channels-roles-backup-${guild.id}-${Date.now()}.json`;
            fs.writeFileSync(path, JSON.stringify(backup, null, 2), 'utf8');

            await message.channel.send(`Backup saved: ${path}`).catch(console.error);
        } catch (error) {
            console.error('Error creating backup:', error);
            return message.channel.send('Failed to create backup.').catch(console.error);
        }
    }
};
