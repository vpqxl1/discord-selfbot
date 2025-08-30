const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    name: "etymology",
    description: "Find the etymology and word origin of any English word",
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
                return safeSend("❌ Please provide a word to look up.\nUsage: `!etymology <word>`");
            }

            const word = args[0].toLowerCase();
            const progressMsg = await safeSend(`🔍 Searching etymology for **${word}**...`);

            try {
                // Try to scrape from Etymology Online
                const response = await axios.get(`https://www.etymonline.com/word/${word}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                const $ = cheerio.load(response.data);
                let etymology = "";

                // Try to extract etymology from the page
                $('.word__defination').each((i, elem) => {
                    const text = $(elem).text().trim();
                    if (text && text.length > 50) { // Ensure it's a substantial definition
                        etymology = text;
                        return false; // Break the loop
                    }
                });

                if (etymology) {
                    // Clean up the text
                    etymology = etymology.replace(/\s+/g, ' ').substring(0, 1000);
                    if (etymology.length >= 1000) etymology += "...";
                    
                    const etymologyReport = `📚 **Etymology of ${word}**

${etymology}

*Source: etymonline.com*`;
                    
                    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                    await safeSend(etymologyReport);
                } else {
                    throw new Error("No etymology found on etymonline.com");
                }
            } catch (error) {
                console.error("Etymology scraping error:", error);
                
                // Fallback to Words API (no API key needed for basic usage)
                try {
                    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                    
                    if (response.data && response.data[0] && response.data[0].meanings) {
                        let definitions = "";
                        
                        response.data[0].meanings.slice(0, 3).forEach((meaning, index) => {
                            definitions += `**${index + 1}. ${meaning.partOfSpeech}**\n`;
                            
                            if (meaning.definitions && meaning.definitions.length > 0) {
                                meaning.definitions.slice(0, 2).forEach((def, defIndex) => {
                                    definitions += `   • ${def.definition}\n`;
                                });
                            }
                            
                            definitions += '\n';
                        });
                        
                        const fallbackReport = `📚 **Definitions for ${word}**

${definitions}

*Etymology not available. Showing definitions instead.*`;
                        
                        if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                        await safeSend(fallbackReport);
                    } else {
                        throw new Error("No definitions available");
                    }
                } catch (fallbackError) {
                    console.error("Fallback error:", fallbackError);
                    
                    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                    await safeSend(`❌ Could not find etymology or definitions for **${word}**. Try a different word.`);
                }
            }

        } catch (error) {
            console.error("Etymology command error:", error);
            await channel.send(`❌ Error: ${error.message || "Failed to fetch etymology"}`);
        }
    }
};
