const CommandBase = require('../CommandBase');

module.exports = {
    name: 'screenshot',
    description: 'Take a screenshot of a website',
    aliases: ['ss', 'webshot'],
    usage: 'screenshot <url>',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a URL to screenshot.\nExample: `!screenshot https://discord.com`');
        }

        let url = args[0];
        
        // Add https:// if not present
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        try {
            // Validate URL
            new URL(url);
            
            // Using screenshot API (free service)
            const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(url)}`;
            
            const ssEmbed = {
                title: '📸 Website Screenshot',
                description: `Screenshot of: ${url}`,
                color: 0x5865F2,
                image: { url: screenshotUrl },
                footer: { text: 'Screenshot may take a moment to load' }
            };

            await base.sendEmbed(channel, ssEmbed);
        } catch (error) {
            console.error('Screenshot command error:', error);
            await base.sendError(channel, 'Invalid URL or failed to take screenshot.');
        }
    }
};
