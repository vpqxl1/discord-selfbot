module.exports = {
    name: "dmuserinfo2",
    description: "Analyze DM messages with live per-user progress",
    async execute(client, message, args) {
        if (!message) return console.log("No message object passed!");

        async function safeSend(content) {
            try {
                if (message.channel && message.channel.send) {
                    return await message.channel.send(content);
                } else {
                    console.log(content);
                }
            } catch {
                console.log(content);
            }
        }

        if (!args || !args.length) {
            if (!message.content) return safeSend("Cannot parse arguments.");
            args = message.content.trim().split(/\s+/).slice(1);
        }

        if (!args[0]) return safeSend("Please provide at least one user ID.");

        // Get the bot's user ID safely
        const botUserId = client.user ? client.user.id : (await client.users.fetch('@me')).id;
        const userId1 = args[0];
        const userId2 = args[1] || (userId1 === botUserId ? message.author.id : botUserId);
        const limit = args[2] ? parseInt(args[2]) : 5000; // Increased default limit

        // Validate user IDs
        try {
            await client.users.fetch(userId1);
            await client.users.fetch(userId2);
        } catch (err) {
            return safeSend("Invalid user ID provided.");
        }

        // Initialize progress messages for each user
        let progressMsg1 = await safeSend(`Starting fetch for <@${userId1}>...`);
        let progressMsg2 = await safeSend(`Starting fetch for <@${userId2}>...`);

        // Function to fetch DM messages between two users
        const fetchDMMessages = async (user1Id, user2Id, progressMsg, userToTrack) => {
            let allMessages = [];
            let lastId = null;
            let remaining = limit;
            let fetched = 0;
            let startTime = Date.now();
            
            // Try to get DM channel
            let dmChannel;
            try {
                const user = await client.users.fetch(user1Id);
                dmChannel = user.dmChannel || await user.createDM();
            } catch (err) {
                throw new Error(`Cannot access DM with <@${user1Id}>`);
            }

            while (remaining > 0) {
                const options = { limit: Math.min(remaining, 100) };
                if (lastId) options.before = lastId;

                try {
                    const chunk = await dmChannel.messages.fetch(options);
                    if (!chunk.size) break;

                    // Filter messages between the two specified users
                    const relevantMessages = chunk.filter(m => 
                        [user1Id, user2Id].includes(m.author.id)
                    );
                    
                    allMessages.push(...relevantMessages.values());
                    lastId = chunk.last().id;
                    remaining -= chunk.size;
                    fetched += chunk.size;

                    // Live progress update
                    if (progressMsg && progressMsg.edit && fetched % 50 === 0) {
                        const elapsed = (Date.now() - startTime) / 1000;
                        const rate = fetched / elapsed;
                        const eta = remaining > 0 && rate > 0 ? Math.round(remaining / rate) : 0;
                        
                        await progressMsg.edit(
                            `Fetching for <@${userToTrack}>: ${allMessages.length} relevant messages ` +
                            `(${fetched}/${limit} scanned, ETA: ${eta}s)`
                        );
                    }
                } catch (err) {
                    console.error("Error fetching messages:", err);
                    break;
                }
            }

            // Filter to only messages from the tracked user
            const userMessages = allMessages.filter(m => m.author.id === userToTrack);
            
            const elapsed = (Date.now() - startTime) / 1000;
            return { messages: userMessages, scanned: fetched, time: elapsed };
        };

        try {
            // Fetch messages for both users in parallel
            const [result1, result2] = await Promise.all([
                fetchDMMessages(userId1, userId2, progressMsg1, userId1),
                fetchDMMessages(userId2, userId1, progressMsg2, userId2)
            ]);

            // Function to analyze messages and calculate stats
            const analyzeMessages = (msgs) => {
                const stats = {
                    messages: msgs.length,
                    words: 0,
                    characters: 0,
                    links: 0,
                    images: 0,
                    videos: 0,
                    embeds: 0,
                    reactions: 0,
                    mentions: 0,
                    edited: 0
                };

                for (const msg of msgs) {
                    stats.words += msg.content.split(/\s+/).length;
                    stats.characters += msg.content.length;
                    stats.links += (msg.content.match(/https?:\/\/\S+/g) || []).length;
                    
                    if (msg.attachments.size > 0) {
                        msg.attachments.forEach(attachment => {
                            if (attachment.height) {
                                if (attachment.url.match(/\.(mp4|webm|mov)$/i)) {
                                    stats.videos++;
                                } else {
                                    stats.images++;
                                }
                            }
                        });
                    }
                    
                    stats.embeds += msg.embeds.length;
                    stats.reactions += msg.reactions.cache.size;
                    stats.mentions += msg.mentions.users.size;
                    if (msg.editedTimestamp) stats.edited++;
                }

                return stats;
            };

            const stats1 = analyzeMessages(result1.messages);
            const stats2 = analyzeMessages(result2.messages);
            
            // Calculate combined stats
            const combinedStats = {
                messages: stats1.messages + stats2.messages,
                words: stats1.words + stats2.words,
                characters: stats1.characters + stats2.characters,
                links: stats1.links + stats2.links,
                images: stats1.images + stats2.images,
                videos: stats1.videos + stats2.videos,
                embeds: stats1.embeds + stats2.embeds,
                reactions: stats1.reactions + stats2.reactions,
                mentions: stats1.mentions + stats2.mentions,
                edited: stats1.edited + stats2.edited
            };

            // Format the output
            const formatStats = (stats, user, time) => `
**<@${user}>** (Scanned in ${time.toFixed(1)}s)
• Messages: ${stats.messages}
• Words: ${stats.words}
• Characters: ${stats.characters}
• Links: ${stats.links}
• Images: ${stats.images}
• Videos: ${stats.videos}
• Embeds: ${stats.embeds}
• Reactions: ${stats.reactions}
• Mentions: ${stats.mentions}
• Edited: ${stats.edited}
            `;

            const output = `
📊 **DM Analysis Summary**

${formatStats(stats1, userId1, result1.time)}
${formatStats(stats2, userId2, result2.time)}

**Combined Totals**
• Messages: ${combinedStats.messages}
• Words: ${combinedStats.words}
• Characters: ${combinedStats.characters}
• Links: ${combinedStats.links}
• Images: ${combinedStats.images}
• Videos: ${combinedStats.videos}
• Embeds: ${combinedStats.embeds}
• Reactions: ${combinedStats.reactions}
• Mentions: ${combinedStats.mentions}
• Edited: ${combinedStats.edited}
            `;

            await safeSend(output);
            
            // Clean up progress messages
            if (progressMsg1 && progressMsg1.delete) await progressMsg1.delete().catch(() => {});
            if (progressMsg2 && progressMsg2.delete) await progressMsg2.delete().catch(() => {});
            
        } catch (err) {
            console.error(err);
            await safeSend(`Error: ${err.message || "An error occurred while fetching user info."}`);
        }
    }
};
