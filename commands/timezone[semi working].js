// commands/timezone.js
const { DateTime } = require('luxon');

module.exports = {
  name: 'timezone',
  description: '🕒 Provides the current time for a specified capital city.',
  /**
   * Executes the timezone command.
   * 
   * @param {Channel} channel The channel where the command was executed.
   * @param {Message} message The message object for the command.
   * @param {Client} client The client or bot instance.
   * @param {String[]} args The arguments passed with the command.
   */
  execute(channel, message, client, args) {
    if (args.length === 0) {
      message.channel.send('Please provide a timezone. Example: `!timezone Europe/Paris`');
      return;
    }

    const timezone = args.join('/');

    // Get the current time in the specified timezone
    const currentTime = DateTime.now().setZone(timezone);

    // Check if the timezone is valid
    if (!currentTime.isValid) {
      message.channel.send(`❌ Invalid timezone: ${timezone}. Please check the timezone format.`);
      return;
    }

    // Format the current time
    const formattedTime = currentTime.toLocaleString(DateTime.DATETIME_MED);

    // Send the current time to the channel
    message.channel.send(`The current time in ${timezone.replace('/', ' ')} is: ${formattedTime}`);
  },
};
