const CommandBase = require('../CommandBase');

// Game state storage
const blackjackGames = new Map();

module.exports = {
    name: 'blackjack',
    description: 'Play Blackjack against the dealer',
    aliases: ['bj', '21'],
    usage: 'blackjack [bet amount]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Check if player already has an active game
        if (blackjackGames.has(message.author.id)) {
            return base.sendError(channel, 'You already have an active Blackjack game!');
        }

        const betAmount = args.length > 0 ? parseInt(args[0]) : 10;
        
        if (isNaN(betAmount) || betAmount <= 0) {
            return base.sendError(channel, 'Please specify a valid bet amount.');
        }

        // Initialize game
        const game = {
            playerId: message.author.id,
            playerHand: [],
            dealerHand: [],
            deck: this.createDeck(),
            bet: betAmount,
            state: 'playing',
            message: null
        };

        // Deal initial cards
        game.playerHand.push(this.drawCard(game.deck));
        game.dealerHand.push(this.drawCard(game.deck));
        game.playerHand.push(this.drawCard(game.deck));
        game.dealerHand.push(this.drawCard(game.deck));

        blackjackGames.set(message.author.id, game);

        // Send initial game state
        await this.updateGameDisplay(channel, game, base);
    },

    createDeck() {
        const suits = ['♥', '♦', '♣', '♠'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ value, suit });
            }
        }
        
        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    },

    drawCard(deck) {
        return deck.pop();
    },

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        for (const card of hand) {
            if (card.value === 'A') {
                aces++;
                value += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }
        
        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    },

    async updateGameDisplay(channel, game, base) {
        let display = `🎰 **Blackjack** - Bet: ${game.bet}\n\n`;
        
        // Player hand
        display += `**Your Hand:** ${this.formatHand(game.playerHand)} (${this.calculateHandValue(game.playerHand)})\n`;
        
        // Dealer hand
        if (game.state === 'playing') {
            display += `**Dealer Hand:** ${game.dealerHand[0].value}${game.dealerHand[0].suit} ??\n`;
        } else {
            display += `**Dealer Hand:** ${this.formatHand(game.dealerHand)} (${this.calculateHandValue(game.dealerHand)})\n`;
        }
        
        // Game controls
        if (game.state === 'playing') {
            display += '\n**Actions:** Hit (h), Stand (s), Double (d)';
        } else {
            display += `\n**Result:** ${this.determineWinner(game)}`;
        }
        
        // Send or update message
        if (game.message) {
            await game.message.edit(display);
        } else {
            game.message = await channel.send(display);
        }
        
        // Set up reaction collector if still playing
        if (game.state === 'playing') {
            this.setupReactionCollector(game, channel, base);
        }
    },

    formatHand(hand) {
        return hand.map(card => `${card.value}${card.suit}`).join(' ');
    },

    determineWinner(game) {
        const playerValue = this.calculateHandValue(game.playerHand);
        const dealerValue = this.calculateHandValue(game.dealerHand);
        
        if (playerValue > 21) return 'You busted! Dealer wins.';
        if (dealerValue > 21) return 'Dealer busted! You win!';
        if (playerValue > dealerValue) return 'You win!';
        if (dealerValue > playerValue) return 'Dealer wins.';
        return 'Push! It\'s a tie.';
    },

    setupReactionCollector(game, channel, base) {
        const filter = (reaction, user) => {
            return ['🇭', '🇸', '🇩'].includes(reaction.emoji.name) && user.id === game.playerId;
        };
        
        const collector = game.message.createReactionCollector({ filter, time: 30000 });
        
        collector.on('collect', async (reaction, user) => {
            try {
                await reaction.users.remove(user.id);
                
                switch (reaction.emoji.name) {
                    case '🇭': // Hit
                        game.playerHand.push(this.drawCard(game.deck));
                        if (this.calculateHandValue(game.playerHand) > 21) {
                            game.state = 'dealer-turn';
                        }
                        break;
                        
                    case '🇸': // Stand
                        game.state = 'dealer-turn';
                        break;
                        
                    case '🇩': // Double
                        game.bet *= 2;
                        game.playerHand.push(this.drawCard(game.deck));
                        game.state = 'dealer-turn';
                        break;
                }
                
                // If it's dealer's turn, play dealer hand
                if (game.state === 'dealer-turn') {
                    await this.playDealerHand(game);
                    game.state = 'finished';
                }
                
                await this.updateGameDisplay(channel, game, base);
                
                if (game.state === 'finished') {
                    collector.stop();
                    blackjackGames.delete(game.playerId);
                }
            } catch (error) {
                console.error('Blackjack error:', error);
            }
        });
        
        collector.on('end', () => {
            if (game.state === 'playing') {
                channel.send('Game timed out.');
                blackjackGames.delete(game.playerId);
            }
        });
        
        // Add initial reactions
        game.message.react('🇭'); // H for Hit
        game.message.react('🇸'); // S for Stand
        game.message.react('🇩'); // D for Double
    },

    async playDealerHand(game) {
        while (this.calculateHandValue(game.dealerHand) < 17) {
            game.dealerHand.push(this.drawCard(game.deck));
        }
    }
};
