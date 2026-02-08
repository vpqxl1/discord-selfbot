const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'anime',
    description: 'Search for an anime on MyAnimeList',
    aliases: ['mal', 'ani'],
    usage: 'anime <anime_name>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide an anime name to search for.');
        }

        const query = args.join(' ');
        
        try {
            // Using Jikan API (Unofficial MyAnimeList API)
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
            
            if (!response.data.data || response.data.data.length === 0) {
                return base.sendError(channel, `No anime found for "${query}".`);
            }

            const anime = response.data.data[0];
            
            const animeEmbed = {
                title: `📺 ${anime.title}`,
                url: anime.url,
                description: anime.synopsis ? (anime.synopsis.length > 500 ? anime.synopsis.substring(0, 500) + '...' : anime.synopsis) : 'No synopsis available.',
                color: 0x2E51A2,
                image: { url: anime.images.jpg.large_image_url },
                fields: [
                    {
                        name: '⭐ Score',
                        value: anime.score ? anime.score.toString() : 'N/A',
                        inline: true
                    },
                    {
                        name: '🎞️ Type',
                        value: anime.type || 'N/A',
                        inline: true
                    },
                    {
                        name: '📅 Status',
                        value: anime.status || 'N/A',
                        inline: true
                    },
                    {
                        name: '🔢 Episodes',
                        value: anime.episodes ? anime.episodes.toString() : 'N/A',
                        inline: true
                    },
                    {
                        name: '🏷️ Genres',
                        value: anime.genres.map(g => g.name).join(', ') || 'N/A',
                        inline: false
                    }
                ],
                footer: { text: `Rank: #${anime.rank || 'N/A'} | Popularity: #${anime.popularity || 'N/A'}` }
            };

            await base.sendEmbed(channel, animeEmbed);
        } catch (error) {
            console.error('Anime command error:', error);
            await base.sendError(channel, 'Failed to fetch anime information.');
        }
    }
};
