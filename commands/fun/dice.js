const CommandBase = require('../CommandBase');

module.exports = {
    name: 'dice',
    description: 'Roll dice with custom sides and quantity',
    aliases: ['roll', 'rolldice', 'diceroll'],
    usage: 'dice [quantity]d[sides]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        let diceExpression = '1d6'; // Default: 1 six-sided die
        
        if (args.length > 0) {
            diceExpression = args[0].toLowerCase();
        }

        try {
            const result = this.rollDice(diceExpression);
            
            const response = `
🎲 **Dice Roll: ${diceExpression}**
**Result:** ${result.total}
**Rolls:** ${result.rolls.join(', ')}
**Individual:** ${result.details}

${this.getDiceArt(result.total)}
            `.trim();

            await base.safeSend(channel, response);

        } catch (error) {
            await base.sendError(channel, 'Invalid dice format. Use: v!dice 2d6 (rolls 2 six-sided dice) or v!dice 1d20');
        }
    },

    rollDice(expression) {
        const match = expression.match(/^(\d+)d(\d+)$/i);
        if (!match) throw new Error('Invalid dice format');
        
        const quantity = parseInt(match[1]);
        const sides = parseInt(match[2]);
        
        if (quantity < 1 || quantity > 100) throw new Error('Quantity must be between 1-100');
        if (sides < 2 || sides > 1000) throw new Error('Sides must be between 2-1000');
        
        const rolls = [];
        let total = 0;
        let details = '';
        
        for (let i = 0; i < quantity; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
            
            if (i > 0) details += ' + ';
            details += `d${sides}(${roll})`;
        }
        
        if (quantity > 1) {
            details += ` = ${total}`;
        }
        
        return { total, rolls, details, expression: `${quantity}d${sides}` };
    },

    getDiceArt(total) {
        const diceFaces = {
            1: '┌───────┐\n│       │\n│   ●   │\n│       │\n└───────┘',
            2: '┌───────┐\n│ ●     │\n│       │\n│     ● │\n└───────┘',
            3: '┌───────┐\n│ ●     │\n│   ●   │\n│     ● │\n└───────┘',
            4: '┌───────┐\n│ ●   ● │\n│       │\n│ ●   ● │\n└───────┘',
            5: '┌───────┐\n│ ●   ● │\n│   ●   │\n│ ●   ● │\n└───────┘',
            6: '┌───────┐\n│ ●   ● │\n│ ●   ● │\n│ ●   ● │\n└───────┘'
        };
        
        const face = Math.min(6, Math.max(1, total));
        return diceFaces[face] || '🎲';
    }
};
