// exchange.js
const axios = require('axios');

module.exports = {
    name: 'exchange',
    description: 'Converts an amount from one currency to another.',
    /**
     * Executes the exchange command.
     * 
     * @param {Channel} channel The channel where the command was executed.
     * @param {Message} message The message object for the command.
     * @param {Client} client The client or bot instance.
     * @param {String[]} args The arguments passed with the command.
     */
    async execute(channel, message, client, args) {
        if (args.length !== 4 || args[2].toLowerCase() !== 'to') {
            message.channel.send('Usage: [prefix]exchange [amount] [from_currency] to [to_currency]');
            return;
        }

        const amount = parseFloat(args[0]);
        const fromCurrency = args[1].toUpperCase();
        const toCurrency = args[3].toUpperCase();

        if (isNaN(amount)) {
            message.channel.send('Invalid amount. Please provide a numerical value.');
            return;
        }

        try {
            // Fetch exchange rates from a reliable API
            const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
            const exchangeRate = response.data.rates[toCurrency];

            if (!exchangeRate) {
                message.channel.send(`Exchange rate from ${fromCurrency} to ${toCurrency} not available.`);
                return;
            }

            const convertedAmount = (amount * exchangeRate).toFixed(2);
            message.channel.send(`${amount} ${fromCurrency} is equal to ${convertedAmount} ${toCurrency}.`);
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            message.channel.send('❌ Error fetching exchange rates. Please try again later.');
        }
    }
};

