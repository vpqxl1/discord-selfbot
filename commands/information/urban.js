const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'urban',
    description: 'Look up definitions on Urban Dictionary',
    aliases: ['ud', 'urbandict'],
    usage: 'urban <term>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a term to look up.');
        }

        try {
            const term = encodeURIComponent(args.join(' '));
            const response = await axios.get(`https://api.urbandictionary.com/v0/define?term=${term}`);
            
            if (!response.data.list || !response.data.list.length) {
                return base.sendError(channel, `No definitions found for "${args.join(' ')}".`);
            }

            const definition = response.data.list[0];
            
            // Format definition and example (handle Discord's 2000 char limit)
            const cleanDef = definition.definition.replace(/[\[\]]/g, '');
            const cleanEx = (definition.example || 'No example provided').replace(/[\[\]]/g, '');

            const urbanEmbed = {
                title: `📖 Urban Dictionary: ${definition.word}`,
                url: definition.permalink,
                description: cleanDef.length > 1000 ? cleanDef.substring(0, 1000) + '...' : cleanDef,
                color: 0x1D2439,
                fields: [
                    {
                        name: '📝 Example',
                        value: cleanEx.length > 1000 ? cleanEx.substring(0, 1000) + '...' : cleanEx,
                        inline: false
                    },
                    {
                        name: '👍 Upvotes',
                        value: definition.thumbs_up.toLocaleString(),
                        inline: true
                    },
                    {
                        name: '👎 Downvotes',
                        value: definition.thumbs_down.toLocaleString(),
                        inline: true
                    }
                ],
                footer: {
                    text: `By ${definition.author} | Definition 1 of ${response.data.list.length}`
                },
                timestamp: new Date()
            };

            await base.sendEmbed(channel, urbanEmbed);
        } catch (error) {
            console.error('Urban Dictionary error:', error);
            await base.sendError(channel, 'Failed to fetch definition from Urban Dictionary.');
        }
    }
};
