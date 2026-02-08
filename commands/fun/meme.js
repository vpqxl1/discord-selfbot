const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'meme',
    description: 'Get a random meme from Reddit',
    aliases: ['redditmeme'],
    usage: 'meme',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            // Using a public Reddit meme API
            const response = await axios.get('https://meme-api.com/gimme');
            const data = response.data;
            
            if (!data || !data.url) {
                throw new Error('Failed to fetch meme');
            }

            const memeEmbed = {
                title: data.title,
                url: data.postLink,
                color: 0xFF4500,
                image: { url: data.url },
                footer: { text: `r/${data.subreddit} | 👍 ${data.ups}` }
            };

            await base.sendEmbed(channel, memeEmbed);
        } catch (error) {
            console.error('Meme command error:', error);
            await base.sendError(channel, 'Failed to fetch a meme.');
        }
    }
};
