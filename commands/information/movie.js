const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'movie',
    description: 'Search for movie information',
    aliases: ['film', 'imdb'],
    usage: 'movie <movie_name>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a movie name to search for.');
        }

        const query = args.join(' ');
        
        try {
            // Using OMDb API (free, no key needed for basic search)
            const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=trilogy`);
            const data = response.data;
            
            if (data.Response === 'False') {
                return base.sendError(channel, `Movie not found: "${query}"`);
            }

            const movieEmbed = {
                title: `🎬 ${data.Title} (${data.Year})`,
                url: `https://www.imdb.com/title/${data.imdbID}`,
                description: data.Plot !== 'N/A' ? data.Plot : 'No plot available.',
                color: 0xF39C12,
                thumbnail: { url: data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Poster' },
                fields: [
                    {
                        name: '⭐ Rating',
                        value: data.imdbRating !== 'N/A' ? `${data.imdbRating}/10` : 'N/A',
                        inline: true
                    },
                    {
                        name: '🎭 Genre',
                        value: data.Genre !== 'N/A' ? data.Genre : 'N/A',
                        inline: true
                    },
                    {
                        name: '⏱️ Runtime',
                        value: data.Runtime !== 'N/A' ? data.Runtime : 'N/A',
                        inline: true
                    },
                    {
                        name: '🎬 Director',
                        value: data.Director !== 'N/A' ? data.Director : 'N/A',
                        inline: true
                    },
                    {
                        name: '🎭 Actors',
                        value: data.Actors !== 'N/A' ? data.Actors : 'N/A',
                        inline: true
                    },
                    {
                        name: '📅 Released',
                        value: data.Released !== 'N/A' ? data.Released : 'N/A',
                        inline: true
                    }
                ],
                footer: { text: `IMDb ID: ${data.imdbID}` }
            };

            if (data.Awards && data.Awards !== 'N/A') {
                movieEmbed.fields.push({
                    name: '🏆 Awards',
                    value: data.Awards,
                    inline: false
                });
            }

            await base.sendEmbed(channel, movieEmbed);
        } catch (error) {
            console.error('Movie command error:', error);
            await base.sendError(channel, 'Failed to fetch movie information.');
        }
    }
};
