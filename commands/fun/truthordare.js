const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'truthordare',
    description: 'Get a truth or dare question',
    aliases: ['tod', 'truth', 'dare'],
    usage: 'truthordare [truth|dare]',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        let type = 'random';
        if (args.length > 0) {
            const input = args[0].toLowerCase();
            if (input === 'truth' || input === 'dare') {
                type = input;
            }
        }
        
        // If random, pick one
        if (type === 'random') {
            type = Math.random() < 0.5 ? 'truth' : 'dare';
        }

        try {
            const response = await axios.get(`https://api.truthordarebot.xyz/v1/${type}`);
            const data = response.data;
            
            if (!data || !data.question) {
                throw new Error('Failed to fetch question');
            }

            const todEmbed = {
                title: type === 'truth' ? '🤥 Truth' : '💪 Dare',
                description: data.question,
                color: type === 'truth' ? 0x3498DB : 0xE74C3C,
                footer: { text: `Type: ${data.type || type}` }
            };

            await base.sendEmbed(channel, todEmbed);
        } catch (error) {
            console.error('Truth or Dare command error:', error);
            
            // Fallback questions
            const fallbackTruths = [
                "What's the most embarrassing thing you've ever done?",
                "What's your biggest fear?",
                "What's the worst lie you've ever told?",
                "What's your most embarrassing childhood memory?",
                "Who was your first crush?"
            ];
            
            const fallbackDares = [
                "Do 20 pushups",
                "Send a funny meme to the chat",
                "Change your profile picture to something embarrassing for 1 hour",
                "Speak in rhymes for the next 5 messages",
                "Share your most played song"
            ];
            
            const question = type === 'truth' 
                ? fallbackTruths[Math.floor(Math.random() * fallbackTruths.length)]
                : fallbackDares[Math.floor(Math.random() * fallbackDares.length)];
            
            const todEmbed = {
                title: type === 'truth' ? '🤥 Truth' : '💪 Dare',
                description: question,
                color: type === 'truth' ? 0x3498DB : 0xE74C3C
            };

            await base.sendEmbed(channel, todEmbed);
        }
    }
};
