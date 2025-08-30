const CommandBase = require('../CommandBase');
const axios = require('axios');
const { MessageEmbed } = require('discord.js-selfbot-v13');

module.exports = {
    name: 'apod',
    description: 'Get NASA Astronomy Picture of the Day with improved embedding',
    aliases: ['nasa', 'astronomy', 'spacepic'],
    usage: 'apod [date YYYY-MM-DD]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY'; // Use DEMO_KEY if no API key set
        
        let dateParam = '';
        if (args.length > 0) {
            // Validate date format
            if (/^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
                dateParam = `&date=${args[0]}`;
            } else {
                return base.sendError(channel, 'Invalid date format. Please use YYYY-MM-DD.');
            }
        }

        try {
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}${dateParam}`);
            const data = response.data;

            if (data.media_type === 'image') {
                await this.sendImageAPOD(channel, data, base);
            } else if (data.media_type === 'video') {
                await this.sendVideoAPOD(channel, data, base);
            } else {
                await base.sendError(channel, 'Unknown media type from APOD API.');
            }
        } catch (error) {
            console.error('APOD command error:', error);
            
            if (error.response?.status === 404) {
                await base.sendError(channel, 'APOD not found for the specified date.');
            } else if (error.response?.status === 403) {
                await base.sendError(channel, 'API rate limit exceeded. Please try again later or use a NASA API key.');
            } else {
                await base.sendError(channel, 'Failed to fetch APOD. Please try again later.');
            }
        }
    },

    async sendImageAPOD(channel, data, base) {
        // Try multiple approaches to handle the image embedding issue
        try {
            // First approach: Try to create an embed with the image
            const embed = new MessageEmbed()
                .setTitle(data.title)
                .setDescription(data.explanation)
                .setImage(data.url)
                .setColor(0x0B3D91) // NASA blue
                .setFooter(`Date: ${data.date} | Credit: ${data.copyright || 'Public Domain'}`);

            const sentMessage = await channel.send({ embeds: [embed] });
            
            // Check if the image failed to load in the embed
            setTimeout(async () => {
                try {
                    // If the message has no embeds or the embed has no image, our embed failed
                    const messages = await channel.messages.fetch({ limit: 5 });
                    const ourMessage = messages.find(m => m.id === sentMessage.id);
                    
                    if (!ourMessage.embeds[0]?.image) {
                        await this.sendImageFallback(channel, data, base);
                        await ourMessage.delete().catch(() => {});
                    }
                } catch (error) {
                    console.error('Error checking embed status:', error);
                }
            }, 3000);
            
        } catch (error) {
            console.error('Embed approach failed, using fallback:', error);
            await this.sendImageFallback(channel, data, base);
        }
    },

    async sendImageFallback(channel, data, base) {
        // Alternative approach when embed fails
        try {
            // Try to download and send the image as an attachment
            const imageResponse = await axios.get(data.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);
            
            await channel.send({
                content: `🛰️ **NASA Astronomy Picture of the Day - ${data.date}**\n**${data.title}**\n\n${data.explanation}\n\n*Credit: ${data.copyright || 'Public Domain'}*`,
                files: [{
                    attachment: buffer,
                    name: 'nasa_apod.jpg'
                }]
            });
        } catch (error) {
            console.error('Download approach failed, using URL only:', error);
            
            // Final fallback: Just send the URL
            await channel.send(
                `🛰️ **NASA Astronomy Picture of the Day - ${data.date}**\n` +
                `**${data.title}**\n\n${data.explanation}\n\n` +
                `**Image URL:** ${data.url}\n` +
                `*Credit: ${data.copyright || 'Public Domain'}*`
            );
        }
    },

    async sendVideoAPOD(channel, data, base) {
        // For videos, we can't embed them directly, so we'll send the URL
        const embed = new MessageEmbed()
            .setTitle(data.title)
            .setDescription(`${data.explanation}\n\n**Video URL:** ${data.url}`)
            .setColor(0x0B3D91)
            .setFooter(`Date: ${data.date} | Credit: ${data.copyright || 'Public Domain'}`);

        await channel.send({ embeds: [embed] });
    }
};
