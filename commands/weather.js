// commands/weather.js
const axios = require('axios');

module.exports = {
  name: 'weather',
  description: 'Provides current weather information for a specified location.',
  /**
   * Executes the weather command.
   * 
   * @param {Channel} channel The channel where the command was executed.
   * @param {Message} message The message object for the command.
   * @param {Client} client The client or bot instance.
   * @param {String[]} args The arguments passed with the command.
   */
  async execute(channel, message, client, args) {
    if (args.length === 0) {
      message.channel.send('Please provide a location. Example: `!weather London`');
      return;
    }

    const location = args.join(' ');

    try {
      // Make a request to wttr.in to get the weather information for the location
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%w+%h`);

      // Response format example: "Clear sky 20°C 10km/h 60%"
      const weatherData = response.data.split(' ');
      const description = weatherData[0];
      const temperature = weatherData[1];
      const windSpeed = weatherData[2];
      const humidity = weatherData[3];

      // Send the weather information to the channel
      message.channel.send(`Weather in ${location}:\n- Description: ${description}\n- Temperature: ${temperature}\n- Wind Speed: ${windSpeed}\n- Humidity: ${humidity}`);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      message.channel.send('❌ Error fetching weather data. Please try again later.');
    }
  },
};
