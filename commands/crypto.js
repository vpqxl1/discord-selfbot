const axios = require('axios');

module.exports = {
    name: 'crypto',
    description: '📈 Fetches detailed info about any cryptocurrency.',
    /**
     * Executes the price command.
     * 
     * @param {Channel} channel The channel where the command was executed.
     * @param {Message} message The message object for the command.
     * @param {Client} client The client or bot instance.
     * @param {String[]} args The arguments passed with the command.
     */
    async execute(channel, message, client, args) {
        if (!args.length) {
            return message.channel.send('⚠️ Please provide a cryptocurrency (e.g. `!price bitcoin` or `!price eth`).');
        }

        const coin = args[0].toLowerCase();

        try {
            // Fetch crypto details from CoinGecko
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
            const data = response.data;

            if (!data || !data.market_data) {
                return message.channel.send(`❌ Could not find data for **${coin}**. Please check the coin ID on CoinGecko.`);
            }

            const name = data.name;
            const symbol = data.symbol.toUpperCase();
            const price = data.market_data.current_price.usd.toLocaleString();
            const change24h = data.market_data.price_change_percentage_24h?.toFixed(2) || 0;
            const marketCap = data.market_data.market_cap.usd.toLocaleString();
            const volume = data.market_data.total_volume.usd.toLocaleString();
            const high24h = data.market_data.high_24h.usd.toLocaleString();
            const low24h = data.market_data.low_24h.usd.toLocaleString();

            // Embed-like styled message
            const infoMessage = 
`📊 **${name} (${symbol})**
💰 Price: **$${price}**
📈 24h Change: **${change24h}%**
🏦 Market Cap: **$${marketCap}**
📊 24h Volume: **$${volume}**
🔼 24h High: **$${high24h}**
🔽 24h Low: **$${low24h}**`;

            message.channel.send(infoMessage);
        } catch (error) {
            console.error('Error fetching crypto data:', error.response?.data || error.message);
            message.channel.send('❌ Error fetching crypto info. Please try again later.');
        }
    }
};

