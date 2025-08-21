//the api likes to return unknown and undefined

const axios = require('axios');

module.exports = {
    name: "quote",
    description: "Get inspirational quotes by category (philosophy, fiction, authors, etc.)",
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

            // Available categories
            const categories = [
                'philosophy', 'fiction', 'inspirational', 'life', 'love', 
                'humor', 'science', 'technology', 'art', 'literature',
                'success', 'wisdom', 'motivational', 'spiritual', 'friendship'
            ];

            // Default category if none specified
            let category = 'inspirational';
            
            if (args && args.length > 0) {
                const requestedCategory = args[0].toLowerCase();
                if (categories.includes(requestedCategory)) {
                    category = requestedCategory;
                } else {
                    return safeSend(`❌ Invalid category. Available categories: ${categories.join(', ')}`);
                }
            }

            const progressMsg = await safeSend(`💭 Fetching a ${category} quote...`);

            try {
                // Using Quotable API (free, no API key needed)
                const response = await axios.get(`https://api.quotable.io/random?tags=${category}`);
                const quoteData = response.data;
                
                const quoteReport = `💬 **${category.charAt(0).toUpperCase() + category.slice(1)} Quote**

"${quoteData.content}"

— **${quoteData.author}**

*Tags: ${quoteData.tags.join(', ')}*`;

                if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                await safeSend(quoteReport);

            } catch (error) {
                console.error("Quote API error:", error);
                
                // Fallback to Forismatic API (no API key needed)
                try {
                    const fallbackResponse = await axios.get(`https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en&key=${Math.floor(Math.random() * 1000000)}`);
                    const fallbackData = fallbackResponse.data;
                    
                    const fallbackReport = `💬 **${category.charAt(0).toUpperCase() + category.slice(1)} Quote**

"${fallbackData.quoteText}"

— **${fallbackData.quoteAuthor || 'Unknown'}**

*Source: Forismatic API*`;

                    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                    await safeSend(fallbackReport);
                } catch (fallbackError) {
                    console.error("Fallback quote API error:", fallbackError);
                    
                    if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
                    await safeSend(`❌ Could not fetch a ${category} quote at this time. Please try again later.`);
                }
            }

        } catch (error) {
            console.error("Quote command error:", error);
            await channel.send(`❌ Error: ${error.message || "Failed to fetch quote"}`);
        }
    }
};
