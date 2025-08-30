const CommandBase = require('../CommandBase');

module.exports = {
    name: 'color',
    description: 'Get information about a color (hex, rgb, hsl)',
    aliases: ['colour', 'hex', 'rgb'],
    usage: 'color <hex|rgb|color name>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide a color. Usage: v!color #ff0000 or v!color red or v!color rgb(255,0,0)');
        }

        const colorInput = args.join(' ').toLowerCase();
        let hex, rgb, hsl;

        try {
            // Parse different color formats
            if (colorInput.startsWith('#')) {
                hex = this.normalizeHex(colorInput);
                rgb = this.hexToRgb(hex);
                hsl = this.rgbToHsl(rgb);
            } else if (colorInput.startsWith('rgb')) {
                rgb = this.parseRgb(colorInput);
                hex = this.rgbToHex(rgb);
                hsl = this.rgbToHsl(rgb);
            } else if (colorInput.startsWith('hsl')) {
                hsl = this.parseHsl(colorInput);
                rgb = this.hslToRgb(hsl);
                hex = this.rgbToHex(rgb);
            } else {
                // Color name
                const namedColor = this.colorNames[colorInput];
                if (namedColor) {
                    hex = namedColor;
                    rgb = this.hexToRgb(hex);
                    hsl = this.rgbToHsl(rgb);
                } else {
                    return base.sendError(channel, 'Unknown color name. Use hex (#ff0000), rgb(r,g,b), or common color names.');
                }
            }

            const colorInfo = `
🎨 **Color Information**
• **HEX:** ${hex}
• **RGB:** rgb(${rgb.r}, ${rgb.g}, ${rgb.b})
• **HSL:** hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)
• **Preview:** ██████████ (${hex})
            `.trim();

            await base.safeSend(channel, colorInfo);

        } catch (error) {
            await base.sendError(channel, 'Invalid color format. Use: #ff0000, rgb(255,0,0), hsl(0,100%,50%), or common color names.');
        }
    },

    normalizeHex(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        return `#${hex}`;
    },

    hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    },

    rgbToHex(rgb) {
        return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
    },

    rgbToHsl(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    parseRgb(rgbString) {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
        if (!match) throw new Error('Invalid RGB format');
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
        };
    },

    parseHsl(hslString) {
        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i);
        if (!match) throw new Error('Invalid HSL format');
        return {
            h: parseInt(match[1]),
            s: parseInt(match[2]),
            l: parseInt(match[3])
        };
    },

    hslToRgb(hsl) {
        const h = hsl.h / 360;
        const s = hsl.s / 100;
        const l = hsl.l / 100;
        
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    colorNames: {
        'red': '#ff0000',
        'green': '#00ff00',
        'blue': '#0000ff',
        'yellow': '#ffff00',
        'purple': '#800080',
        'orange': '#ffa500',
        'pink': '#ffc0cb',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#808080',
        'grey': '#808080',
        'brown': '#a52a2a',
        'cyan': '#00ffff',
        'magenta': '#ff00ff',
        'lime': '#00ff00',
        'maroon': '#800000',
        'navy': '#000080',
        'olive': '#808000',
        'teal': '#008080',
        'silver': '#c0c0c0',
        'gold': '#ffd700',
        'violet': '#ee82ee',
        'indigo': '#4b0082'
    }
};
