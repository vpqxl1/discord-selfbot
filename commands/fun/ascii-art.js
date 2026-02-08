const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'ascii-art',
    description: 'Generate ASCII art text',
    aliases: ['figlet', 'asciitext'],
    usage: 'ascii-art <text>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide text to convert to ASCII art.');
        }

        const text = args.join(' ');
        
        if (text.length > 20) {
            return base.sendError(channel, 'Text is too long. Maximum 20 characters.');
        }

        try {
            // Using patorjk.com API
            const response = await axios.get(`http://artii.herokuapp.com/make?text=${encodeURIComponent(text)}`);
            
            if (!response.data) {
                throw new Error('Failed to generate ASCII art');
            }

            const asciiArt = response.data;
            
            if (asciiArt.length > 1900) {
                return base.sendError(channel, 'Generated ASCII art is too large to send.');
            }

            await base.safeSend(channel, `\`\`\`\n${asciiArt}\n\`\`\``);
        } catch (error) {
            console.error('ASCII art command error:', error);
            await base.sendError(channel, 'Failed to generate ASCII art.');
        }
    }
};
