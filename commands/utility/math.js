const CommandBase = require('../CommandBase');

module.exports = {
    name: 'math',
    description: 'Evaluate a mathematical expression',
    aliases: ['calc', 'calculate'],
    usage: 'math <expression>',
    cooldown: 1000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a mathematical expression to evaluate.');
        }

        const expression = args.join(' ');
        
        try {
            // Basic math evaluation (safer than raw eval)
            // Still using a Function constructor but with strict sanitization
            const sanitized = expression.replace(/[^-+*/().0-9\s]/g, '');
            
            if (!sanitized) {
                return base.sendError(channel, 'Invalid mathematical expression.');
            }

            const result = new Function(`return (${sanitized})`)();
            
            if (result === undefined || result === null || isNaN(result)) {
                throw new Error('Invalid result');
            }

            await base.safeSend(channel, `🔢 **Math Expression:** \`${expression}\`\n✅ **Result:** \`${result.toLocaleString()}\``);
        } catch (error) {
            console.error('Math command error:', error);
            await base.sendError(channel, 'Failed to evaluate expression. Please use numbers and basic operators (+, -, *, /, (, )).');
        }
    }
};
