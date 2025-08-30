const CommandBase = require('../CommandBase');
const axios = require('axios');
const { MessageAttachment } = require('discord.js-selfbot-v13');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Get config with NASA API key
const config = require('../../config');

module.exports = {
    name: 'apod',
    description: 'Get NASA Astronomy Picture of the Day with direct image attachment',
    aliases: ['nasa', 'astronomy', 'spacepic'],
    usage: 'apod [date: today|yesterday|YYYY-MM-DD]',
    cooldown: 8000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Get NASA API key from config, fall back to DEMO_KEY if not set
        const apiKey = config.nasaApiKey || 'DEMO_KEY';
        
        let dateParam = '';
        
        // Handle date parsing
        if (args.length > 0) {
            const dateInput = args[0].toLowerCase();
            
            if (dateInput === 'today') {
                // No date parameter needed for today
            } else if (dateInput === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                dateParam = `&date=${yesterday.toISOString().split('T')[0]}`;
            } else if (this.isValidDate(dateInput)) {
                dateParam = `&date=${this.formatDate(dateInput)}`;
            } else {
                return base.sendError(channel, 
                    'Invalid date format. Use: today, yesterday, or YYYY-MM-DD format.\n' +
                    'Example: v!apod 2023-08-30'
                );
            }
        }

        try {
            // Show loading message
            const loadingMsg = await channel.send('🛰️ Contacting NASA API...');
            
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}${dateParam}`);
            const data = response.data;

            if (data.code === 404) {
                await loadingMsg.delete();
                return base.sendError(channel, 'No APOD found for this date. Try a different date.');
            }

            if (data.media_type !== 'image') {
                await loadingMsg.delete();
                return this.sendVideoAPOD(channel, data, base);
            }

            // Update loading message
            await loadingMsg.edit('📡 Downloading NASA image...');

            // Download and send the image
            await this.downloadAndSendImage(channel, data, base);
            
            // Delete loading message
            await loadingMsg.delete().catch(() => {});

        } catch (error) {
            console.error('APOD command error:', error);
            
            if (error.response?.status === 404) {
                await base.sendError(channel, 'APOD not found for the specified date.');
            } else if (error.response?.status === 400) {
                await base.sendError(channel, 'Invalid date requested. Please use a valid date format.');
            } else if (error.response?.status === 403) {
                await base.sendError(channel, 'API rate limit exceeded. Please try again later or use a NASA API key.');
            } else {
                await base.sendError(channel, 'Failed to fetch APOD. Please try again later.');
            }
        }
    },

    isValidDate(dateString) {
        // Check for YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const parts = dateString.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            
            // Check if date is valid
            const date = new Date(year, month - 1, day);
            return date.getFullYear() === year && 
                   date.getMonth() === month - 1 && 
                   date.getDate() === day;
        }
        
        return false;
    },

    formatDate(dateString) {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Convert other formats to YYYY-MM-DD
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    async downloadAndSendImage(channel, data, base) {
        try {
            // Create a temporary directory if it doesn't exist
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Generate a unique filename
            const filename = `apod_${data.date}_${Date.now()}.jpg`;
            const filePath = path.join(tempDir, filename);
            
            // Download the image
            const response = await axios({
                method: 'GET',
                url: data.url,
                responseType: 'stream'
            });
            
            // Write file to disk
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            // Wait for download to complete
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            // Send the image as an attachment
            const attachment = new MessageAttachment(filePath, filename);
            
            await channel.send({
                content: this.formatAPODMessage(data),
                files: [attachment]
            });
            
            // Clean up the temporary file
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            }, 5000);
            
        } catch (error) {
            console.error('Error downloading image:', error);
            
            // Fallback to URL method if download fails
            await channel.send(this.formatAPODMessage(data) + `\n\n**Image URL:** ${data.url}`);
        }
    },

    formatAPODMessage(data) {
        // Truncate description if it's too long
        let description = data.explanation;
        if (description.length > 1500) {
            description = description.substring(0, 1500) + '...';
        }
        
        return `🛰️ **NASA Astronomy Picture of the Day - ${data.date}**\n` +
               `**${data.title}**\n\n` +
               `${description}\n\n` +
               `*Credit: ${data.copyright || 'Public Domain'}*`;
    },

    async sendVideoAPOD(channel, data, base) {
        // For videos, send the URL directly
        await channel.send(
            `🎥 **NASA Astronomy Video of the Day - ${data.date}**\n` +
            `**${data.title}**\n\n` +
            `${data.explanation}\n\n` +
            `**Video URL:** ${data.url}\n` +
            `*Credit: ${data.copyright || 'Public Domain'}*`
        );
    }
};
