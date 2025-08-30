module.exports = {
    name: "analyze",
    description: "Comprehensive analysis tool for DMs and servers with detailed statistics (use -h for help).", 

    async execute(channel, message, client, args) {
        try {
            const isDM = channel.constructor.name === "DMChannel";
            
            // Safe message sending function
            const safeSend = async (content) => {
                try {
                    return await channel.send(content);
                } catch (err) {
                    console.log(content);
                    return null;
                }
            };

            // Show help if requested
            if (args && (args.includes('-help') || args.includes('-h'))) {
                return await showHelp(safeSend);
            }

            // Parse custom arguments
            let targetUserId = null;
            let messageLimit = 5000; // Default limit
            
            if (args && args.length > 0) {
                for (let i = 0; i < args.length; i++) {
                    if ((args[i] === '-user' || args[i] === '-u') && i + 1 < args.length) {
                        targetUserId = args[i + 1];
                        i++; // Skip next argument
                    } else if ((args[i] === '-msgs' || args[i] === '-m') && i + 1 < args.length) {
                        messageLimit = parseInt(args[i + 1]);
                        i++; // Skip next argument
                    }
                }
            }

            // If user ID specified, analyze specific DM
            if (targetUserId) {
                return await analyzeSpecificDM(channel, message, client, targetUserId, messageLimit, safeSend);
            }
            
            // If no arguments and in DM, show DM analytics
            if (isDM && (!args || args.length === 0)) {
                return await analyzeCurrentDM(channel, message, client, messageLimit, safeSend);
            }
            
            // Otherwise, show server analytics
            return await analyzeServer(channel, message, client, args, safeSend);
            
        } catch (error) {
            console.error("Analysis error:", error);
            await channel.send(`Error: ${error.message || "Failed to analyze"}`);
        }
    }
};

// Show help information
async function showHelp(safeSend) {
    const helpText = `**Analyze Command Help**

**Usage:**
!analyze [-user USERID] [-msgs COUNT]

**Options:**
- -user, -u: Specify a user ID to analyze DM history with that user
- -msgs, -m: Set a custom message limit (default: 5000)
- -help, -h: Show this help message

**Examples:**
- !analyze -u 1234567890 -m 1000  // Analyze 1000 messages with user 1234567890
- !analyze -msgs 2000             // Analyze current DM with 2000 message limit
- !analyze                        // Analyze current DM or server (auto-detects context)

**Note:** Selfbots can only analyze existing DM channels. Make sure you have an existing conversation with the user.`;

    return await safeSend(helpText);
}

// Function to analyze current DM channel
async function analyzeCurrentDM(channel, message, client, limit, safeSend) {
    let userStats = {};
    let lastId = null;
    let processed = 0;
    let totalScanned = 0; // Track total messages scanned from API

    // Send progress message
    const progressMsg = await safeSend(`Starting DM analysis (limit: ${limit} messages)...`);

    while (processed < limit) {
        const batchSize = Math.min(100, limit - processed);
        const batch = await channel.messages.fetch({
            limit: batchSize,
            before: lastId
        });

        if (batch.size === 0) break;

        totalScanned += batch.size; // Count all messages from API

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

        // Update progress
        if (progressMsg && progressMsg.editable && processed % 100 === 0) {
            await progressMsg.edit(`Analyzing DM: ${processed} messages processed (${Math.round((processed / limit) * 100)}%)`);
        }

        if (processed >= limit) break;
    }

    // Delete progress message
    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});

    // Send user reports
    for (const [uid, stats] of Object.entries(userStats)) {
        const user = stats.user;
        const topEmoji = Object.entries(stats.emojis).sort((a,b)=>b[1]-a[1])[0];

        const userReport = `**👤 User: ${user.tag} (${user.id})**
📝 Messages: ${stats.messages}
📊 Words: ${stats.words}
🔤 Characters: ${stats.chars}
🔗 Links: ${stats.links}
🖼️ Images: ${stats.images}
🎥 Videos: ${stats.videos}
📎 Attachments: ${stats.attachments}
🎨 Embeds: ${stats.embeds}
❤️ Reactions: ${stats.reactions}
👥 Mentions: ${stats.mentions}
✏️ Edited: ${stats.edited}
📏 Longest Message: ${stats.longestMsg.slice(0,50)}...
😊 Top Emoji: ${topEmoji ? `${topEmoji[0]} (${topEmoji[1]})` : 'None'}
`;

        await safeSend(userReport);
    }

    // Build combined totals
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

    const combinedReport = `**📊 Combined Totals (Scanned ${totalScanned.toLocaleString()} messages)**
📝 Messages: ${combined.messages}
📊 Words: ${combined.words}
🔤 Characters: ${combined.chars}
🔗 Links: ${combined.links}
🖼️ Images: ${combined.images}
🎥 Videos: ${combined.videos}
📎 Attachments: ${combined.attachments}
🎨 Embeds: ${combined.embeds}
❤️ Reactions: ${combined.reactions}
👥 Mentions: ${combined.mentions}
✏️ Edited: ${combined.edited}
`;

    return await safeSend(combinedReport);
}

