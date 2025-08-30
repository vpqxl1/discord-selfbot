const QRCode = require('qrcode');

module.exports = {
    name: 'qrcode',
    description: 'Generates a QR code for a given link.',
    async execute(channel, message, client, args) {
        const link = args[0];
        
        if (!link) {
            return message.channel.send('Please provide a link to generate a QR code.');
        }

        try {
            const qrImage = await QRCode.toBuffer(link);
            await message.channel.send({
                files: [{ attachment: qrImage, name: 'qrcode.png' }]
            });
        } catch (error) {
            console.error(error);
            message.channel.send('Failed to generate QR code. Make sure the link is valid.');
        }
    }
};

