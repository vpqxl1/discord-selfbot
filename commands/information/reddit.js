const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'reddit',
    description: 'Get top posts from a subreddit',
    aliases: ['subreddit', 'r'],
    usage: 'reddit <subreddit> [hot|new|top]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a subreddit name.\nExample: `!reddit memes` or `!reddit funny top`');
        }

        const subreddit = args[0].replace(/^r\//, '');
        const sort = args[1] && ['hot', 'new', 'top'].includes(args[1].toLowerCase()) ? args[1].toLowerCase() : 'hot';
        
        try {
            const response = await axios.get(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=5`);
            
            if (!response.data || !response.data.data || !response.data.data.children || response.data.data.children.length === 0) {
                return base.sendError(channel, `No posts found in r/${subreddit}`);
            }

            const posts = response.data.data.children.map(child => child.data);
            
            const redditEmbed = {
                title: `🔴 r/${subreddit} - ${sort.toUpperCase()}`,
                color: 0xFF4500,
                fields: posts.slice(0, 5).map((post, i) => {
                    const title = post.title.length > 100 ? post.title.substring(0, 100) + '...' : post.title;
                    return {
                        name: `${i + 1}. ${title}`,
                        value: `👍 ${post.ups} | 💬 ${post.num_comments} | [View Post](https://reddit.com${post.permalink})`,
                        inline: false
                    };
                }),
                footer: { text: `r/${subreddit}` }
            };

            await base.sendEmbed(channel, redditEmbed);
        } catch (error) {
            console.error('Reddit command error:', error);
            if (error.response && error.response.status === 404) {
                await base.sendError(channel, `Subreddit r/${subreddit} not found or is private.`);
            } else {
                await base.sendError(channel, 'Failed to fetch Reddit posts.');
            }
        }
    }
};
