module.exports = {
    name: "clear",
    description: "Delete your own messages",
    async execute(channel, message, client, args) {
        const amount = parseInt(args[0]) || 10;
        
        if (amount > 100) {
            return channel.send("Max 100 messages at once.");
        }
        
        try {
            const messages = await channel.messages.fetch({ limit: amount });
            const yourMessages = messages.filter(m => m.author.id === client.user.id);
            
            if (yourMessages.size === 0) {
                return channel.send("No your messages found.");
            }
            
            for (const msg of yourMessages.values()) {
                await msg.delete().catch(() => {});
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            
            const confirmMsg = await channel.send(`Deleted ${yourMessages.size} messages.`);
            setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
            
        } catch (error) {
            console.error("Clear error:", error);
        }
    }
};
