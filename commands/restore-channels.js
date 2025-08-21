module.exports = {
    name: 'restore-channels',
    description: 'Restore roles, channels and channel permission overwrites from a JSON backup created by backup-channels.',
    /**
     * Executes the restore-channels command.
     *
     * Usage: !restore-channels <filename.json>
     *
     * Note: Requires Manage Roles and Manage Channels permissions.
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

            if (!message.member || !(message.member.hasPermission && (message.member.hasPermission('MANAGE_CHANNELS') || message.member.hasPermission('MANAGE_ROLES')))) {
                return message.channel.send('You need Manage Channels and Manage Roles permissions to run this.').catch(console.error);
            }

            const filename = args[0];
            if (!filename) {
                return message.channel.send('Usage: restore-channels <backup-file.json>').catch(console.error);
            }

            const filepath = `./backups/${filename}`;
            if (!fs.existsSync(filepath)) {
                return message.channel.send('Backup file not found in ./backups.').catch(console.error);
            }

            const raw = fs.readFileSync(filepath, 'utf8');
            const backup = JSON.parse(raw);
            if (!backup.channels || !Array.isArray(backup.channels)) {
                return message.channel.send('Invalid backup file format.').catch(console.error);
            }

            const guild = message.guild;
            const createdRoles = new Map(); // oldRoleId -> newRole
            const createdCategories = new Map(); // oldCategoryId -> newCategory
            const createdChannels = new Map(); // oldChannelId -> newChannel

            // 1) Create roles in order (skip @everyone role)
            const rolesToCreate = (backup.roles || []).filter(r => r.name !== '@everyone').sort((a,b)=> a.position - b.position);
            for (const r of rolesToCreate) {
                try {
                    const perms = typeof r.permissions === 'string' ? BigInt(r.permissions) : BigInt(0);
                    const created = await guild.roles.create({
                        data: {
                            name: r.name,
                            color: r.color || '#000000',
                            hoist: !!r.hoist,
                            permissions: perms,
                            mentionable: !!r.mentionable,
                            position: r.position
                        },
                        reason: `Restored role from backup by ${message.author.tag}`
                    });
                    createdRoles.set(r.id, created);
                } catch (err) {
                    console.error('Failed to create role', r.name, err);
                }
            }

            // 2) Create categories first
            const categories = (backup.channels || []).filter(c => c.type === 4).sort((a,b)=>a.position - b.position);
            for (const cat of categories) {
                try {
                    const created = await guild.channels.create(cat.name, { type: 'GUILD_CATEGORY', position: cat.position, reason: `Restore by ${message.author.tag}` });
                    createdCategories.set(cat.id, created);
                    createdChannels.set(cat.id, created);
                } catch (err) {
                    console.error('Failed to create category', cat.name, err);
                }
            }

            // 3) Create text/voice channels
            const nonCats = (backup.channels || []).filter(c => c.type !== 4).sort((a,b)=>a.position - b.position);
            for (const ch of nonCats) {
                try {
                    const opt = {
                        type: (ch.type === 2) ? 'GUILD_VOICE' : 'GUILD_TEXT',
                        topic: ch.topic || undefined,
                        nsfw: !!ch.nsfw,
                        position: ch.position,
                        rateLimitPerUser: ch.rateLimitPerUser || 0,
                        bitrate: ch.bitrate || undefined,
                        userLimit: ch.userLimit || undefined,
                        reason: `Restore by ${message.author.tag}`
                    };
                    if (ch.parentId && createdCategories.has(ch.parentId)) {
                        opt.parent = createdCategories.get(ch.parentId).id;
                    }
                    const created = await guild.channels.create(ch.name, opt);
                    createdChannels.set(ch.id, created);
                } catch (err) {
                    console.error('Failed to create channel', ch.name, err);
                }
            }

            // 4) Apply permission overwrites
            for (const ch of (backup.channels || [])) {
                const newCh = createdChannels.get(ch.id);
                if (!newCh) continue;
                if (!Array.isArray(ch.permissionOverwrites)) continue;

                const overwrites = [];
                for (const po of ch.permissionOverwrites) {
                    try {
                        // Map role IDs to created roles, members stay as IDs (can't recreate members)
                        let targetId = po.id;
                        if (createdRoles.has(po.id)) targetId = createdRoles.get(po.id).id;
                        // If overwrite targets the @everyone role id from backup, map to guild.id
                        if (po.id === backup.guildId) targetId = guild.id;

                        const allow = po.allow ? BigInt(po.allow) : BigInt(0);
                        const deny = po.deny ? BigInt(po.deny) : BigInt(0);

                        overwrites.push({
                            id: targetId,
                            allow: allow.toString(),
                            deny: deny.toString(),
                            type: po.type
                        });
                    } catch (err) {
                        console.error('Failed to map overwrite', po, err);
                    }
                }

                try {
                    // Clear existing overwrites then set new ones
                    await newCh.overwritePermissions([]).catch(()=>{});
                    for (const ow of overwrites) {
                        await newCh.createOverwrite(ow.id, {
                            allow: BigInt(ow.allow),
                            deny: BigInt(ow.deny)
                        }, `Restore overwrites by ${message.author.tag}`).catch(err=>console.error('apply ow',err));
                    }
                } catch (err) {
                    console.error('Failed to apply permission overwrites for', newCh.name, err);
                }
            }

            return message.channel.send('Restore complete. Some roles/channels or overwrites may have failed. Check console for details.').catch(console.error);
        } catch (error) {
            console.error('Error restoring backup:', error);
            return message.channel.send('Failed to restore backup.').catch(console.error);
        }
    }
};
