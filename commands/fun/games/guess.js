const games = new Map();

module.exports = {
    name: 'guess',
    description: 'Play a number guessing game',
    execute(channel, message, client, args) {
        if (!games.has(message.channel.id)) {
            // Start new game
            const number = Math.floor(Math.random() * 100) + 1;
            games.set(message.channel.id, {
                number: number,
                attempts: 0
            });
            
            return channel.send('🎮 I\'m thinking of a number between 1 and 100. Guess it!');
        }
        
        if (!args.length) {
            return channel.send('Please guess a number between 1 and 100.');
        }
        
        const guess = parseInt(args[0]);
        if (isNaN(guess) || guess < 1 || guess > 100) {
            return channel.send('Please enter a valid number between 1 and 100.');
        }
        
        const game = games.get(message.channel.id);
        game.attempts++;
        
        if (guess === game.number) {
            channel.send(`🎉 Correct! You guessed the number in ${game.attempts} attempts!`);
            games.delete(message.channel.id);
        } else if (guess < game.number) {
            channel.send(`🔺 Too low! Try a higher number. (Attempt ${game.attempts})`);
        } else {
            channel.send(`🔻 Too high! Try a lower number. (Attempt ${game.attempts})`);
        }
    }
};
