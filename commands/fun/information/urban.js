const axios = require('axios');

module.exports = {
    name: 'urban',
    description: 'Look up definitions on Urban Dictionary',
    async execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide a term to look up.');
        }

        try {
            const term = encodeURIComponent(args.join(' '));
            const response = await axios.get(`https://api.urbandictionary.com/v0/define?term=${term}`);
            
            if (!response.data.list.length) {
                return channel.send('No definitions found.');
            }

            const definition = response.data.list[0];
            const urbanEmbed = {
                title: `Urban Dictionary: ${definition.word}`,
                description: definition.definition,
                color: 0x0099ff,
                fields: [
                    {
                        name: 'Example',
                        value: definition.example || 'No example provided',
                        inline: false
                    },
                    {
                        name: '👍',
                        value: definition.thumbs_up.toString(),
                        inline: true
                    },
                    {
                        name: '👎',
                        value: definition.thumbs_down.toString(),
                        inline: true
                    }
                ],
                footer: {
                    text: `By ${definition.author}`
                }
            };

            channel.send({ embeds: [urbanEmbed] });
        } catch (error) {
            console.error('Urban Dictionary error:', error);
            channel.send('Failed to fetch definition.');
        }
    }
};
