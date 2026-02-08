const CommandBase = require('../CommandBase');

const activeTimers = new Map();

module.exports = {
    name: 'timer',
    description: 'Set a countdown timer',
    aliases: ['countdown'],
    usage: 'timer <seconds> [message]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 1) {
            return base.sendWarning(channel, 'Please provide time in seconds.\nExample: `!timer 60 Pizza is ready!`');
        }

        const seconds = parseInt(args[0]);
        if (isNaN(seconds) || seconds <= 0 || seconds > 86400) {
            return base.sendError(channel, 'Please provide a valid time between 1 and 86400 seconds (24 hours).');
        }

        const timerMessage = args.slice(1).join(' ') || 'Timer finished!';
        const endTime = Date.now() + (seconds * 1000);
        const timerId = `${message.author.id}_${Date.now()}`;

        const timeout = setTimeout(async () => {
            try {
                await base.safeSend(channel, `⏰ <@${message.author.id}> ${timerMessage}`);
                activeTimers.delete(timerId);
            } catch (error) {
                console.error('Timer notification error:', error);
            }
        }, seconds * 1000);

        activeTimers.set(timerId, {
            timeout,
            endTime,
            message: timerMessage
        });

        await base.sendSuccess(channel, `Timer set for ${seconds} seconds. Will notify at <t:${Math.floor(endTime / 1000)}:t>`);
    }
};
