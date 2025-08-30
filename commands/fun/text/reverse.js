module.exports = {
    name: 'reverse',
    description: 'Reverse your text',
    execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide text to reverse.');
        }
        
        const text = args.join(' ');
        const reversed = text.split('').reverse().join('');
        channel.send(`🔁 ${reversed}`);
    }
};
