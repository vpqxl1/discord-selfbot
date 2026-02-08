const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'steam',
    description: 'Search for a game on Steam',
    aliases: ['game'],
    usage: 'steam <game_name>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a game name to search for.');
        }

        const query = args.join(' ');
        
        try {
            // First search for the game to get the appid
            const searchRes = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`);
            
            if (!searchRes.data || !searchRes.data.items || searchRes.data.items.length === 0) {
                return base.sendError(channel, `No games found for "${query}".`);
            }

            const game = searchRes.data.items[0];
            const appId = game.id;

            // Get detailed information using appid
            const detailRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
            
            if (!detailRes.data[appId].success) {
                return base.sendError(channel, 'Failed to fetch game details.');
            }

            const data = detailRes.data[appId].data;

            const steamEmbed = {
                title: `🎮 ${data.name}`,
                url: `https://store.steampowered.com/app/${appId}`,
                description: data.short_description || 'No description available.',
                color: 0x171A21,
                image: { url: data.header_image },
                fields: [
                    {
                        name: '💰 Price',
                        value: data.is_free ? 'Free' : (data.price_overview ? data.price_overview.final_formatted : 'N/A'),
                        inline: true
                    },
                    {
                        name: '📅 Release Date',
                        value: data.release_date.date || 'N/A',
                        inline: true
                    },
                    {
                        name: '🏢 Developer',
                        value: data.developers ? data.developers.join(', ') : 'N/A',
                        inline: true
                    }
                ],
                footer: { text: `AppID: ${appId} | Steam Store` }
            };

            if (data.recommendations) {
                steamEmbed.fields.push({
                    name: '👍 Recommendations',
                    value: data.recommendations.total.toLocaleString(),
                    inline: true
                });
            }

            await base.sendEmbed(channel, steamEmbed);
        } catch (error) {
            console.error('Steam command error:', error);
            await base.sendError(channel, 'Failed to fetch game information from Steam.');
        }
    }
};
