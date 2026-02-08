const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'weather',
    description: 'Get current weather information for a location',
    aliases: ['wttr', 'forecast'],
    usage: 'weather <location>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a location (e.g., `!weather London` or `!weather New York`).');
        }

        const location = args.join(' ');
        
        try {
            // Using wttr.in with JSON format for better data parsing
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
            const data = response.data;
            
            if (!data || !data.current_condition || !data.current_condition[0]) {
                throw new Error('Invalid response from weather service');
            }

            const current = data.current_condition[0];
            const nearestArea = data.nearest_area[0];
            const weatherDesc = current.weatherDesc[0].value;
            
            const weatherEmbed = {
                title: `🌤️ Weather in ${nearestArea.areaName[0].value}, ${nearestArea.country[0].value}`,
                description: `**${weatherDesc}**`,
                color: 0x3498DB,
                fields: [
                    {
                        name: '🌡️ Temperature',
                        value: `${current.temp_C}°C (${current.temp_F}°F)`,
                        inline: true
                    },
                    {
                        name: '🌡️ Feels Like',
                        value: `${current.FeelsLikeC}°C (${current.FeelsLikeF}°F)`,
                        inline: true
                    },
                    {
                        name: '💧 Humidity',
                        value: `${current.humidity}%`,
                        inline: true
                    },
                    {
                        name: '🌬️ Wind',
                        value: `${current.windspeedKmph} km/h (${current.windspeedMiles} mph) ${current.winddir16Point}`,
                        inline: true
                    },
                    {
                        name: '👁️ Visibility',
                        value: `${current.visibility} km`,
                        inline: true
                    },
                    {
                        name: '☀️ UV Index',
                        value: current.uvIndex,
                        inline: true
                    }
                ],
                footer: { text: 'Data provided by wttr.in' },
                timestamp: new Date()
            };

            await base.sendEmbed(channel, weatherEmbed);
        } catch (error) {
            console.error('Weather command error:', error);
            // Fallback to simpler format if JSON fails
            try {
                const fallbackResponse = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%w+%h`);
                const parts = fallbackResponse.data.split(' ');
                if (parts.length >= 4) {
                    await base.safeSend(channel, `🌤️ **Weather in ${location}:**\n- Condition: ${parts[0]}\n- Temp: ${parts[1]}\n- Wind: ${parts[2]}\n- Humidity: ${parts[3]}`);
                } else {
                    await base.sendError(channel, `Could not find weather for "${location}".`);
                }
            } catch (fallbackError) {
                await base.sendError(channel, 'Failed to fetch weather information. Please try again later.');
            }
        }
    }
};
