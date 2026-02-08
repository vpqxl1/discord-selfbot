const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'crypto',
    description: 'Get detailed information about a cryptocurrency',
    aliases: ['coin', 'price'],
    usage: 'crypto <coin_id>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a cryptocurrency ID (e.g., `bitcoin`, `ethereum`, `dogecoin`).');
        }

        const coin = args[0].toLowerCase();
        
        try {
            // Using CoinGecko API
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
            const data = response.data;
            
            if (!data || !data.market_data) {
                return base.sendError(channel, `Could not find data for "${coin}". Please use full names like \`bitcoin\`.`);
            }

            const marketData = data.market_data;
            const change24h = marketData.price_change_percentage_24h || 0;

            const cryptoEmbed = {
                title: `🪙 ${data.name} (${data.symbol.toUpperCase()})`,
                thumbnail: { url: data.image.small },
                color: change24h >= 0 ? 0x2ECC71 : 0xE74C3C,
                fields: [
                    {
                        name: '💰 Price',
                        value: `**$${marketData.current_price.usd.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '📈 24h Change',
                        value: `${change24h.toFixed(2)}%`,
                        inline: true
                    },
                    {
                        name: '🏦 Market Cap',
                        value: `$${marketData.market_cap.usd.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '📊 24h High/Low',
                        value: `High: $${marketData.high_24h.usd.toLocaleString()}\nLow: $${marketData.low_24h.usd.toLocaleString()}`,
                        inline: false
                    }
                ],
                footer: { text: 'Data provided by CoinGecko' },
                timestamp: new Date()
            };

            await base.sendEmbed(channel, cryptoEmbed);
        } catch (error) {
            console.error('Crypto command error:', error);
            // Fallback for symbols if full name fails
            try {
                const fallbackRes = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${coin.toUpperCase()}&tsyms=USD`);
                if (fallbackRes.data.USD) {
                    await base.safeSend(channel, `🪙 **${coin.toUpperCase()}**: $${fallbackRes.data.USD.toLocaleString()}`);
                } else {
                    await base.sendError(channel, 'Could not fetch data. Try using the full coin name (e.g., `bitcoin`).');
                }
            } catch (err) {
                await base.sendError(channel, 'Failed to fetch cryptocurrency data.');
            }
        }
    }
};
