const CommandBase = require('../CommandBase');
const zlib = require('zlib');
const util = require('util');

const gzip = util.promisify(zlib.gzip);
const deflate = util.promisify(zlib.deflate);
const brotliCompress = util.promisify(zlib.brotliCompress);

module.exports = {
    name: 'compress',
    description: 'Compress text using various algorithms',
    aliases: ['zip', 'pack'],
    usage: 'compress <algorithm> <text>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 2) {
            return base.sendError(channel, 'Usage: v!compress <algorithm> <text>\nAlgorithms: gzip, deflate, brotli, lz77');
        }

        const algorithm = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        try {
            let compressed;
            let originalSize = Buffer.from(text).length;
            
            switch (algorithm) {
                case 'gzip':
                    compressed = await gzip(text);
                    break;
                    
                case 'deflate':
                    compressed = await deflate(text);
                    break;
                    
                case 'brotli':
                    compressed = await brotliCompress(text);
                    break;
                    
                case 'lz77':
                    compressed = this.lz77Compress(text);
                    break;
                    
                default:
                    return base.sendError(channel, 'Invalid algorithm. Available: gzip, deflate, brotli, lz77');
            }
            
            const compressedSize = Buffer.from(compressed).length;
            const ratio = (compressedSize / originalSize * 100).toFixed(1);
            
            const response = `
📦 **Text Compression**
**Algorithm:** ${algorithm.toUpperCase()}
**Original Size:** ${originalSize} bytes
**Compressed Size:** ${compressedSize} bytes
**Compression Ratio:** ${ratio}%

**Compressed Data (Base64):**
\`\`\`
${Buffer.from(compressed).toString('base64')}
\`\`\`
            `.trim();
            
            await base.safeSend(channel, response);
            
        } catch (error) {
            console.error('Compression error:', error);
            await base.sendError(channel, 'Failed to compress text. Please check your inputs.');
        }
    },

    lz77Compress(text) {
        // Simple LZ77-like compression implementation
        const result = [];
        let pos = 0;
        
        while (pos < text.length) {
            let bestMatch = { offset: 0, length: 0 };
            
            // Search for the longest match in the lookback window
            for (let offset = 1; offset <= Math.min(255, pos); offset++) {
                const start = pos - offset;
                let length = 0;
                
                while (length < 255 && 
                       pos + length < text.length && 
                       text[start + length] === text[pos + length]) {
                    length++;
                }
                
                if (length > bestMatch.length) {
                    bestMatch = { offset, length };
                }
            }
            
            if (bestMatch.length > 2) {
                // Found a good match
                result.push(0x80 | bestMatch.offset); // Flag + offset
                result.push(bestMatch.length);
                pos += bestMatch.length;
            } else {
                // No good match, output literal
                result.push(text.charCodeAt(pos));
                pos++;
            }
        }
        
        return Buffer.from(result);
    }
};
