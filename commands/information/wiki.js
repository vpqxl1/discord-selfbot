const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'wiki',
    description: 'Search for an article on Wikipedia',
    aliases: ['wikipedia'],
    usage: 'wiki <search_term>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a search term.');
        }

        const query = args.join(' ');
        
        try {
            // Using Wikipedia REST API
            const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const data = response.data;
            
            if (data.type === 'disambiguation') {
                return base.sendWarning(channel, `"${query}" is a disambiguation page. Please be more specific.\nLink: ${data.content_urls.desktop.page}`);
            }

            const wikiEmbed = {
                title: `📚 ${data.title}`,
                url: data.content_urls.desktop.page,
                description: data.extract.length > 1000 ? data.extract.substring(0, 1000) + '...' : data.extract,
                color: 0xFFFFFF,
                footer: { text: 'Information from Wikipedia' }
            };

            if (data.thumbnail) {
                wikiEmbed.thumbnail = { url: data.thumbnail.source };
            }

            await base.sendEmbed(channel, wikiEmbed);
        } catch (error) {
            console.error('Wiki command error:', error);
            if (error.response && error.response.status === 404) {
                return base.sendError(channel, `No Wikipedia article found for "${query}".`);
            }
            await base.sendError(channel, 'Failed to fetch information from Wikipedia.');
        }
    }
};
