const CommandBase = require('../CommandBase');

module.exports = {
    name: "serverinfo",
    description: "Shows server info or DM info with detailed statistics and analytics.",
    aliases: ['si', 'server', 'guildinfo'],
    usage: 'serverinfo',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            // Check if the channel is a DM
            const isDM = channel.type === 'DM' || channel.type === 'GROUP_DM' || channel.constructor.name === "DMChannel";

            if (isDM) {
                return this.handleDMAnalytics(channel, message, client, base);
            }

            // If not DM, treat as server channel
            const guild = message.guild;
            if (!guild) return base.sendError(channel, "Could not fetch server info. Are you sure you're in a server?");

            // Enhanced server info
            const owner = await guild.fetchOwner().catch(() => null);
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;
            
            // Server statistics
            const textChannels = channels.filter(c => c.type === 'GUILD_TEXT').size;
            const voiceChannels = channels.filter(c => c.type === 'GUILD_VOICE').size;
            const categories = channels.filter(c => c.type === 'GUILD_CATEGORY').size;
            
            // Role analysis
            const rolesList = roles
                .filter(r => r.id !== guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.name);
            
            const topRoles = rolesList.slice(0, 10).join(', ') + (rolesList.length > 10 ? ` and ${rolesList.length - 10} more...` : '');

            const serverEmbed = {
                title: `🏰 Server Information: ${guild.name}`,
                thumbnail: { url: guild.iconURL({ dynamic: true, size: 512 }) },
                color: 0x5865F2,
                fields: [
                    {
                        name: '👑 Owner',
                        value: owner ? `${owner.user.tag} (\`${owner.id}\`)` : `ID: \`${guild.ownerId}\``,
                        inline: false
                    },
                    {
                        name: '🆔 Server ID',
                        value: `\`${guild.id}\``,
                        inline: true
                    },
                    {
                        name: '📅 Created',
                        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: '👥 Members',
                        value: `${guild.memberCount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '💬 Channels',
                        value: `Total: ${channels.size}\nText: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`,
                        inline: true
                    },
                    {
                        name: '💎 Boosts',
                        value: `Level ${guild.premiumTier}\n${guild.premiumSubscriptionCount} Boosts`,
                        inline: true
                    },
                    {
                        name: '🛡️ Security',
                        value: `MFA: ${guild.mfaLevel === 'ELEVATED' ? 'Yes' : 'No'}\nFilter: ${guild.explicitContentFilter}`,
                        inline: true
                    },
                    {
                        name: `🏷️ Roles [${roles.size - 1}]`,
                        value: topRoles || 'None',
                        inline: false
                    }
                ],
                footer: { text: `Requested by ${message.author.tag}` },
                timestamp: new Date()
            };

            if (guild.banner) {
                serverEmbed.image = { url: guild.bannerURL({ size: 1024 }) };
            }

            await base.sendEmbed(channel, serverEmbed);

        } catch (err) {
            console.error("Error in serverinfo command:", err);
            await base.sendError(channel, "An error occurred while fetching server information.");
        }
    },

    async handleDMAnalytics(channel, message, client, base) {
        const user = channel.recipient || message.author;
        
        try {
            const statusMsg = await base.safeSend(channel, "🔄 Analyzing DM data (last 500 messages)... This may take a moment.");
            
            let totalMessages = 0;
            let userMessages = 0;
            let botMessages = 0;
            let attachmentCount = 0;
            let lastId = null;
            let firstDate = null;
            let lastDate = null;
            
            // Fetch messages in batches (limited to 5 batches for performance)
            for (let i = 0; i < 5; i++) {
                const batch = await channel.messages.fetch({ limit: 100, before: lastId });
                if (batch.size === 0) break;
                
                totalMessages += batch.size;
                batch.forEach(msg => {
                    if (msg.author.bot) botMessages++;
                    else userMessages++;
                    
                    attachmentCount += msg.attachments.size;
                    
                    if (!lastDate || msg.createdAt > lastDate) lastDate = msg.createdAt;
                    if (!firstDate || msg.createdAt < firstDate) firstDate = msg.createdAt;
                });
                
                lastId = batch.last().id;
            }
            
            if (statusMsg) await statusMsg.delete().catch(() => {});

            const dmEmbed = {
                title: `🔌 DM Analytics: ${user.tag}`,
                thumbnail: { url: user.displayAvatarURL({ dynamic: true }) },
                color: 0x5865F2,
                fields: [
                    {
                        name: '👤 User',
                        value: `${user.tag} (\`${user.id}\`)`,
                        inline: false
                    },
                    {
                        name: '📊 Messages (Sample)',
                        value: `Total: ${totalMessages}\nYou: ${userMessages}\nBot: ${botMessages}`,
                        inline: true
                    },
                    {
                        name: '📎 Attachments',
                        value: `${attachmentCount} files shared`,
                        inline: true
                    },
                    {
                        name: '📅 Timeline',
                        value: `From: ${firstDate ? firstDate.toDateString() : 'N/A'}\nTo: ${lastDate ? lastDate.toDateString() : 'N/A'}`,
                        inline: false
                    }
                ],
                footer: { text: 'Analytics based on last 500 messages' },
                timestamp: new Date()
            };

            await base.sendEmbed(channel, dmEmbed);
        } catch (error) {
            console.error('DM Analytics error:', error);
            await base.sendError(channel, 'Failed to perform DM analytics.');
        }
    }
};
