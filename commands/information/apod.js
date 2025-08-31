const CommandBase = require('../CommandBase');
const axios = require('axios');
const { MessageAttachment } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

// Get config with NASA API key
const config = require('../../config');

// Path for storing channel preferences in commands/logs directory
const logsDir = path.resolve(__dirname, '../logs');
const channelsFilePath = path.resolve(logsDir, 'apod_channels.json');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize channels file if it doesn't exist
if (!fs.existsSync(channelsFilePath)) {
    fs.writeFileSync(channelsFilePath, '[]');
}

module.exports = {
    name: 'apod',
    description: 'Get NASA Astronomy Picture of the Day with channel management',
    aliases: ['nasa', 'astronomy', 'spacepic'],
    usage: 'apod [channel|list|remove|help] [date]',
    cooldown: 8000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Get NASA API key from config, fall back to DEMO_KEY if not set
        const apiKey = config.nasaApiKey || 'DEMO_KEY';
        
        // Check if no arguments provided - show help
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        // Handle subcommands
        const subcommand = args[0].toLowerCase();
        
        if (subcommand === 'list') {
            return this.listChannels(channel, client, base);
        }
        
        if (subcommand === 'remove') {
            return this.removeChannel(channel, message, args.slice(1), client, base);
        }
        
        if (subcommand === 'help') {
            return this.showHelp(channel, base);
        }

        // Check if the first argument is a channel mention or ID
        let targetChannel = channel;
        let dateArgs = args;
        
        try {
            // Check if the first argument is a channel mention
            if (args[0].match(/<#(\d+)>/)) {
                const channelId = args[0].match(/<#(\d+)>/)[1];
                targetChannel = await client.channels.fetch(channelId);
                dateArgs = args.slice(1);
            } 
            // Check if the first argument is a channel ID
            else if (args[0].match(/^\d+$/)) {
                targetChannel = await client.channels.fetch(args[0]);
                dateArgs = args.slice(1);
            }
        } catch (error) {
            console.error('Channel fetch error:', error);
            // If channel fetch fails, assume it's a date parameter
        }

        // Parse date parameters
        let dateParam = '';
        if (dateArgs.length > 0) {
            const dateInput = dateArgs[0].toLowerCase();
            
            if (dateInput === 'today') {
                // No date parameter needed for today
            } else if (dateInput === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                dateParam = `&date=${yesterday.toISOString().split('T')[0]}`;
            } else if (this.isValidDate(dateInput)) {
                dateParam = `&date=${this.formatDate(dateInput)}`;
            } else {
                return base.sendError(targetChannel, 
                    'Invalid date format. Use: today, yesterday, or YYYY-MM-DD format.\n' +
                    'Example: v!apod #astronomy 2023-08-30'
                );
            }
        }

        try {
            // Show loading message in the target channel
            const loadingMsg = await targetChannel.send('🛰️ Contacting NASA API...');
            
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}${dateParam}`);
            const data = response.data;

            if (data.code === 404) {
                await loadingMsg.delete();
                return base.sendError(targetChannel, 'No APOD found for this date. Try a different date.');
            }

            if (data.media_type !== 'image') {
                await loadingMsg.delete();
                return this.sendVideoAPOD(targetChannel, data, base);
            }

            // Update loading message
            await loadingMsg.edit('📡 Downloading NASA image...');

            // Download and send the image
            await this.downloadAndSendImage(targetChannel, data, base);
            
            // Delete loading message
            await loadingMsg.delete().catch(() => {});

            // If this was a channel-specific request, offer to save it
            if (targetChannel.id !== channel.id) {
                await this.offerChannelSave(message, targetChannel, base);
            }

        } catch (error) {
            console.error('APOD command error:', error);
            
            if (error.response?.status === 404) {
                await base.sendError(targetChannel, 'APOD not found for the specified date.');
            } else if (error.response?.status === 400) {
                await base.sendError(targetChannel, 'Invalid date requested. Please use a valid date format.');
            } else if (error.response?.status === 403) {
                await base.sendError(targetChannel, 'API rate limit exceeded. Please try again later or use a NASA API key.');
            } else {
                await base.sendError(targetChannel, 'Failed to fetch APOD. Please try again later.');
            }
        }
    },

    async showHelp(channel, base) {
        const helpText = `
🛰️ **APOD Command Help**

**Basic Usage:**
• \`v!apod [date]\` - Get APOD for today or specified date
• \`v!apod #channel [date]\` - Send APOD to a specific channel
• \`v!apod list\` - List channels configured for daily APOD
• \`v!apod remove #channel\` - Remove a channel from daily APOD
• \`v!apod help\` - Show this help

**Date Formats:**
• \`today\` - Today's APOD (default)
• \`yesterday\` - Yesterday's APOD
• \`YYYY-MM-DD\` - Specific date (e.g., 2023-08-30)

**Examples:**
• \`v!apod\` - Get today's APOD
• \`v!apod #space-images\` - Send today's APOD to #space-images
• \`v!apod #astronomy 2023-08-30\` - Send specific APOD to channel
• \`v!apod yesterday\` - Get yesterday's APOD
        `.trim();

        await base.safeSend(channel, helpText);
    },

    async listChannels(channel, client, base) {
        try {
            const channels = this.loadChannels();
            
            if (channels.length === 0) {
                return base.sendError(channel, 'No channels configured for daily APOD.');
            }
            
            let channelList = '📋 **Channels Configured for Daily APOD:**\n\n';
            
            for (const channelId of channels) {
                try {
                    const targetChannel = await client.channels.fetch(channelId);
                    channelList += `• ${targetChannel} (${targetChannel.guild?.name || 'DM'})\n`;
                } catch (error) {
                    channelList += `• Unknown channel (${channelId}) - may have been deleted\n`;
                }
            }
            
            await base.safeSend(channel, channelList);
        } catch (error) {
            console.error('Error listing channels:', error);
            await base.sendError(channel, 'Failed to load channel list.');
        }
    },

    async removeChannel(channel, message, args, client, base) {
        if (args.length === 0) {
            return base.sendError(channel, 'Please specify a channel to remove. Example: v!apod remove #astronomy');
        }
        
        try {
            let targetChannel;
            
            // Check if the argument is a channel mention
            if (args[0].match(/<#(\d+)>/)) {
                const channelId = args[0].match(/<#(\d+)>/)[1];
                targetChannel = await client.channels.fetch(channelId);
            } 
            // Check if the argument is a channel ID
            else if (args[0].match(/^\d+$/)) {
                targetChannel = await client.channels.fetch(args[0]);
            } else {
                return base.sendError(channel, 'Please specify a valid channel. Example: v!apod remove #astronomy');
            }
            
            // Load current channels
            const channels = this.loadChannels();
            const channelIndex = channels.indexOf(targetChannel.id);
            
            if (channelIndex === -1) {
                return base.sendError(channel, `${targetChannel} is not configured for daily APOD.`);
            }
            
            // Remove the channel
            channels.splice(channelIndex, 1);
            this.saveChannels(channels);
            
            await base.sendSuccess(channel, `✅ Removed ${targetChannel} from daily APOD list.`);
        } catch (error) {
            console.error('Error removing channel:', error);
            await base.sendError(channel, 'Failed to remove channel. It may not exist or I may not have access.');
        }
    },

    loadChannels() {
        try {
            const data = fs.readFileSync(channelsFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading channels:', error);
            return [];
        }
    },

    saveChannels(channels) {
        try {
            fs.writeFileSync(channelsFilePath, JSON.stringify(channels, null, 2));
        } catch (error) {
            console.error('Error saving channels:', error);
        }
    },

    async offerChannelSave(message, targetChannel, base) {
        // Ask if user wants to save this channel for daily APOD
        const saveMessage = await base.safeSend(message.channel, 
            `Would you like to configure ${targetChannel} to receive daily APOD automatically? ` +
            `Reply with 'yes' to confirm or 'no' to skip.`
        );
        
        if (!saveMessage) return;
        
        // Set up a collector to get the response
        const filter = m => m.author.id === message.author.id && 
                           (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no');
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });
        
        collector.on('collect', async m => {
            if (m.content.toLowerCase() === 'yes') {
                const channels = this.loadChannels();
                
                if (!channels.includes(targetChannel.id)) {
                    channels.push(targetChannel.id);
                    this.saveChannels(channels);
                    await base.sendSuccess(message.channel, `✅ Configured ${targetChannel} for daily APOD.`);
                } else {
                    await base.sendError(message.channel, `${targetChannel} is already configured for daily APOD.`);
                }
            }
            
            // Delete the question message
            try {
                await saveMessage.delete();
                await m.delete();
            } catch (error) {
                console.error('Error cleaning up messages:', error);
            }
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                saveMessage.delete().catch(() => {});
            }
        });
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

    async downloadAndSendImage(targetChannel, data, base) {
        try {
            // Create a temporary directory if it doesn't exist
            const tempDir = path.join(logsDir, 'temp');
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
            
            await targetChannel.send({
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
            await targetChannel.send(this.formatAPODMessage(data) + `\n\n**Image URL:** ${data.url}`);
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

    async sendVideoAPOD(targetChannel, data, base) {
        // For videos, send the URL directly
        await targetChannel.send(
            `🎥 **NASA Astronomy Video of the Day - ${data.date}**\n` +
            `**${data.title}**\n\n` +
            `${data.explanation}\n\n` +
            `**Video URL:** ${data.url}\n` +
            `*Credit: ${data.copyright || 'Public Domain'}*`
        );
    }
};
