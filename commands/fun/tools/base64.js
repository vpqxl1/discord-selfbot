const CommandBase = require('../CommandBase');

module.exports = {
    name: 'base64',
    description: 'Encode/decode Base64 text',
    aliases: ['b64', 'encode64', 'decode64'],
    usage: 'base64 <encode|decode> <text>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendError(channel, 'Usage: v!base64 <encode|decode> <text>\nExample: v!base64 encode Hello World');
        }

        const operation = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        try {
            let result;
            let operationText;

            if (operation === 'encode') {
                result = Buffer.from(text).toString('base64');
                operationText = 'Encoded';
            } else if (operation === 'decode') {
                result = Buffer.from(text, 'base64').toString('utf8');
                operationText = 'Decoded';
            } else {
                return base.sendError(channel, 'Invalid operation. Use "encode" or "decode".');
            }

            const response = `
🔤 **Base64 ${operationText}**
**Input:** \`${text}\`
**Output:** \`\`\`
${result}
\`\`\`
            `.trim();

            await base.safeSend(channel, response);

        } catch (error) {
            if (operation === 'decode') {
                await base.sendError(channel, 'Invalid Base64 string. Make sure it\'s properly encoded.');
            } else {
                await base.sendError(channel, 'An error occurred during the operation.');
            }
        }
    }
};
