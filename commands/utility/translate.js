const { translate } = require('@vitalets/google-translate-api');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'translate',
    description: 'Translate text to another language',
    aliases: ['tr', 'trans'],
    usage: 'translate <to_lang> <text>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Support both old and new formats
        // New: !translate en Hello
        // Old: !translate auto to en Hello
        
        let toLang, text;
        
        if (args.length >= 4 && args[1].toLowerCase() === 'to') {
            toLang = args[2].toLowerCase();
            text = args.slice(3).join(' ');
        } else if (args.length >= 2) {
            toLang = args[0].toLowerCase();
            text = args.slice(1).join(' ');
        } else {
            return base.sendWarning(channel, 'Please provide a target language and text.\nExample: `!translate en Hola mundo` or `!translate auto to en Hola mundo`');
        }
        
        try {
            const res = await translate(text, { to: toLang });
            
            const transEmbed = {
                title: '🌐 Translation',
                color: 0x5865F2,
                fields: [
                    {
                        name: `📥 Original`,
                        value: text.length > 1000 ? text.substring(0, 1000) + '...' : text,
                        inline: false
                    },
                    {
                        name: `📤 Translated (${toLang})`,
                        value: res.text.length > 1000 ? res.text.substring(0, 1000) + '...' : res.text,
                        inline: false
                    }
                ],
                footer: { text: 'Powered by Google Translate' }
            };

            await base.sendEmbed(channel, transEmbed);
        } catch (error) {
            console.error('Translate command error:', error);
            await base.sendError(channel, 'Failed to translate text. Make sure the language code is valid (e.g., `en`, `es`, `fr`).');
        }
    }
};
