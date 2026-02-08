const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'lyrics',
    description: 'Search for song lyrics',
    aliases: ['ly', 'song'],
    usage: 'lyrics <song_name>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a song name to search for.');
        }

        const query = args.join(' ');
        
        try {
            // Using lyrics.ovh API (free, no key required)
            const searchRes = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`);
            
            if (!searchRes.data.data || searchRes.data.data.length === 0) {
                return base.sendError(channel, `No lyrics found for "${query}".`);
            }

            const song = searchRes.data.data[0];
            const artist = song.artist.name;
            const title = song.title;

            // Get lyrics
            const lyricsRes = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
            
            if (!lyricsRes.data.lyrics) {
                return base.sendError(channel, 'Lyrics not available for this song.');
            }

            let lyrics = lyricsRes.data.lyrics;
            
            // Truncate if too long
            if (lyrics.length > 2000) {
                lyrics = lyrics.substring(0, 1997) + '...';
            }

            const lyricsEmbed = {
                title: `🎵 ${title}`,
                description: lyrics,
                color: 0x1DB954,
                author: {
                    name: artist,
                    icon_url: song.artist.picture_small
                },
                thumbnail: { url: song.album.cover_medium },
                footer: { text: 'Powered by lyrics.ovh' }
            };

            await base.sendEmbed(channel, lyricsEmbed);
        } catch (error) {
            console.error('Lyrics command error:', error);
            await base.sendError(channel, 'Failed to fetch lyrics. The song might not be in the database.');
        }
    }
};
