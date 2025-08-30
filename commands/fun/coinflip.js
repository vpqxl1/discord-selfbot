module.exports = {
    name: 'coinflip',
    description: 'Flip a coin',
    execute(channel, message, client, args) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        message.channel.send(`🪙 The coin landed on **${result}**!`);
    }
};
