const CommandBase = require('../CommandBase');
const axios = require('axios');
const Jimp = require('jimp');
const tinycolor = require('tinycolor2');

module.exports = {
    name: 'palette',
    description: 'Generate color palettes from images or color values',
    aliases: ['colors', 'scheme'],
    usage: 'palette <image URL|color>',
    cooldown: 6000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide an image URL or color value.');
        }

        const input = args[0];
        
        try {
            let palette;
            
            if (this.isColor(input)) {
                // Generate palette from single color
                palette = this.generatePaletteFromColor(input);
            } else if (this.isUrl(input)) {
                // Extract palette from image
                palette = await this.extractPaletteFromImage(input);
            } else {
                return base.sendError(channel, 'Please provide a valid image URL or color value.');
            }
            
            const response = this.formatPaletteResponse(palette);
            await base.safeSend(channel, response);
            
        } catch (error) {
            console.error('Palette error:', error);
            await base.sendError(channel, 'Failed to generate palette. Please check your input and try again.');
        }
    },

    isColor(input) {
        return tinycolor(input).isValid();
    },

    isUrl(input) {
        try {
            new URL(input);
            return true;
        } catch {
            return false;
        }
    },

    generatePaletteFromColor(color) {
        const baseColor = tinycolor(color);
        const palette = {
            original: baseColor.toHexString(),
            monochromatic: this.generateMonochromatic(baseColor),
            analogous: this.generateAnalogous(baseColor),
            complementary: this.generateComplementary(baseColor),
            triadic: this.generateTriadic(baseColor),
            tetradic: this.generateTetradic(baseColor)
        };
        
        return palette;
    },

    async extractPaletteFromImage(url) {
        // Download image
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer'
        });
        
        // Load image with Jimp
        const image = await Jimp.read(response.data);
        
        // Resize for faster processing
        image.resize(100, Jimp.AUTO);
        
        // Extract dominant colors
        const colors = this.extractColorsFromImage(image);
        
        return {
            dominant: colors.slice(0, 5),
            image: url
        };
    },

    extractColorsFromImage(image) {
        const colorMap = new Map();
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        // Sample pixels from the image
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                const color = Jimp.intToRGBA(image.getPixelColor(x, y));
                const hex = tinycolor({ r: color.r, g: color.g, b: color.b }).toHexString();
                
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }
        }
        
        // Sort by frequency and return top colors
        return Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .slice(0, 10);
    },

    generateMonochromatic(baseColor) {
        return [
            baseColor.clone().lighten(20).toHexString(),
            baseColor.clone().lighten(10).toHexString(),
            baseColor.toHexString(),
            baseColor.clone().darken(10).toHexString(),
            baseColor.clone().darken(20).toHexString()
        ];
    },

    generateAnalogous(baseColor) {
        return [
            baseColor.clone().spin(-30).toHexString(),
            baseColor.clone().spin(-15).toHexString(),
            baseColor.toHexString(),
            baseColor.clone().spin(15).toHexString(),
            baseColor.clone().spin(30).toHexString()
        ];
    },

    generateComplementary(baseColor) {
        return [
            baseColor.toHexString(),
            baseColor.clone().complement().toHexString()
        ];
    },

    generateTriadic(baseColor) {
        return [
            baseColor.toHexString(),
            baseColor.clone().spin(120).toHexString(),
            baseColor.clone().spin(240).toHexString()
        ];
    },

    generateTetradic(baseColor) {
        return [
            baseColor.toHexString(),
            baseColor.clone().spin(90).toHexString(),
            baseColor.clone().spin(180).toHexString(),
            baseColor.clone().spin(270).toHexString()
        ];
    },

    formatPaletteResponse(palette) {
        let response = '🎨 **Color Palette Generator**\n\n';
        
        if (palette.image) {
            response += `**Source Image:** ${palette.image}\n`;
            response += `**Dominant Colors:**\n`;
            
            palette.dominant.forEach((color, index) => {
                response += `${index + 1}. ${this.getColorBlock(color)} \`${color}\`\n`;
            });
        } else {
            response += `**Base Color:** ${this.getColorBlock(palette.original)} \`${palette.original}\`\n\n`;
            
            response += `**Monochromatic:** ${palette.monochromatic.map(c => this.getColorBlock(c)).join(' ')}\n`;
            response += `**Analogous:** ${palette.analogous.map(c => this.getColorBlock(c)).join(' ')}\n`;
            response += `**Complementary:** ${palette.complementary.map(c => this.getColorBlock(c)).join(' ')}\n`;
            response += `**Triadic:** ${palette.triadic.map(c => this.getColorBlock(c)).join(' ')}\n`;
            response += `**Tetradic:** ${palette.tetradic.map(c => this.getColorBlock(c)).join(' ')}\n`;
        }
        
        return response;
    },

    getColorBlock(color) {
        return `\`■\``; // Using a block character to represent color
    }
};
