const { DateTime } = require('luxon');
const CommandBase = require('../CommandBase');

module.exports = {
  name: 'timezone',
  description: 'Provides the current time for a specified timezone.',
  aliases: ['time', 'tz'],
  usage: 'timezone <Area/City>',
  cooldown: 2000,

  async execute(channel, message, client, args) {
    const base = new CommandBase();
    
    if (args.length === 0) {
      return base.sendWarning(channel, 'Please provide a timezone. Example: `!timezone Europe/Paris` or `!timezone UTC`');
    }

    // Try to handle common shorthand or replace spaces with underscores
    let timezoneInput = args.join('_');
    
    // Common shorthand mapping
    const shorthands = {
        'EST': 'America/New_York',
        'CST': 'America/Chicago',
        'MST': 'America/Denver',
        'PST': 'America/Los_Angeles',
        'GMT': 'UTC',
        'BST': 'Europe/London',
        'CET': 'Europe/Paris',
        'JST': 'Asia/Tokyo',
        'AEST': 'Australia/Sydney'
    };

    const timezone = shorthands[timezoneInput.toUpperCase()] || timezoneInput;

    try {
        // Get the current time in the specified timezone
        const currentTime = DateTime.now().setZone(timezone);

        // Check if the timezone is valid
        if (!currentTime.isValid) {
          return base.sendError(channel, `Invalid timezone: \`${timezoneInput}\`. Please use format like \`Europe/London\` or \`UTC\`.`);
        }

        const formattedTime = currentTime.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
        const relativeTime = `<t:${Math.floor(currentTime.toSeconds())}:R>`;

        const timeEmbed = {
            title: `🕒 Time in ${timezone.replace(/_/g, ' ')}`,
            description: `**${formattedTime}**\nRelative: ${relativeTime}`,
            color: 0x5865F2,
            fields: [
                {
                    name: '📅 Date',
                    value: currentTime.toFormat('cccc, LLLL dd, yyyy'),
                    inline: true
                },
                {
                    name: '⏰ Offset',
                    value: currentTime.toFormat('ZZZZ'),
                    inline: true
                }
            ],
            footer: { text: `Requested by ${message.author.tag}` },
            timestamp: new Date()
        };

        await base.sendEmbed(channel, timeEmbed);
    } catch (error) {
        console.error('Timezone command error:', error);
        await base.sendError(channel, 'An error occurred while fetching the time.');
    }
  }
};
