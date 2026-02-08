const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'define',
    description: 'Get the definition of a word',
    aliases: ['definition', 'meaning'],
    usage: 'define <word>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a word to define.');
        }

        const word = args[0].toLowerCase();
        
        try {
            // Using Free Dictionary API
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            
            if (!response.data || response.data.length === 0) {
                throw new Error('Word not found');
            }

            const data = response.data[0];
            const meaning = data.meanings[0];
            const definition = meaning.definitions[0];
            
            const defineEmbed = {
                title: `📖 ${data.word}`,
                color: 0x3498DB,
                fields: [
                    {
                        name: '🔤 Part of Speech',
                        value: meaning.partOfSpeech,
                        inline: true
                    }
                ]
            };

            if (data.phonetic) {
                defineEmbed.fields.push({
                    name: '🔊 Pronunciation',
                    value: data.phonetic,
                    inline: true
                });
            }

            defineEmbed.fields.push({
                name: '📝 Definition',
                value: definition.definition,
                inline: false
            });

            if (definition.example) {
                defineEmbed.fields.push({
                    name: '💡 Example',
                    value: `*"${definition.example}"*`,
                    inline: false
                });
            }

            if (definition.synonyms && definition.synonyms.length > 0) {
                defineEmbed.fields.push({
                    name: '🔄 Synonyms',
                    value: definition.synonyms.slice(0, 5).join(', '),
                    inline: false
                });
            }

            await base.sendEmbed(channel, defineEmbed);
        } catch (error) {
            console.error('Define command error:', error);
            if (error.response && error.response.status === 404) {
                await base.sendError(channel, `No definition found for "${word}".`);
            } else {
                await base.sendError(channel, 'Failed to fetch definition.');
            }
        }
    }
};
