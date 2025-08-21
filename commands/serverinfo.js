module.exports = {
    name: "serverinfo",
    description: "Shows server info or DM info with detailed statistics and analytics.",

    async execute(channel, message, client, args) {
        try {
            // Check if the channel is a DM
            const isDM = channel.constructor.name === "DMChannel";

            if (isDM) {
                const user = message.author || client.user;
                
                // Initialize statistics
                let totalMessages = 0;
                let userMessages = 0;
                let botMessages = 0;
                let linkCount = 0;
                let imageCount = 0;
                let videoCount = 0;
                let attachmentCount = 0;
                let embedCount = 0;
                let reactionCount = 0;
                let editedCount = 0;
                let lastMessageDate = null;
                let firstMessageDate = null;
                let wordCount = 0;
                let characterCount = 0;
                
                // Content type tracking
                const fileTypes = {};
                const domains = {};
                const messageLengths = [];
                
                try {
                    channel.send("🔄 Analyzing DM data... This may take a moment.");
                    
                    // Fetch messages in batches
                    let lastId = null;
                    let batchCount = 0;
                    const maxBatches = 50; // Increased for more comprehensive analysis
                    
                    while (batchCount < maxBatches) {
                        const batch = await channel.messages.fetch({ 
                            limit: 100, 
                            before: lastId 
                        });
                        
                        if (batch.size === 0) break;
                        
                        // Process each message in the batch
                        batch.forEach(msg => {
                            totalMessages++;
                            
                            // Track user vs bot messages
                            if (msg.author.bot) {
                                botMessages++;
                            } else {
                                userMessages++;
                            }
                            
                            // Content analysis
                            const content = msg.content || '';
                            characterCount += content.length;
                            
                            if (content.trim()) {
                                wordCount += content.trim().split(/\s+/).length;
                                messageLengths.push(content.length);
                            }
                            
                            // Link detection
                            const linkRegex = /https?:\/\/[^\s]+/g;
                            const links = content.match(linkRegex) || [];
                            linkCount += links.length;
                            
                            // Track domains
                            links.forEach(link => {
                                try {
                                    const url = new URL(link);
                                    const domain = url.hostname.toLowerCase();
                                    domains[domain] = (domains[domain] || 0) + 1;
                                } catch (e) {
                                    // Invalid URL, skip
                                }
                            });
                            
                            // Image detection in content
                            const imageRegex = /\.(jpg|jpeg|png|gif|webp|bmp|svg)\b/gi;
                            const imageLinks = content.match(imageRegex) || [];
                            imageCount += imageLinks.length;
                            
                            // Video detection in content
                            const videoRegex = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)\b/gi;
                            const videoLinks = content.match(videoRegex) || [];
                            videoCount += videoLinks.length;
                            
                            // Attachments
                            if (msg.attachments.size > 0) {
                                attachmentCount += msg.attachments.size;
                                
                                msg.attachments.forEach(attachment => {
                                    const ext = attachment.name?.split('.').pop()?.toLowerCase();
                                    if (ext) {
                                        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
                                        
                                        // Count images and videos from attachments
                                        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
                                            imageCount++;
                                        }
                                        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(ext)) {
                                            videoCount++;
                                        }
                                    }
                                });
                            }
                            
                            // Embeds
                            embedCount += msg.embeds.length;
                            
                            // Reactions
                            if (msg.reactions.cache.size > 0) {
                                msg.reactions.cache.forEach(reaction => {
                                    reactionCount += reaction.count || 0;
                                });
                            }
                            
                            // Edited messages
                            if (msg.editedTimestamp) {
                                editedCount++;
                            }
                            
                            // Date tracking
                            if (!lastMessageDate || msg.createdAt > lastMessageDate) {
                                lastMessageDate = msg.createdAt;
                            }
                            if (!firstMessageDate || msg.createdAt < firstMessageDate) {
                                firstMessageDate = msg.createdAt;
                            }
                        });
                        
                        lastId = batch.last().id;
                        batchCount++;
                        
                        // Progress update every 10 batches
                        if (batchCount % 10 === 0) {
                            await channel.send(`📊 Processed ${totalMessages} messages... (${batchCount}/50 batches)`);
                        }
                    }
                    
                } catch (fetchError) {
                    console.log("Could not fetch all DM statistics:", fetchError.message);
                }

                // Calculate percentages and averages
                const userPercentage = totalMessages > 0 ? ((userMessages / totalMessages) * 100).toFixed(1) : 0;
                const botPercentage = totalMessages > 0 ? ((botMessages / totalMessages) * 100).toFixed(1) : 0;
                const averageMessageLength = messageLengths.length > 0 ? 
                    (messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length).toFixed(1) : 0;
                const averageWordsPerMessage = totalMessages > 0 ? (wordCount / totalMessages).toFixed(1) : 0;
                
                // Get conversation duration
                let conversationDays = 0;
                if (firstMessageDate && lastMessageDate) {
                    conversationDays = Math.ceil((lastMessageDate - firstMessageDate) / (1000 * 60 * 60 * 24));
                }
                const messagesPerDay = conversationDays > 0 ? (totalMessages / conversationDays).toFixed(1) : 0;
                
                // Top domains
                const topDomains = Object.entries(domains)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([domain, count]) => `${domain} (${count})`)
                    .join(', ');
                
                // Top file types
                const topFileTypes = Object.entries(fileTypes)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => `${type} (${count})`)
                    .join(', ');

                const dmInfo = `🔌 **DM Analytics Report**

**👤 User Information:**
• Username: ${user.username}
• Display Name: ${user.displayName || user.username}
• Tag: ${user.tag}
• ID: ${user.id}
• Account Created: ${user.createdAt.toDateString()}
• Bot Account: ${user.bot ? 'Yes' : 'No'}

**📊 Message Statistics:**
• **Total Messages**: ${totalMessages.toLocaleString()}${totalMessages >= 5000 ? ' (sample)' : ''}
• User Messages: ${userMessages.toLocaleString()} (${userPercentage}%)
• Bot Messages: ${botMessages.toLocaleString()} (${botPercentage}%)
• Edited Messages: ${editedCount.toLocaleString()}

**📈 Content Analysis:**
• **Total Characters**: ${characterCount.toLocaleString()}
• **Total Words**: ${wordCount.toLocaleString()}
• **Links Posted**: ${linkCount.toLocaleString()}
• **Images Shared**: ${imageCount.toLocaleString()}
• **Videos Shared**: ${videoCount.toLocaleString()}
• **File Attachments**: ${attachmentCount.toLocaleString()}
• **Embeds**: ${embedCount.toLocaleString()}
• **Reactions**: ${reactionCount.toLocaleString()}

**📏 Averages:**
• Message Length: ${averageMessageLength} characters
• Words per Message: ${averageWordsPerMessage}
• Messages per Day: ${messagesPerDay}

**📅 Timeline:**
• First Message: ${firstMessageDate ? firstMessageDate.toDateString() : 'Unknown'}
• Last Message: ${lastMessageDate ? lastMessageDate.toDateString() : 'Unknown'}
• Conversation Duration: ${conversationDays} days
• Channel ID: ${channel.id}

**🔗 Top Domains:**
${topDomains || 'None found'}

**📎 File Types:**
${topFileTypes || 'None found'}

*Analysis completed on ${totalMessages.toLocaleString()} messages*`;

                return channel.send(dmInfo);
            }

            // If not DM, treat as server channel
            const guild = client.guilds.cache.get(channel.guildId);
            if (!guild) return channel.send("Could not fetch server info.");

            // Enhanced server info
            const owner = await guild.fetchOwner().catch(() => null);
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;
            
            // Server statistics
            const textChannels = channels.filter(c => c.type === 0).size;
            const voiceChannels = channels.filter(c => c.type === 2).size;
            const categories = channels.filter(c => c.type === 4).size;
            const threads = channels.filter(c => c.isThread()).size;
            
            // Role analysis
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
    },
};
