const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs");
const path = require("path");
const { token, prefix, allowedUserIDs } = require("./config");

const client = new Client({
    checkUpdate: false,
    syncStatus: true
});

const commands = new Map();
const aliases = new Map();
const cooldowns = new Map();
let isInitialized = false;

// Make config globally available to fix path issues
global.botConfig = { token, prefix, allowedUserIDs };

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