// Function to analyze specific DM between users
async function analyzeSpecificDM(channel, message, client, targetUserId, limit, safeSend) {
    // Use message author ID as the bot user ID (for selfbots)
    const botUserId = message.author.id;
    
    const userId1 = targetUserId;
    const userId2 = botUserId;

    // Send initial progress message
    const progressMsg = await safeSend(`Starting analysis between user ${userId1} and user ${userId2} (limit: ${limit} messages)...`);

    // Function to update progress
    const updateProgress = async (current, total, eta = 0) => {
        if (!progressMsg || !progressMsg.editable) return;
        
        try {
            await progressMsg.edit(
                `Analyzing DM: ${current} messages processed` +
                (eta > 0 ? ` | ETA: ${eta}s` : "") +
                (total > 0 ? ` (${Math.round((current / total) * 100)}%)` : "")
            );
        } catch (err) {
            console.error("Progress update error:", err);
        }
    };

    // Function to find DM channel (only from cache)
    const findDMChannel = (targetUserId) => {
        // Method 1: Check if user has dmChannel property
        try {
            const user = client.users.cache.get(targetUserId);
            if (user && user.dmChannel) {
                return user.dmChannel;
            }
        } catch (err) { /* Ignore */ }
        
        // Method 2: Search through all channels
        if (client.channels && client.channels.cache) {
            for (const [id, channel] of client.channels.cache) {
                if (channel.type === 'DM' && channel.recipient && channel.recipient.id === targetUserId) {
                    return channel;
                }
            }
        }
        
        return null;
    };

    // Function to analyze a DM channel for both users
    const analyzeDMChannelForBothUsers = async () => {
        let user1Messages = [];
        let user2Messages = [];
        let lastId = null;
        let scanned = 0; // Track messages scanned from API
        const startTime = Date.now();
        
        try {
            // Try to find DM channel (only from cache)
            // We'll use the channel with the target user
            const dmChannel = findDMChannel(userId1);
            
            if (!dmChannel) {
                throw new Error(`No DM channel found in cache for user ${userId1}. ` +
                              `Selfbots can only analyze existing DM channels.`);
            }

            // Fetch messages in batches
            while (scanned < limit) {
                const fetchOptions = { limit: Math.min(100, limit - scanned) };
                if (lastId) fetchOptions.before = lastId;
                
                const messages = await dmChannel.messages.fetch(fetchOptions).catch(err => {
                    console.error("Fetch error:", err);
                    return new Map();
                });
                
                if (messages.size === 0) break;
                
                scanned += messages.size; // Count all messages from API
                
                // Separate messages by user
                messages.forEach(msg => {
                    if (msg.author && msg.author.id === userId1) {
                        user1Messages.push(msg);
                    } else if (msg.author && msg.author.id === userId2) {
                        user2Messages.push(msg);
                    }
                });
                
                lastId = messages.last().id;
                
                // Update progress every 20 messages
                if (scanned % 20 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = scanned / elapsed;
                    const remaining = limit - scanned;
                    const eta = rate > 0 ? Math.round(remaining / rate) : 0;
                    
                    await updateProgress(scanned, limit, eta);
                }
            }
            
            // Final progress update
            await updateProgress(scanned, limit);
            
            return {
                user1Messages,
                user2Messages,
                scanned, // Total messages scanned from API
                time: (Date.now() - startTime) / 1000
            };
            
        } catch (error) {
            console.error("DM history fetch error:", error);
            throw error;
        }
    };

    // Function to analyze message statistics
    const analyzeMessages = (messages) => {
        const stats = {
            messages: messages.length,
            words: 0,
            characters: 0,
            links: 0,
            images: 0,
            videos: 0,
            embeds: 0,
            reactions: 0,
            mentions: 0,
            edited: 0,
            attachments: 0,
            longestMsg: ""
        };

        for (const msg of messages) {
            // Text content analysis
            if (msg.content) {
                stats.words += msg.content.split(/\s+/).filter(w => w.length > 0).length;
                stats.characters += msg.content.length;
                stats.links += (msg.content.match(/https?:\/\/[^\s]+/g) || []).length;
                
                // Track longest message
                if (msg.content.length > stats.longestMsg.length) {
                    stats.longestMsg = msg.content.length > 100 ? 
                        msg.content.substring(0, 100) + "..." : msg.content;
                }
            }
            
            // Attachment analysis
            if (msg.attachments && msg.attachments.size > 0) {
                stats.attachments += msg.attachments.size;
                msg.attachments.forEach(attachment => {
                    if (attachment.contentType?.startsWith('image/')) {
                        stats.images++;
                    } else if (attachment.contentType?.startsWith('video/') || 
                              attachment.filename?.match(/\.(mp4|webm|mov|avi)$/i)) {
                        stats.videos++;
                    }
                });
            }
            
            // Other message features
            if (msg.embeds && msg.embeds.length > 0) stats.embeds += msg.embeds.length;
            if (msg.reactions && msg.reactions.cache.size > 0) stats.reactions += msg.reactions.cache.size;
            if (msg.mentions && msg.mentions.users.size > 0) stats.mentions += msg.mentions.users.size;
            if (msg.editedTimestamp) stats.edited++;
        }

        return stats;
    };

    // Fetch messages for both users from a single channel
    const result = await analyzeDMChannelForBothUsers();

    // Handle results
    let user1Stats = null, user2Stats = null;
    let user1Time = result.time, user2Time = result.time;
    let totalScanned = result.scanned;
    let errors = [];

    if (result.user1Messages.length > 0) {
        user1Stats = analyzeMessages(result.user1Messages);
    } else {
        errors.push(`User 1 (${userId1}): No messages found`);
    }

    if (result.user2Messages.length > 0) {
        user2Stats = analyzeMessages(result.user2Messages);
    } else {
        errors.push(`User 2 (${userId2}): No messages found`);
    }

    // If both failed, show error
    if (!user1Stats && !user2Stats) {
        throw new Error(`Failed to analyze both users:\n${errors.join('\n')}`);
    }

    // Calculate combined statistics
    const combinedStats = {
        messages: (user1Stats?.messages || 0) + (user2Stats?.messages || 0),
        words: (user1Stats?.words || 0) + (user2Stats?.words || 0),
        characters: (user1Stats?.characters || 0) + (user2Stats?.characters || 0),
        links: (user1Stats?.links || 0) + (user2Stats?.links || 0),
        images: (user1Stats?.images || 0) + (user2Stats?.images || 0),
        videos: (user1Stats?.videos || 0) + (user2Stats?.videos || 0),
        embeds: (user1Stats?.embeds || 0) + (user2Stats?.embeds || 0),
        reactions: (user1Stats?.reactions || 0) + (user2Stats?.reactions || 0),
        mentions: (user1Stats?.mentions || 0) + (user2Stats?.mentions || 0),
        edited: (user1Stats?.edited || 0) + (user2Stats?.edited || 0),
        attachments: (user1Stats?.attachments || 0) + (user2Stats?.attachments || 0)
    };

    // Format statistics for display
    const formatStats = (stats, user, time) => {
        if (!stats) return `**User ${user}** - No messages found`;
        
        return `**👤 User ${user}** (Analyzed in ${time.toFixed(1)}s)
📝 Messages: ${stats.messages.toLocaleString()}
📊 Words: ${stats.words.toLocaleString()}
🔤 Characters: ${stats.characters.toLocaleString()}
🔗 Links: ${stats.links.toLocaleString()}
🖼️ Images: ${stats.images.toLocaleString()}
🎥 Videos: ${stats.videos.toLocaleString()}
📎 Attachments: ${stats.attachments.toLocaleString()}
🎨 Embeds: ${stats.embeds.toLocaleString()}
❤️ Reactions: ${stats.reactions.toLocaleString()}
👥 Mentions: ${stats.mentions.toLocaleString()}
✏️ Edited: ${stats.edited.toLocaleString()}
📏 Longest Message: ${stats.longestMsg || 'None'}`;
    };

    // Send individual user reports
    if (user1Stats) {
        await safeSend(formatStats(user1Stats, userId1, user1Time));
    } else {
        await safeSend(`**User ${userId1}** - No messages found`);
    }

    if (user2Stats) {
        await safeSend(formatStats(user2Stats, userId2, user2Time));
    } else {
        await safeSend(`**User ${userId2}** - No messages found`);
    }

    // Send combined statistics
    if (user1Stats || user2Stats) {
        const combinedReport = `**📊 Combined Statistics**
📝 Total Messages: ${combinedStats.messages.toLocaleString()}
📊 Total Words: ${combinedStats.words.toLocaleString()}
🔤 Total Characters: ${combinedStats.characters.toLocaleString()}
🔗 Total Links: ${combinedStats.links.toLocaleString()}
🖼️ Total Images: ${combinedStats.images.toLocaleString()}
🎥 Total Videos: ${combinedStats.videos.toLocaleString()}
📎 Total Attachments: ${combinedStats.attachments.toLocaleString()}
🎨 Total Embeds: ${combinedStats.embeds.toLocaleString()}
❤️ Total Reactions: ${combinedStats.reactions.toLocaleString()}
👥 Total Mentions: ${combinedStats.mentions.toLocaleString()}
✏️ Total Edited: ${combinedStats.edited.toLocaleString()}

Scanned ${totalScanned.toLocaleString()} messages, found ${combinedStats.messages.toLocaleString()} relevant messages`;
        
        await safeSend(combinedReport);
    }

    if (errors.length > 0) {
        await safeSend(`**Note:** Selfbots can only analyze existing DM channels. If you want to analyze a user, make sure you have an existing DM conversation with them.`);
    }
    
    // Clean up progress message
    try {
        if (progressMsg && progressMsg.deletable) await progressMsg.delete();
    } catch (err) {
        console.error("Error cleaning up progress message:", err);
    }
}

