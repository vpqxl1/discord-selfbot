const CommandBase = require('../CommandBase');

module.exports = {
    name: 'roast',
    description: 'Roast someone (for fun)',
    aliases: ['burn'],
    usage: 'roast [@user]',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        const roasts = [
            "I'd agree with you, but then we'd both be wrong.",
            "You're not stupid; you just have bad luck thinking.",
            "I'd explain it to you, but I left my crayons at home.",
            "You bring everyone so much joy... when you leave the room.",
            "I'm jealous of people who haven't met you.",
            "You're like a cloud. When you disappear, it's a beautiful day.",
            "If I wanted to hear from someone with your IQ, I'd watch reality TV.",
            "You're proof that evolution can go in reverse.",
            "I'd challenge you to a battle of wits, but I see you're unarmed.",
            "You're the reason the gene pool needs a lifeguard.",
            "I'd call you a tool, but that would imply you're useful.",
            "You're like a software update. Whenever I see you, I think 'not now'.",
            "If you were any more inbred, you'd be a sandwich.",
            "You have the perfect face for radio.",
            "I'd roast you, but my mom told me not to burn trash.",
            "You're the human equivalent of a participation trophy.",
            "I'd agree with you, but then we'd both look stupid.",
            "You're about as useful as a screen door on a submarine.",
            "If brains were dynamite, you wouldn't have enough to blow your nose.",
            "You're the reason shampoo has instructions."
        ];

        let target = 'someone';
        if (message.mentions.users.size > 0) {
            const user = message.mentions.users.first();
            target = user.toString();
        } else if (args.length > 0) {
            target = args.join(' ');
        }

        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        
        await base.safeSend(channel, `🔥 ${target}, ${roast}`);
    }
};
