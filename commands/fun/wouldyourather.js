const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'wouldyourather',
    description: 'Get a "Would You Rather" question',
    aliases: ['wyr', 'rather'],
    usage: 'wouldyourather',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            // Using Would You Rather API
            const response = await axios.get('https://would-you-rather-api.abaanshanid.repl.co/');
            const data = response.data;
            
            if (!data || !data.data) {
                throw new Error('Failed to fetch question');
            }

            const wyrEmbed = {
                title: '🤔 Would You Rather?',
                description: `**Option A:** ${data.data.option1}\n\n**Option B:** ${data.data.option2}`,
                color: 0xF39C12,
                footer: { text: 'React with 🅰️ or 🅱️ to vote!' }
            };

            const wyrMsg = await base.sendEmbed(channel, wyrEmbed);
            
            if (wyrMsg) {
                await wyrMsg.react('🅰️');
                await wyrMsg.react('🅱️');
            }
        } catch (error) {
            console.error('Would You Rather command error:', error);
            // Fallback to hardcoded questions
            const fallbackQuestions = [
                { a: 'Have the ability to fly', b: 'Have the ability to be invisible' },
                { a: 'Live without music', b: 'Live without movies' },
                { a: 'Be able to speak all languages', b: 'Be able to talk to animals' },
                { a: 'Time travel to the past', b: 'Time travel to the future' },
                { a: 'Have unlimited money', b: 'Have unlimited time' }
            ];
            
            const question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
            
            const wyrEmbed = {
                title: '🤔 Would You Rather?',
                description: `**Option A:** ${question.a}\n\n**Option B:** ${question.b}`,
                color: 0xF39C12,
                footer: { text: 'React with 🅰️ or 🅱️ to vote!' }
            };

            const wyrMsg = await base.sendEmbed(channel, wyrEmbed);
            
            if (wyrMsg) {
                await wyrMsg.react('🅰️');
                await wyrMsg.react('🅱️');
            }
        }
    }
};
