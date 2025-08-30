module.exports = {
    name: 'slotmachine',
    description: 'Play a simple slot machine.',
    execute(channel, message, client, args) {
        const symbols = ['🍒','🍋','🍉','⭐','7️⃣','💎'];
        const slot = [symbols[Math.floor(Math.random()*symbols.length)],
                      symbols[Math.floor(Math.random()*symbols.length)],
                      symbols[Math.floor(Math.random()*symbols.length)]];
        const result = slot[0] === slot[1] && slot[1] === slot[2] ? '🎉 You won!' : '😢 Try again!';
        message.channel.send(`${slot.join(' | ')}\n${result}`);
    }
};
