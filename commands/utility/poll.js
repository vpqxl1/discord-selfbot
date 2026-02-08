const CommandBase = require('../CommandBase');

// Active polls storage
const activePolls = new Map();

module.exports = {
    name: 'poll',
    description: 'Create interactive polls with real-time results',
    aliases: ['vote', 'survey'],
    usage: 'poll create <question> | option1 | option2 | ...',
    cooldown: 5000,

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
        } else {
            // Default to create if no subcommand matches but args exist
            if (args.join(' ').includes('|')) {
                return this.createPoll(channel, message, args, base);
            }
            return this.showHelp(channel, base);
        }
    },

    async createPoll(channel, message, args, base) {
        const input = args.join(' ');
        const parts = input.split('|').map(part => part.trim()).filter(part => part.length > 0);
        
        if (parts.length < 2) {
            return base.sendError(channel, 'Please provide a question and at least 2 options.\nFormat: `!poll Question | Option 1 | Option 2`');
        }

        const question = parts[0];
        const options = parts.slice(1);
        
        if (options.length > 10) {
            return base.sendError(channel, 'Maximum 10 options allowed.');
        }

        const poll = {
            question: question,
            options: options.map(opt => ({ text: opt, votes: 0, voters: [] })),
            creator: message.author.id,
            emojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
            totalVotes: 0,
            message: null
        };

        const display = this.formatPoll(poll);
        poll.message = await base.safeSend(channel, display);
        
        if (!poll.message) return;

        activePolls.set(channel.id, poll);

        for (let i = 0; i < options.length; i++) {
            await poll.message.react(poll.emojis[i]);
        }
        
        // Setup simple reaction listener
        const filter = (reaction, user) => poll.emojis.includes(reaction.emoji.name) && !user.bot;
        const collector = poll.message.createReactionCollector({ filter, time: 3600000 }); // 1 hour

        collector.on('collect', (reaction, user) => {
            const idx = poll.emojis.indexOf(reaction.emoji.name);
            if (idx >= 0 && idx < poll.options.length) {
                // Remove previous votes
                poll.options.forEach(opt => {
                    const vIdx = opt.voters.indexOf(user.id);
                    if (vIdx !== -1) {
                        opt.votes--;
                        opt.voters.splice(vIdx, 1);
                        poll.totalVotes--;
                    }
                });
                
                // Add new vote
                poll.options[idx].votes++;
                poll.options[idx].voters.push(user.id);
                poll.totalVotes++;
                
                // Update display
                poll.message.edit(this.formatPoll(poll)).catch(() => {});
            }
        });
    },

    formatPoll(poll) {
        let text = `📊 **POLL: ${poll.question}**\n\n`;
        poll.options.forEach((opt, i) => {
            const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
            text += `${poll.emojis[i]} **${opt.text}**\n${bar} ${percent}% (${opt.votes})\n`;
        });
        text += `\nTotal Votes: ${poll.totalVotes}`;
        return text;
    },

    async endPoll(channel, message, base) {
        const poll = activePolls.get(channel.id);
        if (!poll) return base.sendError(channel, 'No active poll in this channel.');
        
        activePolls.delete(channel.id);
        await base.sendSuccess(channel, `Poll ended. Final results above.`);
    },

    async showHelp(channel, base) {
        const help = `
📊 **Poll Help**
• \`!poll create <question> | <opt1> | <opt2>\`
• \`!poll end\` - End active poll
        `.trim();
        await base.safeSend(channel, help);
    }
};
