const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'cat',
    description: 'Get a random cat image',
    aliases: ['kitty', 'meow'],
    usage: 'cat',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            const response = await axios.get('https://api.thecatapi.com/v1/images/search');
            
            if (!response.data || response.data.length === 0) {
                throw new Error('Failed to fetch cat image');
            }

            const catEmbed = {
                title: '🐱 Meow!',
                color: 0x5865F2,
                image: { url: response.data[0].url }
            };

            await base.sendEmbed(channel, catEmbed);
        } catch (error) {
            console.error('Cat command error:', error);
            await base.sendError(channel, 'Failed to fetch a cat image.');
        }
    }
};
