// Use global config instead of requiring it to avoid path issues
class CommandBase {
    constructor() {
        this.config = global.botConfig || { prefix: '!', allowedUserIDs: [] };
        this.prefix = this.config.prefix;
        this.cooldown = 0;
    }
    
    async execute(channel, message, client, args) {
        throw new Error('Execute method not implemented');
    }
    
    async safeSend(channel, content, options = {}) {
        try {
            // Split long content into multiple messages if it exceeds Discord's limit
            if (typeof content === 'string' && content.length > 2000) {
                const chunks = content.match(/[\s\S]{1,1900}/g) || [];
                let lastMsg = null;
                for (const chunk of chunks) {
                    lastMsg = await channel.send(chunk);
                }
                return lastMsg;
            }
            const sentMessage = await channel.send(content, options);
            return sentMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }
    
    async safeReply(message, content, options = {}) {
        try {
            if (typeof content === 'string' && content.length > 2000) {
                return this.safeSend(message.channel, content, options);
            }
            return await message.reply(content, options);
        } catch (error) {
            console.error('Error replying to message:', error);
            return this.safeSend(message.channel, content, options);
        }
    }
    
    async safeDelete(message, timeout = 0) {
        try {
            if (timeout > 0) {
                setTimeout(() => message.delete().catch(() => {}), timeout);
                return true;
            }
            await message.delete();
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }
    
    validatePermissions(userId) {
        return this.config.allowedUserIDs.includes(userId);
    }
    
    async sendError(channel, errorMessage) {
        return this.safeSend(channel, `❌ ${errorMessage}`);
    }
    
    async sendSuccess(channel, message) {
        return this.safeSend(channel, `✅ ${message}`);
    }
    
    async sendWarning(channel, message) {
        return this.safeSend(channel, `⚠️ ${message}`);
    }

    async sendEmbed(channel, embedData) {
        try {
            // Selfbots don't support rich embeds like bots do in some contexts,
            // but discord.js-selfbot-v13 handles them. 
            // We format them nicely as text for better compatibility if needed.
            return await channel.send({ embeds: [embedData] });
        } catch (error) {
            console.error('Error sending embed:', error);
            // Fallback to text format
            let text = `**${embedData.title || ''}**\n${embedData.description || ''}\n`;
            if (embedData.fields) {
                embedData.fields.forEach(f => {
                    text += `\n**${f.name}**\n${f.value}`;
                });
            }
            return this.safeSend(channel, text);
        }
    }
    
    parseArgs(args, schema = {}) {
        const parsed = {};
        let index = 0;
        
        for (const [key, type] of Object.entries(schema)) {
            if (index >= args.length) break;
            
            switch (type) {
                case 'number':
                    parsed[key] = parseFloat(args[index]);
                    break;
                case 'boolean':
                    parsed[key] = args[index].toLowerCase() === 'true';
                    break;
                case 'array':
                    parsed[key] = args.slice(index);
                    index = args.length;
                    break;
                default:
                    parsed[key] = args[index];
            }
            
            index++;
        }
        
        return parsed;
    }
    
    createRateLimiter(limit, windowMs) {
        const hits = new Map();
        return (userId) => {
            const now = Date.now();
            const userHits = hits.get(userId) || { count: 0, resetTime: now + windowMs };
            
            if (now > userHits.resetTime) {
                userHits.count = 0;
                userHits.resetTime = now + windowMs;
            }
            
            userHits.count++;
            hits.set(userId, userHits);
            
            return userHits.count <= limit;
        };
    }
}

module.exports = CommandBase;
