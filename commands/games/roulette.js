const CommandBase = require('../CommandBase');

module.exports = {
    name: 'roulette',
    description: 'Play Roulette with various betting options',
    aliases: ['roul', 'wheel'],
    usage: 'roulette <bet> <amount>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendError(channel, 'Usage: v!roulette <bet> <amount>\nExample: v!roulette red 10');
        }

        const betType = args[0].toLowerCase();
        const betAmount = parseInt(args[1]);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            return base.sendError(channel, 'Please specify a valid bet amount.');
        }

        // Validate bet type
        const validBets = this.getValidBets();
        if (!validBets[betType]) {
            return base.sendError(channel, `Invalid bet type. Available bets: ${Object.keys(validBets).join(', ')}`);
        }

        // Spin the wheel
        const result = this.spinWheel();
        const won = this.checkWin(betType, result);
        const payout = won ? this.calculatePayout(betType, betAmount) : -betAmount;

        // Display result
        const display = `
🎡 **Roulette** - Bet: ${betAmount} on ${betType}
**Wheel Result:** ${result.number} ${result.color}
**Outcome:** ${won ? 'WIN' : 'LOSE'} ${won ? `+${payout}` : payout}
${this.getWheelVisualization(result)}
        `.trim();

        await base.safeSend(channel, display);
    },

    spinWheel() {
        const numbers = [];
        for (let i = 0; i < 37; i++) numbers.push(i); // 0-36
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        let color;
        if (number === 0) {
            color = 'green';
        } else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
            color = 'red';
        } else {
            color = 'black';
        }
        
        return { number, color };
    },

    getValidBets() {
        return {
            'red': { type: 'color', payout: 1 },
            'black': { type: 'color', payout: 1 },
            'green': { type: 'color', payout: 35 },
            'even': { type: 'even/odd', payout: 1 },
            'odd': { type: 'even/odd', payout: 1 },
            'high': { type: 'high/low', payout: 1 }, // 19-36
            'low': { type: 'high/low', payout: 1 }, // 1-18
            '1st12': { type: 'dozen', payout: 2 }, // 1-12
            '2nd12': { type: 'dozen', payout: 2 }, // 13-24
            '3rd12': { type: 'dozen', payout: 2 }, // 25-36
            '1-18': { type: 'half', payout: 1 },
            '19-36': { type: 'half', payout: 1 }
        };
    },

    checkWin(betType, result) {
        const number = result.number;
        
        switch (betType) {
            case 'red': return result.color === 'red';
            case 'black': return result.color === 'black';
            case 'green': return number === 0;
            case 'even': return number !== 0 && number % 2 === 0;
            case 'odd': return number !== 0 && number % 2 === 1;
            case 'high': return number >= 19 && number <= 36;
            case 'low': return number >= 1 && number <= 18;
            case '1st12': return number >= 1 && number <= 12;
            case '2nd12': return number >= 13 && number <= 24;
            case '3rd12': return number >= 25 && number <= 36;
            case '1-18': return number >= 1 && number <= 18;
            case '19-36': return number >= 19 && number <= 36;
            default: return false;
        }
    },

    calculatePayout(betType, betAmount) {
        const bets = this.getValidBets();
        return betAmount * bets[betType].payout;
    },

    getWheelVisualization(result) {
        // Simple text-based wheel visualization
        const wheel = `
    ┌─────────────────┐
    │    ROULETTE     │
    ├─────────────────┤
    │       ${result.number} ${result.color.toUpperCase()}     │
    └─────────────────┘
        `.trim();
        
        return wheel;
    }
};
