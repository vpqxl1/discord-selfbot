const CommandBase = require('../CommandBase');

module.exports = {
    name: 'rate',
    description: 'Rate something out of 10',
    aliases: ['rating'],
    usage: 'rate <thing>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide something to rate.\nExample: `!rate pizza`');
        }

        const thing = args.join(' ');
        
        // Generate a consistent rating based on the thing (so same thing always gets same rating)
        let hash = 0;
        for (let i = 0; i < thing.length; i++) {
            hash = ((hash << 5) - hash) + thing.charCodeAt(i);
            hash = hash & hash;
        }
        
        const rating = Math.abs(hash % 11); // 0-10
        const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating);
        
        let comment = '';
        if (rating <= 2) comment = 'Not great...';
        else if (rating <= 4) comment = 'Could be better.';
        else if (rating <= 6) comment = 'Pretty decent!';
        else if (rating <= 8) comment = 'Really good!';
        else comment = 'Absolutely amazing!';

        const rateEmbed = {
            title: '⭐ Rating',
            description: `**${thing}**\n\n${stars}\n\n**${rating}/10** - ${comment}`,
            color: 0xF1C40F
        };

        await base.sendEmbed(channel, rateEmbed);
    }
};