// Function to analyze server
async function analyzeServer(channel, message, client, args, safeSend) {
    const guild = client.guilds.cache.get(channel.guildId);
    if (!guild) return safeSend("Could not fetch server info.");

    const owner = await guild.fetchOwner().catch(() => null);
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;

    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const categories = channels.filter(c => c.type === 4).size;
    const threads = channels.filter(c => c.isThread()).size;

    // Get premium tier in a more readable format
    const boostLevels = {
        0: "NONE",
        1: "TIER_1",
        2: "TIER_2",
        3: "TIER_3"
    };
    
    const boostLevel = boostLevels[guild.premiumTier] || "NONE";
    
    // Get verification level in a more readable format
    const verificationLevels = {
        0: "NONE",
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH",
        4: "VERY_HIGH"
    };
    
    const verificationLevel = verificationLevels[guild.verificationLevel] || "UNKNOWN";
    
    // Get explicit content filter in a more readable format
    const contentFilterLevels = {
        0: "DISABLED",
        1: "MEMBERS_WITHOUT_ROLES",
        2: "ALL_MEMBERS"
    };
    
    const contentFilter = contentFilterLevels[guild.explicitContentFilter] || "UNKNOWN";

    const rolesWithMembers = await Promise.all(
        roles.map(async role => {
            if (role.name === '@everyone') return { name: role.name, members: guild.memberCount };
            return { name: role.name, members: role.members?.size || 0 };
        })
    );

    const topRoles = rolesWithMembers
        .sort((a, b) => b.members - a.members)
        .slice(0, 5)
        .map(role => `• ${role.name} (${role.members})`)
        .join('\n');

    const serverInfo = `🔌 **Server Analytics Report**

**🏠 Basic Information:**
• **Name**: ${guild.name}
• **ID**: ${guild.id}
• **Owner**: ${owner ? `${owner.user.username} (${owner.id})` : 'Unknown'} (${guild.ownerId})
• **Created**: ${guild.createdAt.toDateString()}
• **Region**: ${guild.region || 'Unknown'}
• **Verification Level**: ${verificationLevel}

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
• **Boost Level**: ${boostLevel}
• **Total Boosts**: ${guild.premiumSubscriptionCount || 0}
• **Boosters**: ${guild.members.cache.filter(m => m.premiumSince).size}

**🎭 Top Roles by Members:**
${topRoles || '• No roles found'}

**⚡ Server Features:**
${guild.features.length > 0 ? guild.features.map(f => `• ${f.replace(/_/g, ' ').toLowerCase()}`).join('\n') : '• No special features'}

**🛡️ Security & Moderation:**
• **MFA Required**: ${guild.mfaLevel > 0 ? 'Yes' : 'No'}
• **Explicit Content Filter**: ${contentFilter}
• **Default Notifications**: ${guild.defaultMessageNotifications === 0 ? 'All Messages' : 'Only Mentions'}`;

    await safeSend(serverInfo);
}
