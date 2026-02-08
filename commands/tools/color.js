const CommandBase = require('../CommandBase');
const tinycolor = require('tinycolor2');

module.exports = {
    name: 'color',
    description: 'Get information about a color',
    aliases: ['colour', 'hex'],
    usage: 'color <hex|rgb|color_name>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!args.length) {
            return base.sendWarning(channel, 'Please provide a color.\nExamples: `!color #5865F2`, `!color rgb(88, 101, 242)`, `!color blue`');
        }

        const colorInput = args.join(' ');
        const color = tinycolor(colorInput);
        
        if (!color.isValid()) {
            return base.sendError(channel, 'Invalid color. Please use hex (#RRGGBB), rgb(r,g,b), or common color names.');
        }

        const hex = color.toHexString().toUpperCase();
        const rgb = color.toRgb();
        const hsl = color.toHsl();
        const hsv = color.toHsv();

        const colorEmbed = {
            title: `🎨 Color Information`,
            color: parseInt(hex.replace('#', ''), 16),
            fields: [
                {
                    name: '🔢 HEX',
                    value: `\`${hex}\``,
                    inline: true
                },
                {
                    name: '🌈 RGB',
                    value: `\`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\``,
                    inline: true
                },
                {
                    name: '🎨 HSL',
                    value: `\`hsl(${Math.round(hsl.h)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)\``,
                    inline: true
                },
                {
                    name: '💡 HSV',
                    value: `\`hsv(${Math.round(hsv.h)}°, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)\``,
                    inline: true
                },
                {
                    name: '🔆 Brightness',
                    value: `${Math.round(color.getBrightness())}/255`,
                    inline: true
                },
                {
                    name: '⚫⚪ Luminance',
                    value: `${color.getLuminance().toFixed(3)}`,
                    inline: true
                }
            ],
            thumbnail: { url: `https://singlecolorimage.com/get/${hex.replace('#', '')}/100x100` }
        };

        await base.sendEmbed(channel, colorEmbed);
    }
};
