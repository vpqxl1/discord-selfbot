module.exports = {
    name: 'rps',
    description: 'Play Rock Paper Scissors',
    execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please choose rock, paper, or scissors.');
        }
        
        const choices = ['rock', 'paper', 'scissors'];
        const userChoice = args[0].toLowerCase();
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        
        if (!choices.includes(userChoice)) {
            return channel.send('Please choose rock, paper, or scissors.');
        }
        
        let result;
        if (userChoice === botChoice) {
            result = "It's a tie!";
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win!';
        } else {
            result = 'I win!';
        }
        
        const emojis = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️'
        };
        
        channel.send(`${emojis[userChoice]} vs ${emojis[botChoice]}\n\n**${result}**`);
    }
};
