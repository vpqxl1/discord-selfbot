const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'dog',
    description: 'Get a random dog image',
    aliases: ['doggo', 'puppy'],
    usage: 'dog',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            const response = await axios.get('https://dog.ceo/api/breeds/image/random');
            
            if (response.data.status !== 'success') {
                throw new Error('Failed to fetch dog image');
            }

            const dogEmbed = {
                title: '🐶 Woof!',
                color: 0x5865F2,
                image: { url: response.data.message }
            };

            await base.sendEmbed(channel, dogEmbed);
        } catch (error) {
            console.error('Dog command error:', error);
            await base.sendError(channel, 'Failed to fetch a dog image.');
        }
    }
};
