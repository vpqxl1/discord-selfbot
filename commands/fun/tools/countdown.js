const CommandBase = require('../CommandBase');

const activeTimers = new Map();

module.exports = {
    name: 'countdown',
    description: 'Start a countdown timer',
    aliases: ['timer', 'cd'],
    usage: 'countdown <time> [message]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Usage: v!countdown <time> [message]\nExample: v!countdown 1h30m Pizza is ready!');
        }

        const timeArg = args[0].toLowerCase();
        const timerMessage = args.length > 1 ? args.slice(1).join(' ') : 'Time\'s up!';
        const userId = message.author.id;
        const timerId = `${userId}-${Date.now()}`;

        // Parse complex time (1h30m15s format)
        let totalSeconds = 0;
        const timeRegex = /(\d+)([smhd])/g;
        let match;

        while ((match = timeRegex.exec(timeArg)) !== null) {
            const amount = parseInt(match[1]);
            const unit = match[2];
            
            switch (unit) {
                case 's': totalSeconds += amount; break;
                case 'm': totalSeconds += amount * 60; break;
                case 'h': totalSeconds += amount * 3600; break;
                case 'd': totalSeconds += amount * 86400; break;
            }
        }

        if (totalSeconds === 0) {
            return base.sendError(channel, 'Invalid time format. Use: 1h30m15s, 45m, 2h, etc.');
        }

        if (totalSeconds > 86400) { // 24 hours max
            return base.sendError(channel, 'Maximum countdown time is 24 hours.');
        }

        const endTime = Date.now() + (totalSeconds * 1000);

        // Store timer
        activeTimers.set(timerId, {
            userId,
            channelId: channel.id,
            message: timerMessage,
            endTime,
            interval: null
        });

        // Send initial message with progress bar
        const initialMessage = await base.safeSend(channel, this.createTimerMessage(totalSeconds, totalSeconds, timerMessage));

        // Update timer every 5 seconds
        const interval = setInterval(async () => {
            try {
                const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                
                if (remaining === 0) {
                    clearInterval(interval);
                    activeTimers.delete(timerId);
                    
                    const targetChannel = await client.channels.fetch(channel.id);
                    if (targetChannel && initialMessage) {
                        await initialMessage.edit(`⏰ **COUNTDOWN COMPLETE!**\n${timerMessage}`);
                    }
                    return;
                }

                if (initialMessage) {
                    await initialMessage.edit(this.createTimerMessage(remaining, totalSeconds, timerMessage));
                }
            } catch (error) {
                console.error('Countdown error:', error);
                clearInterval(interval);
                activeTimers.delete(timerId);
            }
        }, 5000);

        // Store interval reference
        activeTimers.get(timerId).interval = interval;
    },

    createTimerMessage(remainingSeconds, totalSeconds, message) {
        const progress = 1 - (remainingSeconds / totalSeconds);
        const progressBarLength = 20;
        const filled = Math.floor(progress * progressBarLength);
        const empty = progressBarLength - filled;
        
        const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
        const percent = Math.floor(progress * 100);
        
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        const timeLeft = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        return `⏰ **Countdown** [${percent}%]\n\`[${progressBar}]\`\n**Time left:** ${timeLeft}\n**Message:** ${message}`;
    }
};
