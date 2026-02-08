const CommandBase = require('../CommandBase');

module.exports = {
    name: 'calculator',
    description: 'Advanced calculator with multiple operations',
    aliases: ['calc2'],
    usage: 'calculator <operation> <numbers...>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendWarning(channel, 'Please provide an operation and numbers.\nOperations: add, subtract, multiply, divide, power, sqrt, percent\nExample: `!calculator add 5 10 15`');
        }

        const operation = args[0].toLowerCase();
        const numbers = args.slice(1).map(n => parseFloat(n)).filter(n => !isNaN(n));

        if (numbers.length === 0) {
            return base.sendError(channel, 'Please provide valid numbers.');
        }

        let result;
        let operationName;

        try {
            switch (operation) {
                case 'add':
                case '+':
                    result = numbers.reduce((a, b) => a + b, 0);
                    operationName = 'Addition';
                    break;
                
                case 'subtract':
                case '-':
                    result = numbers.reduce((a, b) => a - b);
                    operationName = 'Subtraction';
                    break;
                
                case 'multiply':
                case '*':
                    result = numbers.reduce((a, b) => a * b, 1);
                    operationName = 'Multiplication';
                    break;
                
                case 'divide':
                case '/':
                    if (numbers.includes(0) && numbers.indexOf(0) > 0) {
                        return base.sendError(channel, 'Cannot divide by zero.');
                    }
                    result = numbers.reduce((a, b) => a / b);
                    operationName = 'Division';
                    break;
                
                case 'power':
                case '^':
                    if (numbers.length !== 2) {
                        return base.sendError(channel, 'Power operation requires exactly 2 numbers.');
                    }
                    result = Math.pow(numbers[0], numbers[1]);
                    operationName = 'Power';
                    break;
                
                case 'sqrt':
                case 'squareroot':
                    result = numbers.map(n => Math.sqrt(n));
                    operationName = 'Square Root';
                    break;
                
                case 'percent':
                case '%':
                    if (numbers.length !== 2) {
                        return base.sendError(channel, 'Percent operation requires exactly 2 numbers (value, percentage).');
                    }
                    result = (numbers[0] * numbers[1]) / 100;
                    operationName = 'Percentage';
                    break;
                
                default:
                    return base.sendError(channel, 'Invalid operation. Available: add, subtract, multiply, divide, power, sqrt, percent');
            }

            const calcEmbed = {
                title: `🔢 ${operationName}`,
                color: 0x3498DB,
                fields: [
                    {
                        name: '📥 Input',
                        value: `\`${numbers.join(', ')}\``,
                        inline: false
                    },
                    {
                        name: '📤 Result',
                        value: `\`${Array.isArray(result) ? result.map(r => r.toFixed(4)).join(', ') : result.toLocaleString()}\``,
                        inline: false
                    }
                ]
            };

            await base.sendEmbed(channel, calcEmbed);
        } catch (error) {
            console.error('Calculator command error:', error);
            await base.sendError(channel, 'An error occurred during calculation.');
        }
    }
};
