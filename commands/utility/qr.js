const CommandBase = require('../CommandBase');

module.exports = {
    name: 'qr',
    description: 'Generate a QR code',
    aliases: ['qrcode', 'qrgen'],
    usage: 'qr <text_or_url>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide text or URL to encode.\nExample: `!qr https://discord.com`');
        }

        const data = args.join(' ');
        
        if (data.length > 500) {
            return base.sendError(channel, 'Text is too long. Maximum 500 characters.');
        }

        try {
            // Using QR Server API (free, no key needed)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
            
            const qrEmbed = {
                title: '📱 QR Code Generated',
                description: `Scan this QR code to access:\n\`\`\`${data.substring(0, 100)}${data.length > 100 ? '...' : ''}\`\`\``,
                color: 0x000000,
                image: { url: qrUrl },
                footer: { text: 'Scan with your phone camera' }
            };

            await base.sendEmbed(channel, qrEmbed);
        } catch (error) {
            console.error('QR command error:', error);
            await base.sendError(channel, 'Failed to generate QR code.');
        }
    }
};
