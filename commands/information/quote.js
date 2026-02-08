const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'quote',
    description: 'Get inspirational quotes by category',
    aliases: ['inspire', 'motivation'],
    usage: 'quote [category]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Available categories for ZenQuotes
        const categories = [
            'philosophy', 'fiction', 'inspirational', 'life', 'love', 
            'humor', 'science', 'technology', 'art', 'literature',
            'success', 'wisdom', 'motivational', 'spiritual', 'friendship'
        ];

        let category = '';
        if (args.length > 0) {
            const requested = args[0].toLowerCase();
            if (categories.includes(requested)) {
                category = requested;
            } else {
                return base.sendWarning(channel, `Invalid category. Available: ${categories.join(', ')}`);
            }
        }

        try {
            // Using ZenQuotes
            const url = category ? `https://zenquotes.io/api/random/${category}` : 'https://zenquotes.io/api/random';
            const response = await axios.get(url);
            const data = response.data[0];
            
            if (!data || !data.q) {
                throw new Error('Invalid response from quote service');
            }

            const quoteEmbed = {
                title: `💡 ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Inspirational'} Quote`,
                description: `*${data.q}*`,
                color: 0xF1C40F,
                footer: { text: `— ${data.a}` }
            };

            await base.sendEmbed(channel, quoteEmbed);
        } catch (error) {
            console.error('Quote command error:', error);
            // Fallback to Quotable
            try {
                const quotableUrl = category ? `https://api.quotable.io/random?tags=${category}` : 'https://api.quotable.io/random';
                const qResponse = await axios.get(quotableUrl);
                const qData = qResponse.data;
                
                await base.sendEmbed(channel, {
                    title: '💡 Quote',
                    description: `*${qData.content}*`,
                    color: 0xF1C40F,
                    footer: { text: `— ${qData.author}` }
                });
            } catch (err) {
                await base.sendError(channel, 'Failed to fetch a quote. Please try again later.');
            }
        }
    }
};
