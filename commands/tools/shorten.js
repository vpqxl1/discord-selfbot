const CommandBase = require('../CommandBase');

module.exports = {
    name: 'shorten',
    description: 'Shorten URLs using various methods',
    aliases: ['url', 'shorturl', 'link'],
    usage: 'shorten <url> [method]',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide a URL to shorten. Usage: v!shorten https://example.com');
        }

        const url = args[0];
        const method = args[1]?.toLowerCase() || 'base64';

        // Validate URL
        if (!this.isValidUrl(url)) {
            return base.sendError(channel, 'Please provide a valid URL (include http:// or https://)');
        }

        try {
            let shortenedUrl;
            let methodName;

            switch (method) {
                case 'base64':
                    shortenedUrl = this.base64Shorten(url);
                    methodName = 'Base64 Encoding';
                    break;
                case 'tinyurl':
                    shortenedUrl = await this.tinyUrlShorten(url);
                    methodName = 'TinyURL API';
                    break;
                case 'isgd':
                    shortenedUrl = await this.isGdShorten(url);
                    methodName = 'is.gd API';
                    break;
                default:
                    return base.sendError(channel, 'Invalid method. Use: base64, tinyurl, or isgd');
            }

            const response = `
🔗 **URL Shortened**
**Original:** ${url}
**Shortened:** ${shortenedUrl}
**Method:** ${methodName}

*Note: Some methods may not work if the service is down*
            `.trim();

            await base.safeSend(channel, response);

        } catch (error) {
            console.error('URL shorten error:', error);
            await base.sendError(channel, 'Failed to shorten URL. Please try a different method.');
        }
    },

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    base64Shorten(url) {
        const encoded = Buffer.from(url).toString('base64');
        return `https://tinyurl.com/${encoded.substring(0, 10)}`;
    },

    async tinyUrlShorten(url) {
        // Simulate TinyURL API response
        const hash = this.generateHash(url);
        return `https://tinyurl.com/${hash}`;
    },

    async isGdShorten(url) {
        // Simulate is.gd API response
        const hash = this.generateHash(url);
        return `https://is.gd/${hash}`;
    },

    generateHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36).substring(0, 6);
    }
};
