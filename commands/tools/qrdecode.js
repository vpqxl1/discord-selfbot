const CommandBase = require('../CommandBase');
const axios = require('axios');
const jsQR = require('jsqr');
const Jimp = require('jimp');

module.exports = {
    name: 'qrdecode',
    description: 'Decode QR codes from images',
    aliases: ['qrread', 'qrcode'],
    usage: 'qrdecode <image URL>',
    cooldown: 8000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide an image URL or attach an image with a QR code.');
        }

        const imageUrl = args[0];
        
        try {
            // Download the image
            const response = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'arraybuffer'
            });
            
            // Load image with Jimp
            const image = await Jimp.read(response.data);
            
            // Convert to image data for jsQR
            const imageData = {
                data: new Uint8ClampedArray(image.bitmap.data),
                width: image.bitmap.width,
                height: image.bitmap.height
            };
            
            // Decode QR code
            const decoded = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (!decoded) {
                return base.sendError(channel, 'No QR code found in the image.');
            }
            
            const result = this.analyzeQRContent(decoded.data);
            
            const responseText = `
📱 **QR Code Decoded**
**Type:** ${result.type}
**Content:** 
\`\`\`
${decoded.data}
\`\`\`
**Channels:** ${decoded.channels}
**Version:** ${decoded.version}
            `.trim();
            
            await base.safeSend(channel, responseText);
            
        } catch (error) {
            console.error('QR decode error:', error);
            await base.sendError(channel, 'Failed to decode QR code. Please check the image URL and try again.');
        }
    },

    analyzeQRContent(content) {
        // Determine the type of content
        if (content.startsWith('http://') || content.startsWith('https://')) {
            return { type: 'URL' };
        } else if (content.startsWith('BEGIN:VCARD')) {
            return { type: 'Contact Card' };
        } else if (content.startsWith('WIFI:')) {
            return { type: 'WiFi Configuration' };
        } else if (content.match(/^[a-zA-Z0-9\+/=]{20,}$/) && content.length % 4 === 0) {
            return { type: 'Base64 Encoded' };
        } else if (content.match(/^[0-9]{10,}$/)) {
            return { type: 'Numeric Code' };
        } else {
            return { type: 'Text' };
        }
    }
};
