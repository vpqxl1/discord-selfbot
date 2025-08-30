const axios = require('axios');

module.exports = {
    name: "dictionary",
    description: "Look up word definitions",
    async execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send("Please provide a word to look up.");
        }

        const word = args[0].toLowerCase();
        
        try {
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (response.data && response.data.length > 0) {
                const entry = response.data[0];
                let dictReport = `📚 **Dictionary: ${word}**\n\n`;
                
                if (entry.phonetics && entry.phonetics.length > 0) {
                    const phonetic = entry.phonetics.find(p => p.text) || entry.phonetics[0];
                    dictReport += `🔊 **Pronunciation**: ${phonetic.text || 'N/A'}\n\n`;
                }
                
                if (entry.meanings && entry.meanings.length > 0) {
                    entry.meanings.slice(0, 3).forEach((meaning, index) => {
                        dictReport += `**${index + 1}. ${meaning.partOfSpeech}**\n`;
                        
                        if (meaning.definitions && meaning.definitions.length > 0) {
                            meaning.definitions.slice(0, 2).forEach((def, defIndex) => {
                                dictReport += `   • ${def.definition}\n`;
                                if (def.example) {
                                    dictReport += `     *Example: "${def.example}"*\n`;
                                }
                            });
                        }
                        dictReport += '\n';
                    });
                }
                
                dictReport += `*Source: Free Dictionary API*`;
                channel.send(dictReport);
            } else {
                channel.send(`No definitions found for **${word}**.`);
            }
        } catch (error) {
            channel.send(`Could not find dictionary information for **${word}**.`);
        }
    }
};
