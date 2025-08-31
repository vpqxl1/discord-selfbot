const CommandBase = require('../CommandBase');
const axios = require('axios');

module.exports = {
    name: 'unshorten',
    description: 'Unshorten URLs and reveal destination',
    aliases: ['expand', 'url'],
    usage: 'unshorten <URL>',
    cooldown: 4000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide a shortened URL to expand.');
        }

        const shortUrl = args[0];
        
        if (!this.isValidUrl(shortUrl)) {
            return base.sendError(channel, 'Please provide a valid URL.');
        }

        try {
            const result = await this.unshortenUrl(shortUrl);
            
            const response = `
🔗 **URL Unshortener**
**Short URL:** ${shortUrl}
**Destination:** ${result.url}
**Redirects:** ${result.redirects}
**Final Status:** ${result.status}
**Content Type:** ${result.contentType}
**Security:** ${this.checkSecurity(result)}
            `.trim();
            
            await base.safeSend(channel, response);
            
        } catch (error) {
            console.error('Unshorten error:', error);
            await base.sendError(channel, 'Failed to unshorten URL. It may be invalid or inaccessible.');
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

    async unshortenUrl(url) {
        let currentUrl = url;
        const redirects = [];
        let finalStatus = 0;
        let contentType = '';
        
        // Follow redirects with a limit
        for (let i = 0; i < 10; i++) {
            try {
                const response = await axios.head(currentUrl, {
                    maxRedirects: 0,
                    validateStatus: null,
                    timeout: 5000
                });
                
                finalStatus = response.status;
                contentType = response.headers['content-type'] || '';
                
                if (response.status >= 300 && response.status < 400 && response.headers.location) {
                    redirects.push({
                        from: currentUrl,
                        to: response.headers.location,
                        status: response.status
                    });
                    currentUrl = response.headers.location;
                } else {
                    break;
                }
            } catch (error) {
                throw new Error(`Failed to resolve URL: ${error.message}`);
            }
        }
        
        return {
            url: currentUrl,
            redirects: redirects.length,
            status: finalStatus,
            contentType: contentType,
            chain: redirects
        };
    },

    checkSecurity(result) {
        const security = [];
        
        // Check for HTTPS
        if (result.url.startsWith('https://')) {
            security.push('HTTPS Secure');
        } else {
            security.push('HTTP (Not Secure)');
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /bit\.ly/i,
            /tinyurl\.com/i,
            /goo\.gl/i,
            /t\.co/i,
            /ow\.ly/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(result.url))) {
            security.push('Suspicious Shortener');
        }
        
        // Check for known malicious domains
        const maliciousDomains = [
            'example-malicious.com',
            // Add more known malicious domains as needed
        ];
        
        const domain = new URL(result.url).hostname;
        if (maliciousDomains.includes(domain)) {
            security.push('Known Malicious Domain');
        }
        
        return security.join(', ') || 'No security issues detected';
    }
};
