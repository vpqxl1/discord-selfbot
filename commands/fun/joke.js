const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'joke',
    description: 'Get a random joke',
    aliases: ['haha'],
    usage: 'joke',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            // Using JokeAPI
            const response = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode');
            const data = response.data;
            
            let jokeText = '';
            if (data.type === 'single') {
                jokeText = data.joke;
            } else {
                jokeText = `**${data.setup}**\n\n*${data.delivery}*`;
            }

            const jokeEmbed = {
                title: `😂 Random ${data.category} Joke`,
                description: jokeText,
                color: 0xF1C40F,
                footer: { text: 'Powered by JokeAPI' }
            };

            await base.sendEmbed(channel, jokeEmbed);
        } catch (error) {
            console.error('Joke command error:', error);
            await base.sendError(channel, 'Failed to fetch a joke.');
        }
    }
};
