const CommandBase = require('../CommandBase');
const crypto = require('crypto');

module.exports = {
    name: 'encrypt',
    description: 'Encrypt text using various algorithms',
    aliases: ['cipher', 'encode'],
    usage: 'encrypt <algorithm> <text> [key]',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendError(channel, 'Usage: v!encrypt <algorithm> <text> [key]\nAlgorithms: caesar, aes, xor, base64');
        }

        const algorithm = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        try {
            let result;
            let method;
            
            switch (algorithm) {
                case 'caesar':
                    result = this.caesarCipher(text, 3);
                    method = 'Caesar Cipher (shift 3)';
                    break;
                    
                case 'aes':
                    const key = args.length > 2 ? args[args.length - 1] : 'defaultkey';
                    result = this.aesEncrypt(text, key);
                    method = 'AES-256 Encryption';
                    break;
                    
                case 'xor':
                    const xorKey = args.length > 2 ? args[args.length - 1] : 'key';
                    result = this.xorEncrypt(text, xorKey);
                    method = 'XOR Encryption';
                    break;
                    
                case 'base64':
                    result = Buffer.from(text).toString('base64');
                    method = 'Base64 Encoding';
                    break;
                    
                default:
                    return base.sendError(channel, 'Invalid algorithm. Available: caesar, aes, xor, base64');
            }
            
            const response = `
🔐 **Text Encryption**
**Method:** ${method}
**Original:** ${text.length > 50 ? text.substring(0, 50) + '...' : text}
**Encrypted:** \`\`\`
${result}
\`\`\`
            `.trim();
            
            await base.safeSend(channel, response);
            
        } catch (error) {
            console.error('Encryption error:', error);
            await base.sendError(channel, 'Failed to encrypt text. Please check your inputs.');
        }
    },

    caesarCipher(text, shift) {
        return text.split('').map(char => {
            if (char.match(/[a-z]/i)) {
                const code = char.charCodeAt(0);
                const base = code >= 65 && code <= 90 ? 65 : 97;
                return String.fromCharCode(((code - base + shift) % 26) + base);
            }
            return char;
        }).join('');
    },

    aesEncrypt(text, key) {
        const cipher = crypto.createCipheriv('aes-256-gcm', 
            crypto.createHash('sha256').update(key).digest(), 
            crypto.randomBytes(16)
        );
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return encrypted;
    },

    xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return Buffer.from(result).toString('base64');
    }
};
