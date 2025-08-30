const axios = require('axios');

module.exports = {
    name: 'weather',
    description: 'Get weather information',
    async execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide a location.');
        }

        const location = args.join(' ');
        
        try {
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%w+%h`);
            const [description, temperature, wind, humidity] = response.data.split(' ');
            
            channel.send(`🌤️ **Weather in ${location}:**\n- Description: ${description}\n- Temperature: ${temperature}\n- Wind: ${wind}\n- Humidity: ${humidity}`);
        } catch (error) {
            channel.send('Could not fetch weather information.');
        }
    }
};
