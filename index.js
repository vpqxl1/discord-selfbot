const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { MessageAttachment } = require("discord.js-selfbot-v13");
const { token, prefix, allowedUserIDs, nasaApiKey } = require("./config");

const client = new Client({
    checkUpdate: false,
    syncStatus: true
});

const commands = new Map();
const aliases = new Map();
const cooldowns = new Map();
let isInitialized = false;

// Make config globally available to fix path issues
global.botConfig = { token, prefix, allowedUserIDs, nasaApiKey };

// Recursive function to load commands from all subfolders
function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.name.endsWith('.js') && file.name !== 'CommandBase.js') {
            try {
                delete require.cache[require.resolve(fullPath)];
                const command = require(fullPath);
                
                if (command && typeof command.execute === 'function' && command.name) {
                    commands.set(command.name, command);
                    
                    // Register aliases
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => {
                            aliases.set(alias, command.name);
                        });
                    }
                    
                    console.log(`✓ Loaded command: ${command.name}`);
                }
            } catch (error) {
                console.error(`Error loading ${file.name}:`, error.message);
            }
        }
    }
}

// Ready event
client.once("ready", () => {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Prefix: ${prefix}`);
    console.log(`Loaded ${commands.size} commands with ${aliases.size} aliases`);

    // Initialize commands that need it
    for (const [name, command] of commands) {
        if (typeof command.init === 'function') {
            command.init(client);
        }
    }
    
    // Start daily APOD scheduler
    startDailyAPODScheduler(client);
    
    console.log('Daily APOD scheduler initialized');
});

// Message event
client.on("messageCreate", async (message) => {
    if (!message.author || message.author.bot) return;
    
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check permissions
    if (!allowedUserIDs.includes(message.author.id)) {
        return safeSend(message.channel, "❌ You don't have permission to use this command.");
    }

    // Resolve aliases
    const actualCommandName = aliases.get(commandName) || commandName;
    const command = commands.get(actualCommandName);
    
    if (!command) return;

    // Check cooldown
    if (await checkCooldown(message.author.id, command)) {
        return safeSend(message.channel, "⏳ Please wait before using this command again.");
    }

    try {
        await command.execute(message.channel, message, client, args);
        console.log(`Executed command: ${actualCommandName} by ${message.author.tag}`);
    } catch (error) {
        console.error(`Error executing ${actualCommandName}:`, error);
        await safeSend(message.channel, "❌ An error occurred while executing the command.");
    }
});

async function checkCooldown(userId, command) {
    if (!command.cooldown) return false;
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name) || new Map();
    
    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + command.cooldown;
        if (now < expirationTime) return true;
    }
    
    timestamps.set(userId, now);
    cooldowns.set(command.name, timestamps);
    
    // Clean up old cooldowns
    setTimeout(() => {
        const currentTimestamps = cooldowns.get(command.name);
        if (currentTimestamps) {
            currentTimestamps.delete(userId);
        }
    }, command.cooldown);
    
    return false;
}

async function safeSend(channel, content, options = {}) {
    try {
        return await channel.send(content, options);
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

// Load commands
try {
    const commandsDir = path.join(__dirname, "commands");
    loadCommands(commandsDir);
} catch (error) {
    console.error("Error loading commands:", error);
}

// Cleanup function
function cleanup() {
    console.log('Shutting down gracefully...');
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Login
client.login(token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});

// Export for help command and other modules
client.commands = commands;
client.aliases = aliases;
client.prefix = prefix;

// Daily APOD Scheduler function
function startDailyAPODScheduler(client) {
    // Path to channels file
    const logsDir = path.resolve(__dirname, './commands/logs');
    const channelsFilePath = path.resolve(logsDir, 'apod_channels.json');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Initialize channels file if it doesn't exist
    if (!fs.existsSync(channelsFilePath)) {
        fs.writeFileSync(channelsFilePath, '[]');
    }
    
    // Function to send APOD to a channel
    async function sendAPODToChannel(channel, data) {
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
            
            await channel.send({
                content: `🛰️ **Daily NASA Astronomy Picture of the Day - ${data.date}**\n` +
                         `**${data.title}**\n\n` +
                         `${data.explanation.substring(0, 1500)}${data.explanation.length > 1500 ? '...' : ''}\n\n` +
                         `*Credit: ${data.copyright || 'Public Domain'}*`,
                files: [attachment]
            });
            
            // Clean up the temporary file
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            }, 5000);
            
        } catch (error) {
            console.error('Error sending daily APOD:', error);
            // Fallback to URL method
            await channel.send(
                `🛰️ **Daily NASA Astronomy Picture of the Day - ${data.date}**\n` +
                `**${data.title}**\n\n` +
                `${data.explanation}\n\n` +
                `**Image URL:** ${data.url}\n` +
                `*Credit: ${data.copyright || 'Public Domain'}*`
            );
        }
    }
    
    // Function to send APOD to all configured channels
    async function sendDailyAPOD() {
        try {
            // Get NASA API key from config
            const apiKey = nasaApiKey || 'DEMO_KEY';
            
            // Get today's APOD
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
            const data = response.data;
            
            if (data.media_type !== 'image') {
                console.log('Today\'s APOD is a video, skipping daily send');
                return;
            }
            
            // Load configured channels
            let channels = [];
            try {
                const data = fs.readFileSync(channelsFilePath, 'utf8');
                channels = JSON.parse(data);
            } catch (error) {
                console.error('Error loading channels for daily APOD:', error);
            }
            
            // Send to all configured channels
            for (const channelId of channels) {
                try {
                    const channel = await client.channels.fetch(channelId);
                    await sendAPODToChannel(channel, data);
                } catch (error) {
                    console.error(`Error sending APOD to channel ${channelId}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in daily APOD send:', error);
        }
    }
    
    // Schedule daily APOD at 10:00 AM every day
    function scheduleDailyAPOD(hour, minute) {
        const now = new Date();
        const targetTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute,
            0
        );
        
        // If target time has already passed today, schedule for tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const timeUntilTarget = targetTime.getTime() - now.getTime();
        
        setTimeout(() => {
            sendDailyAPOD();
            // Schedule next execution (24 hours later)
            setInterval(sendDailyAPOD, 24 * 60 * 60 * 1000);
        }, timeUntilTarget);
    }
    
    // Start the scheduler (10:00 AM)
    scheduleDailyAPOD(10, 0);
}
