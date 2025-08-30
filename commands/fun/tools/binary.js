const CommandBase = require('../CommandBase');

module.exports = {
    name: 'binary',
    description: 'Convert text to/from binary',
    aliases: ['bin', 'binaryconverter'],
    usage: 'binary <encode|decode> <text>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendError(channel, 'Usage: v!binary <encode|decode> <text>\nExample: v!binary encode Hello');
        }

        const operation = args[0].toLowerCase();
        const input = args.slice(1).join(' ');

        try {
            let result;
            let operationText;

            if (operation === 'encode') {
                result = this.textToBinary(input);
                operationText = 'Encoded';
            } else if (operation === 'decode') {
                result = this.binaryToText(input);
                operationText = 'Decoded';
            } else {
                return base.sendError(channel, 'Invalid operation. Use "encode" or "decode".');
            }

            const response = `
🔢 **Binary ${operationText}**
**Input:** \`${input}\`
**Output:** \`\`\`
${result}
\`\`\`
            `.trim();

            await base.safeSend(channel, response);

        } catch (error) {
            await base.sendError(channel, 'Invalid binary format or input too long.');
        }
    },

    textToBinary(text) {
        return text.split('').map(char => {
            const binary = char.charCodeAt(0).toString(2);
            return binary.padStart(8, '0');
        }).join(' ');
    },

    binaryToText(binary) {
        // Remove spaces and validate binary format
        const cleanBinary = binary.replace(/\s/g, '');
        if (!/^[01]+$/.test(cleanBinary) || cleanBinary.length % 8 !== 0) {
            throw new Error('Invalid binary format');
        }

        let result = '';
        for (let i = 0; i < cleanBinary.length; i += 8) {
            const byte = cleanBinary.substring(i, i + 8);
            const charCode = parseInt(byte, 2);
            result += String.fromCharCode(charCode);
        }
        return result;
    }
};
