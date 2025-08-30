const axios = require('axios');

module.exports = {
    name: 'dadjoke',
    description: 'Get a random dad joke',
    async execute(channel, message, client, args) {
        try {
            const response = await axios.get('https://icanhazdadjoke.com/', {
                headers: { 'Accept': 'application/json' }
            });
            channel.send(`${response.data.joke}`);
        } catch (error) {
            channel.send('Could not fetch a joke. Try again later!');
        }
    }
};
