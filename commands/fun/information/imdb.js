const axios = require('axios');

module.exports = {
    name: 'imdb',
    description: 'Search for movie information on IMDB',
    async execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide a movie title to search for.');
        }
        
        const query = encodeURIComponent(args.join(' '));
        
        try {
            // This is a simplified example - you'd need an OMDB API key for detailed info
            channel.send(`🎬 IMDB search for "${args.join(' ')}":\nhttps://www.imdb.com/find?q=${query}`);
            
            // If you have an OMDB API key, you could implement proper movie info
            /*
            const response = await axios.get(
                `http://www.omdbapi.com/?apikey=YOUR_API_KEY&t=${query}`
            );
            
            if (response.data.Response === 'False') {
                return channel.send('Movie not found.');
            }
            
            const movie = response.data;
            const movieEmbed = {
                title: `${movie.Title} (${movie.Year})`,
                description: movie.Plot,
                color: 0xf5c518, // IMDB yellow
                fields: [
                    {
                        name: 'Rating',
                        value: `${movie.imdbRating}/10`,
                        inline: true
                    },
                    {
                        name: 'Runtime',
                        value: movie.Runtime,
                        inline: true
                    },
                    {
                        name: 'Genre',
                        value: movie.Genre,
                        inline: true
                    },
                    {
                        name: 'Director',
                        value: movie.Director,
                        inline: true
                    },
                    {
                        name: 'Actors',
                        value: movie.Actors,
                        inline: false
                    }
                ],
                thumbnail: {
                    url: movie.Poster
                },
                footer: {
                    text: 'Data from OMDB API'
                }
            };
            
            channel.send({ embeds: [movieEmbed] });
            */
        } catch (error) {
            console.error('IMDB search error:', error);
            channel.send('Failed to search IMDB.');
        }
    }
};
