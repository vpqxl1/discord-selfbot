const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'github',
    description: 'Search for a GitHub repository',
    aliases: ['gh', 'repo'],
    usage: 'github <search_term>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a repository name to search for.');
        }

        const query = args.join(' ');
        
        try {
            const response = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=1`);
            
            if (!response.data.items || response.data.items.length === 0) {
                return base.sendError(channel, `No repositories found for "${query}".`);
            }

            const repo = response.data.items[0];
            
            const githubEmbed = {
                title: `📁 ${repo.full_name}`,
                url: repo.html_url,
                description: repo.description || 'No description provided.',
                color: 0x24292F,
                thumbnail: { url: repo.owner.avatar_url },
                fields: [
                    {
                        name: '⭐ Stars',
                        value: repo.stargazers_count.toLocaleString(),
                        inline: true
                    },
                    {
                        name: '🍴 Forks',
                        value: repo.forks_count.toLocaleString(),
                        inline: true
                    },
                    {
                        name: '🔍 Language',
                        value: repo.language || 'N/A',
                        inline: true
                    },
                    {
                        name: '📅 Last Updated',
                        value: `<t:${Math.floor(new Date(repo.updated_at).getTime() / 1000)}:R>`,
                        inline: true
                    }
                ],
                footer: { text: `Owner: ${repo.owner.login}` },
                timestamp: new Date()
            };

            await base.sendEmbed(channel, githubEmbed);
        } catch (error) {
            console.error('GitHub command error:', error);
            await base.sendError(channel, 'Failed to fetch repository information.');
        }
    }
};
