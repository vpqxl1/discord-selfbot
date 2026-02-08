const CommandBase = require('../CommandBase');

module.exports = {
    name: 'purge',
    description: 'Delete your own messages in bulk',
    aliases: ['clean', 'cleanup'],
    usage: 'purge <amount>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 1) {
            return base.sendWarning(channel, 'Please provide the number of messages to delete (1-100).');
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return base.sendError(channel, 'Please provide a valid number between 1 and 100.');
        }

        try {
            const statusMsg = await base.safeSend(channel, `🗑️ Deleting your last ${amount} messages...`);
            
            let deleted = 0;
            let lastId = message.id;
            
            while (deleted < amount) {
                const fetchAmount = Math.min(100, amount - deleted + 10);
                const messages = await channel.messages.fetch({ limit: fetchAmount, before: lastId });
                
                if (messages.size === 0) break;
                
                const userMessages = messages.filter(m => m.author.id === client.user.id);
                
                for (const msg of userMessages.values()) {
                    if (deleted >= amount) break;
                    try {
                        await msg.delete();
                        deleted++;
                        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit protection
                    } catch (error) {
                        console.error('Error deleting message:', error);
                    }
                }
                
                lastId = messages.last().id;
                
                if (userMessages.size === 0) break;
            }
            
            if (statusMsg) {
                await statusMsg.edit(`✅ Deleted ${deleted} of your messages.`);
                setTimeout(() => statusMsg.delete().catch(() => {}), 3000);
            }
        } catch (error) {
            console.error('Purge command error:', error);
            await base.sendError(channel, 'An error occurred while deleting messages.');
        }
    }
};
