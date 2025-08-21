module.exports = {
    name: "dmuserinfo",
    description: "Shows DM info with detailed statistics and analytics of each user.",

    async execute(channel, message, client, args) {
        try {
            const isDM = channel.constructor.name === "DMChannel";

            // ------------------ DM ANALYTICS ------------------
            if (isDM) {
                const scanLimit = parseInt(args[0]) || 5000;

                let userStats = {};
                let lastId = null;
                let processed = 0;

                while (processed < scanLimit) {
                    const batch = await channel.messages.fetch({
                        limit: 100,
                        before: lastId
                    });

                    if (batch.size === 0) break;

                    batch.forEach(msg => {
                        processed++;
                        lastId = msg.id;

                        const uid = msg.author.id;
                        if (!userStats[uid]) {
                            userStats[uid] = {
                                user: msg.author,
                                messages: 0,
                                words: 0,
                                chars: 0,
                                links: 0,
                                images: 0,
                                videos: 0,
                                embeds: 0,
                                reactions: 0,
                                edited: 0,
                                mentions: 0,
                                longestMsg: "",
                                emojis: {}
                            };
                        }

                        const stats = userStats[uid];
                        const content = msg.content || '';
                        stats.messages++;
                        stats.chars += content.length;
                        if (content.trim()) stats.words += content.split(/\s+/).length;

                        if (content.length > stats.longestMsg.length) stats.longestMsg = content;

                        stats.mentions += msg.mentions.users.size;

                        const links = content.match(/https?:\/\/[^\s]+/g) || [];
                        stats.links += links.length;

                        const emojiMatches = content.match(/<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}]/gu) || [];
                        emojiMatches.forEach(e => stats.emojis[e] = (stats.emojis[e] || 0) + 1);

                        msg.attachments.forEach(att => {
                            const ext = att.name?.split('.').pop()?.toLowerCase();
                            if (['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)) stats.images++;
                            if (['mp4','avi','mov','wmv','flv','webm','mkv','m4v'].includes(ext)) stats.videos++;
                        });

                        stats.embeds += msg.embeds.length;
                        msg.reactions.cache.forEach(r => stats.reactions += r.count);
                        if (msg.editedTimestamp) stats.edited++;
                    });

                    if (processed >= scanLimit) break;
                }

                // Send one message per user
                for (const [uid, stats] of Object.entries(userStats)) {
                    const user = stats.user;
                    const topEmoji = Object.entries(stats.emojis).sort((a,b)=>b[1]-a[1])[0];

                    const userReport = `**👤 ${user.tag}**
• Messages: ${stats.messages}
• Words: ${stats.words}
• Characters: ${stats.chars}
• Links: ${stats.links}
• Images: ${stats.images}
• Videos: ${stats.videos}
• Embeds: ${stats.embeds}
• Reactions: ${stats.reactions}
• Mentions: ${stats.mentions}
• Edited: ${stats.edited}
• Longest Message: ${stats.longestMsg.slice(0,50)}...
• Top Emoji: ${topEmoji ? `${topEmoji[0]} (${topEmoji[1]})` : 'None'}
`;

                    await channel.send(userReport);
                }

                // Now build combined totals
                let combined = {
                    messages: 0, words: 0, chars: 0,
                    links: 0, images: 0, videos: 0,
                    embeds: 0, reactions: 0, edited: 0,
                    mentions: 0
                };

                for (const stats of Object.values(userStats)) {
                    combined.messages += stats.messages;
                    combined.words += stats.words;
                    combined.chars += stats.chars;
                    combined.links += stats.links;
                    combined.images += stats.images;
                    combined.videos += stats.videos;
                    combined.embeds += stats.embeds;
                    combined.reactions += stats.reactions;
                    combined.edited += stats.edited;
                    combined.mentions += stats.mentions;
                }

                const combinedReport = `**📊 Combined Totals (Scanned ${processed.toLocaleString()} messages)**
• Messages: ${combined.messages}
• Words: ${combined.words}
• Characters: ${combined.chars}
• Links: ${combined.links}
• Images: ${combined.images}
• Videos: ${combined.videos}
• Embeds: ${combined.embeds}
• Reactions: ${combined.reactions}
• Mentions: ${combined.mentions}
• Edited: ${combined.edited}
`;

                return channel.send(combinedReport);
            }

            // ------------------ SERVER ANALYTICS ------------------
            const guild = client.guilds.cache.get(channel.guildId);
            if (!guild) return channel.send("Could not fetch server info.");

            const owner = await guild.fetchOwner().catch(() => null);
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;

            const textChannels = channels.filter(c => c.type === 0).size;
            const voiceChannels = channels.filter(c => c.type === 2).size;
            const categories = channels.filter(c => c.type === 4).size;
            const threads = channels.filter(c => c.isThread()).size;

            const rolesWithMembers = await Promise.all(
                roles.map(async role => {
                    if (role.name === '@everyone') return { name: role.name, members: guild.memberCount };
                    return { name: role.name, members: role.members?.size || 0 };
                })
            );

            const topRoles = rolesWithMembers
                .sort((a, b) => b.members - a.members)
                .slice(0, 5)
                .map(role => `${role.name} (${role.members})`)
                .join('\n• ');

            const serverInfo = `🔌 **Server Analytics Report**

**🏠 Basic Information:**
• **Name**: ${guild.name}
• **ID**: ${guild.id}
• **Owner**: ${owner ? owner.user.tag : 'Unknown'} (${guild.ownerId})
• **Created**: ${guild.createdAt.toDateString()}
• **Region**: ${guild.region || 'Unknown'}
• **Verification Level**: ${guild.verificationLevel}

**📊 Server Statistics:**
• **Total Members**: ${guild.memberCount.toLocaleString()}
• **Online Members**: ${guild.presences?.cache.size || 'Unknown'}
• **Total Channels**: ${channels.size}
  - 💬 Text Channels: ${textChannels}
  - 🔊 Voice Channels: ${voiceChannels}
  - 📁 Categories: ${categories}
  - 🧵 Threads: ${threads}
• **Total Roles**: ${roles.size}
• **Custom Emojis**: ${guild.emojis.cache.size}
• **Stickers**: ${guild.stickers?.cache.size || 0}

**💎 Premium Features:**
• **Boost Level**: ${guild.premiumTier || 0}
• **Total Boosts**: ${guild.premiumSubscriptionCount || 0}
• **Boosters**: ${guild.members.cache.filter(m => m.premiumSince).size}

**🎭 Top Roles by Members:**
• ${topRoles || 'No roles found'}

**⚡ Server Features:**
${guild.features.length > 0 ? guild.features.map(f => `• ${f.replace(/_/g, ' ').toLowerCase()}`).join('\n') : '• No special features'}

**🛡️ Security & Moderation:**
• **MFA Required**: ${guild.mfaLevel > 0 ? 'Yes' : 'No'}
• **Explicit Content Filter**: ${guild.explicitContentFilter}
• **Default Notifications**: ${guild.defaultMessageNotifications === 0 ? 'All Messages' : 'Only Mentions'}`;

            channel.send(serverInfo);

        } catch (err) {
            console.error("Error in serverinfo command:", err);
            channel.send("An error occurred while fetching information.");
        }
    }
};

