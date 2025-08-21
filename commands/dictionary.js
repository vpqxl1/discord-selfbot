const axios = require('axios');

module.exports = {
    name: "dictionary",
    description: "Look up definitions using free dictionary APIs",
    async execute(channel, message, client, args) {
        try {
            const safeSend = async (content) => {
                try {
                    return await channel.send(content);
                } catch (err) {
                    console.log(content);
                    return null;
                }
            };

            if (!args || args.length === 0) {
                return safeSend("❌ Please provide a word to look up.\nUsage: `!dictionary <word>`");
            }

            const word = args[0].toLowerCase();
            const progressMsg = await safeSend(`📖 Looking up **${word}** in the dictionary...`);

            try {
                // Using Free Dictionary API (completely free, no API key needed)
                const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                
                if (response.data && response.data.length > 0) {
                    const entry = response.data[0];
                    let dictionaryReport = `📚 **Dictionary: ${word}**\n\n`;
                    
                    // Phonetics
                    if (entry.phonetics && entry.phonetics.length > 0) {
                        const phonetic = entry.phonetics.find(p => p.text) || entry.phonetics[0];
                        dictionaryReport += `🔊 **Pronunciation**: ${phonetic.text || 'Not available'}\n\n`;
                    }
                    
                    // Meanings
                    if (entry.meanings && entry.meanings.length > 0) {
                        entry.meanings.slice(0, 3).forEach((meaning, index) => {
                            dictionaryReport += `**${index + 1}. ${meaning.partOfSpeech}**\n`;
                            
                            if (meaning.definitions && meaning.definitions.length > 0) {
                                meaning.definitions.slice(0, 2).forEach((def, defIndex) => {
                                    dictionaryReport += `   • ${def.definition}\n`;
                                    if (def.example) {
                                        dictionaryReport += `     *Example: "${def.example}"*\n`;
                                    }
                                });
                            }
                            
                            dictionaryReport += '\n';
                        });
                    }
                    
                    // Source
                    dictionaryReport += `*Source: Free Dictionary API*`;
                    
                    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                    await safeSend(dictionaryReport);
                } else {
                    throw new Error("No definitions found");
                }
            } catch (error) {
                console.error("Dictionary API error:", error);
                
                if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                await safeSend(`❌ Could not find dictionary information for **${word}**. Try a different word.`);
            }

        } catch (error) {
            console.error("Dictionary command error:", error);
            await channel.send(`❌ Error: ${error.message || "Failed to fetch dictionary definition"}`);
        }
    }
};
