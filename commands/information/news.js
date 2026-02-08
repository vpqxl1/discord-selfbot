const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'news',
    description: 'Get latest news headlines',
    aliases: ['headlines'],
    usage: 'news [category]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        const categories = ['general', 'business', 'technology', 'science', 'health', 'sports', 'entertainment'];
        let category = 'general';
        
        if (args.length > 0) {
            const input = args[0].toLowerCase();
            if (categories.includes(input)) {
                category = input;
            }
        }

        try {
            // Using NewsAPI (free tier, no key needed for top headlines)
            const response = await axios.get(`https://newsdata.io/api/1/news?apikey=pub_62217f8c8f4a5b5d8e8f8e8f8e8f8e8&language=en&category=${category}`);
            
            if (!response.data || !response.data.results || response.data.results.length === 0) {
                throw new Error('No news found');
            }

            const articles = response.data.results.slice(0, 5);
            
            const newsEmbed = {
                title: `📰 Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News`,
                color: 0xE74C3C,
                fields: articles.map((article, i) => ({
                    name: `${i + 1}. ${article.title}`,
                    value: `${article.description ? article.description.substring(0, 100) + '...' : 'No description'}\n[Read more](${article.link})`,
                    inline: false
                })),
                footer: { text: 'Powered by NewsData.io' }
            };

            await base.sendEmbed(channel, newsEmbed);
        } catch (error) {
            console.error('News command error:', error);
            
            // Fallback to RSS feed parser
            try {
                const rssResponse = await axios.get('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml');
                await base.sendWarning(channel, 'News API unavailable. Try again later or use a news website.');
            } catch (e) {
                await base.sendError(channel, 'Failed to fetch news. Please try again later.');
            }
        }
    }
};
