const CommandBase = require('../CommandBase');

// Active polls storage
const activePolls = new Map();

module.exports = {
    name: 'poll',
    description: 'Create advanced polls with multiple question types',
    aliases: ['vote', 'survey'],
    usage: 'poll create <question> | option1 | option2 | ...',
    cooldown: 6000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        const subcommand = args[0].toLowerCase();
        
        if (subcommand === 'create') {
            return this.createPoll(channel, message, args.slice(1), base);
        } else if (subcommand === 'end') {
            return this.endPoll(channel, message, base);
        } else if (subcommand === 'list') {
            return this.listPolls(channel, base);
        } else {
            return this.showHelp(channel, base);
        }
    },

    async createPoll(channel, message, args, base) {
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide a question and options for the poll.');
        }

        const input = args.join(' ');
        const parts = input.split('|').map(part => part.trim()).filter(part => part.length > 0);
        
        if (parts.length < 3) {
            return base.sendError(channel, 'Please provide a question and at least 2 options.\nFormat: v!poll create Question | Option 1 | Option 2 | ...');
        }

        const question = parts[0];
        const options = parts.slice(1);
        
        // Create poll
        const poll = {
            id: Date.now().toString(),
            question: question,
            options: options.map((option, index) => ({
                text: option,
                votes: 0,
                voters: []
            })),
            creator: message.author.id,
            message: null,
            emojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
            totalVotes: 0,
            startTime: Date.now()
        };

        activePolls.set(channel.id, poll);

        // Display poll
        const display = this.formatPollDisplay(poll);
        poll.message = await channel.send(display);
        
        // Add reactions
        for (let i = 0; i < options.length; i++) {
            await poll.message.react(poll.emojis[i]);
        }
        
        // Set up reaction collector
        this.setupReactionCollector(channel, poll, base);
    },

    setupReactionCollector(channel, poll, base) {
        const filter = (reaction, user) => {
            return poll.emojis.includes(reaction.emoji.name) && !user.bot;
        };
        
        const collector = poll.message.createReactionCollector({ filter });
        
        collector.on('collect', (reaction, user) => {
            const optionIndex = poll.emojis.indexOf(reaction.emoji.name);
            
            if (optionIndex >= 0 && optionIndex < poll.options.length) {
                // Remove previous votes from this user
                for (const option of poll.options) {
                    const voterIndex = option.voters.indexOf(user.id);
                    if (voterIndex !== -1) {
                        option.votes--;
                        option.voters.splice(voterIndex, 1);
                        poll.totalVotes--;
                    }
                }
                
                // Add new vote
                poll.options[optionIndex].votes++;
                poll.options[optionIndex].voters.push(user.id);
                poll.totalVotes++;
                
                // Update poll display
                this.updatePollDisplay(poll, base);
            }
        });
    },

    formatPollDisplay(poll) {
        let display = `📊 **Poll: ${poll.question}**\n\n`;
        
        poll.options.forEach((option, index) => {
            const percentage = poll.totalVotes > 0 
                ? Math.round((option.votes / poll.totalVotes) * 100) 
                : 0;
                
            const barLength = 10;
            const filled = Math.round((percentage / 100) * barLength);
            const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
            
            display += `${poll.emojis[index]} **${option.text}**\n`;
            display += `${bar} ${percentage}% (${option.votes} votes)\n\n`;
        });
        
        display += `Total votes: ${poll.totalVotes}`;
        
        return display;
    },

    async updatePollDisplay(poll, base) {
        try {
            const display = this.formatPollDisplay(poll);
            await poll.message.edit(display);
        } catch (error) {
            console.error('Poll update error:', error);
        }
    },

    async endPoll(channel, message, base) {
        const poll = activePolls.get(channel.id);
        
        if (!poll) {
            return base.sendError(channel, 'No active poll in this channel.');
        }
        
        if (poll.creator !== message.author.id) {
            return base.sendError(channel, 'Only the poll creator can end the poll.');
        }
        
        // Display final results
        const results = this.formatFinalResults(poll);
        await channel.send(results);
        
        // Clean up
        activePolls.delete(channel.id);
        try {
            await poll.message.delete();
        } catch (error) {
            console.error('Error deleting poll message:', error);
        }
    },

    formatFinalResults(poll) {
        let results = `🏁 **Poll Results: ${poll.question}**\n\n`;
        
        // Sort options by votes
        const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
        
        sortedOptions.forEach((option, index) => {
            const percentage = poll.totalVotes > 0 
                ? Math.round((option.votes / poll.totalVotes) * 100) 
                : 0;
                
            results += `${index + 1}. **${option.text}** - ${percentage}% (${option.votes} votes)\n`;
        });
        
        results += `\n**Total votes:** ${poll.totalVotes}`;
        results += `\n**Duration:** ${Math.round((Date.now() - poll.startTime) / 1000)} seconds`;
        
        return results;
    },

    async listPolls(channel, base) {
        if (activePolls.size === 0) {
            return base.sendError(channel, 'No active polls.');
        }
        
        let list = `📋 **Active Polls**\n\n`;
        
        for (const [channelId, poll] of activePolls) {
            try {
                const channel = await client.channels.fetch(channelId);
                list += `• **${channel.name}**: ${poll.question} (${poll.totalVotes} votes)\n`;
            } catch (error) {
                list += `• Unknown channel: ${poll.question}\n`;
            }
        }
        
        await base.safeSend(channel, list);
    },

    async showHelp(channel, base) {
        const help = `
📊 **Poll System Help**

**Commands:**
• \`v!poll create <question> | option1 | option2 | ...\` - Create a new poll
• \`v!poll end\` - End the current poll and show results
• \`v!poll list\` - List all active polls

**Examples:**
• \`v!poll create Favorite color? | Red | Blue | Green\`
• \`v!poll create Best programming language? | JavaScript | Python | Java | C++\`

**Features:**
• Real-time vote counting
• Percentage bars visualization
• Multiple option support (up to 10)
• Cross-channel poll listing
        `.trim();
        
        await base.safeSend(channel, help);
    }
};
