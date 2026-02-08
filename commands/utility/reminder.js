const CommandBase = require('../CommandBase');

// Store active reminders
const reminders = new Map();

module.exports = {
    name: 'reminder',
    description: 'Set a reminder for yourself',
    aliases: ['remind', 'remindme'],
    usage: 'reminder <time_in_minutes> <message>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendWarning(channel, 'Please provide time (in minutes) and a reminder message.\nExample: `!reminder 30 Check the oven`');
        }

        const minutes = parseInt(args[0]);
        if (isNaN(minutes) || minutes <= 0 || minutes > 10080) { // Max 1 week
            return base.sendError(channel, 'Please provide a valid time between 1 and 10080 minutes (1 week).');
        }

        const reminderText = args.slice(1).join(' ');
        const timeMs = minutes * 60 * 1000;
        const remindAt = new Date(Date.now() + timeMs);

        const reminderId = `${message.author.id}_${Date.now()}`;

        const timeout = setTimeout(async () => {
            try {
                await base.safeSend(channel, `⏰ **Reminder for <@${message.author.id}>:**\n${reminderText}`);
                reminders.delete(reminderId);
            } catch (error) {
                console.error('Reminder send error:', error);
            }
        }, timeMs);

        reminders.set(reminderId, {
            timeout,
            userId: message.author.id,
            text: reminderText,
            remindAt
        });

        await base.sendSuccess(channel, `Reminder set! I'll remind you in ${minutes} minute(s) at <t:${Math.floor(remindAt.getTime() / 1000)}:t>`);
    }
};
