const CommandBase = require('../CommandBase');

module.exports = {
    name: 'compliment',
    description: 'Give someone a compliment',
    aliases: ['praise', 'nice'],
    usage: 'compliment [@user]',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        const compliments = [
            "You're an awesome friend!",
            "You light up the room!",
            "You're a gift to those around you.",
            "You're a smart cookie!",
            "You are awesome!",
            "You have impeccable manners.",
            "You're really something special.",
            "You're a great listener.",
            "You're so thoughtful.",
            "Your perspective is refreshing.",
            "You're an inspiration.",
            "You're wonderful!",
            "You deserve a hug right now.",
            "You should be proud of yourself.",
            "You're more helpful than you realize.",
            "You've got all the right moves!",
            "You're one of a kind!",
            "You're really cool.",
            "You're like sunshine on a rainy day.",
            "You bring out the best in other people.",
            "Your smile is contagious.",
            "You're even better than a unicorn, because you're real.",
            "You're a great example to others.",
            "Being around you is like being on a happy little vacation.",
            "You always know how to find that silver lining."
        ];

        let target = 'You';
        if (message.mentions.users.size > 0) {
            const user = message.mentions.users.first();
            target = user.toString();
        } else if (args.length > 0) {
            target = args.join(' ');
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        
        await base.safeSend(channel, `💖 ${target}, ${compliment}`);
    }
};
